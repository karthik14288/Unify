import React from 'react';
import { useLens, LensType, LENS_CONFIGS } from '../hooks/useLens';
import { GraduationCap, Activity, Sprout, Check } from 'lucide-react';
import clsx from 'clsx';

interface LensSelectorProps {
  variant?: 'tabs' | 'dropdown' | 'cards';
  className?: string;
}

export const LensSelector: React.FC<LensSelectorProps> = ({ variant = 'tabs', className }) => {
  const { activeLens, setLens } = useLens();

  const getIcon = (type: LensType, sizeClass = 'w-4 h-4') => {
    switch (type) {
      case 'Education':
        return <GraduationCap className={sizeClass} />;
      case 'Healthcare':
        return <Activity className={sizeClass} />;
      case 'Agriculture':
        return <Sprout className={sizeClass} />;
    }
  };

  if (variant === 'cards') {
    return (
      <div className={clsx('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>
        {(Object.keys(LENS_CONFIGS) as LensType[]).map((lensKey) => {
          const cfg = LENS_CONFIGS[lensKey];
          const isSelected = activeLens === lensKey;

          return (
            <button
              key={lensKey}
              onClick={() => setLens(lensKey)}
              className={clsx(
                'relative text-left p-5 rounded-2xl transition-all duration-300 border text-slate-200 cursor-pointer overflow-hidden group',
                isSelected
                  ? 'glass-panel border-white/20 ring-2 shadow-xl'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70',
                isSelected && lensKey === 'Education' && 'ring-indigo-500/60 shadow-indigo-500/10',
                isSelected && lensKey === 'Healthcare' && 'ring-cyan-500/60 shadow-cyan-500/10',
                isSelected && lensKey === 'Agriculture' && 'ring-emerald-500/60 shadow-emerald-500/10'
              )}
            >
              {/* Background Glow */}
              {isSelected && (
                <div
                  className={clsx(
                    'absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30 pointer-events-none',
                    lensKey === 'Education' && 'bg-indigo-500',
                    lensKey === 'Healthcare' && 'bg-cyan-500',
                    lensKey === 'Agriculture' && 'bg-emerald-500'
                  )}
                />
              )}

              <div className="flex items-center justify-between mb-3">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                    isSelected
                      ? `bg-gradient-to-tr ${cfg.gradient} text-white shadow-lg`
                      : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                  )}
                >
                  {getIcon(lensKey, 'w-5 h-5')}
                </div>
                {isSelected && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/10">
                    <Check className="w-3 h-3 text-emerald-400" /> Active
                  </span>
                )}
              </div>

              <h4 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                {cfg.name} Lens
              </h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {cfg.tagline}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate max-w-[200px]">Prompt context adapted</span>
                <span className="font-mono text-slate-400">RAG tuned</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Default 'tabs' variant
  return (
    <div
      className={clsx(
        'inline-flex items-center p-1.5 rounded-xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md',
        className
      )}
    >
      {(Object.keys(LENS_CONFIGS) as LensType[]).map((lensKey) => {
        const isSelected = activeLens === lensKey;
        const cfg = LENS_CONFIGS[lensKey];

        return (
          <button
            key={lensKey}
            onClick={() => setLens(lensKey)}
            className={clsx(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer',
              isSelected
                ? 'bg-slate-800 text-white shadow-md border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            )}
          >
            <span
              className={clsx(
                'w-2 h-2 rounded-full',
                lensKey === 'Education' && 'bg-indigo-400',
                lensKey === 'Healthcare' && 'bg-cyan-400',
                lensKey === 'Agriculture' && 'bg-emerald-400',
                isSelected && 'animate-ping opacity-75'
              )}
            />
            {getIcon(lensKey, 'w-3.5 h-3.5')}
            <span>{cfg.name}</span>
          </button>
        );
      })}
    </div>
  );
};
