import React, { useState } from 'react';
import { 
  CheckCircle2, XCircle, AlertCircle, ArrowDownToLine, FileQuestion, 
  Loader2, Package, ExternalLink, Plus, RefreshCw, Pin, FileText, 
  Settings2, ChevronDown, Trash2, ListFilter
} from 'lucide-react';
import { ModFile, ModLoader, ModrinthVersion } from '../types';
import { formatFileSize } from '../utils/fileHelpers';
import { MC_RELEASES, LOADERS } from '../constants';

interface ModCardProps {
  mod: ModFile;
  index: number;
  onDownload: (mod: ModFile) => void;
  isDownloading: boolean;
  onAddDependency?: (id: string, name: string) => void;
  addedProjectIds?: string[];
  onRetry?: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onOpenChangelog?: (mod: ModFile) => void;
  onSetOverride?: (id: string, customLoader?: ModLoader, customVersion?: string) => void;
  onSelectVersion?: (modId: string, version: ModrinthVersion) => void;
  onRemove?: (id: string) => void;
  globalLoader: ModLoader;
  globalMcVersion: string;
}

export const ModCard: React.FC<ModCardProps> = ({
  mod,
  index,
  onDownload,
  isDownloading,
  onAddDependency,
  addedProjectIds,
  onRetry,
  onTogglePin,
  onOpenChangelog,
  onSetOverride,
  onSelectVersion,
  onRemove,
  globalLoader,
  globalMcVersion,
}) => {
  const [showOverrideMenu, setShowOverrideMenu] = useState(false);
  const [showVersionMenu, setShowVersionMenu] = useState(false);
  const [selectedLoader, setSelectedLoader] = useState<ModLoader>(mod.customLoader || globalLoader);
  const [selectedVersion, setSelectedVersion] = useState<string>(mod.customVersion || globalMcVersion);

  const getStatusIcon = () => {
    if (mod.isPinned) return <Pin className="w-3.5 h-3.5 text-amber-400" />;
    switch (mod.status) {
      case 'checking': return <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />;
      case 'found': return <CheckCircle2 className="w-3.5 h-3.5 text-[#1bd96a]" />;
      case 'up-to-date': return <CheckCircle2 className="w-3.5 h-3.5 text-[#1bd96a]" />;
      case 'missing': return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      case 'error': return <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />;
      default: return <FileQuestion className="w-3.5 h-3.5 text-zinc-600" />;
    }
  };

  const getStatusText = () => {
    if (mod.isPinned) return 'Pinned';
    switch (mod.status) {
      case 'checking': return 'Checking...';
      case 'found': return 'Update Found';
      case 'up-to-date': return 'Up to date';
      case 'missing': return 'Not Found';
      case 'error': return 'Error';
      default: return 'Pending';
    }
  };

  const handleSaveOverride = () => {
    const isLoaderOverridden = selectedLoader !== globalLoader ? selectedLoader : undefined;
    const isVersionOverridden = selectedVersion !== globalMcVersion ? selectedVersion : undefined;
    onSetOverride?.(mod.id, isLoaderOverridden, isVersionOverridden);
    setShowOverrideMenu(false);
  };

  const isOverridden = Boolean(mod.customLoader || mod.customVersion);
  const availableVersions = mod.availableVersions || [];

  return (
    <div
      style={{
        animation: `fadeIn 0.25s ease-out ${Math.min(index * 0.02, 0.3)}s both`,
      }}
      className={`
        group relative rounded-3xl border bg-zinc-950/85 p-5 transition-colors duration-200 flex flex-col justify-between
        ${mod.isPinned 
          ? 'border-amber-500/40 bg-amber-950/15'
          : mod.status === 'found'
          ? 'border-[#1bd96a]/35 hover:border-[#1bd96a]/70 shadow-[0_0_25px_-10px_rgba(27,217,106,0.2)]'
          : mod.status === 'missing' || mod.status === 'error'
          ? 'border-red-900/40 hover:border-red-500/40'
          : 'border-zinc-800 hover:border-zinc-700'}
        backdrop-blur-md
      `}
    >
      <div>
        {/* Top Header / Icon & Actions */}
        <div className="flex items-start gap-3.5 relative z-10">
          {/* Mod Icon */}
          <div className="relative shrink-0 w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shadow-inner">
            {mod.iconUrl ? (
              <img src={mod.iconUrl} alt={mod.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-6 h-6 text-zinc-600" />
            )}
          </div>

          {/* Title & Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-xs font-bold text-white truncate pr-1 tracking-wide" title={mod.name}>
                {mod.name}
              </h4>

              {/* Action Buttons Top-Right */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Pin Button */}
                {onTogglePin && (
                  <button
                    onClick={() => onTogglePin(mod.id)}
                    className={`p-1.5 rounded-xl transition-colors ${
                      mod.isPinned
                        ? 'text-amber-400 bg-amber-950/80 border border-amber-800'
                        : 'text-zinc-500 hover:text-amber-400 hover:bg-zinc-900'
                    }`}
                    title={mod.isPinned ? 'Unpin version' : 'Pin (skip updates)'}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Retry Button */}
                {onRetry && (mod.status === 'error' || mod.status === 'missing' || mod.status === 'pending') && (
                  <button
                    onClick={() => onRetry(mod.id)}
                    className="p-1.5 rounded-xl text-zinc-500 hover:text-[#1bd96a] hover:bg-zinc-900 transition-colors"
                    title="Retry verification"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Override settings toggle */}
                {onSetOverride && (
                  <button
                    onClick={() => {
                      setShowOverrideMenu(!showOverrideMenu);
                      setShowVersionMenu(false);
                    }}
                    className={`p-1.5 rounded-xl transition-colors ${
                      isOverridden
                        ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                    }`}
                    title="Override loader or MC version"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Remove button */}
                {onRemove && (
                  <button
                    onClick={() => onRemove(mod.id)}
                    className="p-1.5 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-zinc-900 transition-colors"
                    title="Remove from list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Original filename & size */}
            <p className="text-[11px] text-zinc-500 font-mono truncate mt-0.5" title={mod.originalFile?.name || mod.name}>
              {mod.originalFile?.name || 'Manual Addition'}
            </p>

            {/* Badges & Meta */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {/* Status Badge */}
              <span className={`
                inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider
                ${mod.isPinned ? 'bg-amber-950/80 text-amber-400 border border-amber-800' : ''}
                ${!mod.isPinned && mod.status === 'found' ? 'bg-[#1bd96a]/15 text-[#1bd96a] border border-[#1bd96a]/40' : ''}
                ${!mod.isPinned && mod.status === 'up-to-date' ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : ''}
                ${!mod.isPinned && mod.status === 'missing' ? 'bg-red-950/80 text-red-400 border border-red-900' : ''}
                ${!mod.isPinned && mod.status === 'error' ? 'bg-yellow-950/80 text-yellow-400 border border-yellow-800' : ''}
                ${!mod.isPinned && (mod.status === 'checking' || mod.status === 'pending') ? 'bg-zinc-900 text-zinc-400 border border-zinc-800' : ''}
              `}>
                {getStatusIcon()}
                <span>{getStatusText()}</span>
              </span>

              {/* Source Badge */}
              {mod.source && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-500 border border-zinc-800 capitalize font-mono">
                  {mod.source}
                </span>
              )}

              {/* File Size */}
              {mod.fileSize && (
                <span className="text-[10px] text-zinc-500 font-mono">
                  {formatFileSize(mod.fileSize)}
                </span>
              )}

              {/* Override indicator */}
              {isOverridden && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800 font-mono">
                  {mod.customLoader || globalLoader} {mod.customVersion || globalMcVersion}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Override Form Dropdown */}
        {showOverrideMenu && (
          <div className="mt-3 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5 relative z-20 text-xs shadow-xl">
            <h5 className="text-[11px] font-bold text-white">Override Target Version:</h5>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-500">Loader</label>
                <select
                  value={selectedLoader}
                  onChange={e => setSelectedLoader(e.target.value as ModLoader)}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-700 text-white rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-[#1bd96a]"
                >
                  {LOADERS.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500">MC Version</label>
                <select
                  value={selectedVersion}
                  onChange={e => setSelectedVersion(e.target.value)}
                  className="w-full mt-1 bg-zinc-950 border border-zinc-700 text-white rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-[#1bd96a]"
                >
                  {MC_RELEASES.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  setSelectedLoader(globalLoader);
                  setSelectedVersion(globalMcVersion);
                  onSetOverride?.(mod.id, undefined, undefined);
                  setShowOverrideMenu(false);
                }}
                className="px-2.5 py-1 text-[10px] text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                Reset
              </button>
              <button
                onClick={handleSaveOverride}
                className="px-3.5 py-1.5 text-[10px] font-bold bg-[#1bd96a] text-black rounded-xl hover:bg-[#1bd96a]/90 shadow-md"
              >
                Apply & Search
              </button>
            </div>
          </div>
        )}

        {/* Update Target Filename & Version Selector Trigger */}
        {mod.fileName && mod.status === 'found' && (
          <div className="mt-3 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 text-xs shadow-inner">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-[#1bd96a] font-mono truncate font-bold" title={mod.fileName}>
                → {mod.fileName}
              </span>

              {/* Version picker dropdown button */}
              {availableVersions.length > 1 && onSelectVersion && (
                <button
                  onClick={() => {
                    setShowVersionMenu(!showVersionMenu);
                    setShowOverrideMenu(false);
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 font-mono flex items-center gap-1 shrink-0 transition-colors shadow-sm"
                  title="Choose from multiple versions of this mod"
                >
                  <ListFilter className="w-3 h-3 text-[#1bd96a]" />
                  <span>{availableVersions.length} versions</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {mod.versionNumber && (
              <div className="text-[10px] text-zinc-400 font-mono flex items-center justify-between">
                <span>Version: v{mod.versionNumber}</span>
                {mod.versionType && (
                  <span className={`capitalize px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    mod.versionType === 'release' ? 'text-[#1bd96a] bg-[#1bd96a]/15 border border-[#1bd96a]/30' : 'text-amber-400 bg-amber-950/60 border border-amber-800'
                  }`}>
                    {mod.versionType}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Version Selection Modal / Dropdown */}
        {showVersionMenu && availableVersions.length > 0 && (
          <div className="mt-3 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 relative z-20 text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
              <h5 className="text-[11px] font-bold text-white">Select Mod Version:</h5>
              <button
                onClick={() => setShowVersionMenu(false)}
                className="text-[10px] text-zinc-500 hover:text-white px-1.5 py-0.5 rounded-lg hover:bg-zinc-800"
              >
                Close
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
              {availableVersions.map((v) => {
                const isSelected = v.id === mod.versionId || v.version_number === mod.versionNumber;
                const file = v.files.find(f => f.primary) || v.files[0];
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      onSelectVersion?.(mod.id, v);
                      setShowVersionMenu(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                      isSelected
                        ? 'border-[#1bd96a] bg-[#1bd96a]/15 text-white font-bold shadow-sm'
                        : 'border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[11px] text-white truncate">
                        {v.name || `v${v.version_number}`}
                      </span>
                      <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold ${
                        v.version_type === 'release' ? 'bg-[#1bd96a]/20 text-[#1bd96a]' : 'bg-amber-950/60 text-amber-400'
                      }`}>
                        {v.version_type || 'Release'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span>{file ? formatFileSize(file.size) : ''}</span>
                      <span>{v.date_published ? new Date(v.date_published).toLocaleDateString() : ''}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Missing Dependency Warning Section */}
        {mod.missingDependencies && mod.missingDependencies.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-800/80 relative z-10">
            <div className="flex items-center gap-1.5 text-yellow-400 mb-2">
              <AlertCircle className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Dependencies</span>
            </div>
            <ul className="space-y-1.5">
              {mod.missingDependencies.map(dep => {
                const isAdded = addedProjectIds?.includes(dep.id);
                return (
                  <li key={dep.id} className="text-xs text-zinc-400 flex items-center justify-between gap-2">
                    <a
                      href={`https://modrinth.com/mod/${dep.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-yellow-300 transition-colors flex items-center gap-1 truncate text-[11px]"
                    >
                      <span className="truncate">{dep.name}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-50 shrink-0" />
                    </a>

                    {onAddDependency && !isAdded && (
                      <button
                        onClick={() => onAddDependency(dep.id, dep.name)}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1bd96a] text-black hover:bg-[#1bd96a]/90 transition-all flex items-center gap-1 shrink-0"
                        title="Add to mod list"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    )}
                    {isAdded && (
                      <span className="text-[10px] text-[#1bd96a] flex items-center gap-1 opacity-80 shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Added
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2 relative z-10">
        {/* Changelog trigger */}
        {onOpenChangelog && mod.projectId ? (
          <button
            onClick={() => onOpenChangelog(mod)}
            className="text-[11px] text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
            title="Read version release notes"
          >
            <FileText className="w-3 h-3" />
            <span>Notes</span>
          </button>
        ) : <div />}

        {/* Download button */}
        {mod.status === 'found' && mod.downloadUrl && (
          <button
            onClick={() => onDownload(mod)}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1bd96a] text-black hover:bg-[#1bd96a]/90 text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download this updated mod file"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowDownToLine className="w-3.5 h-3.5" />
            )}
            <span>Download</span>
          </button>
        )}
      </div>
    </div>
  );
};