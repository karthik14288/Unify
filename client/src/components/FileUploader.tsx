import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLens, LensType } from '../hooks/useLens';
import { api } from '../lib/api';
import {
  UploadCloud,
  FileText,
  Music,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';

interface FileUploaderProps {
  onUploadSuccess?: () => void;
  selectedLens?: LensType;
}

type PipelineStage = 'Idle' | 'Uploading' | 'Extracting' | 'Chunking' | 'Embedding' | 'Saved' | 'Error';

export const FileUploader: React.FC<FileUploaderProps> = ({ onUploadSuccess, selectedLens }) => {
  const { token } = useAuth();
  const { activeLens } = useLens();
  const lensToUse = selectedLens || activeLens;

  const [isDragging, setIsDragging] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('Idle');
  const [activeFileName, setActiveFileName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successDetails, setSuccessDetails] = useState<{ chunksCount: number; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setActiveFileName(file.name);
    setErrorMessage('');
    setSuccessDetails(null);
    setPipelineStage('Uploading');

    try {
      const res = await api.uploadFile(token, file, lensToUse, (stage) => {
        setPipelineStage(stage);
      });

      setPipelineStage('Saved');
      setSuccessDetails({
        chunksCount: res.chunksCount || 1,
        message: res.message || 'File vectorized successfully',
      });

      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Reset after 4 seconds
      setTimeout(() => {
        setPipelineStage('Idle');
        setActiveFileName('');
      }, 4000);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setPipelineStage('Error');
      setErrorMessage(err.message || 'An error occurred while uploading and extracting file content.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
      e.target.value = ''; // Reset input
    }
  };

  // Quick-load demo samples for instant multimodal evaluation
  const handleLoadSample = (sampleType: 'audio' | 'image' | 'doc') => {
    let mockContent = '';
    let mockFileName = '';
    let mockMime = 'text/plain';

    if (lensToUse === 'Agriculture') {
      if (sampleType === 'audio') {
        mockFileName = 'field_voice_note_scout_report.mp3';
        mockMime = 'audio/mp3';
        mockContent = `[00:05] Audio Recording - Agronomist Field Scout North Sector
[00:15] Noticeable interveinal chlorosis and yellowing on the lower leaves of Maize Block 4. 
[00:30] The leaf veins are remaining dark green while the margins are turning pale yellow and necrotic.
[00:45] Suspecting severe Nitrogen deficiency or restricted root uptake due to recent hardpan compaction.`;
      } else if (sampleType === 'image') {
        mockFileName = 'drone_multispectral_orthomosaic.png';
        mockMime = 'image/png';
        mockContent = `[Page 1] Visual OCR & Diagram Interpretation - Drone Multispectral Orthomosaic Map
Sector: North Quadrant, Grid 14-B.
Visual Observation: Distinct NDVI reflectance dip from 0.78 down to 0.42. 
Infrared imagery reveals yellowing canopy stress spreading across 4.2 acres.
Canopy density is reduced by 28% compared to the southern control field.`;
      } else {
        mockFileName = 'soil_telemetry_chemistry_report.pdf';
        mockMime = 'application/pdf';
        mockContent = `[Page 1] Soil Telemetry & Chemistry Lab Report
Sample ID: ST-2026-994. Field: North Block 4.
Soil pH: 6.2 (Optimal: 6.5 - 7.0).
Available Nitrate-Nitrogen (NO3-N): 8.4 ppm (Deficient, threshold is > 25 ppm).
Organic Matter: 1.8%.
Recommendation: Immediate foliar nitrogen application and side-dress urea at 45 lbs/acre.`;
      }
    } else if (lensToUse === 'Healthcare') {
      if (sampleType === 'audio') {
        mockFileName = 'cardiologist_dictation_memo.mp3';
        mockMime = 'audio/mp3';
        mockContent = `[00:05] Dr. Vance Clinical Dictation - Patient #4092
[00:20] Patient reports episodic dyspnea and bilateral ankle edema over past 10 days.
[00:40] Auscultation reveals S3 gallop and trace bibasilar crackles.
[01:05] Blood pressure 148/92 mmHg, Heart rate 84 bpm regular.`;
      } else if (sampleType === 'image') {
        mockFileName = 'ecg_rhythm_strip.png';
        mockMime = 'image/png';
        mockContent = `[Page 1] Diagnostic Imaging & ECG Rhythm Strip Scan
Lead II and V1-V6 evaluation.
Findings: Sinus rhythm with non-specific ST-T wave abnormalities in lateral leads.
Left ventricular hypertrophy (LVH) by Sokolow-Lyon voltage criteria.
No acute ST-elevation myocardial infarction patterns noted.`;
      } else {
        mockFileName = 'comprehensive_metabolic_panel.pdf';
        mockMime = 'application/pdf';
        mockContent = `[Page 1] Comprehensive Metabolic & Cardiac Biomarker Panel
Patient ID: #4092. Date: 2026-09-28.
Serum Creatinine: 1.4 mg/dL (Elevated, baseline 0.9).
eGFR: 52 mL/min/1.73m2 (Stage 3a CKD).
NT-proBNP: 1840 pg/mL (Significantly elevated, reference < 125 pg/mL).
Potassium: 4.6 mEq/L (Normal).`;
      }
    } else {
      // Education
      if (sampleType === 'audio') {
        mockFileName = 'quantum_mechanics_lecture_w3.mp3';
        mockMime = 'audio/mp3';
        mockContent = `[00:10] Physics 401 Lecture 3 - Quantum Entanglement and Bell State
[00:25] Professor remarks: When two particles are generated in an entangled singlet state, the spin measurement along any axis yields instantaneous correlation.
[00:50] Notice that Bell's inequality |E(a,b) - E(a,c)| <= 1 + E(b,c) is violated by quantum mechanical predictions up to 2*sqrt(2).`;
      } else if (sampleType === 'image') {
        mockFileName = 'whiteboard_derivation_scan.png';
        mockMime = 'image/png';
        mockContent = `[Page 1] Scanned Whiteboard Diagram - EPR Paradox & Spin Projection
Diagram shows twin photon source emit opposite polarization |Ψ-> = 1/sqrt(2) (|01> - |10>).
Vector diagram verifies orthogonality of detector angles theta = 22.5 degrees.
CHSH inequality correlation coefficient S = 2.828 exceeding the classical limit of 2.`;
      } else {
        mockFileName = 'quantum_information_handout_ch4.pdf';
        mockMime = 'application/pdf';
        mockContent = `[Page 1] Course Handout Chapter 4: Non-Locality and Quantum Teleportation
Key Theorem 4.2: No-Communication Theorem guarantees that superluminal signaling cannot be achieved through entanglement alone.
[Page 2] Teleportation protocol requires 2 classical bits sent over subluminal channel to reconstruct state |psi>.`;
      }
    }

    const blob = new Blob([mockContent], { type: 'text/plain' });
    const sampleFile = new File([blob], mockFileName, { type: mockMime });
    processFile(sampleFile);
  };

  const stages: PipelineStage[] = ['Extracting', 'Chunking', 'Embedding', 'Saved'];

  const getStageIndex = (stage: PipelineStage) => {
    switch (stage) {
      case 'Extracting':
        return 0;
      case 'Chunking':
        return 1;
      case 'Embedding':
        return 2;
      case 'Saved':
        return 3;
      default:
        return -1;
    }
  };

  const currentStageIndex = getStageIndex(pipelineStage);

  return (
    <div className="w-full space-y-5">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.mp3,.mp4,.wav,.m4a,.mov,.webm,.txt"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Dropzone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (pipelineStage === 'Idle' || pipelineStage === 'Saved' || pipelineStage === 'Error') {
            fileInputRef.current?.click();
          }
        }}
        className={clsx(
          'relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer overflow-hidden group',
          isDragging
            ? 'border-indigo-400 bg-indigo-950/40 scale-[1.01] shadow-xl shadow-indigo-500/10'
            : 'border-slate-700/80 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/70',
          pipelineStage !== 'Idle' && pipelineStage !== 'Saved' && pipelineStage !== 'Error' && 'pointer-events-none'
        )}
      >
        {/* Glow Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center justify-center relative z-10">
          {/* Animated Modality Floating Icons */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md group-hover:scale-110 transition-transform">
              <Music className="w-6 h-6" />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-7 h-7 animate-bounce" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md group-hover:scale-110 transition-transform">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Drop raw multimodal files into your shared index
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-1.5 leading-relaxed">
            Upload voice notes (<span className="text-amber-300 font-mono">.mp3</span>), aerial/scanned images (<span className="text-emerald-300 font-mono">.png, .jpg</span>), videos (<span className="text-purple-300 font-mono">.mp4</span>), or documents (<span className="text-cyan-300 font-mono">.pdf</span>).
          </p>

          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700/80 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
            <span>Browse Workspace Files</span>
          </div>

          <span className="text-[11px] text-slate-400 mt-3 font-mono">
            Active Lens Target: <span className="text-indigo-400 font-semibold">{lensToUse}</span>
          </span>
        </div>
      </div>

      {/* Progress & Pipeline Stepper */}
      {pipelineStage !== 'Idle' && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {pipelineStage === 'Saved' ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : pipelineStage === 'Error' ? (
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <AlertCircle className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 animate-spin">
                  <Loader2 className="w-5 h-5" />
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold text-white truncate max-w-sm">
                  {activeFileName || 'Processing Multimodal Stream'}
                </h4>
                <p className="text-xs text-slate-400">
                  {pipelineStage === 'Uploading' && 'Uploading raw binary to Supabase Storage...'}
                  {pipelineStage === 'Extracting' && 'Gemini 2.5 Pro transcribing audio, OCR scanning & diagram parsing...'}
                  {pipelineStage === 'Chunking' && 'Preserving timestamps and creating semantic chunks...'}
                  {pipelineStage === 'Embedding' && 'Generating 768-dim embeddings with text-embedding-004...'}
                  {pipelineStage === 'Saved' && successDetails?.message}
                  {pipelineStage === 'Error' && errorMessage}
                </p>
              </div>
            </div>

            <span
              className={clsx(
                'text-xs font-mono font-bold px-3 py-1 rounded-full border',
                pipelineStage === 'Saved'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : pipelineStage === 'Error'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 animate-pulse'
              )}
            >
              {pipelineStage}
            </span>
          </div>

          {/* Stepper Pipeline Stage Badges */}
          {pipelineStage !== 'Error' && (
            <div className="grid grid-cols-4 gap-2 pt-2">
              {stages.map((stage, idx) => {
                const isPassed = currentStageIndex > idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div
                    key={stage}
                    className={clsx(
                      'p-2.5 rounded-xl border text-center transition-all',
                      isPassed
                        ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                        : isCurrent
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                        : 'bg-slate-900/30 border-slate-800 text-slate-400'
                    )}
                  >
                    <span className="text-[10px] font-mono block uppercase tracking-wider">
                      Stage {idx + 1}
                    </span>
                    <span className="text-xs font-semibold block mt-0.5">{stage}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 1-Click Instant Multimodal Datasets for Target Domain */}
      <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white tracking-wide uppercase">
              1-Click {lensToUse} Multimodal Ingestion Suite
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Instant sample files across Audio, Image OCR, and PDF reports
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleLoadSample('audio')}
            disabled={pipelineStage !== 'Idle' && pipelineStage !== 'Saved' && pipelineStage !== 'Error'}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 hover:bg-amber-950/30 hover:border-amber-700/50 border border-slate-700/60 text-left transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Music className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-xs font-semibold text-white block group-hover:text-amber-300 truncate">
                {lensToUse === 'Agriculture' ? 'Field Scout Voice Note' : lensToUse === 'Healthcare' ? 'Doctor Clinical Memo' : 'Quantum Lecture Audio'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Audio .mp3 with timestamps</span>
            </div>
          </button>

          <button
            onClick={() => handleLoadSample('image')}
            disabled={pipelineStage !== 'Idle' && pipelineStage !== 'Saved' && pipelineStage !== 'Error'}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 hover:bg-emerald-950/30 hover:border-emerald-700/50 border border-slate-700/60 text-left transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-xs font-semibold text-white block group-hover:text-emerald-300 truncate">
                {lensToUse === 'Agriculture' ? 'Drone Aerial Orthomosaic' : lensToUse === 'Healthcare' ? 'ECG Rhythm Strip' : 'Whiteboard Derivation'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Image .png with diagrams</span>
            </div>
          </button>

          <button
            onClick={() => handleLoadSample('doc')}
            disabled={pipelineStage !== 'Idle' && pipelineStage !== 'Saved' && pipelineStage !== 'Error'}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 hover:bg-cyan-950/30 hover:border-cyan-700/50 border border-slate-700/60 text-left transition-all cursor-pointer group disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-xs font-semibold text-white block group-hover:text-cyan-300 truncate">
                {lensToUse === 'Agriculture' ? 'Soil Chemistry Telemetry' : lensToUse === 'Healthcare' ? 'Metabolic Lab Panel' : 'Course Handout Ch. 4'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Document .pdf with pages</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
