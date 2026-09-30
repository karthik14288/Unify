import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLens } from '../hooks/useLens';
import { LensSelector } from './LensSelector';
import { SettingsModal } from './SettingsModal';
import {
  LayoutDashboard,
  UploadCloud,
  MessageSquareText,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
  Layers,
  Database,
  Shield,
  Activity,
  User,
} from 'lucide-react';
import clsx from 'clsx';

export const Layout: React.FC = () => {
  const { user, signOut, isDemoUser } = useAuth();
  const { activeLens, config } = useLens();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navItems = [
    {
      to: '/dashboard',
      label: 'Workspace & Lenses',
      icon: <LayoutDashboard className="w-5 h-5" />,
      description: 'Domain hubs & telemetry',
    },
    {
      to: '/ingest',
      label: 'Ingest Knowledge',
      icon: <UploadCloud className="w-5 h-5" />,
      description: 'Multimodal vectorizer',
    },
    {
      to: '/chat',
      label: 'Reasoning Interface',
      icon: <MessageSquareText className="w-5 h-5" />,
      description: 'Cross-modal citations',
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 glass-panel border-r border-slate-800/80 p-5 shrink-0 z-30 justify-between">
        <div className="space-y-6">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                Unify <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">v1.0</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Cross-Modal AI Understanding</p>
            </div>
          </div>

          {/* Active Domain Lens Card */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1 font-semibold uppercase tracking-wider text-[10px]">
                <Layers className="w-3.5 h-3.5 text-indigo-400" /> Active Lens
              </span>
              <span className={clsx('text-[11px] font-bold px-2 py-0.5 rounded-full border', config.badgeBg)}>
                {config.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {config.tagline}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 block mb-2">
              Platform Modules
            </span>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                  )
                }
              >
                {item.icon}
                <div>
                  <span className="block leading-none">{item.label}</span>
                  <span className="text-[10px] text-slate-400 block mt-1 leading-none group-hover:text-slate-300">
                    {item.description}
                  </span>
                </div>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          {/* Quick Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900/80 transition-colors border border-transparent hover:border-slate-800 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>System & Schema</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* User Info & Logout */}
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-white block truncate">
                  {user?.user_metadata?.full_name || user?.email || 'Principal Researcher'}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {isDemoUser ? 'Demo Sandbox' : 'Supabase Session'}
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 glass-panel px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                {location.pathname === '/dashboard' && 'Workspace & Lens Matrix'}
                {location.pathname === '/ingest' && 'Multimodal Knowledge Base Manager'}
                {location.pathname === '/chat' && 'Cross-Modal Reasoning Engine'}
              </h2>
              <span className="text-[11px] text-slate-400 hidden sm:block">
                Unified 768-dim Vector Space • Pgvector HNSW Retrieval
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <LensSelector variant="tabs" />
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              title="System Diagnostics & Database Schema"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden glass-panel border-b border-slate-800 p-4 space-y-4 z-30">
            <div className="pb-2 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-semibold uppercase text-slate-400">Select Domain Lens</span>
              <LensSelector variant="tabs" />
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                      isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    )
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <button
                onClick={() => {
                  setIsSettingsOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="text-slate-300 hover:text-white flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Diagnostics & Keys</span>
              </button>
              <button
                onClick={handleSignOut}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto relative bg-slate-950">
          <Outlet />
        </main>
      </div>

      {/* Global Settings & Diagnostics Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
