import { IProductRepository } from '../../repositories/IProductRepository';
import { ICategoryRepository } from '../../repositories/ICategoryRepository';
import {
  AiAssistantHistoryMessage,
  AiAssistantResponsePayload,
  AiAssistantCategorySuggestion,
  AiAssistantProductSuggestion,
} from '../../entities/ai/AiAssistant.types';
import { GeminiAssistantService } from '../../../services/ai/GeminiAssistantService';
import { FallbackKnowledgeService, KnowledgeInsight } from '../../../services/ai/FallbackKnowledgeService';
import { ProgrammableSearchService } from '../../../services/ai/ProgrammableSearchService';
import { ProductEntity } from '../../entities/Product.entity';
import { CategoryEntity } from '../../entities/Category.entity';

interface QueryIntent {
  wantsCookingGuide: boolean;
  needsStepByStep: boolean;
  enrichedQuestion: string;
}

const VIETNAMESE_MARKERS = /[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;

const detectResponseLocale = (text: string, fallback: string = 'vi'): 'vi' | 'en' => {
  if (VIETNAMESE_MARKERS.test(text)) {
    return 'vi';
  }
  const lowered = text.toLowerCase();
  const englishHints = ['what', 'who', 'where', 'how', 'price', 'sell', 'selling', 'buy', 'available', 'hi', 'hello'];
  if (englishHints.some((hint) => lowered.includes(hint))) {
    return 'en';
  }
  const fallbackIsEn = (fallback || '').toLowerCase().startsWith('en');
  return fallbackIsEn ? 'en' : 'vi';
};

const formatCurrency = (value: number, locale: string) => {
  try {
    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} VND`;
  }
};

const normalizeSearchTerm = (input: string): string => {
  return input
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
};

const stripDiacritics = (value: string): string => {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const KEYWORD_STOP_WORDS = new Set(
  [
    'what',
    'which',
    'about',
    'please',
    'help',
    'more',
    'other',
    'others',
    'items',
    'item',
    'foods',
    'food',
    'products',
    'product',
    'types',
    'type',
    'any',
    'show',
    'list',
    'need',
    'want',
    'tell',
    'cai',
    'mon',
    'loai',
    'san',
    'pham',
    'gia'
  ].map((token) => stripDiacritics(token.toLowerCase()))
);

const MAX_CONTEXT_PRODUCTS = 30;
const MIN_CONTEXT_PRODUCTS = 12;
const MAX_CONTEXT_CATEGORIES = 20;
const GENERAL_QUERY_MARKERS = [
  'co doc',
  'doc khong',
  'an toan',
  'co an duoc',
  'an duoc khong',
  'co tot',
  'tot khong',
  'la gi',
  'loi ich',
  'tac hai',
  'co hai',
  'an duoc khong',
  'how to',
  'what is',
  'is it safe',
  'toxic',
  'poison',
  'nutrition',
  'benefit',
  'use case',
  'huong dan',
  'cach',
  'cach nau',
  'nau',
  'mon',
  'recipe',
  'cook',
  'cooking',
  'lam sao',
  'bao quan',
  'nguon goc',
];

const COOKING_QUERY_MARKERS = [
  'cach nau',
  'huong dan nau',
  'huong dan lam',
  'mon ngon',
  'mon gi',
  'lam mon',
  'cong thuc',
  'recipe',
  'cook',
  'cooking',
  'how to cook',
  'chien',
  'xao',
  'nuong',
  'ham',
  'om',
  'kho',
  'luoc',
  'steamed',
  'grill',
  'bake',
  'bo song',
  'so che',
  'che bien',
  'cac buoc nau',
  'buoc nau',
  'nguyen lieu',
];

const STEP_QUERY_MARKERS = [
  'cac buoc',
  'chi tiet',
  'chi tiet tung buoc',
  'step by step',
  'instructions',
  'ingredient list',
  'nguyen lieu',
  'cong doan',
].map((marker) => stripDiacritics(marker.toLowerCase()));

const SEARCH_REQUEST_MARKERS = [
  'tim ho',
  'tim giup',
  'tim dum',
  'ban tim',
  'tim dum minh',
  'tim dum toi',
  'tra cuu',
  'tra ho',
  'search giup',
  'search for me',
  'find it for me',
  'look it up',
  'google giup',
  'google ho',
  'tra thong tin',
  'check giup',
  'internet',
];

const ASSISTANT_LIMITATION_MARKERS = [
  'khong the tim kiem thong tin ben ngoai internet',
  'khong the tim kiem thong tin ben ngoai',
  'khong the tim kiem tren internet',
  'khong the tim kiem internet',
  'cannot search the internet',
  'cant search the internet',
  'cannot browse the internet',
  'can\'t browse the internet',
  'i cannot search online',
];

export class AskAiAssistantUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly aiService: GeminiAssistantService,
    private readonly fallbackKnowledgeService: FallbackKnowledgeService,
    private readonly programmableSearchService?: ProgrammableSearchService
  ) {}

  async execute(params: {
    question: string;
    locale?: string;
    history?: AiAssistantHistoryMessage[];
  }): Promise<AiAssistantResponsePayload> {
    if (!this.aiService.isEnabled()) {
      throw new Error('AI assistant is not available at the moment.');
    }

    const { question, locale = 'vi', history = [] } = params;
    const sanitizedQuestion = question?.trim();
    if (!sanitizedQuestion) {
      throw new Error('Message is required');
    }

    const responseLocale = detectResponseLocale(sanitizedQuestion, locale);
    const searchTerm = normalizeSearchTerm(sanitizedQuestion);
    const keywordHints = this.collectKeywords(sanitizedQuestion, history);
    const intent = this.resolveQueryIntent(sanitizedQuestion, history, responseLocale);
    const wantsCookingGuide = intent.wantsCookingGuide;
    const needsStepByStep = intent.needsStepByStep;
    const externalQuestion = intent.enrichedQuestion;

    const categorySearchPromise = searchTerm
      ? this.categoryRepository.searchByName(searchTerm, MAX_CONTEXT_CATEGORIES).catch(() => [] as CategoryEntity[])
      : Promise.resolve([] as CategoryEntity[]);

    const productSearchPromise = searchTerm
      ? this.productRepository
          .search(searchTerm, { page: 1, limit: MAX_CONTEXT_PRODUCTS })
          .catch(() => ({ products: [] as ProductEntity[] }))
      : Promise.resolve({ products: [] as ProductEntity[] });

    const keywordCategoryPromises = keywordHints.slice(0, 5).map((keyword) =>
      this.categoryRepository.searchByName(keyword, 8).catch(() => [] as CategoryEntity[])
    );

    const keywordProductPromises = keywordHints.slice(0, 5).map((keyword) =>
      this.productRepository
        .search(keyword, { page: 1, limit: 20 })
        .catch(() => ({ products: [] as ProductEntity[] }))
    );

    const [baseCategories, baseProductMatches, bestSelling, featured, newest] = await Promise.all([
      categorySearchPromise,
      productSearchPromise,
      this.productRepository.getBestSelling(24).catch(() => [] as ProductEntity[]),
      this.productRepository.getFeatured(24).catch(() => [] as ProductEntity[]),
      this.productRepository.getNewest(24).catch(() => [] as ProductEntity[]),
    ]);

    const [keywordCategories, keywordProducts] = await Promise.all([
      Promise.all(keywordCategoryPromises),
      Promise.all(keywordProductPromises),
    ]);

    let categories = this.dedupeCategories([
      ...baseCategories,
      ...keywordCategories.flat(),
    ]);

    if (categories.length < Math.min(MAX_CONTEXT_CATEGORIES, 8)) {
      const fallbackCategories = await this.categoryRepository.findAll(false).catch(() => [] as CategoryEntity[]);
      const sortedFallback = fallbackCategories
        .filter((category) => category.isActive)
        .sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
      categories = this.dedupeCategories([...categories, ...sortedFallback]);
    }

    const selectedCategories = categories.slice(0, MAX_CONTEXT_CATEGORIES);

    const keywordProductList = keywordProducts.flatMap((result) => result.products ?? []);
    let aggregatedProducts = this.dedupeProducts([
      ...(baseProductMatches.products ?? []),
      ...keywordProductList,
      ...bestSelling,
      ...featured,
      ...newest,
    ]);

    if (aggregatedProducts.length < MIN_CONTEXT_PRODUCTS) {
      const fallbackCatalog = await this.productRepository
        .findAll(undefined, undefined, { page: 1, limit: 60 })
        .catch(() => ({ products: [] as ProductEntity[] }));
      aggregatedProducts = this.dedupeProducts([
        ...aggregatedProducts,
        ...(fallbackCatalog.products ?? []),
      ]);
    }

    const selectedProducts = aggregatedProducts.slice(0, MAX_CONTEXT_PRODUCTS);

    const categorySection = this.buildCategoryContext(selectedCategories, responseLocale);
    const productSection = this.buildProductContext(selectedProducts, responseLocale);
    const sellerSection = this.buildSellerContext(selectedProducts, responseLocale);
    const priceSummary = this.buildPriceSummary(selectedProducts, responseLocale);

    const catalogState = this.resolveCatalogState(selectedProducts, selectedCategories);
    const shouldFetchExternal = this.needsExternalInsights(
      sanitizedQuestion,
      catalogState,
      history,
      wantsCookingGuide || needsStepByStep
    );
    const fallbackInsights = shouldFetchExternal
      ? await this.resolveFallbackInsights(
          catalogState,
          externalQuestion,
          responseLocale,
          wantsCookingGuide,
          needsStepByStep
        )
      : [];
    const fallbackSection = this.buildFallbackContext(fallbackInsights, responseLocale);

    const context = [
      `Customer language: ${responseLocale === 'en' ? 'English' : 'Vietnamese'}`,
      categorySection,
      productSection,
      priceSummary,
      sellerSection,
      fallbackSection,
    ]
      .filter(Boolean)
      .join('\n\n');

    const answer = await this.aiService.generateResponse({
      question: sanitizedQuestion,
      locale: responseLocale,
      context,
      history,
      dataAvailability: catalogState,
      fallbackInsights: fallbackInsights.length ? fallbackSection : '',
      intentDirectives: this.buildIntentDirectives(intent, responseLocale),
    });

    return {
      answer,
      suggestions: {
        categories: selectedCategories.map((category) => this.mapCategorySuggestion(category)),
        products: selectedProducts.map((product) => this.mapProductSuggestion(product)),
      },
    };
  }

  private needsExternalInsights(
    question: string,
    state: 'full' | 'partial' | 'empty',
    history: AiAssistantHistoryMessage[],
    wantsCookingGuide: boolean
  ): boolean {
    if (state !== 'full') {
      return true;
    }
    const normalized = stripDiacritics(question.toLowerCase());
    if (question.includes('?')) {
      return true;
    }
    if (normalized.length <= 2) {
      return false;
    }
    if (GENERAL_QUERY_MARKERS.some((marker) => normalized.includes(marker))) {
      return true;
    }
    const isInstructional = normalized.startsWith('cach ') || normalized.startsWith('huong dan') || normalized.startsWith('lam sao');
    if (isInstructional || wantsCookingGuide) {
      return true;
    }
    if (SEARCH_REQUEST_MARKERS.some((marker) => normalized.includes(marker))) {
      return true;
    }

    const lastAssistantMessage = [...history]
      .reverse()
      .find((entry) => entry.role === 'assistant' && typeof entry.content === 'string');

    if (lastAssistantMessage) {
      const lastContent = stripDiacritics(lastAssistantMessage.content.toLowerCase());
      if (ASSISTANT_LIMITATION_MARKERS.some((marker) => lastContent.includes(marker))) {
        return true;
      }
    }

    return false;
  }

  private resolveCatalogState(products: ProductEntity[], categories: CategoryEntity[]): 'full' | 'partial' | 'empty' {
    if (!products.length && !categories.length) {
      return 'empty';
    }
    if (products.length < 3) {
      return 'partial';
    }
    return 'full';
  }

  private collectKeywords(question: string, history: AiAssistantHistoryMessage[]): string[] {
    const sources = [question, ...history.filter((item) => item.role === 'user').slice(-4).map((item) => item.content || '')];
    const seen = new Map<string, string>();

    for (const text of sources) {
      if (!text) continue;
      const tokens = text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter(Boolean);

      for (const token of tokens) {
        const normalized = stripDiacritics(token);
        if (normalized.length < 3) continue;
        if (KEYWORD_STOP_WORDS.has(normalized)) continue;
        if (!seen.has(normalized)) {
          seen.set(normalized, token);
        }
      }
    }

    return Array.from(seen.values()).slice(0, 6);
  }

  private dedupeCategories(categories: CategoryEntity[]): CategoryEntity[] {
    const seen = new Set<string>();
    const result: CategoryEntity[] = [];
    for (const category of categories) {
      const id = category?.id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      result.push(category);
    }
    return result;
  }

  private dedupeProducts(products: ProductEntity[]): ProductEntity[] {
    const seen = new Set<string>();
    const result: ProductEntity[] = [];
    for (const product of products) {
      const id = product?.id;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      result.push(product);
    }
    return result;
  }

  private buildCategoryContext(categories: CategoryEntity[], locale: 'vi' | 'en'): string {
    if (!categories.length) return '';
    const header = locale === 'en' ? 'Categories:' : 'Danh mục:';
    const quantityLabel = locale === 'en' ? 'items' : 'sản phẩm';
    const lines = categories.map((category) => {
      const count = typeof category.productCount === 'number' && category.productCount > 0 ? ` — ${category.productCount} ${quantityLabel}` : '';
      const desc = category.description ? ` — ${category.description}` : '';
      return `• ${category.name}${count}${desc}`;
    });
    return [header, ...lines].join('\n');
  }

  private buildProductContext(products: ProductEntity[], locale: 'vi' | 'en'): string {
    if (!products.length) return '';
    const header = locale === 'en' ? 'Products:' : 'Sản phẩm:';
    const lines = products.map((product) => this.describeProduct(product, locale));
    return [header, ...lines].join('\n');
  }

  private describeProduct(product: ProductEntity, locale: 'vi' | 'en'): string {
    const unit = product.unit || (locale === 'en' ? 'unit' : 'đơn vị');
    const price = formatCurrency(product.price, locale);
    const category = product.category?.name ? ` — ${product.category.name}` : '';
    const seller = product.owner?.userName || (locale === 'en' ? 'Unknown seller' : 'Người bán chưa rõ');
    const rating = typeof product.rating === 'number' && product.rating > 0 ? ` | ${product.rating.toFixed(1)}/5` : '';
    const reviewInfo = typeof product.reviewCount === 'number' && product.reviewCount > 0 ? ` (${product.reviewCount} ${locale === 'en' ? 'reviews' : 'đánh giá'})` : '';
    const stockQuantity = typeof product.stockQuantity === 'number' ? product.stockQuantity : null;
    const stockLabel = locale === 'en' ? 'Stock' : 'Tồn';
    const availability = stockQuantity !== null
      ? `${stockLabel}: ${stockQuantity}`
      : `${stockLabel}: ${product.inStock ? (locale === 'en' ? 'Available' : 'Còn hàng') : (locale === 'en' ? 'Check' : 'Kiểm tra thêm')}`;
    const tags = Array.isArray(product.tags) && product.tags.length
      ? ` | ${locale === 'en' ? 'Tags' : 'Nhãn'}: ${product.tags.slice(0, 4).join(', ')}`
      : '';
    const priceLabel = locale === 'en' ? 'Price' : 'Giá';
    const sellerLabel = locale === 'en' ? 'Seller' : 'Người bán';
    return [
      `• ${product.name}${category}`,
      `  ${sellerLabel}: ${seller} | ${priceLabel}: ${price} / ${unit}${rating}${reviewInfo}`,
      `  ${availability}${tags}`,
    ].join('\n');
  }

  private buildSellerContext(products: ProductEntity[], locale: 'vi' | 'en'): string {
    if (!products.length) return '';
    const sellerLabel = locale === 'en' ? 'Sellers:' : 'Người bán:';
    const aggregated = new Map<string, { name: string; items: string[] }>();

    for (const product of products) {
      const sellerName = product.owner?.userName || (locale === 'en' ? 'Unknown seller' : 'Người bán chưa rõ');
      const key = sellerName.toLowerCase();
      if (!aggregated.has(key)) {
        aggregated.set(key, { name: sellerName, items: [] });
      }
      const entry = aggregated.get(key)!;
      if (entry.items.length < 3) {
        entry.items.push(product.name);
      }
    }

    const lines = Array.from(aggregated.values())
      .slice(0, 10)
      .map((entry) => `• ${entry.name} — ${entry.items.join(', ')}`);

    return lines.length ? [sellerLabel, ...lines].join('\n') : '';
  }

  private buildPriceSummary(products: ProductEntity[], locale: 'vi' | 'en'): string {
    const prices = products
      .map((product) => product.price)
      .filter((price) => typeof price === 'number' && !Number.isNaN(price));

    if (!prices.length) {
      return '';
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((sum, value) => sum + value, 0) / prices.length;
    const label = locale === 'en' ? 'Price range' : 'Khoảng giá';
    const avgLabel = locale === 'en' ? 'avg' : 'trung bình';
    return `${label}: ${formatCurrency(min, locale)} - ${formatCurrency(max, locale)} (${avgLabel} ${formatCurrency(Math.round(avg), locale)})`;
  }

  private async resolveFallbackInsights(
    state: 'full' | 'partial' | 'empty',
    searchTerm: string,
    locale: 'vi' | 'en',
    wantsCookingGuide: boolean,
    needsStepByStep: boolean
  ): Promise<KnowledgeInsight[]> {
    if (state === 'full') {
      // When catalog is full but question needs external info we still want a small set of snippets
      // so the calling code should gate this method. If invoked for a "full" state we still
      // provide lightweight context.
    }

    const limit = state === 'empty' ? 4 : state === 'partial' ? 3 : 2;
    const insights: KnowledgeInsight[] = [];

    if (this.programmableSearchService?.isEnabled()) {
      const externalInsights = await this.programmableSearchService
        .searchInsights(searchTerm, locale, limit, {
          cookingHint: wantsCookingGuide,
          stepByStep: needsStepByStep,
        })
        .catch(() => [] as KnowledgeInsight[]);
      insights.push(...externalInsights);
    }

    if (insights.length < limit) {
      const fallback = this.fallbackKnowledgeService.searchInsights(searchTerm, locale, limit - insights.length);
      insights.push(...fallback);
    }

    return insights.slice(0, limit);
  }

  private buildFallbackContext(insights: KnowledgeInsight[], locale: 'vi' | 'en'): string {
    if (!insights.length) return '';
    const header = locale === 'en'
      ? 'External insights (extra context pulled from trusted sources):'
      : 'Thông tin tham khảo bên ngoài (nguồn đáng tin cậy cho câu hỏi này):';
    const highlightLabel = locale === 'en' ? 'Highlights' : 'Ghi chú nhanh';
    const sourceLabel = locale === 'en' ? 'Source' : 'Nguồn';
    const stepsLabel = locale === 'en' ? 'Steps' : 'Các bước';

    const lines = insights.flatMap((insight) => {
      const section: string[] = [`• ${insight.title}: ${insight.summary}`];
      const sourceValue = [insight.source, insight.url].filter(Boolean).join(' — ');
      if (sourceValue) {
        section.push(`  ${sourceLabel}: ${sourceValue}`);
      }
      if (insight.highlights.length) {
        section.push(`  ${highlightLabel}:`);
        section.push(...insight.highlights.slice(0, 3).map((item) => `    - ${item}`));
      }
      if (insight.instructions?.length) {
        section.push(`  ${stepsLabel}:`);
        section.push(...insight.instructions.slice(0, 4).map((step, index) => `    ${index + 1}. ${step}`));
      }
      return section;
    });
    return [header, ...lines].join('\n');
  }

  private isCookingQuery(question: string): boolean {
    const normalized = stripDiacritics(question.toLowerCase());
    if (normalized.length < 3) {
      return false;
    }
    if (COOKING_QUERY_MARKERS.some((marker) => normalized.includes(marker))) {
      return true;
    }
    return /\b(nau|chien|xao|nuong|ham|kho|om|mon)\b/.test(normalized);
  }

  private resolveQueryIntent(
    question: string,
    history: AiAssistantHistoryMessage[],
    locale: 'vi' | 'en'
  ): QueryIntent {
    const normalized = stripDiacritics(question.toLowerCase());
    let wantsCookingGuide = this.isCookingQuery(question);
    const needsStepByStep = this.isStepRequest(normalized);
    let enrichedQuestion = question;

    const lastCookingQuestion = this.findLastCookingQuestion(history);
    if (!wantsCookingGuide && lastCookingQuestion) {
      wantsCookingGuide = true;
      enrichedQuestion = `${lastCookingQuestion} ${question}`.trim();
    } else if (lastCookingQuestion && needsStepByStep && question.length < 18) {
      enrichedQuestion = `${lastCookingQuestion} ${question}`.trim();
    }

    if (needsStepByStep) {
      const stepHint = locale === 'en' ? 'step by step instructions' : 'các bước chi tiết';
      const enrichedNormalized = stripDiacritics(enrichedQuestion.toLowerCase());
      if (!enrichedNormalized.includes('step') && !enrichedNormalized.includes('buoc')) {
        enrichedQuestion = `${enrichedQuestion} ${stepHint}`.trim();
      }
    }

    return {
      wantsCookingGuide,
      needsStepByStep,
      enrichedQuestion,
    };
  }

  private buildIntentDirectives(intent: QueryIntent, locale: 'vi' | 'en'): string[] {
    const directives: string[] = [];
    if (intent.wantsCookingGuide) {
      directives.push(
        locale === 'en'
          ? 'Customer is asking for cooking ideas or recipes. Combine catalog items with the supplied external insights to describe concrete dishes.'
          : 'Khách đang hỏi món ăn/công thức. Hãy kết hợp dữ liệu trong web và phần tham khảo để mô tả món cụ thể.'
      );
    }
    if (intent.needsStepByStep) {
      directives.push(
        locale === 'en'
          ? 'Customer explicitly asked for step-by-step instructions. When external insights provide steps, reproduce them as a numbered list before adding extra tips.'
          : 'Khách yêu cầu hướng dẫn từng bước. Nếu phần tham khảo có bước cụ thể, hãy liệt kê chúng theo dạng số thứ tự trước khi bổ sung lời khuyên khác.'
      );
    }
    return directives;
  }

  private findLastCookingQuestion(history: AiAssistantHistoryMessage[]): string | null {
    const reversed = [...history].reverse();
    for (const entry of reversed) {
      if (entry.role !== 'user') continue;
      const content = entry.content?.trim();
      if (!content) continue;
      if (this.isCookingQuery(content)) {
        return content;
      }
    }
    return null;
  }

  private isStepRequest(normalizedQuestion: string): boolean {
    if (!normalizedQuestion) {
      return false;
    }
    if (STEP_QUERY_MARKERS.some((marker) => normalizedQuestion.includes(marker))) {
      return true;
    }
    return /\b(buoc|step)\b/.test(normalizedQuestion);
  }

  private mapCategorySuggestion(category: CategoryEntity): AiAssistantCategorySuggestion {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      slug: category.slug,
      parentId: category.parentId,
    };
  }

  private mapProductSuggestion(product: ProductEntity): AiAssistantProductSuggestion {
    const image = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      image,
      inStock: product.inStock ?? (typeof product.stockQuantity === 'number' ? product.stockQuantity > 0 : undefined),
      rating: product.rating ?? null,
      reviewCount: product.reviewCount ?? null,
      categoryName: product.category?.name ?? null,
      tags: product.tags ?? [],
    };
  }
}
