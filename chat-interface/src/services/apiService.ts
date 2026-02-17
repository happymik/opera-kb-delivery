import { ChatResponse, Market, Product } from '../types';

const API_BASE = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.lomeai.com/webhook';
const MAX_RETRIES = 2;

async function fetchWithRetry(url: string, options: RequestInit, retries: number): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.statusText}`);
    }
    const text = await response.text();
    if (text.length > 0) {
      // Return a new Response with the text so caller can parse JSON
      return new Response(text, { status: response.status, headers: response.headers });
    }
    // Empty response - retry if attempts remain
    if (attempt < retries) {
      console.warn(`Empty response, retrying (${attempt + 1}/${retries})...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error('Empty response after retries');
}

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

    const response = await fetchWithRetry(`${API_BASE}/opera-kb-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }, MAX_RETRIES);

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
