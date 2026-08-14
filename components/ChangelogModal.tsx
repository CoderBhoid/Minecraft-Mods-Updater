import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ArrowDownToLine, ExternalLink } from 'lucide-react';
import { ModFile } from '../types';
import { Button } from './Button';

interface ChangelogModalProps {
  mod: ModFile | null;
  onClose: () => void;
  onDownload: (mod: ModFile) => void;
  isDownloading: boolean;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({
  mod,
  onClose,
  onDownload,
  isDownloading,
}) => {
  if (!mod) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 sm:p-6">
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
          className="relative w-full max-w-2xl max-h-[80vh] flex flex-col rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#1bd96a] shrink-0 overflow-hidden">
                {mod.iconUrl ? (
                  <img src={mod.iconUrl} alt={mod.name} className="w-full h-full object-cover" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white tracking-tight truncate">{mod.name}</h3>
                <p className="text-xs text-zinc-500 font-mono">
                  {mod.versionNumber || 'Latest Release'} • {mod.fileName}
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
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-500 border-b border-zinc-800/80 pb-3">
              <span>Changelog Notes</span>
              {mod.projectId && (
                <a
                  href={`https://modrinth.com/mod/${mod.projectId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1bd96a] hover:underline flex items-center gap-1"
                >
                  View on Modrinth <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {mod.changelog ? (
              <div className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed bg-zinc-900/30 p-4 rounded-xl border border-zinc-800 max-h-96 overflow-y-auto">
                {mod.changelog}
              </div>
            ) : (
              <div className="text-center py-10 text-zinc-500 text-xs">
                No changelog notes provided for this version.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
            <Button variant="ghost" className="w-auto px-4 py-2 text-xs" onClick={onClose}>
              Close
            </Button>

            {mod.status === 'found' && mod.downloadUrl && (
              <Button
                variant="primary"
                className="w-auto px-5 py-2 text-xs"
                onClick={() => {
                  onDownload(mod);
                  onClose();
                }}
                isLoading={isDownloading}
                icon={<ArrowDownToLine className="w-4 h-4" />}
              >
                Download This Version
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
