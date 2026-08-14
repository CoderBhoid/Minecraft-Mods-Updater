import React, { useState, useRef } from 'react';
import { 
  Search, X, Sparkles, Pin, AlertCircle, 
  Copy, FileJson, UploadCloud, Network, Layers, HardDrive,
  ChevronDown
} from 'lucide-react';
import { FilterStatus, SortOption, ModFile, ModLoader } from '../types';
import { formatModListText } from '../utils/fileHelpers';
import { showToast } from '../hooks/useToast';

interface ModFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterStatus: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  mods: ModFile[];
  mcVersion: string;
  loader: ModLoader;
  onOpenDependencyGraph: () => void;
  onOpenProfiles: () => void;
  onOpenFolderSync: () => void;
  onExportManifest: () => void;
  onImportManifest: (jsonString: string) => void;
  folderConnected?: boolean;
}

export const ModFilterBar: React.FC<ModFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  sortBy,
  onSortChange,
  mods,
  mcVersion,
  loader,
  onOpenDependencyGraph,
  onOpenProfiles,
  onOpenFolderSync,
  onExportManifest,
  onImportManifest,
  folderConnected,
}) => {
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Counts for pills
  const counts = {
    all: mods.length,
    found: mods.filter(m => m.status === 'found').length,
    missing: mods.filter(m => m.status === 'missing' || m.status === 'error').length,
    pinned: mods.filter(m => m.isPinned).length,
  };

  const handleCopy = (format: 'plain' | 'markdown' | 'discord') => {
    const text = formatModListText(mods, mcVersion, loader, format);
    navigator.clipboard.writeText(text);
    showToast('success', 'Copied to clipboard', `Formatted as ${format.toUpperCase()}`);
    setShowCopyMenu(false);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportManifest(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Top row: Search & Action buttons */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search mods by name or jar file..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-zinc-950/90 border border-zinc-800 focus:border-[#1bd96a] rounded-2xl text-xs text-white placeholder-zinc-500 outline-none transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 rounded-full hover:bg-zinc-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCopyMenu(!showCopyMenu)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-2xl transition-colors hover:text-white"
              title="Copy mod list formatted as text"
            >
              <Copy className="w-3.5 h-3.5 text-[#1bd96a]" />
              <span>Copy List</span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {showCopyMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowCopyMenu(false)} />
                <div className="absolute right-0 mt-1.5 w-48 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 text-xs">
                  <button
                    onClick={() => handleCopy('markdown')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-900 text-zinc-300 hover:text-white flex items-center justify-between transition-colors"
                  >
                    <span>Markdown Table</span>
                  </button>
                  <button
                    onClick={() => handleCopy('discord')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-900 text-zinc-300 hover:text-white flex items-center justify-between transition-colors"
                  >
                    <span>Discord Format</span>
                  </button>
                  <button
                    onClick={() => handleCopy('plain')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-900 text-zinc-300 hover:text-white flex items-center justify-between transition-colors"
                  >
                    <span>Plain Text</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Export JSON */}
          <button
            onClick={onExportManifest}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-2xl transition-colors hover:text-white"
            title="Export mod list as JSON manifest"
          >
            <FileJson className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export</span>
          </button>

          {/* Import JSON */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-2xl transition-colors hover:text-white"
            title="Import modpack from JSON manifest"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import</span>
          </button>

          {/* Dependency Graph */}
          <button
            onClick={onOpenDependencyGraph}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-2xl transition-colors hover:text-white"
            title="View dependency tree and resolve libraries"
          >
            <Network className="w-3.5 h-3.5 text-yellow-400" />
            <span>Dependencies</span>
          </button>

          {/* Profiles */}
          <button
            onClick={onOpenProfiles}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-2xl transition-colors hover:text-white"
            title="Manage saved modpack profiles"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Profiles</span>
          </button>

          {/* Folder Sync */}
          <button
            onClick={onOpenFolderSync}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs rounded-2xl border transition-all ${
              folderConnected
                ? 'bg-[#1bd96a]/15 border-[#1bd96a]/50 text-[#1bd96a] shadow-[0_0_15px_-5px_rgba(27,217,106,0.3)]'
                : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white'
            }`}
            title="Direct File System folder synchronization"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>{folderConnected ? 'Folder Linked' : 'Folder Sync'}</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Status Pills & Sort dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            All ({counts.all})
          </button>

          <button
            onClick={() => onFilterChange('found')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              filterStatus === 'found'
                ? 'bg-green-950/80 text-green-400 border border-green-800 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#1bd96a]" />
            <span>Updates ({counts.found})</span>
          </button>

          <button
            onClick={() => onFilterChange('missing')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              filterStatus === 'missing'
                ? 'bg-red-950/80 text-red-400 border border-red-800 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <AlertCircle className="w-3 h-3 text-red-400" />
            <span>Attention ({counts.missing})</span>
          </button>

          <button
            onClick={() => onFilterChange('pinned')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              filterStatus === 'pinned'
                ? 'bg-amber-950/80 text-amber-400 border border-amber-800 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Pin className="w-3 h-3 text-amber-400" />
            <span>Pinned ({counts.pinned})</span>
          </button>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-zinc-500">
          <span>Sort:</span>
          <select
            value={sortBy}
            onChange={e => onSortChange(e.target.value as SortOption)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-2xl px-3.5 py-1.5 text-xs outline-none focus:border-[#1bd96a] cursor-pointer shadow-sm"
          >
            <option value="status">Status (Updates First)</option>
            <option value="name-asc">Name (A → Z)</option>
            <option value="name-desc">Name (Z → A)</option>
            <option value="size-desc">File Size (Largest)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
