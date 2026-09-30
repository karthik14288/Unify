import React from 'react';
import { CitationItem } from '../lib/api';
import { FileText, Music, Image as ImageIcon, Video, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

interface CitationBadgeProps {
  id: string;
  citation?: CitationItem;
  onClick: (citation: CitationItem | { citation_id: string }) => void;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({ id, citation, onClick }) => {
  const getModalityIcon = (fileName?: string) => {
    if (!fileName) return <FileText className="w-3 h-3" />;
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.m4a')) {
      return <Music className="w-3 h-3 text-amber-400" />;
    }
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')) {
      return <ImageIcon className="w-3 h-3 text-emerald-400" />;
    }
    if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm')) {
      return <Video className="w-3 h-3 text-purple-400" />;
    }
    return <FileText className="w-3 h-3 text-cyan-400" />;
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(citation || { citation_id: id });
      }}
      title={citation ? `${citation.source_file_name} (${citation.location})` : `Citation [${id}]`}
      className={clsx(
        'inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md text-xs font-semibold font-mono tracking-tight transition-all duration-200 cursor-pointer align-baseline select-none',
        'bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 hover:text-white border border-indigo-700/50 hover:border-indigo-400 shadow-sm hover:shadow-indigo-500/20 hover:scale-105 active:scale-95'
      )}
    >
      {citation && getModalityIcon(citation.source_file_name)}
      <span>[{id}]</span>
      <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
    </button>
  );
};
