export type AiAssistantRole = 'user' | 'assistant';

export interface AiAssistantHistoryMessage {
  role: AiAssistantRole;
  content: string;
}

export interface AiAssistantCategorySuggestion {
  id: string;
  name: string;
  description?: string | null;
  slug?: string | null;
  parentId?: string | null;
}

export interface AiAssistantProductSuggestion {
  id: string;
  name: string;
  price: number;
  unit?: string;
  image?: string | null;
  inStock?: boolean;
  rating?: number | null;
  reviewCount?: number | null;
  categoryName?: string | null;
  tags?: string[];
}

export interface AiAssistantResponsePayload {
  answer: string;
  suggestions: {
    categories: AiAssistantCategorySuggestion[];
    products: AiAssistantProductSuggestion[];
  };
}
