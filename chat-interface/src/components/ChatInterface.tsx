import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, Market, Product } from '../types';
import Spinner from './Spinner';
import SendIcon from './icons/SendIcon';

interface ChatInterfaceProps {
  history: ChatMessage[];
  isQueryLoading: boolean;
  onSendMessage: (message: string, market: Market, product: Product) => void;
  exampleQuestions: string[];
  sessionId: string;
  onResetSession: () => void;
}

const MARKETS: Market[] = ['all', 'br', 'de', 'en', 'tr', 'fr'];
const PRODUCTS: Product[] = ['all', 'desktop', 'mobile', 'air', 'neon', 'spotify', 'general'];

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  history,
  isQueryLoading,
  onSendMessage,
  exampleQuestions,
  sessionId,
  onResetSession,
}) => {
  const [query, setQuery] = useState('');
  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<Market>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product>('all');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (exampleQuestions.length === 0) {
      setCurrentSuggestion('');
      return;
    }

    setCurrentSuggestion(exampleQuestions[0]);
    let suggestionIndex = 0;
    const intervalId = setInterval(() => {
      suggestionIndex = (suggestionIndex + 1) % exampleQuestions.length;
      setCurrentSuggestion(exampleQuestions[suggestionIndex]);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [exampleQuestions]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSendMessage(query, selectedMarket, selectedProduct);
      setQuery('');
    }
  };

  const handleSourceClick = (text: string) => {
    setModalContent(text);
  };

  const closeModal = () => {
    setModalContent(null);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isQueryLoading]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Session Controls */}
      <div className="border-b border-gem-mist/30 bg-gem-slate px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-end">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gem-offwhite/60">
              Session: {sessionId.slice(0, 8)}...
            </span>
            <button
              onClick={onResetSession}
              className="px-3 py-1.5 text-sm bg-gem-mist/20 hover:bg-gem-mist/40 rounded-lg transition-colors"
            >
              New Conversation
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto px-4 pt-6 pb-32">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          {history.length === 0 && (
            <div className="text-center py-12">
              <h2 className="text-3xl font-bold mb-4">Ask the Opera Knowledge Base</h2>
              <p className="text-gem-offwhite/70 mb-6">
                Ask any question about Opera products, campaigns, or processes.
              </p>
              <div className="flex gap-4 justify-center mb-6">
                <div>
                  <label className="block text-sm mb-2">Market</label>
                  <select
                    value={selectedMarket}
                    onChange={(e) => setSelectedMarket(e.target.value as Market)}
                    className="bg-gem-slate border border-gem-mist/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gem-blue"
                  >
                    {MARKETS.map(market => (
                      <option key={market} value={market}>{market.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2">Product</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value as Product)}
                    className="bg-gem-slate border border-gem-mist/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gem-blue"
                  >
                    {PRODUCTS.map(product => (
                      <option key={product} value={product}>{product.charAt(0).toUpperCase() + product.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {history.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl px-5 py-4 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-gem-blue text-white'
                  : 'bg-gem-slate'
              }`}>
                <div className="markdown-body">
                  <ReactMarkdown>{message.parts[0].text}</ReactMarkdown>
                </div>
                {message.role === 'model' && message.sourceNames && message.sourceNames.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gem-mist/50">
                    <h4 className="text-xs font-semibold text-gem-offwhite/70 mb-2">Sources:</h4>
                    <ul className="space-y-1">
                      {message.sourceNames.map((name, i) => (
                        <li key={i} className="text-sm text-gem-teal flex items-start gap-2">
                          <span className="text-gem-teal/60 mt-0.5">&#8226;</span>
                          <span>{name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {message.role === 'model' && message.groundingChunks && message.groundingChunks.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gem-mist/50">
                    <h4 className="text-xs font-semibold text-gem-offwhite/70 mb-2">Source Documents:</h4>
                    <div className="flex flex-wrap gap-2">
                      {message.groundingChunks.map((chunk, chunkIndex) => (
                        chunk.retrievedContext?.text && (
                          <button
                            key={chunkIndex}
                            onClick={() => handleSourceClick(chunk.retrievedContext!.text!)}
                            className="bg-gem-mist/50 hover:bg-gem-mist text-xs px-3 py-1 rounded-md transition-colors"
                            aria-label={`View source ${chunkIndex + 1}`}
                            title="View source document chunk"
                          >
                            Source {chunkIndex + 1}
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isQueryLoading && (
            <div className="flex justify-start">
              <div className="max-w-xl lg:max-w-2xl px-5 py-3 rounded-2xl bg-gem-slate flex items-center">
                <Spinner />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gem-onyx/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-2 min-h-[3rem] flex items-center justify-center">
            {!isQueryLoading && currentSuggestion && (
              <button
                onClick={() => setQuery(currentSuggestion)}
                className="text-base text-gem-offwhite bg-gem-slate hover:bg-gem-mist transition-colors px-4 py-2 rounded-full"
                title="Use this suggestion as your prompt"
              >
                Try: "{currentSuggestion}"
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about Opera..."
              className="flex-grow bg-gem-mist border border-gem-mist/50 rounded-full py-3 px-5 focus:outline-none focus:ring-2 focus:ring-gem-blue"
              disabled={isQueryLoading}
            />
            <button
              type="submit"
              disabled={isQueryLoading || !query.trim()}
              className="p-3 bg-gem-blue hover:bg-blue-500 rounded-full text-white disabled:bg-gem-mist transition-colors"
              title="Send message"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </div>

      {modalContent !== null && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-gem-slate p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Source Text</h3>
            <div className="flex-grow overflow-y-auto pr-4 text-gem-offwhite/80 border-t border-b border-gem-mist py-4 prose prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
              <ReactMarkdown>{modalContent || ''}</ReactMarkdown>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={closeModal} className="px-6 py-2 rounded-md bg-gem-blue hover:bg-blue-500 text-white transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
