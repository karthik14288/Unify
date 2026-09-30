import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLens, LensType } from '../hooks/useLens';
import { FileUploader } from '../components/FileUploader';
import { LensSelector } from '../components/LensSelector';
import { api, SourceItem } from '../lib/api';
import {
  UploadCloud,
  FileText,
  Music,
  Image as ImageIcon,
  Video,
  Trash2,
  Database,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';

export const IngestPage: React.FC = () => {
  const { token } = useAuth();
  const { activeLens, config } = useLens();

  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilterLens, setSelectedFilterLens] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const data = await api.getSources(token);
      setSources(data);
    } catch (e) {
      console.warn('Failed to load sources:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [token]);

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    try {
      await api.deleteSource(token, id);
      setSources((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error('Delete source failed:', e);
    } finally {
      setDeleteId(null);
    }
  };

  const filteredSources = sources.filter((s) => {
    const matchesLens = selectedFilterLens === 'All' || s.lensCategory === selectedFilterLens;
    const matchesSearch = s.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.fileType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLens && matchesSearch;
  });

  const getModalityIcon = (fileType: string) => {
    if (fileType.includes('audio')) return <Music className="w-4 h-4 text-amber-400" />;
    if (fileType.includes('image')) return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    if (fileType.includes('video')) return <Video className="w-4 h-4 text-purple-400" />;
    return <FileText className="w-4 h-4 text-cyan-400" />;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <UploadCloud className="w-7 h-7 text-indigo-400" />
            Multimodal Knowledge Ingestion Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Ingest raw voice memos, drone aerial imagery, medical scans, and native documents into Supabase pgvector. Gemini transcribes audio timestamps and reads visual diagrams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSources}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Index</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop File Uploader Component */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
              Active Ingestion Lens:
            </span>
            <span className={clsx('text-xs font-bold px-2.5 py-0.5 rounded-full border', config.badgeBg)}>
              {activeLens} Lens
            </span>
          </div>
          <LensSelector variant="tabs" />
        </div>

        <FileUploader onUploadSuccess={fetchSources} />
      </div>

      {/* Knowledge Base Repository Table / Grid */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              Ingested Sources Index ({filteredSources.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Source files vectorized into 768-dimensional embeddings in PostgreSQL
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search file name or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 w-48 sm:w-56"
              />
            </div>

            {/* Lens Category Filter */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              {['All', 'Agriculture', 'Healthcare', 'Education'].map((l) => (
                <button
                  key={l}
                  onClick={() => setSelectedFilterLens(l)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                    selectedFilterLens === l
                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Source Cards / Table */}
        {filteredSources.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-slate-800 space-y-3">
            <Database className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">
              {sources.length === 0 ? 'Your Knowledge Base is Empty' : 'No Sources Match Filter Criteria'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Use the drag-and-drop uploader above or click the 1-Click sample suite buttons to ingest data.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSources.map((source) => (
              <div
                key={source.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90 transition-all flex flex-col justify-between space-y-4 group shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0">
                        {getModalityIcon(source.fileType)}
                      </div>
                      <span
                        className={clsx(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                          source.lensCategory === 'Education' && 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
                          source.lensCategory === 'Healthcare' && 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
                          source.lensCategory === 'Agriculture' && 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        )}
                      >
                        {source.lensCategory}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(source.id)}
                      disabled={deleteId === source.id}
                      title="Delete Source & Associated Chunks"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-white tracking-tight break-all line-clamp-1" title={source.fileName}>
                    {source.fileName}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400 block mt-0.5 truncate">
                    {source.fileType}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {source.chunksCount || 1} Chunks
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{new Date(source.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
