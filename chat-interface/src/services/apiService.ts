import { ChatResponse, Market, Product } from '../types';

const API_BASE = 'https://n8n.lomeai.com/webhook';

export async function sendChatMessage(
  question: string,
  market: Market = 'all',
  product: Product = 'all',
  sessionId?: string
): Promise<ChatResponse> {
  try {
    const requestBody: Record<string, string> = { question, market, product };

    if (sessionId) {
      requestBody.sessionId = sessionId;
    }

    const response = await fetch(`${API_BASE}/kb-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Chat error:', error);
    return {
      success: false,
      answer: 'Failed to get response. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
