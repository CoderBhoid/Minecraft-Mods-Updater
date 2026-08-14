import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Network, CheckCircle2, AlertCircle, Plus, ExternalLink, ShieldCheck } from 'lucide-react';
import { ModFile, ModLoader } from '../types';
import { Button } from './Button';

interface DependencyGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  mods: ModFile[];
  onAddDependency: (depId: string, depName: string) => void;
  onResolveAll: () => void;
  loader: ModLoader;
  mcVersion: string;
}

export const DependencyGraphModal: React.FC<DependencyGraphModalProps> = ({
  isOpen,
  onClose,
  mods,
  onAddDependency,
  onResolveAll,
}) => {
  if (!isOpen) return null;

  // Build dependency map
  const modsWithDeps = mods.filter(m => m.missingDependencies && m.missingDependencies.length > 0);
  const totalMissingSet = new Set<string>();

  mods.forEach(m => {
    m.missingDependencies?.forEach(dep => {
      if (!mods.some(existing => existing.projectId === dep.id)) {
        totalMissingSet.add(dep.id);
      }
    });
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#1bd96a]">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  Mod Dependency Graph
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                    {totalMissingSet.size} Missing
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Inspect required library relationships and resolve missing components
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            {totalMissingSet.size > 0 && (
              <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-yellow-200">Missing Dependencies Detected</h5>
                    <p className="text-[11px] text-yellow-400/80">
                      {totalMissingSet.size} required libraries are not yet in your modpack.
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  className="sm:w-auto text-xs py-2 px-4 whitespace-nowrap"
                  onClick={() => {
                    onResolveAll();
                    onClose();
                  }}
                  icon={<ShieldCheck className="w-4 h-4" />}
                >
                  Resolve All ({totalMissingSet.size})
                </Button>
              </div>
            )}

            {modsWithDeps.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-[#1bd96a] mx-auto mb-3 opacity-80" />
                <h4 className="text-sm font-bold text-white mb-1">All Dependencies Satisfied</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  No missing libraries were detected across your installed mods.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {modsWithDeps.map(mod => (
                  <div
                    key={mod.id}
                    className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-[#1bd96a]" />
                        <h4 className="text-xs font-bold text-white tracking-wide">{mod.name}</h4>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {mod.missingDependencies?.length} requirement{mod.missingDependencies?.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 border-l-2 border-zinc-800">
                      {mod.missingDependencies?.map(dep => {
                        const isAdded = mods.some(m => m.projectId === dep.id);
                        return (
                          <div
                            key={dep.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <a
                                href={`https://modrinth.com/mod/${dep.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-300 hover:text-yellow-400 transition-colors truncate flex items-center gap-1"
                              >
                                <span className="truncate">{dep.name}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-50 shrink-0" />
                              </a>
                            </div>

                            {isAdded ? (
                              <span className="text-[10px] text-[#1bd96a] flex items-center gap-1 shrink-0 font-medium">
                                <CheckCircle2 className="w-3 h-3" /> Added
                              </span>
                            ) : (
                              <button
                                onClick={() => onAddDependency(dep.id, dep.name)}
                                className="px-2 py-1 text-[10px] font-bold rounded bg-[#1bd96a] text-black hover:bg-[#1bd96a]/90 transition-all shrink-0 flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Add
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 flex justify-end">
            <Button variant="secondary" className="w-auto px-5 py-2 text-xs" onClick={onClose}>
              Done
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
