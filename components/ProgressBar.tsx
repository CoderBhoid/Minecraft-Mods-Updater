import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Download, HardDrive } from 'lucide-react';
import { BatchProgress } from '../types';

interface ProgressBarProps {
  progress: BatchProgress;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  if (progress.phase === 'idle' || progress.total === 0) return null;

  const getPhaseLabel = () => {
    switch (progress.phase) {
      case 'hashing': return 'Calculating file hashes...';
      case 'identifying': return 'Identifying mod projects...';
      case 'resolving': return 'Checking updates & dependencies...';
      case 'downloading': return 'Downloading mod update files...';
      case 'syncing': return 'Writing updates to mods folder...';
      default: return 'Processing...';
    }
  };

  const getIcon = () => {
    switch (progress.phase) {
      case 'downloading':
        return <Download className="w-4 h-4 text-[#1bd96a] animate-bounce" />;
      case 'syncing':
        return <HardDrive className="w-4 h-4 text-[#1bd96a] animate-pulse" />;
      default:
        return <RefreshCw className="w-4 h-4 text-[#1bd96a] animate-spin" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full p-4 mb-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-md relative overflow-hidden"
    >
      {/* Background neon ambient line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#1bd96a]/40 to-transparent" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            {getIcon()}
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
              {getPhaseLabel()}
              <span className="text-[#1bd96a] font-mono font-normal text-[11px]">
                {progress.current} / {progress.total}
              </span>
            </h4>
            {progress.currentModName && (
              <p className="text-[11px] text-zinc-500 font-mono truncate max-w-md mt-0.5">
                {progress.currentModName}
              </p>
            )}
          </div>
        </div>

        <div className="text-right font-mono text-xs font-bold text-[#1bd96a] shrink-0">
          {progress.percent}%
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 rounded-full bg-zinc-950 border border-zinc-800/80 overflow-hidden relative">
        <motion.div
          className="h-full bg-gradient-to-r from-[#1bd96a]/80 to-[#1bd96a] rounded-full shadow-[0_0_12px_rgba(27,217,106,0.6)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress.percent}%` }}
          transition={{ ease: 'easeOut', duration: 0.25 }}
        />
      </div>
    </motion.div>
  );
};
