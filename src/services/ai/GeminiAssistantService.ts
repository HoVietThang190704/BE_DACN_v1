import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { config } from '../../config';
import { logger } from '../../shared/utils/logger';
import { AiAssistantHistoryMessage } from '../../domain/entities/ai/AiAssistant.types';

const DEFAULT_MODEL = config.GEMINI_MODEL || 'gemini-2.0-flash';

export class GeminiAssistantService {
  private readonly model: GenerativeModel | null;

  constructor(private readonly apiKey: string = config.GEMINI_API_KEY) {
    if (!apiKey) {
      logger.warn('[GeminiAssistantService] Missing GEMINI_API_KEY, AI assistant is disabled');
      this.model = null;
      return;
    }

    const client = new GoogleGenerativeAI(apiKey);
    this.model = client.getGenerativeModel({
      model: DEFAULT_MODEL,
      generationConfig: {
        temperature: 0.55,
        topP: 0.9,
        topK: 32,
        maxOutputTokens: 896,
      },
    });
  }

  isEnabled(): boolean {
    return Boolean(this.model && this.apiKey);
  }

  async generateResponse(params: {
    question: string;
    locale?: string;
    context: string;
    history?: AiAssistantHistoryMessage[];
    dataAvailability?: 'full' | 'partial' | 'empty';
    fallbackInsights?: string;
    intentDirectives?: string[];
  }): Promise<string> {
    if (!this.isEnabled() || !this.model) {
      throw new Error('AI assistant is not configured. Please set GEMINI_API_KEY.');
    }

    const {
      question,
      locale = 'vi',
      context,
      history = [],
      dataAvailability = 'full',
      fallbackInsights,
      intentDirectives = [],
    } = params;
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      throw new Error('Question cannot be empty');
    }

    const filteredHistory = history
      .filter((item) => item?.content?.trim())
      .slice(-6)
      .map((item) => `${item.role === 'assistant' ? 'Assistant' : 'Customer'}: ${item.content.trim()}`)
      .join('\n');

    const languageDirective = locale === 'en' ? 'English' : 'Vietnamese';
    const availabilityDirective = this.buildAvailabilityDirective(dataAvailability, locale);
    const fallbackBlock = fallbackInsights?.trim()
      ? fallbackInsights.trim()
      : (locale === 'en'
          ? 'External insights: (none supplied)'
          : 'Thông tin tham khảo bên ngoài: (chưa có)');
    const intentDirectiveBlock = intentDirectives.filter(Boolean).join(' ');

    const systemPrompt = [
      'You are FreshBuddy, a helpful, friendly AI shopping assistant for the Fresh Food Platform.',
      'Always reply only in the customer\'s language (English or Vietnamese). Do not mix languages in a single response.',
      'Use only the provided catalog context (categories, products, sellers, promotions) to craft responses; do not fabricate information.',
      'If the user is asking "who is selling <product>", list seller names and a brief availability/price line for each seller using data from the catalog context.',
      'When listing multiple options, prefer short bullet points and be concise. Use natural, conversational language appropriate to the customer\'s locale.',
      'Never include internal IDs, API keys, or backend implementation information.',
      'If information is missing from the context, acknowledge it and explain what additional detail you need (e.g., location, variant).',
      'Keep answers concise and suitable for a chat UI, ideally no longer than 180 words.',
      availabilityDirective,
      intentDirectiveBlock,
      `Respond in ${languageDirective}.`,
    ]
      .filter(Boolean)
      .join(' ');

    const promptSections = [
      systemPrompt,
      context ? `Catalog context:\n${context}` : 'Catalog context: (no catalog data provided)',
      fallbackBlock,
      filteredHistory ? `Conversation so far:\n${filteredHistory}` : 'Conversation so far: (first turn)',
      `Customer question: ${trimmedQuestion}`,
      'Assistant response:',
    ];

    try {
      const result = await this.model.generateContent(promptSections.join('\n\n'));
      const responseText = result.response.text()?.trim();
      if (!responseText) {
        throw new Error('Gemini returned an empty response');
      }
      return responseText;
    } catch (error) {
      logger.error('[GeminiAssistantService] Failed to generate response', error);
      throw new Error('Failed to contact AI assistant');
    }
  }

  private buildAvailabilityDirective(state: 'full' | 'partial' | 'empty', locale: string): string {
    if (state === 'empty') {
      return locale === 'en'
        ? 'Catalog data is empty. Begin your answer with "Our web catalog does not have this item yet." Immediately follow up with clearly labeled external tips pulled from the provided insights.'
        : 'Không có dữ liệu nào trong web. Mở đầu câu trả lời bằng câu "Hiện web chưa có dữ liệu này." Sau đó chia sẻ các gợi ý tham khảo bên ngoài được cung cấp.';
    }
    if (state === 'partial') {
      return locale === 'en'
        ? 'Only a few catalog items match. Mention that availability is limited before offering suggestions.'
        : 'Dữ liệu trong web hiện khá ít, hãy nói rõ chúng đang hạn chế trước khi gợi ý.';
    }
    return locale === 'en'
      ? 'Catalog data is available. Lead with platform items before optional tips.'
      : 'Dữ liệu web đã sẵn sàng, hãy ưu tiên giới thiệu sản phẩm trong hệ thống trước khi thêm gợi ý khác.';
  }
}
