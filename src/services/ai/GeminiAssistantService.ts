import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { config } from '../../config';
import { logger } from '../../shared/utils/logger';
import { AiAssistantHistoryMessage } from '../../domain/entities/ai/AiAssistant.types';

const DEFAULT_MODEL = config.GEMINI_MODEL || 'gemini-2.5-flash';
const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

interface ApiKeyConfig {
  key: string;
  label: string;
}

export class GeminiAssistantService {
  private readonly apiKeys: ApiKeyConfig[];
  private currentKeyIndex = 0;
  private readonly modelName: string;

  constructor() {
    this.apiKeys = this.initializeApiKeys();
    this.modelName = DEFAULT_MODEL;
    
    if (this.apiKeys.length === 0) {
      logger.warn('[GeminiAssistantService] No GEMINI_API_KEY configured, AI assistant is disabled');
    } else {
      logger.info(`[GeminiAssistantService] Initialized with ${this.apiKeys.length} API key(s), model: ${this.modelName}`);
    }
  }

  private initializeApiKeys(): ApiKeyConfig[] {
    const keys: ApiKeyConfig[] = [];
    
    if (config.GEMINI_API_KEY) {
      keys.push({ key: config.GEMINI_API_KEY, label: 'primary' });
    }
    if (config.GEMINI_API_KEY_BACKUP && config.GEMINI_API_KEY_BACKUP !== config.GEMINI_API_KEY) {
      keys.push({ key: config.GEMINI_API_KEY_BACKUP, label: 'backup' });
    }
    
    return keys;
  }

  private createModel(apiKey: string, modelName: string): GenerativeModel {
    const client = new GoogleGenerativeAI(apiKey);
    return client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topP: 0.92,
        topK: 40,
        maxOutputTokens: 3072,
      },
    });
  }

  private rotateApiKey(): void {
    if (this.apiKeys.length > 1) {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      logger.info(`[GeminiAssistantService] Rotated to ${this.apiKeys[this.currentKeyIndex].label} API key`);
    }
  }

  isEnabled(): boolean {
    return this.apiKeys.length > 0;
  }

  async generateResponse(params: {
    question: string;
    locale?: string;
    context: string;
    history?: AiAssistantHistoryMessage[];
    dataAvailability?: 'full' | 'partial' | 'empty';
    fallbackInsights?: string;
    intentDirectives?: string[];
    externalSearchResults?: string;
  }): Promise<string> {
    if (!this.isEnabled()) {
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
      externalSearchResults,
    } = params;
    
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      throw new Error('Question cannot be empty');
    }

    const prompt = this.buildPrompt({
      question: trimmedQuestion,
      locale,
      context,
      history,
      dataAvailability,
      fallbackInsights,
      intentDirectives,
      externalSearchResults,
    });

    // Try with multiple keys and models
    const maxAttempts = this.apiKeys.length * FALLBACK_MODELS.length * 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const keyConfig = this.apiKeys[this.currentKeyIndex];
      const modelName = FALLBACK_MODELS[Math.floor(attempt / this.apiKeys.length) % FALLBACK_MODELS.length] || this.modelName;

      try {
        const model = this.createModel(keyConfig.key, modelName);
        const result = await model.generateContent(prompt);
        const responseText = result.response.text()?.trim();
        
        if (!responseText) {
          throw new Error('Gemini returned an empty response');
        }
        
        return responseText;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = lastError.message || '';

        // Handle rate limit - rotate key and retry
        if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests') || errorMessage.includes('quota')) {
          logger.warn(`[GeminiAssistantService] Rate limit on ${keyConfig.label} key with ${modelName}, rotating...`);
          this.rotateApiKey();
          await this.delay(500);
          continue;
        }

        // Handle model not found - try next model
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          logger.warn(`[GeminiAssistantService] Model ${modelName} not found, trying next...`);
          continue;
        }

        // Other errors - log and continue
        logger.error(`[GeminiAssistantService] Error on attempt ${attempt + 1}:`, error);
        
        if (attempt < maxAttempts - 1) {
          this.rotateApiKey();
          await this.delay(300);
          continue;
        }
      }
    }

    // All attempts failed
    throw new Error(
      locale === 'vi'
        ? 'Hệ thống AI đang bận. Vui lòng thử lại sau vài giây.'
        : 'AI assistant is currently busy. Please try again in a few seconds.'
    );
  }

  private buildPrompt(params: {
    question: string;
    locale: string;
    context: string;
    history: AiAssistantHistoryMessage[];
    dataAvailability: 'full' | 'partial' | 'empty';
    fallbackInsights?: string;
    intentDirectives: string[];
    externalSearchResults?: string;
  }): string {
    const {
      question,
      locale,
      context,
      history,
      dataAvailability,
      fallbackInsights,
      intentDirectives,
      externalSearchResults,
    } = params;

    const languageDirective = locale === 'en' ? 'English' : 'Vietnamese';
    
    const filteredHistory = history
      .filter((item) => item?.content?.trim())
      .slice(-8)
      .map((item) => `${item.role === 'assistant' ? 'FreshBuddy' : 'Khách hàng'}: ${item.content.trim()}`)
      .join('\n');

    const systemPrompt = this.buildSystemPrompt(locale, dataAvailability, intentDirectives);

    const sections: string[] = [
      systemPrompt,
      '',
      '=== DỮ LIỆU SẢN PHẨM/DANH MỤC TỪ HỆ THỐNG ===',
      context || '(Không có dữ liệu sản phẩm phù hợp)',
    ];

    if (externalSearchResults?.trim()) {
      sections.push('');
      sections.push('=== KẾT QUẢ TÌM KIẾM TỪ GOOGLE (Thông tin bên ngoài) ===');
      sections.push(externalSearchResults);
    }

    if (fallbackInsights?.trim()) {
      sections.push('');
      sections.push('=== THÔNG TIN THAM KHẢO BỔ SUNG ===');
      sections.push(fallbackInsights);
    }

    if (filteredHistory) {
      sections.push('');
      sections.push('=== LỊCH SỬ HỘI THOẠI ===');
      sections.push(filteredHistory);
    }

    sections.push('');
    sections.push(`=== CÂU HỎI CỦA KHÁCH HÀNG ===`);
    sections.push(question);
    sections.push('');
    sections.push(`[Trả lời bằng tiếng ${languageDirective}, thân thiện và hữu ích]`);
    sections.push('FreshBuddy:');

    return sections.join('\n');
  }

  private buildSystemPrompt(
    locale: string,
    dataAvailability: 'full' | 'partial' | 'empty',
    intentDirectives: string[]
  ): string {
    const isVietnamese = locale !== 'en';
    
    const basePrompt = isVietnamese
      ? `Bạn là FreshBuddy - trợ lý AI thông minh của nền tảng thực phẩm tươi sống Fresh Food Platform.

NHIỆM VỤ CHÍNH:
• Tư vấn sản phẩm: Giới thiệu sản phẩm tươi ngon có sẵn trong hệ thống
• Hướng dẫn nấu ăn: Chia sẻ công thức, cách chế biến các món ăn từ nguyên liệu
• Gợi ý nguyên liệu: Kết nối món ăn với sản phẩm đang bán (VD: "Để nấu phở, bạn cần thịt bò - đang có ở shop X, giá Y đồng")
• Tìm kiếm thông minh: Sử dụng thông tin từ Google Search để trả lời câu hỏi về dinh dưỡng, mẹo nấu ăn, bảo quản thực phẩm

NGUYÊN TẮC TRẢ LỜI:
• Luôn ưu tiên giới thiệu sản phẩm trong hệ thống nếu có liên quan
• Khi hướng dẫn nấu ăn, LUÔN liên kết với sản phẩm đang bán (nếu có)
• Nếu không có sản phẩm phù hợp, vẫn trả lời câu hỏi dựa trên thông tin tìm kiếm
• Trả lời ngắn gọn, dễ hiểu, phù hợp với giao diện chat (tối đa 250 từ)
• Sử dụng bullet points khi liệt kê
• Thêm emoji phù hợp để sinh động hơn 🥬🍖🍳

ĐỊNH DẠNG:
• Dùng • hoặc - cho danh sách
• Bôi đậm **tên sản phẩm** và **giá**
• Ghi rõ nguồn nếu lấy thông tin từ bên ngoài`
      : `You are FreshBuddy - an intelligent AI assistant for the Fresh Food Platform.

MAIN TASKS:
• Product consultation: Recommend fresh products available in the system
• Cooking guidance: Share recipes and cooking methods
• Ingredient suggestions: Connect dishes with products for sale
• Smart search: Use Google Search info to answer nutrition, cooking tips, food storage questions

RESPONSE PRINCIPLES:
• Always prioritize products in the system if relevant
• When giving cooking instructions, ALWAYS link to products being sold (if available)
• If no matching products, still answer based on search information
• Keep answers concise, suitable for chat UI (max 250 words)
• Use bullet points when listing
• Add appropriate emojis 🥬🍖🍳`;

    const availabilityNote = this.buildAvailabilityNote(dataAvailability, isVietnamese);
    const intentNote = intentDirectives.filter(Boolean).join(' ');

    return [basePrompt, availabilityNote, intentNote].filter(Boolean).join('\n\n');
  }

  private buildAvailabilityNote(state: 'full' | 'partial' | 'empty', isVietnamese: boolean): string {
    if (state === 'empty') {
      return isVietnamese
        ? '⚠️ LƯU Ý: Không tìm thấy sản phẩm phù hợp trong hệ thống. Hãy trả lời dựa trên thông tin tìm kiếm bên ngoài và đề xuất khách hàng tìm kiếm thêm trên website.'
        : '⚠️ NOTE: No matching products found in the system. Answer based on external search info and suggest the customer search more on the website.';
    }
    if (state === 'partial') {
      return isVietnamese
        ? '📝 GHI CHÚ: Chỉ tìm thấy một số sản phẩm liên quan. Hãy giới thiệu những gì có và bổ sung thông tin từ nguồn bên ngoài.'
        : '📝 NOTE: Only a few related products found. Present what\'s available and supplement with external info.';
    }
    return isVietnamese
      ? '✅ Dữ liệu sản phẩm đầy đủ. Ưu tiên giới thiệu sản phẩm trong hệ thống.'
      : '✅ Full product data available. Prioritize system products.';
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
