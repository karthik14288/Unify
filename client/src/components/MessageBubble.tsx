import React from 'react';
import { CitationItem } from '../lib/api';
import { CitationBadge } from './CitationBadge';
import { Bot, User, Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  citations?: CitationItem[];
  onCitationClick: (citation: CitationItem) => void;
  lens?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  content,
  citations = [],
  onCitationClick,
  lens,
}) => {
  // Map citations by their ID (e.g., "1", "2") for fast lookup
  const citationMap = new Map<string, CitationItem>();
  citations.forEach((c) => {
    // Also handle format like "[1]" or "1"
    const cleanId = c.citation_id.replace(/[\[\]]/g, '');
    citationMap.set(cleanId, c);
    citationMap.set(c.citation_id, c);
  });

  /**
   * Helper that takes an inline text line and replaces [1], [2], etc. with CitationBadges
   */
  const renderInlineTextWithCitations = (text: string) => {
    // Match [1], [2], [Source_1], [Source 1], etc.
    const citationRegex = /\[(\d+|Source_\d+|Source\s*\d+)\]/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = citationRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      const matchedText = match[0];
      const citationId = match[1].replace(/Source_?/i, '').trim();

      // Push text prior to this citation
      if (matchIndex > lastIndex) {
        elements.push(text.substring(lastIndex, matchIndex));
      }

      const citationObj = citationMap.get(citationId) || citationMap.get(matchedText) || {
        citation_id: citationId,
        source_file_name: 'Multimodal Source',
        location: 'Context',
        snippet: 'Referenced multimodal context chunk.',
      };

      elements.push(
        <CitationBadge
          key={`cite-${matchIndex}-${citationId}`}
          id={citationId}
          citation={citationObj}
          onClick={() => onCitationClick(citationObj)}
        />
      );

      lastIndex = matchIndex + matchedText.length;
    }

    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return elements.length > 0 ? elements : text;
  };

  /**
   * Parse formatted text with markdown headings, bolding, lists, and code blocks
   */
  const renderFormattedMarkdown = (rawContent: string) => {
    const lines = rawContent.split('\n');
    const nodes: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    lines.forEach((line, idx) => {
      // Code block toggles
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          nodes.push(
            <pre
              key={`code-${idx}`}
              className="my-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto shadow-inner"
            >
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      const trimmed = line.trim();

      // Heading 3
      if (trimmed.startsWith('### ')) {
        nodes.push(
          <h4 key={`h3-${idx}`} className="text-sm font-bold text-white mt-4 mb-1">
            {renderInlineTextWithCitations(trimmed.slice(4))}
          </h4>
        );
        return;
      }

      // Heading 2
      if (trimmed.startsWith('## ')) {
        nodes.push(
          <h3 key={`h2-${idx}`} className="text-base font-bold text-white mt-4 mb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            {renderInlineTextWithCitations(trimmed.slice(3))}
          </h3>
        );
        return;
      }

      // Heading 1
      if (trimmed.startsWith('# ')) {
        nodes.push(
          <h2 key={`h1-${idx}`} className="text-lg font-extrabold text-white mt-4 mb-2">
            {renderInlineTextWithCitations(trimmed.slice(2))}
          </h2>
        );
        return;
      }

      // Unordered list item
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        nodes.push(
          <li key={`li-${idx}`} className="ml-5 list-disc text-slate-200 my-1 leading-relaxed">
            {renderInlineTextWithCitations(trimmed.slice(2))}
          </li>
        );
        return;
      }

      // Numbered list item
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        nodes.push(
          <div key={`num-${idx}`} className="flex items-start gap-2 my-1 leading-relaxed">
            <span className="text-xs font-mono font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 shrink-0">
              {numMatch[1]}.
            </span>
            <span className="text-slate-200">{renderInlineTextWithCitations(numMatch[2])}</span>
          </div>
        );
        return;
      }

      // Empty line / paragraph break
      if (!trimmed) {
        nodes.push(<div key={`sp-${idx}`} className="h-2" />);
        return;
      }

      // Standard paragraph
      nodes.push(
        <p key={`p-${idx}`} className="text-slate-200 leading-relaxed my-1">
          {renderInlineTextWithCitations(line)}
        </p>
      );
    });

    if (inCodeBlock && codeBlockContent.length > 0) {
      nodes.push(
        <pre
          key={`code-end`}
          className="my-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto"
        >
          <code>{codeBlockContent.join('\n')}</code>
        </pre>
      );
    }

    return nodes;
  };

  const isUser = role === 'user';

  return (
    <div
      className={clsx(
        'flex gap-3 md:gap-4 my-4 animate-fadeIn',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Bot Icon */}
      {!isUser && (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shrink-0 mt-1">
          <Bot className="w-5 h-5" />
        </div>
      )}

      {/* Bubble Container */}
      <div
        className={clsx(
          'max-w-[85%] md:max-w-[78%] rounded-2xl p-4 md:p-5 text-sm transition-all duration-200 shadow-md',
          isUser
            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-xs shadow-indigo-600/10'
            : 'glass-panel border-slate-800 text-slate-100 rounded-tl-xs shadow-slate-950/40'
        )}
      >
        {/* Assistant Header info with lens tag */}
        {!isUser && (
          <div className="flex items-center justify-between gap-4 pb-2.5 mb-3 border-b border-slate-800/80 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Unify Reasoning Engine</span>
            </div>
            {lens && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                {lens} Lens
              </span>
            )}
          </div>
        )}

        {/* Bubble Text Content */}
        <div className="space-y-1">
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
          ) : (
            renderFormattedMarkdown(content)
          )}
        </div>

        {/* Citations Footer summary pill list */}
        {!isUser && citations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
              Source Trail:
            </span>
            {citations.map((c) => (
              <button
                key={c.citation_id}
                onClick={() => onCitationClick(c)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-900/80 hover:bg-indigo-950 text-indigo-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40 transition-colors cursor-pointer"
              >
                <span className="font-bold">[{c.citation_id}]</span>
                <span className="truncate max-w-[120px]">{c.source_file_name}</span>
                <span className="text-[10px] text-slate-400">({c.location})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Icon */}
      {isUser && (
        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-200 shrink-0 mt-1 shadow-md">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
