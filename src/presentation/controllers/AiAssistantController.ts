import { Request, Response } from 'express';
import { AskAiAssistantUseCase } from '../../domain/usecases/ai/AskAiAssistant.usecase';
import { AiAssistantHistoryMessage } from '../../domain/entities/ai/AiAssistant.types';
import { logger } from '../../shared/utils/logger';

export class AiAssistantController {
  constructor(private readonly askAiAssistantUseCase: AskAiAssistantUseCase) {}

  async chat(req: Request, res: Response): Promise<void> {
    try {
      const message = typeof req.body?.message === 'string' ? req.body.message : '';
      if (!message.trim()) {
        res.status(400).json({ success: false, message: 'Message is required' });
        return;
      }

      const locale = typeof req.body?.locale === 'string' ? req.body.locale : req.acceptsLanguages()?.[0] || 'vi';
      const rawHistory: unknown = req.body?.history;
      const sanitizedHistory: AiAssistantHistoryMessage[] = Array.isArray(rawHistory)
        ? rawHistory
            .map((entry) => {
              if (!entry || typeof entry !== 'object') return null;
              const role = (entry as { role?: string }).role;
              const content = (entry as { content?: unknown }).content;
              if ((role === 'user' || role === 'assistant') && typeof content === 'string') {
                return {
                  role,
                  content: content.slice(0, 800),
                } as AiAssistantHistoryMessage;
              }
              return null;
            })
            .filter((item): item is AiAssistantHistoryMessage => Boolean(item))
            .slice(-6)
        : [];

      const result = await this.askAiAssistantUseCase.execute({
        question: message,
        locale,
        history: sanitizedHistory,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const isUnavailable = /not available/i.test(message) || /not configured/i.test(message);
      logger.error('[AiAssistantController] chat error:', error);
      res.status(isUnavailable ? 503 : 500).json({ success: false, message });
    }
  }
}
