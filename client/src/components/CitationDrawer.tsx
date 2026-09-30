import React, { useState } from 'react';
import { CitationItem } from '../lib/api';
import {
  X,
  Copy,
  Check,
  FileText,
  Music,
  Image as ImageIcon,
  Video,
  Clock,
  BookOpen,
  Sparkles,
  Quote,
} from 'lucide-react';
import clsx from 'clsx';

interface CitationDrawerProps {
  citation: CitationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({
  citation,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !citation) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(citation.snippet || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getModalityMeta = (fileName: string) => {
    const lower = (fileName || '').toLowerCase();
    if (lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.m4a')) {
      return {
        type: 'Audio Transcript',
        icon: <Music className="w-5 h-5 text-amber-400" />,
        badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        isAudio: true,
      };
    }
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')) {
      return {
        type: 'Visual OCR & Diagram',
        icon: <ImageIcon className="w-5 h-5 text-emerald-400" />,
        badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        isImage: true,
      };
    }
    if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm')) {
      return {
        type: 'Video Timeline',
        icon: <Video className="w-5 h-5 text-purple-400" />,
        badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
        isVideo: true,
      };
    }
    return {
      type: 'Structured Document',
      icon: <FileText className="w-5 h-5 text-cyan-400" />,
      badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      isDoc: true,
    };
  };

  const meta = getModalityMeta(citation.source_file_name);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md glass-panel border-l border-slate-700/60 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
          {/* Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
                {meta.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Source [{citation.citation_id}]
                  </span>
                  <span
                    className={clsx(
                      'text-xs font-medium px-2 py-0.5 rounded border',
                      meta.badgeColor
                    )}
                  >
                    {meta.type}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mt-1 truncate max-w-[220px]">
                  {citation.source_file_name}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Location Pill */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                {meta.isAudio || meta.isVideo ? (
                  <Clock className="w-4 h-4 text-amber-400" />
                ) : (
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                )}
                <span className="font-semibold text-slate-400">Exact Location:</span>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-indigo-300 border border-slate-700">
                {citation.location || 'Section 1'}
              </span>
            </div>

            {/* Audio Waveform visualization if audio */}
            {meta.isAudio && (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30">
                <div className="flex items-center justify-between text-xs text-amber-300 mb-2">
                  <span className="font-mono">Audio Segment Recorded</span>
                  <span className="font-mono text-amber-400 font-semibold">{citation.location}</span>
                </div>
                {/* Simulated waveform bars */}
                <div className="flex items-center gap-1 h-8 px-2 bg-slate-950/40 rounded-lg">
                  {[40, 70, 30, 90, 60, 85, 45, 95, 30, 60, 80, 50, 75, 90, 40, 65, 85, 30, 55, 70].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="flex-1 bg-amber-400/70 rounded-full transition-all duration-300"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Snippet Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-indigo-400" /> Ground Truth Snippet
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-300 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 text-sm leading-relaxed font-sans shadow-inner">
                <div className="absolute top-2 left-2 text-indigo-500/20 pointer-events-none select-none">
                  <Quote className="w-8 h-8" />
                </div>
                <p className="relative z-10 whitespace-pre-wrap italic">
                  "{citation.snippet || 'Snippet text not provided by source index.'}"
                </p>
              </div>
            </div>

            {/* Cross-Modal RAG Integrity Banner */}
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-slate-300 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-indigo-200">Cross-Modal Verification</p>
                <p className="text-slate-400 mt-0.5 leading-relaxed">
                  This claim was cross-referenced in the shared 768-dimensional vector space from the original file{' '}
                  <span className="font-mono text-slate-300 font-semibold">{citation.source_file_name}</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
