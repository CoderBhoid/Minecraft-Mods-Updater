import { useState, useCallback } from 'react';
import { ModFile } from '../types';
import { showToast } from './useToast';

export interface FolderSyncState {
  isSupported: boolean;
  folderName: string | null;
  isSyncing: boolean;
  syncProgress: { current: number; total: number; filename: string } | null;
}

export const useFolderSync = () => {
  const isSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  const [dirHandle, setDirHandle] = useState<any | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; filename: string } | null>(null);

  const selectDirectory = useCallback(async (): Promise<File[] | null> => {
    if (!isSupported) {
      showToast('warning', 'Browser not supported', 'File System Access API requires a Chromium browser (Chrome, Edge, Brave).');
      return null;
    }

    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'desktop',
      });

      setDirHandle(handle);
      setFolderName(handle.name);

      const files: File[] = [];
      for await (const entry of handle.values()) {
        if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.jar')) {
          const file = await entry.getFile();
          files.push(file);
        }
      }

      showToast('success', 'Folder connected', `Loaded ${files.length} mods from "${handle.name}"`);
      return files;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Directory picker error:', err);
        showToast('error', 'Failed to open directory', err.message);
      }
      return null;
    }
  }, [isSupported]);

  const writeUpdatesToDirectory = useCallback(async (
    mods: ModFile[],
    onProgress?: (current: number, total: number, filename: string) => void
  ): Promise<number> => {
    if (!dirHandle) {
      showToast('error', 'No folder connected', 'Please connect your mods folder first.');
      return 0;
    }

    const updates = mods.filter(m => m.status === 'found' && m.downloadUrl && m.fileName && !m.isPinned);
    if (updates.length === 0) {
      showToast('info', 'No updates to write', 'All mods are up to date or pinned.');
      return 0;
    }

    setIsSyncing(true);
    let successCount = 0;

    try {
      // Check write permission
      const perm = await dirHandle.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted') {
        const req = await dirHandle.requestPermission({ mode: 'readwrite' });
        if (req !== 'granted') {
          throw new Error('Write permission denied by user');
        }
      }

      for (let i = 0; i < updates.length; i++) {
        const mod = updates[i];
        const newFileName = mod.fileName!;
        const oldFileName = mod.originalFile?.name;

        setSyncProgress({ current: i + 1, total: updates.length, filename: newFileName });
        onProgress?.(i + 1, updates.length, newFileName);

        try {
          // Download file blob
          const res = await fetch(mod.downloadUrl!);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();

          // Write new file
          const newFileHandle = await dirHandle.getFileHandle(newFileName, { create: true });
          const writable = await newFileHandle.createWritable();
          await writable.write(blob);
          await writable.close();

          // Remove old file if name changed
          if (oldFileName && oldFileName !== newFileName) {
            try {
              await dirHandle.removeEntry(oldFileName);
            } catch (e) {
              console.warn(`Could not remove old file ${oldFileName}`, e);
            }
          }

          successCount++;
        } catch (fileErr: any) {
          console.error(`Failed to update ${mod.name}:`, fileErr);
        }
      }

      showToast('success', 'Sync complete', `Successfully updated ${successCount} mods directly in "${dirHandle.name}"!`);
      return successCount;
    } catch (err: any) {
      console.error('Write updates failed:', err);
      showToast('error', 'Folder sync failed', err.message);
      return successCount;
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  }, [dirHandle]);

  const disconnect = useCallback(() => {
    setDirHandle(null);
    setFolderName(null);
    showToast('info', 'Folder disconnected');
  }, []);

  return {
    isSupported,
    dirHandle,
    folderName,
    isSyncing,
    syncProgress,
    selectDirectory,
    writeUpdatesToDirectory,
    disconnect,
  };
};
