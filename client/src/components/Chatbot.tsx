import { useState, useEffect, useCallback, useRef } from 'react';
import { trpc } from '../lib/trpc';
import { useLocation } from 'wouter';
import {
  X, Send, Loader2, Trash2, Minimize2, Maximize2,
  BookOpen, HelpCircle, Languages, Sparkles, MessageCircle,
  Star, ArrowRight, LogIn
} from 'lucide-react';
import { getLoginUrl, getSignUpUrl } from '@/const';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Modes available when the user is NOT logged in (landing/marketing pages) */
type GuestChatMode = 'support' | 'faq' | 'demo';

/** Modes available when the user IS logged in (in-app pages) */
type AppChatMode = 'general' | 'languagePractice' | 'support';

type ChatMode = GuestChatMode | AppChatMode;

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface BookiContext {
  page?: string;
  isAuthenticated?: boolean;
  storyTitle?: string;
  storyTranslation?: string;
  storyTheme?: string;
  storyLanguage?: string;
  userLevel?: string;
  currentSentence?: string;
  currentSentenceTranslation?: string;
  vocabularyWords?: string[];
}

interface ChatbotProps {
  context?: BookiContext;
}

// ─── Quick chips per mode ─────────────────────────────────────────────────────

const QUICK_CHIPS: Record<string, string[]> = {
  // Guest modes
  support: [
    "How does Storyling.ai work?",
    "Is it free to start?",
    "What languages are available?",
    "How is this different from Duolingo?",
  ],
  faq: [
    "What's included in the free plan?",
    "Can I cancel anytime?",
    "How do I choose my level?",
    "Do you have a mobile app?",
  ],
  demo: [
    "Show me an example story",
    "How does vocabulary learning work?",
    "What is Film mode?",
    "Tell me about Podcast mode",
  ],
  // App modes
  general: [
    "What can you help me with?",
    "How do I improve my level?",
    "Explain a word for me",
  ],
  languagePractice: [
    "Let's have a conversation",
    "Correct my grammar",
    "Quiz me on vocabulary",
    "Explain this sentence",
  ],
  appSupport: [
    "How do I create a story?",
    "How does spaced repetition work?",
    "What's the difference between levels?",
    "How do I export my word bank?",
  ],
  story: [
    "Explain this sentence",
    "Quiz me on vocabulary",
    "What does this word mean?",
    "Translate this for me",
  ],
};

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Sign-up nudge banner (shown in guest mode) ───────────────────────────────

function SignUpNudge() {
  return (
    <div className="mx-3 mb-2 rounded-xl bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-100 p-3 flex items-center gap-3 flex-shrink-0">
      <Star className="w-4 h-4 text-purple-500 flex-shrink-0" />
      <p className="text-xs text-purple-700 flex-1 leading-snug">
        Start learning for free — no credit card needed!
      </p>
      <a
        href={getSignUpUrl()}
        className="flex items-center gap-1 text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-teal-500 rounded-full px-3 py-1.5 whitespace-nowrap hover:opacity-90 transition-opacity"
      >
        Join Free <ArrowRight className="w-3 h-3" />
      </a>
    </div>
  );
}

// ─── Main Chatbot component ───────────────────────────────────────────────────

export function Chatbot({ context }: ChatbotProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAuthenticated = context?.isAuthenticated ?? false;

  // Default mode depends on auth state
  const [mode, setMode] = useState<ChatMode>(isAuthenticated ? 'general' : 'support');

  // Keep mode in sync when auth state changes
  useEffect(() => {
    if (isAuthenticated && (mode === 'support' || mode === 'faq' || mode === 'demo')) {
      setMode('general');
      setMessages([]);
      setConversationId(null);
    } else if (!isAuthenticated && (mode === 'general' || mode === 'languagePractice')) {
      setMode('support');
      setMessages([]);
      setConversationId(null);
    }
  }, [isAuthenticated]);

  const utils = trpc.useUtils();

  // Hide on auth pages
  const hideOnPages = ['/login', '/signup', '/verify-email'];
  const shouldHide = hideOnPages.some(p => location.startsWith(p));

  // Resolve quick chips
  const quickChips = context?.storyTitle
    ? QUICK_CHIPS.story
    : mode === 'support' && isAuthenticated
    ? QUICK_CHIPS.appSupport
    : QUICK_CHIPS[mode] ?? QUICK_CHIPS.support;

  // Get or create conversation
  const { data: conversationData, isLoading: loadingConversation } = trpc.chatbot.getConversation.useQuery(
    {
      mode: (mode === 'faq' || mode === 'demo') ? 'support' : (mode as AppChatMode),
      language: context?.storyLanguage || 'English',
      level: context?.userLevel || 'intermediate',
    },
    { enabled: isOpen && !shouldHide }
  );

  // Send message mutation
  const sendMessageMutation = trpc.chatbot.sendMessage.useMutation({
    onSuccess: (newMessage) => {
      setMessages((prev) => [...prev, newMessage as Message]);
      setMessage('');
      if (!isOpen) setHasNewMessage(true);
    },
    onError: (error) => {
      // Show a friendly error message as a bot reply
      const errorMsg = error.message?.includes('429') || error.message?.includes('quota')
        ? "I'm temporarily unavailable due to high demand. Please try again in a few minutes! \u2728"
        : error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')
        ? "That took too long \u2014 please try again!"
        : "Oops, something went wrong. Please try again!";
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant' as const,
          content: errorMsg,
          createdAt: new Date(),
        },
      ]);
    },
  });

  // Clear conversation mutation
  const clearConversationMutation = trpc.chatbot.clearConversation.useMutation({
    onSuccess: () => {
      setMessages([]);
      utils.chatbot.getConversation.invalidate();
    },
  });

  useEffect(() => {
    if (conversationData) {
      setConversationId(conversationData.conversation.id);
      setMessages(conversationData.messages as Message[]);
    }
  }, [conversationData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Listen for open-booki-chat event dispatched from the adventure map
  useEffect(() => {
    const handler = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener('open-booki-chat', handler);
    return () => window.removeEventListener('open-booki-chat', handler);
  }, []);

  const handleSendMessage = useCallback((text?: string) => {
    const msgText = text || message;
    if (!msgText.trim() || !conversationId || sendMessageMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: msgText,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    sendMessageMutation.mutate({
      conversationId,
      message: msgText.trim(),
      context: context || { page: location },
    });

    setMessage('');
  }, [message, conversationId, sendMessageMutation, context, location]);

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);
    setMessages([]);
    setConversationId(null);
  };

  // ─── Tab configs ───────────────────────────────────────────────────────────

  const guestTabs: { mode: GuestChatMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'support', label: 'Ask Us', icon: <MessageCircle className="w-3.5 h-3.5" /> },
    { mode: 'faq', label: 'FAQ', icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { mode: 'demo', label: 'See How', icon: <Sparkles className="w-3.5 h-3.5" /> },
  ];

  const appTabs: { mode: AppChatMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'general', label: 'General', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { mode: 'languagePractice', label: 'Practice', icon: <Languages className="w-3.5 h-3.5" /> },
    { mode: 'support', label: 'Help', icon: <HelpCircle className="w-3.5 h-3.5" /> },
  ];

  // ─── Empty state description ───────────────────────────────────────────────

  const emptyDescription = (() => {
    if (!isAuthenticated) {
      if (mode === 'faq') return "Got questions about Storyling.ai? I have all the answers!";
      if (mode === 'demo') return "Let me show you how Storyling.ai works — ask me anything about the features!";
      return "Hi! I'm Booki 👋 Ask me anything about Storyling.ai — how it works, pricing, languages, or how to get started!";
    }
    if (mode === 'languagePractice') return "Let's practice your language skills! I can help with conversations, grammar, and vocabulary.";
    if (mode === 'support') return "I'm here to help you get the most out of Storyling.ai. Ask me anything!";
    if (context?.storyTitle) return `I'm here to help you understand "${context.storyTitle}". Ask me about vocabulary, grammar, or the story!`;
    return "I'm your story companion! I can help with language practice, vocabulary, grammar, or anything about the app.";
  })();

  // ─── Render ────────────────────────────────────────────────────────────────

  if (shouldHide) return null;

  return (
    <>
      {/* Floating Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 group"
          aria-label="Open Booki chat"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 via-violet-500 to-teal-500 shadow-lg shadow-purple-500/30 flex items-center justify-center hover:scale-110 transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/40">
              <span className="text-2xl">📖</span>
            </div>
            {hasNewMessage && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            )}
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
              <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                {isAuthenticated ? 'Chat with Booki ✨' : 'Have a question? Ask Booki!'}
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200/60 flex flex-col overflow-hidden transition-all duration-200 ${
            isMinimized ? 'h-16 w-80' : 'w-[380px] h-[580px]'
          }`}
          style={{ maxHeight: 'calc(100vh - 6rem)' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-teal-500 p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/booki-pfp_7efb7238.png"
                  alt="Booki"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm leading-tight">Booki</h3>
                <p className="text-white/70 text-xs">
                  {isAuthenticated ? 'Your story companion' : 'Storyling.ai assistant'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                aria-label="Close Booki"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Mode Tabs */}
              <div className="flex border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
                {(isAuthenticated ? appTabs : guestTabs).map((tab) => (
                  <button
                    key={tab.mode}
                    onClick={() => handleModeChange(tab.mode)}
                    className={`flex-1 py-2.5 text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                      mode === tab.mode
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Context Banner (when on a story page) */}
              {context?.storyTitle && (
                <div className="px-4 py-2 bg-purple-50 border-b border-purple-100 flex items-center gap-2 flex-shrink-0">
                  <BookOpen className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                  <p className="text-xs text-purple-700 truncate">
                    <span className="font-medium">Reading:</span> {context.storyTitle}
                  </p>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {loadingConversation ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-2">
                    <div className="text-4xl mb-3">📖</div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">Hi, I'm Booki!</h4>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                      {emptyDescription}
                    </p>
                    {/* Quick chips */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {quickChips.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => handleSendMessage(chip)}
                          disabled={!conversationId}
                          className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-full px-3 py-1.5 transition-colors disabled:opacity-50"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    {/* Sign-in CTA for guest users */}
                    {!isAuthenticated && (
                      <div className="mt-5 flex flex-col gap-2 w-full">
                        <a
                          href={getSignUpUrl()}
                          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-teal-500 rounded-full py-2.5 hover:opacity-90 transition-opacity"
                        >
                          <Sparkles className="w-4 h-4" />
                          Start Learning Free
                        </a>
                        <a
                          href={getLoginUrl()}
                          className="w-full flex items-center justify-center gap-2 text-sm font-medium text-purple-600 border border-purple-200 rounded-full py-2 hover:bg-purple-50 transition-colors"
                        >
                          <LogIn className="w-4 h-4" />
                          Sign In
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center text-xs flex-shrink-0 mb-0.5">
                            📖
                          </div>
                        )}
                        <div
                          className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {sendMessageMutation.isPending && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Sign-up nudge for guest users (shown when there are messages) */}
              {!isAuthenticated && messages.length > 0 && <SignUpNudge />}

              {/* Input Area */}
              <div className="border-t border-gray-100 p-3 flex-shrink-0 bg-white">
                {/* Quick chips when messages exist */}
                {messages.length > 0 && messages.length < 4 && (
                  <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-hide">
                    {quickChips.slice(0, 3).map((chip) => (
                      <button
                        key={chip}
                        onClick={() => handleSendMessage(chip)}
                        disabled={!conversationId || sendMessageMutation.isPending}
                        className="text-xs bg-gray-100 hover:bg-purple-50 hover:text-purple-700 text-gray-600 border border-gray-200 hover:border-purple-200 rounded-full px-2.5 py-1 whitespace-nowrap transition-colors flex-shrink-0 disabled:opacity-50"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 items-end">
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder={isAuthenticated ? "Ask Booki anything..." : "Ask a question..."}
                    className="flex-1 px-3.5 py-2.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white text-sm transition-all placeholder-gray-400"
                    disabled={sendMessageMutation.isPending || !conversationId}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!message.trim() || sendMessageMutation.isPending || !conversationId}
                    className="w-10 h-10 bg-gradient-to-br from-purple-500 to-teal-500 text-white rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                    aria-label="Send message"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {messages.length > 0 && (
                  <button
                    onClick={() => conversationId && clearConversationMutation.mutate({ conversationId })}
                    disabled={clearConversationMutation.isPending || !conversationId}
                    className="mt-2 text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear conversation
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
