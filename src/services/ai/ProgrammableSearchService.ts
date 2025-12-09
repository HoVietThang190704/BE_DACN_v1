import axios from 'axios';
import { config } from '../../config';
import { logger } from '../../shared/utils/logger';
import { KnowledgeInsight } from './FallbackKnowledgeService';

interface GoogleSearchItem {
  cacheId?: string;
  title?: string;
  link?: string;
  displayLink?: string;
  snippet?: string;
  htmlSnippet?: string;
  pagemap?: {
    metatags?: Array<Record<string, string>>;
  };
}

const SEARCH_ENDPOINT = 'https://www.googleapis.com/customsearch/v1';

const COOKING_VERB_REGEX = /(mix|cook|stir|heat|add|serve|marinate|slice|chop|saute|boil|fry|season|grill|simmer|knead|whisk|steam|xào|nêm|ướp|đảo|cho|đun|rửa|băm|chiên|nướng|trộn|thêm|thả|rang|hầm|om|luộc)/i;

interface SearchOptions {
  cookingHint?: boolean;
  stepByStep?: boolean;
}

export class ProgrammableSearchService {
  private readonly apiKey = config.GOOGLE_SEARCH_API_KEY;
  private readonly searchEngineId = config.GOOGLE_SEARCH_ENGINE_ID;

  isEnabled(): boolean {
    return Boolean(this.apiKey && this.searchEngineId);
  }

  async searchInsights(
    term: string,
    locale: 'vi' | 'en',
    limit: number = 3,
    options?: SearchOptions
  ): Promise<KnowledgeInsight[]> {
    if (!this.isEnabled()) {
      return [];
    }

    const query = this.buildQuery(term?.trim(), locale, options);
    if (!query) {
      return [];
    }

    try {
      const { data } = await axios.get<{ items?: GoogleSearchItem[] }>(SEARCH_ENDPOINT, {
        params: {
          key: this.apiKey,
          cx: this.searchEngineId,
          q: query,
          num: Math.min(Math.max(limit, 1), 5),
          hl: locale === 'en' ? 'en' : 'vi',
          gl: 'vn',
          safe: 'active',
        },
        timeout: 6000,
      });

      const items = Array.isArray(data?.items) ? data?.items : [];
      const insights: KnowledgeInsight[] = [];

      for (const item of items) {
        const summary = this.pickSummary(item, locale);
        if (!summary) {
          continue;
        }

        const link = typeof item.link === 'string' ? item.link : undefined;
        const snippet = item.snippet || summary;
        const instructions = options?.cookingHint
          ? await this.resolveCookingInstructions(snippet, link, options?.stepByStep)
          : undefined;
        insights.push({
          id: item.cacheId || link || `google-${insights.length}`,
          title: item.title?.trim() || this.extractSource(link) || 'External reference',
          summary,
          highlights: this.buildHighlights(snippet || summary),
          url: link,
          source: this.extractSource(item.displayLink || link),
          instructions: instructions && instructions.length ? instructions : undefined,
        });

        if (insights.length >= limit) {
          break;
        }
      }

      return insights;
    } catch (error) {
      logger.warn('[ProgrammableSearchService] Failed to fetch insights', error);
      return [];
    }
  }

  private pickSummary(item: GoogleSearchItem, locale: 'vi' | 'en'): string {
    const snippet = item.snippet?.trim();
    if (snippet) {
      return snippet;
    }
    const htmlSnippet = item.htmlSnippet?.replace(/<[^>]+>/g, '').trim();
    if (htmlSnippet) {
      return htmlSnippet;
    }
    const structured = item.pagemap?.metatags?.[0];
    const metaDescription = structured?.description || structured?.['og:description'];
    if (metaDescription) {
      return metaDescription.trim();
    }
    return locale === 'en' ? 'Reference article about fresh food availability.' : 'Tham khảo bài viết liên quan đến nguồn hàng.';
  }

  private buildHighlights(text: string): string[] {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return [];
    }
    const segments = normalized.split(/(?<=[.!?])\s+/).map((segment) => segment.trim()).filter(Boolean);
    return segments.slice(0, 3);
  }

  private buildInstructions(text: string): string[] {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return [];
    }
    const candidates = normalized
      .split(/(?<=[.!?])/)
      .map((sentence) => sentence.trim().replace(/^[•\-\d\.)\s]+/, ''))
      .filter((sentence) => sentence.length > 8);
    return candidates.filter((sentence) => COOKING_VERB_REGEX.test(sentence)).slice(0, 4);
  }

  private async resolveCookingInstructions(
    snippet: string | undefined,
    link?: string,
    needsStepByStep?: boolean
  ): Promise<string[] | undefined> {
    const snippetInstructions = this.buildInstructions(snippet || '');
    if (snippetInstructions.length >= (needsStepByStep ? 3 : 1)) {
      return snippetInstructions;
    }

    if (link) {
      const html = await this.fetchPageContent(link);
      if (html) {
        const extracted = this.extractInstructionsFromHtml(html);
        if (extracted.length) {
          return extracted;
        }
      }
    }

    return snippetInstructions.length ? snippetInstructions : undefined;
  }

  private async fetchPageContent(url?: string): Promise<string | null> {
    if (!url) {
      return null;
    }
    try {
      const { data } = await axios.get<string>(url, {
        timeout: 6000,
        responseType: 'text',
        maxContentLength: 250_000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; FreshBuddyBot/1.0)',
        },
      });
      return typeof data === 'string' ? data : null;
    } catch (error) {
      logger.debug('[ProgrammableSearchService] Failed to fetch page content', { url, error: (error as Error)?.message });
      return null;
    }
  }

  private extractInstructionsFromHtml(html: string): string[] {
    const sanitized = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<(li|p|br|div|h[1-6])[^>]*>/gi, '\n')
      .replace(/<\/(li|p|br|div|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|&amp;/gi, ' ')
      .replace(/\r/g, '\n');

    const lines = sanitized
      .split('\n')
      .map((line) => line.replace(/^[•\-*\d\.)\s]+/, '').trim())
      .filter((line) => line.length > 10);

    const steps: string[] = [];
    let pendingPrefix: string | null = null;

    for (const rawLine of lines) {
      if (!rawLine) continue;
      if (/^(nguyên liệu|nguyen lieu|ingredient)/i.test(rawLine)) {
        pendingPrefix = null;
        continue;
      }

      const stepMatch = rawLine.match(/^(bước|buoc|step)\s*\d+[^:]*(:)?/i);
      if (stepMatch) {
        if (stepMatch[2]) {
          steps.push(rawLine);
        } else {
          pendingPrefix = rawLine;
        }
        if (steps.length >= 8) break;
        continue;
      }

      if (pendingPrefix) {
        steps.push(`${pendingPrefix}: ${rawLine}`.trim());
        pendingPrefix = null;
        if (steps.length >= 8) break;
        continue;
      }

      if (COOKING_VERB_REGEX.test(rawLine)) {
        steps.push(rawLine);
        if (steps.length >= 8) break;
      }
    }

    return steps.slice(0, 8);
  }

  private buildQuery(term: string | undefined, locale: 'vi' | 'en', options?: SearchOptions): string {
    if (!term) return '';
    if (options?.cookingHint) {
      const suffixes = [locale === 'en' ? 'recipe instructions' : 'cách làm chi tiết'];
      if (options.stepByStep) {
        suffixes.push(locale === 'en' ? 'step by step' : 'các bước thực hiện');
      }
      return `${term} ${suffixes.join(' ')}`.trim();
    }
    return term;
  }

  private extractSource(link?: string): string | undefined {
    if (!link) {
      return undefined;
    }
    try {
      return new URL(link).hostname.replace(/^www\./, '');
    } catch {
      return link;
    }
  }
}
