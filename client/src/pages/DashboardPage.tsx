import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLens, LensType, LENS_CONFIGS } from '../hooks/useLens';
import { LensSelector } from '../components/LensSelector';
import { api, SourceItem } from '../lib/api';
import {
  Layers,
  UploadCloud,
  MessageSquareText,
  FileText,
  Music,
  Image as ImageIcon,
  Video,
  ArrowRight,
  Database,
  Sparkles,
  Cpu,
  Clock,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';

export const DashboardPage: React.FC = () => {
  const { token, user } = useAuth();
  const { activeLens, setLens, config } = useLens();
  const navigate = useNavigate();

  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  const fetchSources = async () => {
    setLoadingSources(true);
    try {
      const data = await api.getSources(token);
      setSources(data);
    } catch (err) {
      console.warn('Could not load sources:', err);
    } finally {
      setLoadingSources(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [token]);

  const handleDeleteSource = async (id: string) => {
    try {
      await api.deleteSource(token, id);
      setSources((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  // Modality statistics calculation
  const totalSources = sources.length;
  const audioCount = sources.filter((s) => s.fileType.includes('audio')).length;
  const imageCount = sources.filter((s) => s.fileType.includes('image')).length;
  const docCount = sources.filter((s) => s.fileType.includes('pdf') || s.fileType.includes('text')).length;
  const videoCount = sources.filter((s) => s.fileType.includes('video')).length;
  const totalChunks = sources.reduce((acc, s) => acc + (s.chunksCount || 0), 0);

  const filteredSources = sources.filter((s) => s.lensCategory === activeLens);

  return (
    <div className="max-w-7xl mx-auto p-6 sm:p-8 space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cross-Modal Unified Vector Space</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, {user?.user_metadata?.full_name || 'Principal Researcher'}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Unify ingests multi-format data across audio transcripts, drone orthomosaics, diagrams, and reports into a single 768-dimensional space. Select a domain lens to guide the AI reasoning persona.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/ingest')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Ingest New Media</span>
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <MessageSquareText className="w-4 h-4 text-cyan-400" />
              <span>Launch Reasoning</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Domain Lenses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Domain Lenses Selector
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click a lens below to adapt the AI system prompt and cross-modal reasoning context
            </p>
          </div>
          <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full border', config.badgeBg)}>
            Current: {config.name} Lens
          </span>
        </div>

        <LensSelector variant="cards" />
      </div>

      {/* Workspace Vector Space Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-card border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Ingested Files</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">{totalSources}</p>
          <span className="text-[11px] text-slate-400 block font-mono">
            {totalChunks} semantic chunks vectorized
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Audio Memos & Voice</span>
            <Music className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white">{audioCount}</p>
          <span className="text-[11px] text-amber-400/80 block font-mono">
            Transcribed with [MM:SS] timestamps
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Scans & Drone Aerials</span>
            <ImageIcon className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white">{imageCount}</p>
          <span className="text-[11px] text-emerald-400/80 block font-mono">
            Visual OCR & diagram extraction
          </span>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Documents & Reports</span>
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white">{docCount}</p>
          <span className="text-[11px] text-cyan-400/80 block font-mono">
            Page-indexed PDF text & tables
          </span>
        </div>
      </div>

      {/* Active Lens Persona & Recent Files */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Lens Persona Deep-Dive */}
        <div className="lg:col-span-1 rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-tr shadow-md', config.gradient)}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">System Persona</span>
              <h3 className="text-base font-bold text-white">{config.name} Lens Active</h3>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans space-y-2">
            <p className="font-semibold text-white">System Prompt Directive:</p>
            <p className="italic text-slate-300 bg-slate-950/50 p-3 rounded-lg border border-slate-800/60 font-mono text-[11px]">
              "{config.systemRole}"
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider text-[10px]">
              Representative Target Artifacts:
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {config.sampleSources.map((sample, idx) => (
                <li key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/40 border border-slate-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span className="font-mono">{sample}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => navigate('/chat')}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Query in {config.name} Lens</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Recent Ingested Files for Active Lens */}
        <div className="lg:col-span-2 rounded-2xl glass-panel p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                Indexed Knowledge Base for [{activeLens}]
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Files vectorized in Supabase pgvector under the active domain
              </p>
            </div>
            <button
              onClick={() => navigate('/ingest')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              Manage All Sources <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {filteredSources.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 space-y-3">
              <UploadCloud className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                No files indexed yet for {activeLens} Lens
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload farmer voice notes, drone photos, or soil reports to test cross-modal reasoning.
              </p>
              <button
                onClick={() => navigate('/ingest')}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
              >
                Go to Ingest Manager
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredSources.slice(0, 5).map((source) => (
                <div
                  key={source.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                      {source.fileType.includes('audio') ? (
                        <Music className="w-4 h-4 text-amber-400" />
                      ) : source.fileType.includes('image') ? (
                        <ImageIcon className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-white block truncate">
                        {source.fileName}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-mono">{source.fileType}</span>
                        <span>•</span>
                        <span>{source.chunksCount || 1} Chunks</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 hidden sm:block">
                      {new Date(source.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDeleteSource(source.id)}
                      title="Delete Source"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
