import React, { useState, useEffect } from 'react';
import { ChatMessage, Market, Product } from './types';
import { sendChatMessage } from './services/apiService';
import ChatInterface from './components/ChatInterface';

const EXAMPLE_QUESTIONS = [
  'What are the campaign rules for Opera Desktop in Brazil?',
  'How do I onboard a new market?',
  'What is the approval process for campaigns?',
  'Tell me about Opera GX features',
  'What are the differences between Desktop and Mobile campaigns?',
];

function extractSources(text: string): { cleanText: string; sources: string[] } {
  const sources: string[] = [];

  // Match **Sources:** or Sources: section at the end
  const sourcesRegex = /\n*\*{0,2}Sources?\*{0,2}:\s*\n([\s\S]*?)$/i;
  const match = text.match(sourcesRegex);

  if (match) {
    const sourcesBlock = match[1];
    const cleanText = text.slice(0, match.index).trimEnd();
    // Extract individual source lines (- *name* or - name or * name)
    const lineRegex = /[-*]\s*\*?([^*\n]+)\*?\s*/g;
    let lineMatch;
    while ((lineMatch = lineRegex.exec(sourcesBlock)) !== null) {
      const src = lineMatch[1].trim();
      if (src && src !== 'Search_Knowledge_Base Tool') {
        sources.push(src);
      }
    }
    return { cleanText, sources };
  }

  // Match inline "Source: X Tool." or "Source: X." at the end
  const inlineSourceRegex = /\n*Source:\s*(.+?)\.?\s*$/i;
  const inlineMatch = text.match(inlineSourceRegex);
  if (inlineMatch) {
    const src = inlineMatch[1].trim();
    const cleanText = text.slice(0, inlineMatch.index).trimEnd();
    if (src && src !== 'Search_Knowledge_Base Tool' && src !== 'Opera knowledge base documents') {
      sources.push(src);
    }
    return { cleanText, sources };
  }

  return { cleanText: text, sources };
}

const AUTH_KEY = 'opera_kb_auth';
const CORRECT_PASSWORD = 'OperaKB2026';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => {
    const stored = localStorage.getItem('opera_kb_session_id');
    return stored || crypto.randomUUID();
  });

  useEffect(() => {
    localStorage.setItem('opera_kb_session_id', sessionId);
  }, [sessionId]);

  const resetSession = () => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    setChatHistory([]);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === CORRECT_PASSWORD) {
      localStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleSendMessage = async (message: string, market: Market, product: Product) => {
    const userMessage: ChatMessage = {
      role: 'user',
      parts: [{ text: message }],
    };
    setChatHistory((prev) => [...prev, userMessage]);
    setIsQueryLoading(true);

    try {
      const result = await sendChatMessage(message, market, product, sessionId);
      const { cleanText, sources: extractedSources } = extractSources(result.answer);
      const modelMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: cleanText }],
        sourceNames: extractedSources,
        groundingChunks: result.sources || [],
      };
      setChatHistory((prev) => [...prev, modelMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: 'Sorry, I encountered an error. Please try again.' }],
      };
      setChatHistory((prev) => [...prev, errorMessage]);
      console.error('Failed to get response:', err);
    } finally {
      setIsQueryLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gem-onyx text-gem-offwhite">
        <div className="w-full max-w-md px-6">
          <div className="bg-gem-slate rounded-2xl shadow-2xl p-8 border border-gem-mist/30">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Opera Knowledge Base</h1>
              <p className="text-gem-offwhite/60 text-sm">Enter your password to continue</p>
            </div>
            <form onSubmit={handleLogin}>
              <div className="mb-6">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError(false);
                  }}
                  placeholder="Password"
                  className={`w-full bg-gem-onyx border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-gem-blue text-gem-offwhite placeholder-gem-offwhite/40 ${
                    passwordError ? 'border-red-500' : 'border-gem-mist/50'
                  }`}
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-400 text-sm mt-2">Incorrect password. Please try again.</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-gem-blue hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gem-onyx text-gem-offwhite">
      {/* Header */}
      <nav className="bg-gem-slate border-b border-gem-mist/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Opera Knowledge Base</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow overflow-hidden">
        <ChatInterface
          history={chatHistory}
          isQueryLoading={isQueryLoading}
          onSendMessage={handleSendMessage}
          exampleQuestions={EXAMPLE_QUESTIONS}
          sessionId={sessionId}
          onResetSession={resetSession}
        />
      </main>
    </div>
  );
};

export default App;
