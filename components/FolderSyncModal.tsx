import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HardDrive, CheckCircle2, AlertTriangle, ArrowRight, FolderOpen, RefreshCw } from 'lucide-react';
import { ModFile, ModLoader } from '../types';
import { Button } from './Button';

interface FolderSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSupported: boolean;
  folderName: string | null;
  onSelectDirectory: () => void;
  onWriteUpdates: () => void;
  onDisconnect: () => void;
  isSyncing: boolean;
  syncProgress: { current: number; total: number; filename: string } | null;
  mods: ModFile[];
  loader: ModLoader;
  mcVersion: string;
}

export const FolderSyncModal: React.FC<FolderSyncModalProps> = ({
  isOpen,
  onClose,
  isSupported,
  folderName,
  onSelectDirectory,
  onWriteUpdates,
  onDisconnect,
  isSyncing,
  syncProgress,
  mods,
}) => {
  if (!isOpen) return null;

  const updateCount = mods.filter(m => m.status === 'found' && m.downloadUrl && !m.isPinned).length;

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
          className="relative w-full max-w-xl flex flex-col rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#1bd96a]">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Direct Folder Sync</h3>
                <p className="text-xs text-zinc-500">
                  Read from and write updates directly to your local `.minecraft/mods` folder
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
          <div className="p-6 space-y-6">
            {!isSupported ? (
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-yellow-200">Browser Not Supported</h4>
                  <p className="text-[11px] text-yellow-400/80 leading-relaxed mt-1">
                    The File System Access API is supported in Chromium browsers (Chrome, Microsoft Edge, Brave, Opera). You can still drag & drop folders or download ZIP bundles normally on any browser!
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Folder status card */}
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider">Connection Status</span>
                    {folderName ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1bd96a]/20 text-[#1bd96a] font-mono flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 font-mono">
                        Not Linked
                      </span>
                    )}
                  </div>

                  {folderName ? (
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono">{folderName}</h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {mods.length} mods tracked in list
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-auto px-3 py-1 text-xs border-zinc-700 hover:border-red-400 hover:text-red-400"
                        onClick={onDisconnect}
                      >
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-2 text-center">
                      <Button
                        variant="primary"
                        onClick={() => {
                          onSelectDirectory();
                        }}
                        icon={<FolderOpen className="w-4 h-4" />}
                      >
                        Select Local Mods Folder
                      </Button>
                      <p className="text-[10px] text-zinc-500 mt-2">
                        Usually located at <span className="font-mono text-zinc-400">%appdata%/.minecraft/mods</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Write updates action */}
                {folderName && (
                  <div className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">Direct Disk Update</h4>
                      <span className="text-xs font-mono text-[#1bd96a]">
                        {updateCount} files ready
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Writing updates directly to disk will download new versions into <span className="text-white font-mono">"{folderName}"</span> and safely delete outdated JAR files.
                    </p>

                    {syncProgress && (
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1.5">
                        <div className="flex justify-between text-[10px] text-zinc-400">
                          <span>Writing: {syncProgress.filename}</span>
                          <span className="font-mono text-[#1bd96a]">{syncProgress.current} / {syncProgress.total}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                          <div
                            className="h-full bg-[#1bd96a] rounded-full transition-all duration-200"
                            style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      variant="primary"
                      onClick={onWriteUpdates}
                      isLoading={isSyncing}
                      disabled={updateCount === 0 || isSyncing}
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      {isSyncing ? 'Writing Updates to Disk...' : `Write ${updateCount} Updates to Folder`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 flex justify-end">
            <Button variant="secondary" className="w-auto px-5 py-2 text-xs" onClick={onClose}>
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
