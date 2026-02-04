import React, { useState, useRef, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Upload, Search, Download, Settings, Zap, RefreshCw } from 'lucide-react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import './index.css';

import { MC_RELEASES, MC_SNAPSHOTS, LOADERS } from './constants';
import { ModFile, ModLoader } from './types';
import { cleanModName, computeSHA1 } from './utils/fileHelpers';
import * as api from './services/modrinth';
import { Button } from './components/Button';
import { ModCard } from './components/ModCard';
import { LandingPage } from './components/LandingPage';
import { Footer } from './components/Footer';

const App: React.FC = () => {
  const [versionType, setVersionType] = useState<'release' | 'snapshot'>('release');

  // Versions state
  const [onlineReleases, setOnlineReleases] = useState<string[] | null>(null);
  const [onlineSnapshots, setOnlineSnapshots] = useState<string[] | null>(null);
  const [fetchingVersions, setFetchingVersions] = useState(false);

  const [mcVersion, setMcVersion] = useState(MC_RELEASES[0]);
  const [loader, setLoader] = useState<ModLoader>('fabric');

  const [mods, setMods] = useState<ModFile[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Drag and Drop state
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch latest versions on mount
  useEffect(() => {
    const fetchVersions = async () => {
      setFetchingVersions(true);
      try {
        const data = await api.getGameVersions();
        const releases = data.filter(v => v.version_type === 'release').map(v => v.version);
        const snapshots = data.filter(v => v.version_type === 'snapshot').map(v => v.version);

        setOnlineReleases(releases);
        setOnlineSnapshots(snapshots);

        // Auto-select latest release if we are on default
        if (releases.length > 0 && versionType === 'release') {
          setMcVersion(releases[0]);
        }
      } catch (err) {
        console.error("Failed to fetch latest versions, using fallback", err);
      } finally {
        setFetchingVersions(false);
      }
    };
    fetchVersions();
  }, []);

  const availableVersions = useMemo(() => {
    if (versionType === 'release') {
      return onlineReleases || MC_RELEASES;
    }
    return onlineSnapshots || MC_SNAPSHOTS;
  }, [versionType, onlineReleases, onlineSnapshots]);

  // Ensure selected version exists in the new list when toggling
  useEffect(() => {
    if (!availableVersions.includes(mcVersion) && availableVersions.length > 0) {
      setMcVersion(availableVersions[0]);
    }
  }, [versionType, availableVersions, mcVersion]);

  // Memoize all project IDs for efficient lookup in ModCard
  const allProjectIds = useMemo(() => mods.map(m => m.projectId).filter(Boolean) as string[], [mods]);

  // -- Handlers --

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  // Global Drag Handlers
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
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const jarFiles = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.name.endsWith('.jar'));
      if (jarFiles.length > 0) processFiles(jarFiles);
    }
  };

  const processFiles = (files: File[]) => {
    const newMods: ModFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      originalFile: file,
      name: cleanModName(file.name),
      status: 'pending'
    }));
    setMods(prev => [...prev, ...newMods]);
  };

  const handleAddDependency = async (id: string, name: string) => {
    if (mods.some(m => m.projectId === id)) return;

    const newMod: ModFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      projectId: id,
      status: 'checking'
    };

    setMods(prev => [...prev, newMod]);

    try {
      // Parallel fetch for version and project info
      const [version, project] = await Promise.all([
        api.getLatestVersion(id, [loader], [mcVersion]).catch(() => null),
        api.getProject(id).catch(() => null)
      ]);

      if (version) {
        const missingDeps: { id: string; name: string }[] = [];

        if (version.dependencies) {
          for (const dep of version.dependencies) {
            if (dep.dependency_type === 'required' && dep.project_id) {
              // Simple check against current known mods, though recursion might be needed 
              // for full correctness. Here we just add it to missing list if not found.
              // We will need to fetch project names for nice display.
              try {
                const depProject = await api.getProject(dep.project_id);
                missingDeps.push({ id: dep.project_id, name: depProject.title });
              } catch (e) {
                missingDeps.push({ id: dep.project_id, name: 'Unknown Mod' });
              }
            }
          }
        }

        setMods(prev => prev.map(m => m.id === newMod.id ? {
          ...m,
          status: 'found',
          downloadUrl: version.files[0].url,
          fileName: version.files[0].filename,
          iconUrl: project?.icon_url,
          missingDependencies: missingDeps
        } : m));
      } else {
        setMods(prev => prev.map(m => m.id === newMod.id ? { ...m, status: 'missing' } : m));
      }
    } catch (e) {
      console.error("Failed to resolve dependency", e);
      setMods(prev => prev.map(m => m.id === newMod.id ? { ...m, status: 'error' } : m));
    }
  };

  const handleClear = () => {
    setMods([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const checkUpdates = async () => {
    setIsChecking(true);

    // Create a local working copy
    let workingMods = [...mods];

    // --- PHASE 1: IDENTIFICATION ---
    for (let i = 0; i < workingMods.length; i++) {
      if (workingMods[i].projectId) continue;

      setMods(prev => prev.map((m, idx) => idx === i ? { ...m, status: 'checking' } : m));

      let projectId = workingMods[i].projectId;
      let iconUrl = workingMods[i].iconUrl;

      try {
        // originalFile is present for manually dropped mods, but type is optional now
        if (workingMods[i].originalFile) {
          const hash = await computeSHA1(workingMods[i].originalFile!);
          const versionFromHash = await api.getVersionByHash(hash);

          if (versionFromHash) {
            projectId = versionFromHash.project_id;
          }
        }

        if (!projectId) {
          const searchResults = await api.searchMod(workingMods[i].name, loader);
          if (searchResults.hits.length > 0) {
            projectId = searchResults.hits[0].project_id;
            iconUrl = searchResults.hits[0].icon_url;
          }
        }
      } catch (error) {
        console.error(`Identification failed for ${workingMods[i].name}`, error);
      }

      if (projectId) {
        workingMods[i] = { ...workingMods[i], projectId, iconUrl };
        setMods(prev => {
          const next = [...prev];
          next[i] = workingMods[i];
          return next;
        });
      }

      await new Promise(r => setTimeout(r, 50));
    }

    // --- PHASE 2: UPDATE FETCHING & DEPENDENCY CHECK ---
    for (let i = 0; i < workingMods.length; i++) {
      const mod = workingMods[i];

      if (!mod.projectId) {
        workingMods[i] = { ...mod, status: 'missing' };
        setMods([...workingMods]);
        continue;
      }

      if (mod.status !== 'checking') {
        setMods(prev => prev.map(m => m.id === mod.id ? { ...m, status: 'checking' } : m));
      }

      try {
        const version = await api.getLatestVersion(mod.projectId, [loader], [mcVersion]);

        if (version) {
          const missingDeps: { id: string; name: string }[] = [];

          if (version.dependencies) {
            for (const dep of version.dependencies) {
              if (dep.dependency_type === 'required' && dep.project_id) {
                const isPresent = workingMods.some(m => m.projectId === dep.project_id);

                if (!isPresent) {
                  try {
                    const depProject = await api.getProject(dep.project_id);
                    missingDeps.push({ id: dep.project_id, name: depProject.title });
                  } catch (e) {
                    missingDeps.push({ id: dep.project_id, name: 'Unknown Mod' });
                  }
                }
              }
            }
          }

          workingMods[i] = {
            ...mod,
            status: 'found',
            downloadUrl: version.files[0].url,
            fileName: version.files[0].filename,
            projectId: mod.projectId,
            iconUrl: mod.iconUrl,
            missingDependencies: missingDeps
          };
        } else {
          workingMods[i] = { ...mod, status: 'missing' };
        }
      } catch (error) {
        workingMods[i] = { ...mod, status: 'error' };
      }

      setMods([...workingMods]);
      await new Promise(r => setTimeout(r, 100));
    }

    setIsChecking(false);
  };

  const handleDownloadOne = async (mod: ModFile) => {
    if (!mod.downloadUrl || !mod.fileName) return;

    setDownloadingId(mod.id);
    try {
      const response = await fetch(mod.downloadUrl);
      const blob = await response.blob();
      saveAs(blob, mod.fileName);
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setDownloadingId(null);
    }
  };

  const downloadAll = async () => {
    setIsDownloadingAll(true);
    const zip = new JSZip();
    const foundMods = mods.filter(m => m.status === 'found' && m.downloadUrl);

    await Promise.all(foundMods.map(async (mod) => {
      try {
        if (!mod.downloadUrl) return;
        const response = await fetch(mod.downloadUrl);
        const blob = await response.blob();
        zip.file(mod.fileName || `${mod.name}.jar`, blob);
      } catch (e) {
        console.error(`Failed to download ${mod.name}`, e);
      }
    }));

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `mods-update-${mcVersion}-${loader}.zip`);
    setIsDownloadingAll(false);
  };

  const stats = {
    total: mods.length,
    found: mods.filter(m => m.status === 'found').length,
    missing: mods.filter(m => m.status === 'missing').length
  };

  return (
    <div
      className="min-h-screen flex flex-col font-sans selection:bg-[#1bd96a] selection:text-black bg-black relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Global Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 z-[100] bg-zinc-950/90 backdrop-blur-md border-2 border-dashed border-[#1bd96a] rounded-3xl flex items-center justify-center pointer-events-none shadow-[0_0_50px_-10px_rgba(27,217,106,0.3)]"
          >
            <div className="text-center p-10">
              <div className="w-24 h-24 bg-[#1bd96a] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#1bd96a]/20">
                <Upload className="w-10 h-10 text-black animate-bounce" />
              </div>
              <h2 className="text-4xl text-white tracking-tight mb-2">Drop JAR files here</h2>
              <p className="text-zinc-400 text-lg">Add mods to your list instantly</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row items-start relative">

        {/* Left Sidebar: Branding & Controls */}
        <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-900/20 flex flex-col shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto custom-scrollbar">

          {/* Hero / Branding Section - Centered & Restored Design */}
          <div className="p-8 pb-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_40px_-10px_rgba(27,217,106,0.15)] ring-1 ring-[#1bd96a]/20">
              <Zap className="w-8 h-8 text-[#1bd96a] fill-current" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white mb-2">
              Update Your Mods
            </h1>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-[240px]">
              The ultimate tool to check for updates, verify hashes, and resolve missing dependencies.
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent mx-8 mb-6" />

          <div className="px-8 flex-1 flex flex-col gap-6">
            {/* Configuration */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-3 h-3" /> Configuration
                </h2>
                {fetchingVersions && (
                  <span className="text-[10px] text-[#1bd96a] flex items-center gap-1 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Fetching...
                  </span>
                )}
              </div>
              <div className="space-y-4">

                {/* Version Type Toggle */}
                <div className="p-1 bg-zinc-950 rounded-xl border border-zinc-800 flex">
                  <button
                    onClick={() => setVersionType('release')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${versionType === 'release'
                      ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-[#1bd96a]/20'
                      : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                  >
                    Releases
                  </button>
                  <button
                    onClick={() => setVersionType('snapshot')}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${versionType === 'snapshot'
                      ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-[#1bd96a]/20'
                      : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                  >
                    Snapshots
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500">Target Version</label>
                  <div className="relative">
                    <select
                      value={mcVersion}
                      onChange={(e) => setMcVersion(e.target.value)}
                      className="w-full appearance-none bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:border-[#1bd96a] focus:ring-1 focus:ring-[#1bd96a] transition-colors outline-none cursor-pointer hover:border-zinc-700"
                    >
                      {availableVersions.map((v, i) => (
                        <option key={v} value={v}>
                          {v} {i === 0 && onlineReleases ? '★ Latest' : ''}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">↓</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500">Mod Loader</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LOADERS.map(l => (
                      <button
                        key={l.value}
                        onClick={() => setLoader(l.value as ModLoader)}
                        className={`py-2.5 text-xs font-medium rounded-xl border transition-all ${loader === l.value ? 'bg-[#1bd96a] text-black border-[#1bd96a] shadow-[0_0_15px_-5px_rgba(27,217,106,0.3)]' : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pb-8 space-y-4">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept=".jar" className="hidden" />

              {/* Drag and Drop Box - Replaces standard Button */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-zinc-800 hover:border-[#1bd96a] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:bg-[#1bd96a]/5"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform group-hover:bg-[#1bd96a]">
                  <Upload className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors" />
                </div>
                <p className="text-xs text-zinc-300 group-hover:text-[#1bd96a] transition-colors">Add Mods</p>
                <p className="text-[10px] text-zinc-600 group-hover:text-zinc-500">Drop .jar files here</p>
              </div>

              {/* Enhanced Check Updates Button */}
              <Button
                variant="primary"
                className={`w-full ${mods.length === 0 ? "opacity-50" : ""}`}
                onClick={checkUpdates}
                isLoading={isChecking}
                disabled={mods.length === 0}
                icon={<Search className="w-4 h-4" />}
              >
                Check Updates
              </Button>

              {stats.found > 0 && (
                <Button
                  className="w-full bg-green-500 border-green-500 text-black hover:bg-green-400 hover:border-green-400"
                  onClick={downloadAll}
                  isLoading={isDownloadingAll}
                  icon={<Download className="w-4 h-4" />}
                >
                  Download ZIP ({stats.found})
                </Button>
              )}

              {mods.length > 0 && (
                <button
                  className="w-full text-xs text-zinc-500 hover:text-red-400 transition-colors py-1"
                  onClick={handleClear}
                >
                  Clear List
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Right Content: List or Info */}
        <main className="flex-1 w-full bg-black min-h-screen flex flex-col">

          {mods.length === 0 ? (
            <div className="flex-1 flex flex-col">
              <LandingPage />
            </div>
          ) : (
            <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex-1">
              <div className="flex items-center justify-between mb-8 sticky top-0 bg-black/80 backdrop-blur z-20 py-4 -my-4">
                <h2 className="text-xl flex items-center gap-3">
                  Installed Mods <span className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-full">{stats.total}</span>
                </h2>
                <div className="flex gap-4 text-xs font-mono">
                  <span className="text-[#1bd96a]">{stats.found} UPDATES</span>
                  <span className="text-zinc-600">/</span>
                  <span className="text-zinc-500">{stats.missing} UNKNOWN</span>
                </div>
              </div>

              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-20"
              >
                <AnimatePresence mode='popLayout'>
                  {mods.map((mod, idx) => (
                    <ModCard
                      key={mod.id}
                      mod={mod}
                      index={idx}
                      onDownload={handleDownloadOne}
                      isDownloading={downloadingId === mod.id}
                      onAddDependency={handleAddDependency}
                      addedProjectIds={allProjectIds}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}

          <Footer showInfo={mods.length === 0} />
        </main>
      </div>
    </div>
  );
};

export default App;