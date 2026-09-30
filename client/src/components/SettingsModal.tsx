import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Database,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Layers,
} from 'lucide-react';
import { api, getStoredApiKey, setStoredApiKey } from '../lib/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [customKey, setCustomKey] = useState(getStoredApiKey());
  const [savedKeySuccess, setSavedKeySuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await api.getStatus();
      setStatus(data);
    } catch (e) {
      console.warn('Status fetch error:', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setCustomKey(getStoredApiKey());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    setStoredApiKey(customKey.trim());
    setSavedKeySuccess(true);
    setTimeout(() => setSavedKeySuccess(false), 2500);
  };

  const copySqlSchema = () => {
    const sql = `-- ====================================================================
-- UNIFY PLATFORM DATABASE SCHEMA & VECTOR CONFIGURATION
-- Execute this entire script in your Supabase SQL Editor
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    lens_category TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    page_number INT,
    start_time NUMERIC,
    end_time NUMERIC,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx 
ON document_chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS sources_user_id_idx ON sources (user_id);
CREATE INDEX IF NOT EXISTS sources_lens_idx ON sources (lens_category);
CREATE INDEX IF NOT EXISTS document_chunks_source_id_idx ON document_chunks (source_id);
CREATE INDEX IF NOT EXISTS document_chunks_user_id_idx ON document_chunks (user_id);

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only view their own sources" ON sources;
CREATE POLICY "Users can only view their own sources" 
ON sources FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sources" ON sources;
CREATE POLICY "Users can insert their own sources" 
ON sources FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sources" ON sources;
CREATE POLICY "Users can delete their own sources" 
ON sources FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only view their own chunks" ON document_chunks;
CREATE POLICY "Users can only view their own chunks" 
ON document_chunks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own chunks" ON document_chunks;
CREATE POLICY "Users can insert their own chunks" 
ON document_chunks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own chunks" ON document_chunks;
CREATE POLICY "Users can delete their own chunks" 
ON document_chunks FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION match_chunks (
    query_embedding vector(768),
    match_threshold float DEFAULT 0.0,
    match_count int DEFAULT 5,
    filter_user_id uuid DEFAULT NULL,
    filter_lens text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    source_id uuid,
    content text,
    page_number int,
    start_time numeric,
    end_time numeric,
    file_name text,
    file_type text,
    lens_category text,
    similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.source_id,
        dc.content,
        dc.page_number,
        dc.start_time,
        dc.end_time,
        s.file_name,
        s.file_type,
        s.lens_category,
        (1 - (dc.embedding <=> query_embedding))::float AS similarity
    FROM document_chunks dc
    JOIN sources s ON s.id = dc.source_id
    WHERE (filter_user_id IS NULL OR dc.user_id = filter_user_id)
      AND (filter_lens IS NULL OR s.lens_category = filter_lens)
      AND (1 - (dc.embedding <=> query_embedding)) >= match_threshold
    ORDER BY dc.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-6 sm:p-8 z-10 text-slate-100">
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">System Architecture & Diagnostic Settings</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verify pgvector tables, Supabase connection, and Gemini API keys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-6 space-y-6">
          {/* Status Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Supabase DB</span>
                <span className="text-xs font-semibold text-white">
                  {status?.supabaseConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${
                  status?.supabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Gemini 2.5 Pro</span>
                <span className="text-xs font-semibold text-white">
                  {status?.geminiKeyConfigured || customKey ? 'Armed & Ready' : 'Key Needed'}
                </span>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${
                  status?.geminiKeyConfigured || customKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Schema & RPC</span>
                <span className="text-xs font-semibold text-white">
                  {status?.schemaReady ? 'Tables Initialized' : 'Execute Schema'}
                </span>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${
                  status?.schemaReady ? 'bg-emerald-400' : 'bg-cyan-400'
                }`}
              />
            </div>
          </div>

          {/* Gemini API Key Setting */}
          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-400" />
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Get Key in Google AI Studio <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Used for <strong>Gemini 2.5 Pro</strong> multimodal audio/video transcription, OCR, RAG synthesis, and <strong>text-embedding-004</strong>. You can enter your key below (stored in your browser) or define <code>GEMINI_API_KEY</code> in <code>server/.env</code>.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
              />
              <button
                onClick={handleSaveKey}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {savedKeySuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    Saved
                  </>
                ) : (
                  'Apply Key'
                )}
              </button>
            </div>
          </div>

          {/* PostgreSQL / Supabase Schema Guide */}
          <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                PostgreSQL pgvector Schema
              </label>
              <button
                onClick={copySqlSchema}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied SQL!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    Copy Schema SQL
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Contains the complete definitions for <code>sources</code>, <code>document_chunks</code> (768-dim vector), HNSW index, RLS policies, and the <code>match_chunks</code> RPC similarity search.
            </p>
            <div className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto max-h-36">
              <code>{`-- File: database/schema.sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE sources (...);
CREATE TABLE document_chunks (... embedding vector(768));
CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops);
CREATE FUNCTION match_chunks (...);`}</code>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Paste into your Supabase Dashboard SQL Editor</span>
              <a
                href="https://supabase.com/dashboard/project/eqtapthujqoonvpwipgv/sql"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                Open Supabase SQL Editor <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={fetchStatus}
            disabled={loadingStatus}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
            Refresh Diagnostics
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
