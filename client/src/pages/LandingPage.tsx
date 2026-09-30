import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  FileText,
  Music,
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  Mail,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';

export const LandingPage: React.FC = () => {
  const { user, signInWithEmail, signUpWithEmail, signInAsDemo } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect straight to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(email, password);
        if (error) throw error;
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
      }
      navigate('/dashboard');
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    signInAsDemo();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[400px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
            Unify <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Platform</span>
          </span>
        </div>

        <button
          onClick={handleDemoSignIn}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-indigo-500/50 transition-all cursor-pointer shadow-sm"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Demo Access</span>
        </button>
      </header>

      {/* Hero & Auth Section */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 flex-1 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 justify-center">
        {/* Left Column: Product Value Proposition */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>General-Purpose Cross-Modal RAG Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            One shared vector space for{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              all modalities.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Ingest audio recordings, video timelines, native PDF documents, and scanned imagery.
            Reason across fragmented formats simultaneously with guaranteed, exact citations.
          </p>

          {/* Multimodal Badges Matrix */}
          <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-medium text-amber-300">
              <Music className="w-4 h-4 text-amber-400" />
              <span>Audio [MM:SS] Timestamps</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-medium text-emerald-300">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>Scanned Images & Diagrams</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-medium text-cyan-300">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Native Documents & PDFs</span>
            </div>
          </div>

          {/* Domain Lenses Pill */}
          <div className="pt-4 flex items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">Domain Lenses:</span>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">Education</span>
            <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">Healthcare</span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">Agriculture</span>
          </div>
        </div>

        {/* Right Column: Supabase Auth Card */}
        <div className="w-full max-w-md">
          <div className="glass-panel p-8 rounded-3xl border border-slate-700/80 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {isSignUp ? 'Create Workspace Account' : 'Authenticate Workspace'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isSignUp ? 'Initialize your isolated Supabase RLS vector store' : 'Sign in to access your multimodal knowledge base'}
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <span>⚠️</span>
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="researcher@unify.ai"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-sm font-semibold transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In with Supabase'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-800 text-center space-y-3">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError(null);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-800"></div>
                <span className="shrink mx-2 text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                  Or Instant Sandbox
                </span>
                <div className="grow border-t border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={handleDemoSignIn}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700/80 hover:border-emerald-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Explore as Demo Researcher (1-Click)</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex items-center gap-4">
          <span>Powered by Gemini 2.5 Pro & text-embedding-004</span>
          <span>•</span>
          <span>Supabase pgvector (768 Dimensions)</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Strict Row Level Security (RLS) Active</span>
        </div>
      </footer>
    </div>
  );
};
