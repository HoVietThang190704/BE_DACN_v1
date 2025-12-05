import { FALLBACK_KNOWLEDGE_BASE, FallbackKnowledgeCard } from '../../data/knowledge/fallbackCatalog';

export interface KnowledgeInsight {
  id: string;
  title: string;
  summary: string;
  highlights: string[];
  source?: string;
  url?: string;
  instructions?: string[];
}

export class FallbackKnowledgeService {
  constructor(private readonly knowledgeBase: FallbackKnowledgeCard[] = FALLBACK_KNOWLEDGE_BASE) {}

  searchInsights(term: string, locale: 'vi' | 'en', limit: number = 3): KnowledgeInsight[] {
    if (!this.knowledgeBase.length) {
      return [];
    }

    const normalizedTerm = this.normalize(term);
    const tokens = normalizedTerm.split(/\s+/).filter(Boolean);

    const ranked = this.knowledgeBase
      .map((card) => ({
        card,
        score: this.calculateScore(card, tokens),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (ranked.length === 0) {
      return this.knowledgeBase.slice(0, limit).map((card) => this.toInsight(card, locale));
    }

    return ranked.map((entry) => this.toInsight(entry.card, locale));
  }

  private calculateScore(card: FallbackKnowledgeCard, tokens: string[]): number {
    if (!tokens.length) return 1;
    const keywordSet = new Set(card.keywords.map((keyword) => this.normalize(keyword)));
    let score = 0;
    for (const token of tokens) {
      if (keywordSet.has(token)) {
        score += 3;
      } else if ([...keywordSet].some((keyword) => keyword.includes(token) || token.includes(keyword))) {
        score += 1;
      }
    }
    return score;
  }

  private toInsight(card: FallbackKnowledgeCard, locale: 'vi' | 'en'): KnowledgeInsight {
    const summary = locale === 'en' ? card.summaryEn : card.summaryVi;
    const highlights = locale === 'en' ? card.highlightsEn : card.highlightsVi;
    return {
      id: card.id,
      title: card.title,
      summary,
      highlights,
      source: undefined,
      url: undefined,
      instructions: undefined,
    };
  }

  private normalize(value: string): string {
    return value
      ?.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();
  }
}
