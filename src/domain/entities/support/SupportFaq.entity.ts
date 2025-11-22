export type SupportedLocale = 'vi' | 'en';

type FaqTranslation = {
  vi: string;
  en: string;
};

export interface SupportFaqRecord {
  id: string;
  category: string;
  question: FaqTranslation;
  answer: FaqTranslation;
  helpful: number;
  notHelpful: number;
  keywords?: string[];
}

export type SupportFaqVoteType = 'helpful' | 'not_helpful';

export interface SupportFaq {
  id: string;
  category: string;
  question: string;
  answer: string;
  helpful: number;
  notHelpful: number;
  userVote?: SupportFaqVoteType | null;
}
