import React, { createContext, useContext, useState, useEffect } from 'react';

export type LensType = 'Education' | 'Healthcare' | 'Agriculture';

export interface LensConfig {
  id: LensType;
  name: string;
  tagline: string;
  color: string;
  accentHex: string;
  gradient: string;
  badgeBg: string;
  iconName: string;
  sampleSources: string[];
  systemRole: string;
}

export const LENS_CONFIGS: Record<LensType, LensConfig> = {
  Education: {
    id: 'Education',
    name: 'Education',
    tagline: 'Pedagogical synthesis of lectures, textbooks & handwritten notes',
    color: 'indigo',
    accentHex: '#6366f1',
    gradient: 'from-indigo-500 to-purple-600',
    badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    iconName: 'GraduationCap',
    sampleSources: ['Lecture-Transcript-W3.mp3', 'Calculus-Handout-Ch4.pdf', 'Whiteboard-Notes.png'],
    systemRole: 'Synthesizing lecture recordings, scanned handouts, and whiteboard notes for study answers.',
  },
  Healthcare: {
    id: 'Healthcare',
    name: 'Healthcare',
    tagline: 'Clinical correlation of diagnostic memos, labs & vitals',
    color: 'cyan',
    accentHex: '#06b6d4',
    gradient: 'from-cyan-500 to-blue-600',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    iconName: 'Activity',
    sampleSources: ['Doctor-Voice-Memo.mp3', 'Comprehensive-Metabolic-Panel.pdf', 'EKG-Scan.png'],
    systemRole: 'Synthesizing a doctor\'s voice memo and scanned lab reports for patient progress.',
  },
  Agriculture: {
    id: 'Agriculture',
    name: 'Agriculture',
    tagline: 'Agronomic diagnostics of drone scans, soil telemetry & farmer audio',
    color: 'emerald',
    accentHex: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    iconName: 'Sprout',
    sampleSources: ['Drone-Field-Orthomosaic.png', 'Soil-Sensor-Telemetry.pdf', 'Field-Scout-Voice-Note.mp3'],
    systemRole: 'Synthesizing farmer voice notes, soil sensor reports, and drone photos for crop issue diagnosis (e.g., nitrogen deficiency).',
  },
};

interface LensContextType {
  activeLens: LensType;
  setLens: (lens: LensType) => void;
  config: LensConfig;
}

const LensContext = createContext<LensContextType | undefined>(undefined);

export const LensProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeLens, setActiveLens] = useState<LensType>(() => {
    const saved = localStorage.getItem('unify_active_lens') as LensType;
    return (saved && ['Education', 'Healthcare', 'Agriculture'].includes(saved)) ? saved : 'Agriculture';
  });

  const setLens = (lens: LensType) => {
    setActiveLens(lens);
    localStorage.setItem('unify_active_lens', lens);
  };

  return (
    <LensContext.Provider
      value={{
        activeLens,
        setLens,
        config: LENS_CONFIGS[activeLens],
      }}
    >
      {children}
    </LensContext.Provider>
  );
};

export const useLens = () => {
  const context = useContext(LensContext);
  if (!context) {
    throw new Error('useLens must be used within a LensProvider');
  }
  return context;
};
