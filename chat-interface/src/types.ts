export type Market = 'br' | 'de' | 'en' | 'tr' | 'fr' | 'all';
export type Product = 'desktop' | 'mobile' | 'air' | 'neon' | 'spotify' | 'general' | 'all';

export interface GroundingChunk {
  retrievedContext?: {
    text?: string;
    title?: string;
    uri?: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  sourceNames?: string[];
  groundingChunks?: GroundingChunk[];
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  sources?: GroundingChunk[];
  tokenUsage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
  error?: string;
}
