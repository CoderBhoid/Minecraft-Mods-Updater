import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, ArrowDownToLine, FileQuestion, Loader2, Package, Link, ExternalLink, Plus } from 'lucide-react';
import { ModFile } from '../types';

interface ModCardProps {
  mod: ModFile;
  index: number;
  onDownload: (mod: ModFile) => void;
  isDownloading: boolean;
  onAddDependency?: (id: string, name: string) => void;
  addedProjectIds?: string[];
}

export const ModCard: React.FC<ModCardProps> = ({ mod, index, onDownload, isDownloading, onAddDependency, addedProjectIds }) => {
  const getStatusIcon = () => {
    switch (mod.status) {
      case 'checking': return <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />;
      case 'found': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'missing': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <FileQuestion className="w-5 h-5 text-zinc-700" />;
    }
  };

  const getStatusText = () => {
    switch (mod.status) {
      case 'checking': return 'Checking...';
      case 'found': return 'Update Found';
      case 'missing': return 'Not Found';
      case 'error': return 'Error';
      default: return 'Pending';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`
        group relative overflow-hidden rounded-xl border bg-zinc-900/50 p-4 transition-all duration-300 flex flex-col
        ${mod.status === 'found' ? 'border-green-900/30 hover:border-green-500/50' : 'border-zinc-800 hover:border-zinc-600'}
        hover:shadow-lg hover:shadow-black/50
      `}
    >
      {/* Background Glow for success */}
      {mod.status === 'found' && (
        <div className="absolute inset-0 bg-green-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
      )}

      <div className="flex items-start gap-4 relative z-10 flex-1">
        <div className="relative shrink-0 w-12 h-12 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden">
          {mod.iconUrl ? (
            <img src={mod.iconUrl} alt={mod.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-6 h-6 text-zinc-700" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-zinc-100 truncate pr-2" title={mod.name}>
              {mod.name}
            </h4>
            
            {mod.status === 'found' && (
              <button
                onClick={() => onDownload(mod)}
                disabled={isDownloading}
                className="shrink-0 p-2 -mt-1 -mr-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download this mod"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowDownToLine className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          
          <p className="text-xs text-zinc-500 font-mono truncate mt-0.5" title={mod.originalFile?.name || 'Dependency'}>
            {mod.originalFile?.name || 'Auto-resolved Dependency'}
          </p>
          
          <div className="flex items-center gap-2 mt-3">
            <span className={`
              inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
              ${mod.status === 'found' ? 'bg-green-950 text-green-400 border border-green-900' : ''}
              ${mod.status === 'missing' ? 'bg-red-950 text-red-400 border border-red-900' : ''}
              ${mod.status === 'checking' ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : ''}
              ${mod.status === 'pending' ? 'bg-zinc-800 text-zinc-500 border border-zinc-700' : ''}
            `}>
              {getStatusIcon()}
              {getStatusText()}
            </span>
            {mod.fileName && mod.status === 'found' && (
              <span className="text-[10px] text-zinc-600 font-mono truncate max-w-[120px]">
                 → {mod.fileName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dependency Warning */}
      {mod.missingDependencies && mod.missingDependencies.length > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-800 relative z-10">
          <div className="flex items-center gap-2 text-yellow-500 mb-2">
            <AlertCircle className="w-3 h-3" />
            <span className="text-xs font-semibold uppercase tracking-wider">Missing Dependencies</span>
          </div>
          <ul className="space-y-2">
            {mod.missingDependencies.map((dep) => {
              const isAdded = addedProjectIds?.includes(dep.id);
              return (
                <li key={dep.id} className="text-xs text-zinc-400 flex items-center justify-between gap-2 group/item">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1 h-1 bg-yellow-500 rounded-full shrink-0"></span>
                    <a 
                      href={`https://modrinth.com/mod/${dep.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-yellow-400 transition-colors flex items-center gap-1 group/link truncate"
                    >
                      <span className="truncate">{dep.name}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover/link:opacity-100" />
                    </a>
                  </div>
                  
                  {onAddDependency && !isAdded && (
                    <button
                      onClick={() => onAddDependency(dep.id, dep.name)}
                      className="p-1.5 rounded-md bg-[#1bd96a] text-black hover:bg-[#1bd96a]/90 hover:scale-105 transition-all shadow-[0_0_10px_-2px_rgba(27,217,106,0.3)] flex items-center justify-center shrink-0"
                      title="Add to mod list"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                    </button>
                  )}
                  {isAdded && (
                    <span className="text-[10px] text-green-500 flex items-center gap-1 opacity-70">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Added
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </motion.div>
  );
};