import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLens } from '../hooks/useLens';
import { api, CitationItem } from '../lib/api';
import { MessageBubble } from './MessageBubble';
import { LensSelector } from './LensSelector';
import { CitationDrawer } from './CitationDrawer';
import {
  Send,
  Sparkles,
  Bot,
  AlertCircle,
  HelpCircle,
  Trash2,
  ChevronDown,
  Layers,
} from 'lucide-react';
import clsx from 'clsx';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: CitationItem[];
  lens?: string;
  timestamp: string;
}

export const ChatWindow: React.FC = () => {
  const { token } = useAuth();
  const { activeLens, config } = useLens();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem(`unify_chat_history_${activeLens}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: `Welcome to **Unify** operating under the **${config.name} Lens**.\n\nI reason across your ingested multimodal files—including audio recordings, scanned diagrams, drone images, and native documents—in a shared 768-dimensional vector space.\n\nAsk any question to retrieve and synthesize cross-modal evidence with exact, clickable citations.`,
        citations: [],
        lens: config.name,
        timestamp: new Date().toLocaleTimeString(),
      },
    ];
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Save history per lens
  useEffect(() => {
    localStorage.setItem(`unify_chat_history_${activeLens}`, JSON.stringify(messages));
  }, [messages, activeLens]);

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputValue]);

  const handleCitationClick = (citation: CitationItem | { citation_id: string }) => {
    // If partial citation object, try to look up in existing messages
    let foundCitation: CitationItem | undefined;
    for (const msg of messages) {
      const match = msg.citations?.find(
        (c) => c.citation_id === citation.citation_id || `[${c.citation_id}]` === citation.citation_id
      );
      if (match) {
        foundCitation = match;
        break;
      }
    }

    const resolved: CitationItem = foundCitation || (citation as CitationItem);
    setActiveCitation(resolved);
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputValue.trim();
    if (!query || isLoading) return;

    setErrorMsg(null);
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await api.sendChat(token, query, activeLens);

      const assistantMessage: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        citations: response.citations || [],
        lens: response.lens || activeLens,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMsg(err.message || 'Failed to generate cross-modal reasoning answer');

      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Unable to complete reasoning request**: ${err.message || 'An error occurred'}.\n\nPlease ensure your knowledge base has uploaded files for the **${activeLens}** lens, and that the Gemini API key and Supabase database are configured.`,
        citations: [],
        lens: activeLens,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `rst-${Date.now()}`,
        role: 'assistant',
        content: `Chat session reset for **${config.name} Lens**. What would you like to investigate?`,
        citations: [],
        lens: config.name,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // Sample prompt pills depending on active lens
  const getSamplePrompts = () => {
    switch (activeLens) {
      case 'Agriculture':
        return [
          'What is causing the leaf yellowing in the north sector?',
          'Correlate the soil telemetry nitrogen level with the drone NDVI aerial scan.',
          'What specific remediation does the field agronomist recommend?',
        ];
      case 'Healthcare':
        return [
          'Summarize the patient’s cardiac markers and recent clinical dictation.',
          'Are there any contraindications or elevated indicators in the metabolic panel?',
          'What were the doctor’s auscultation findings at the 0:40 timestamp?',
        ];
      case 'Education':
        return [
          'Synthesize the key points from the lecture recording and handout on quantum entanglement.',
          'Explain the EPR paradox formula written on the whiteboard scan.',
          'Does the No-Communication theorem permit superluminal signaling?',
        ];
    }
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Chat Header Bar */}
      <div className="p-4 px-6 border-b border-slate-800 bg-slate-950/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-tr', config.gradient)}>
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Cross-Modal Reasoning Pipeline
              <span className={clsx('text-[11px] font-semibold px-2 py-0.5 rounded-full border', config.badgeBg)}>
                {config.name} Mode
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
              {config.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <LensSelector variant="tabs" />
          <button
            onClick={clearChat}
            title="Reset Chat Session"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            citations={msg.citations}
            lens={msg.lens}
            onCitationClick={handleCitationClick}
          />
        ))}

        {/* Loading / Thinking Bubble */}
        {isLoading && (
          <div className="flex gap-3 md:gap-4 my-4 animate-fadeIn">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shrink-0">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div className="glass-panel border-slate-800 rounded-2xl rounded-tl-xs p-5 shadow-xl space-y-3 max-w-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Synthesizing Multimodal Knowledge Chunks...</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-slate-800 rounded-full animate-pulse w-4/5" />
                <div className="h-2 bg-slate-800 rounded-full animate-pulse w-3/5" />
                <div className="h-2 bg-slate-800 rounded-full animate-pulse w-2/3" />
              </div>
              <span className="text-[11px] text-slate-400 block pt-1 font-mono">
                Searching 768-dim pgvector space & citing exact timestamps/pages
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Pills */}
      <div className="px-4 sm:px-6 py-2 border-t border-slate-800/60 bg-slate-950/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-indigo-400" /> Suggested:
        </span>
        {getSamplePrompts().map((prompt, i) => (
          <button
            key={i}
            onClick={() => setInputValue(prompt)}
            className="text-xs whitespace-nowrap px-3 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors shrink-0 cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <div className="p-4 sm:p-6 pt-3 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          <div className="flex-1 relative rounded-2xl glass-input border border-slate-700/80 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-lg transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask Unify in ${config.name} Lens (e.g. "What is causing the leaf yellowing?")...`}
              className="w-full py-3.5 pl-4 pr-12 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-hidden resize-none max-h-40"
            />
          </div>

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className={clsx(
              'p-3.5 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 shadow-lg',
              inputValue.trim() && !isLoading
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-indigo-500/25 hover:scale-105 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span className="font-mono text-slate-400">Gemini 2.5 Pro + text-embedding-004</span>
        </div>
      </div>

      {/* Slide-out Citation Inspector Drawer */}
      <CitationDrawer
        citation={activeCitation}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};
