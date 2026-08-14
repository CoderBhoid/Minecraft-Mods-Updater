import React, { useState, useRef, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Upload, Search, Download, Settings, Zap, RefreshCw, Layers, 
  HardDrive, FolderOpen, AlertCircle, FileSpreadsheet, Sparkles, X, Check 
} from 'lucide-react';
import './index.css';

import { MC_RELEASES, MC_SNAPSHOTS, LOADERS } from './constants';
import { ModFile, ModLoader, ModpackProfile } from './types';
import { extractJarFilesFromDataTransfer, decodeProfileShareUrl } from './utils/fileHelpers';
import * as api from './services/modrinth';

// Custom Hooks
import { useModSettings } from './hooks/useModSettings';
import { useMods } from './hooks/useMods';
import { useProfiles } from './hooks/useProfiles';
import { useFolderSync } from './hooks/useFolderSync';
import { useToastManager, showToast } from './hooks/useToast';

// Components
import { Button } from './components/Button';
import { ModCard } from './components/ModCard';
import { LandingPage } from './components/LandingPage';
import { Footer } from './components/Footer';
import { ToastContainer } from './components/ToastContainer';
import { ProgressBar } from './components/ProgressBar';
import { ModFilterBar } from './components/ModFilterBar';
import { DependencyGraphModal } from './components/DependencyGraphModal';
import { ProfileManagerModal } from './components/ProfileManagerModal';
import { FolderSyncModal } from './components/FolderSyncModal';
import { ChangelogModal } from './components/ChangelogModal';
import { NotFoundPage } from './components/NotFoundPage';

const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Settings & Filters Hook
  const {
    versionType, setVersionType,
    mcVersion, setMcVersion,
    hasCustomVersion,
    loader, setLoader,
    sortBy, setSortBy,
    searchQuery, setSearchQuery,
    filterStatus, setFilterStatus,
  } = useModSettings();

  // Mods Hook
  const {
    mods,
    addFiles,
    removeMod,
    clearMods,
    togglePin,
    setModOverride,
    selectModVersion,
    retryMod,
    checkUpdates,
    isChecking,
    batchProgress,
    addDependency,
    resolveAllDependencies,
    downloadOne,
    downloadAll,
    isDownloadingAll,
    downloadingId,
    exportManifest,
    importManifest,
    loadProfileMods,
    allProjectIds,
  } = useMods();

  // Profiles Hook
  const {
    profiles,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    saveProfile,
    createNewProfile,
    updateProfile,
    duplicateProfile,
    deleteProfile,
  } = useProfiles();

  // Folder Sync Hook
  const {
    isSupported: isFolderSyncSupported,
    folderName,
    isSyncing,
    syncProgress,
    selectDirectory,
    writeUpdatesToDirectory,
    disconnect: disconnectFolder,
  } = useFolderSync();

  // Toast Notification System
  const { toasts, removeToast } = useToastManager();

  // Online versions state
  const [onlineReleases, setOnlineReleases] = useState<string[] | null>(null);
  const [onlineSnapshots, setOnlineSnapshots] = useState<string[] | null>(null);
  const [fetchingVersions, setFetchingVersions] = useState(false);

  // Shared Profile Import State
  const [pendingSharedProfile, setPendingSharedProfile] = useState<ModpackProfile | null>(null);

  // Modal Visibility State
  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFolderSyncModalOpen, setIsFolderSyncModalOpen] = useState(false);
  const [changelogMod, setChangelogMod] = useState<ModFile | null>(null);

  // Drag & Drop visual state
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check URL query parameters for shared profile on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const profileParam = params.get('profile') || params.get('importProfile');
      if (profileParam) {
        const decoded = decodeProfileShareUrl(profileParam);
        if (decoded) {
          setPendingSharedProfile(decoded);
        }
      }
    }
  }, []);

  // Fetch latest official game versions on mount
  useEffect(() => {
    const fetchVersions = async () => {
      setFetchingVersions(true);
      try {
        const data = await api.getGameVersions();
        const releases = data.filter(v => v.version_type === 'release').map(v => v.version);
        const snapshots = data.filter(v => v.version_type === 'snapshot').map(v => v.version);

        setOnlineReleases(releases);
        setOnlineSnapshots(snapshots);

        // Dynamically auto-select the latest release if not manually set
        if (releases.length > 0) {
          if (!hasCustomVersion || (versionType === 'release' && !releases.includes(mcVersion)) || (versionType === 'snapshot' && !snapshots.includes(mcVersion))) {
            const targetLatest = versionType === 'release' ? releases[0] : (snapshots[0] || releases[0]);
            setMcVersion(targetLatest, false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch latest game versions, using offline fallbacks", err);
      } finally {
        setFetchingVersions(false);
      }
    };
    fetchVersions();
  }, [hasCustomVersion, versionType, mcVersion, setMcVersion]);

  const availableVersions = useMemo(() => {
    if (versionType === 'release') {
      return onlineReleases || MC_RELEASES;
    }
    return onlineSnapshots || MC_SNAPSHOTS;
  }, [versionType, onlineReleases, onlineSnapshots]);

  // Global Drag Handlers with recursive folder support
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      setIsDragging(false);
      dragCounter.current = 0;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer) {
      const jarFiles = await extractJarFilesFromDataTransfer(e.dataTransfer);
      if (jarFiles.length > 0) {
        addFiles(jarFiles);
      } else {
        showToast('warning', 'No .jar files found', 'Make sure you are dropping Minecraft mod JAR files or a mods folder.');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const jarFiles = (Array.from(e.target.files) as File[]).filter(f => f.name.toLowerCase().endsWith('.jar'));
      if (jarFiles.length > 0) {
        addFiles(jarFiles);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Connect local folder via FolderSync
  const handleConnectFolder = async () => {
    const files = await selectDirectory();
    if (files && files.length > 0) {
      addFiles(files);
    }
  };

  // Filter and Sort mods
  const filteredAndSortedMods = useMemo(() => {
    let result = [...mods];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(m => 
        m.name.toLowerCase().includes(q) || 
        (m.originalFile?.name && m.originalFile.name.toLowerCase().includes(q)) ||
        (m.fileName && m.fileName.toLowerCase().includes(q))
      );
    }

    // 2. Status Filter
    if (filterStatus === 'found') {
      result = result.filter(m => m.status === 'found' && !m.isPinned);
    } else if (filterStatus === 'missing') {
      result = result.filter(m => m.status === 'missing' || m.status === 'error');
    } else if (filterStatus === 'pinned') {
      result = result.filter(m => m.isPinned);
    } else if (filterStatus === 'up-to-date') {
      result = result.filter(m => m.status === 'up-to-date');
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'size-desc') return (b.fileSize || 0) - (a.fileSize || 0);

      // Default: Status Priority (found -> checking -> missing -> error -> up-to-date -> pending)
      const priority = (mod: ModFile) => {
        if (mod.isPinned) return 5;
        switch (mod.status) {
          case 'found': return 1;
          case 'checking': return 2;
          case 'missing': return 3;
          case 'error': return 4;
          case 'up-to-date': return 6;
          default: return 7;
        }
      };
      return priority(a) - priority(b);
    });

    return result;
  }, [mods, searchQuery, filterStatus, sortBy]);

  // Overall Statistics
  const stats = {
    total: mods.length,
    found: mods.filter(m => m.status === 'found' && !m.isPinned).length,
    missing: mods.filter(m => m.status === 'missing' || m.status === 'error').length,
    pinned: mods.filter(m => m.isPinned).length,
  };

  // 404 Route handling
  if (currentPath !== '/' && currentPath !== '' && currentPath !== '/index.html') {
    return (
      <NotFoundPage
        onGoHome={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col font-sans selection:bg-[#1bd96a] selection:text-black bg-black relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Global Toast Alerts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Global Drag & Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 z-[100] bg-zinc-950/95 backdrop-blur-lg border-2 border-dashed border-[#1bd96a] rounded-3xl flex items-center justify-center pointer-events-none shadow-[0_0_60px_-10px_rgba(27,217,106,0.35)]"
          >
            <div className="text-center p-10 space-y-4">
              <div className="w-20 h-20 bg-[#1bd96a] rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-[#1bd96a]/30">
                <Upload className="w-10 h-10 text-black animate-bounce" />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Drop JAR files or Mods Folder here
              </h2>
              <p className="text-zinc-400 text-sm max-w-sm mx-auto">
                Subfolders and `.jar` mod files will be scanned automatically
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col md:flex-row items-start relative">

        {/* Left Sidebar: Branding & Configuration */}
        <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-950/80 backdrop-blur flex flex-col shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto custom-scrollbar">

          {/* Hero Branding Section */}
          <div className="p-8 pb-6 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_35px_-10px_rgba(27,217,106,0.2)] ring-1 ring-[#1bd96a]/30">
              <Zap className="w-7 h-7 text-[#1bd96a] fill-current" />
            </div>
            <h1 className="text-lg font-black tracking-tight text-white mb-1">
              Minecraft Mods Updater
            </h1>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-[240px]">
              Intelligent update detector, dependency graph resolver & bulk packager.
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mx-8 mb-6" />

          {/* Configuration Controls */}
          <div className="px-8 flex-1 flex flex-col gap-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-[#1bd96a]" /> Target Environment
                </h2>
                {fetchingVersions && (
                  <span className="text-[10px] text-[#1bd96a] flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Fetching...
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {/* Version Type Toggle (Releases / Snapshots) */}
                <div className="p-1.5 bg-zinc-900/70 rounded-2xl border border-zinc-800 flex">
                  <button
                    onClick={() => {
                      setVersionType('release');
                      const target = onlineReleases?.[0] || MC_RELEASES[0];
                      setMcVersion(target, false);
                    }}
                    className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${
                      versionType === 'release'
                        ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-[#1bd96a]/30 font-bold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Releases
                  </button>
                  <button
                    onClick={() => {
                      setVersionType('snapshot');
                      const target = onlineSnapshots?.[0] || MC_SNAPSHOTS[0];
                      setMcVersion(target, false);
                    }}
                    className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${
                      versionType === 'snapshot'
                        ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-[#1bd96a]/30 font-bold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Snapshots
                  </button>
                </div>

                {/* Target Game Version Select */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-400">Game Version</label>
                    {!hasCustomVersion && (
                      <span className="text-[10px] text-[#1bd96a] font-mono font-bold">
                        ★ Auto (Latest)
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={availableVersions.includes(mcVersion) ? mcVersion : (availableVersions[0] || '')}
                      onChange={e => setMcVersion(e.target.value, true)}
                      className="w-full appearance-none bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-4 py-2.5 text-xs focus:border-[#1bd96a] focus:ring-1 focus:ring-[#1bd96a] transition-colors outline-none cursor-pointer hover:border-zinc-700 font-mono shadow-inner"
                    >
                      {availableVersions.map((v, i) => (
                        <option key={v} value={v}>
                          {v} {i === 0 ? '★ (Latest)' : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs">
                      ▼
                    </div>
                  </div>
                </div>

                {/* Mod Loader Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Mod Loader</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LOADERS.map(l => (
                      <button
                        key={l.value}
                        onClick={() => setLoader(l.value as ModLoader)}
                        className={`py-2 text-xs font-bold rounded-2xl border transition-all ${
                          loader === l.value
                            ? 'bg-[#1bd96a] text-black border-[#1bd96a] shadow-[0_0_15px_-4px_rgba(27,217,106,0.4)]'
                            : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Ingestion & Action Zone */}
            <div className="mt-auto pb-8 space-y-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                multiple
                accept=".jar"
                className="hidden"
              />

              {/* Drag and Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-zinc-800 hover:border-[#1bd96a] rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:bg-[#1bd96a]/5"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform group-hover:bg-[#1bd96a]">
                  <Upload className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors" />
                </div>
                <p className="text-xs font-bold text-zinc-300 group-hover:text-[#1bd96a] transition-colors">
                  Add Mod Files
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Click to select or drop `.jar` / folders
                </p>
              </div>

              {/* Check Updates Primary Trigger */}
              <Button
                variant="primary"
                className={`w-full ${mods.length === 0 ? 'opacity-50' : ''}`}
                onClick={() => checkUpdates(loader, mcVersion)}
                isLoading={isChecking}
                disabled={mods.length === 0 || isChecking}
                icon={<Search className="w-4 h-4" />}
              >
                {isChecking ? 'Checking Updates...' : 'Check Updates'}
              </Button>

              {/* Bulk Download ZIP Trigger */}
              {stats.found > 0 && (
                <Button
                  className="w-full bg-[#1bd96a] border-[#1bd96a] text-black hover:bg-[#1bd96a]/90 font-bold"
                  onClick={() => downloadAll(mcVersion, loader)}
                  isLoading={isDownloadingAll}
                  disabled={isDownloadingAll}
                  icon={<Download className="w-4 h-4" />}
                >
                  Download All ZIP ({stats.found})
                </Button>
              )}

              {/* Clear List */}
              {mods.length > 0 && (
                <button
                  className="w-full text-xs text-zinc-500 hover:text-red-400 transition-colors py-1 text-center"
                  onClick={clearMods}
                >
                  Clear Mod List
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 w-full bg-black min-h-screen flex flex-col">
          {mods.length === 0 ? (
            <LandingPage
              onBrowseFiles={() => fileInputRef.current?.click()}
              onSelectFolder={handleConnectFolder}
              onOpenProfiles={() => setIsProfileModalOpen(true)}
            />
          ) : (
            <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex-1">
              {/* Batch Operation Progress Bar */}
              <ProgressBar progress={batchProgress} />

              {/* Modern Search & Action Bar */}
              <ModFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterStatus={filterStatus}
                onFilterChange={setFilterStatus}
                sortBy={sortBy}
                onSortChange={setSortBy}
                mods={mods}
                mcVersion={mcVersion}
                loader={loader}
                onOpenDependencyGraph={() => setIsDependencyModalOpen(true)}
                onOpenProfiles={() => setIsProfileModalOpen(true)}
                onOpenFolderSync={() => setIsFolderSyncModalOpen(true)}
                onExportManifest={() => exportManifest(mcVersion, loader)}
                onImportManifest={(jsonStr) => {
                  const manifest = importManifest(jsonStr);
                  if (manifest) {
                    if (manifest.targetLoader) setLoader(manifest.targetLoader);
                    if (manifest.targetMcVersion) setMcVersion(manifest.targetMcVersion);
                  }
                }}
                folderConnected={Boolean(folderName)}
              />

              {/* Active Profile Bar (if profile active) */}
              {activeProfile && (
                <div className="mb-4 p-3.5 rounded-2xl bg-purple-950/30 border border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-purple-900/60 flex items-center justify-center text-purple-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">Profile:</span>
                        <strong className="text-white font-mono">{activeProfile.name}</strong>
                      </div>
                      <p className="text-[10px] text-purple-300/80 font-mono">
                        {loader.toUpperCase()} • {mcVersion} • {mods.length} mods
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        saveProfile(activeProfile.name, mcVersion, loader, versionType, mods, activeProfile.id);
                        showToast('success', 'Profile saved', `Updated "${activeProfile.name}" with current mods`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-sm"
                      title="Save current mod list into this active profile"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsProfileModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs border border-zinc-800 transition-colors"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => {
                        setActiveProfileId(null);
                        showToast('info', 'Profile unlinked', 'Current session is no longer tracking a profile');
                      }}
                      className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
                      title="Unlink profile"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Mod Cards Responsive Grid */}
              {filteredAndSortedMods.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl p-8">
                  <Search className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-white mb-1">No mods match your filter</h3>
                  <p className="text-xs text-zinc-500 mb-4">
                    Try adjusting your search query or switching the status filter tab.
                  </p>
                  <Button
                    variant="outline"
                    className="w-auto px-4 py-2 text-xs border-zinc-800"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterStatus('all');
                    }}
                  >
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-20">
                  {filteredAndSortedMods.map((mod, idx) => (
                    <ModCard
                      key={mod.id}
                      mod={mod}
                      index={idx}
                      onDownload={downloadOne}
                      isDownloading={downloadingId === mod.id}
                      onAddDependency={(id, name) => addDependency(id, name, loader, mcVersion)}
                      addedProjectIds={allProjectIds}
                      onRetry={(id) => retryMod(id, loader, mcVersion)}
                      onTogglePin={togglePin}
                      onOpenChangelog={(m) => setChangelogMod(m)}
                      onSetOverride={setModOverride}
                      onSelectVersion={selectModVersion}
                      onRemove={removeMod}
                      globalLoader={loader}
                      globalMcVersion={mcVersion}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Component */}
          <Footer showInfo={mods.length === 0} />
        </main>
      </div>

      {/* Shared Profile Detection Dialog */}
      {pendingSharedProfile && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-lg px-4">
          <div className="p-4 rounded-3xl bg-zinc-950/95 border border-[#1bd96a]/60 shadow-[0_0_40px_-5px_rgba(27,217,106,0.35)] backdrop-blur-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1bd96a]/20 border border-[#1bd96a]/40 flex items-center justify-center text-[#1bd96a] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white">Shared Modpack Profile Detected!</h4>
                <p className="text-[11px] text-zinc-300 font-mono mt-0.5 truncate">
                  {pendingSharedProfile.name} • {pendingSharedProfile.loader.toUpperCase()} {pendingSharedProfile.mcVersion} ({pendingSharedProfile.mods.length} mods)
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-zinc-800">
              <Button
                variant="ghost"
                className="w-auto px-4 py-1.5 text-xs rounded-xl"
                onClick={() => {
                  setPendingSharedProfile(null);
                  window.history.replaceState({}, '', window.location.pathname);
                }}
              >
                Dismiss
              </Button>
              <Button
                variant="primary"
                className="w-auto px-5 py-1.5 text-xs rounded-xl"
                onClick={() => {
                  const saved = createNewProfile(
                    pendingSharedProfile.name,
                    pendingSharedProfile.mcVersion,
                    pendingSharedProfile.loader,
                    pendingSharedProfile.versionType,
                    []
                  );
                  updateProfile(saved.id, { mods: pendingSharedProfile.mods });
                  setActiveProfileId(saved.id);
                  setLoader(pendingSharedProfile.loader);
                  setMcVersion(pendingSharedProfile.mcVersion);
                  setVersionType(pendingSharedProfile.versionType);
                  loadProfileMods(pendingSharedProfile.mods);
                  setPendingSharedProfile(null);
                  window.history.replaceState({}, '', window.location.pathname);
                  showToast('success', 'Shared profile imported', `Loaded "${pendingSharedProfile.name}" into your session!`);
                }}
                icon={<Check className="w-4 h-4" />}
              >
                Import & Load Modpack
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <DependencyGraphModal
        isOpen={isDependencyModalOpen}
        onClose={() => setIsDependencyModalOpen(false)}
        mods={mods}
        onAddDependency={(id, name) => addDependency(id, name, loader, mcVersion)}
        onResolveAll={() => resolveAllDependencies(loader, mcVersion)}
        loader={loader}
        mcVersion={mcVersion}
      />

      <ProfileManagerModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelectProfile={(profile) => {
          setActiveProfileId(profile.id);
          setLoader(profile.loader);
          setMcVersion(profile.mcVersion);
          setVersionType(profile.versionType);
          loadProfileMods(profile.mods);
          showToast('success', 'Profile loaded', `Loaded "${profile.name}"`);
        }}
        onSaveCurrentAsProfile={(name, targetId) => {
          saveProfile(name, mcVersion, loader, versionType, mods, targetId);
        }}
        onUpdateProfile={updateProfile}
        onDuplicateProfile={duplicateProfile}
        onDeleteProfile={deleteProfile}
        currentMods={mods}
        currentLoader={loader}
        currentMcVersion={mcVersion}
      />

      <FolderSyncModal
        isOpen={isFolderSyncModalOpen}
        onClose={() => setIsFolderSyncModalOpen(false)}
        isSupported={isFolderSyncSupported}
        folderName={folderName}
        onSelectDirectory={handleConnectFolder}
        onWriteUpdates={() => writeUpdatesToDirectory(mods)}
        onDisconnect={disconnectFolder}
        isSyncing={isSyncing}
        syncProgress={syncProgress}
        mods={mods}
        loader={loader}
        mcVersion={mcVersion}
      />

      <ChangelogModal
        mod={changelogMod}
        onClose={() => setChangelogMod(null)}
        onDownload={downloadOne}
        isDownloading={downloadingId === changelogMod?.id}
      />
    </div>
  );
};

export default App;