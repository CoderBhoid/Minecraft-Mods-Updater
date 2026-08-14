import { useState, useCallback, useMemo } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { ModFile, ModLoader, BatchProgress, MissingDependencyInfo, ModrinthVersion } from '../types';
import { cleanModName, computeSHA1, buildModpackManifest, parseModpackManifest } from '../utils/fileHelpers';
import * as modrinthApi from '../services/modrinth';
import * as curseforgeApi from '../services/curseforge';
import { showToast } from './useToast';

export const useMods = () => {
  const [mods, setMods] = useState<ModFile[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    total: 0,
    current: 0,
    currentModName: '',
    phase: 'idle',
    percent: 0,
  });

  // Add new files to the mod list
  const addFiles = useCallback((files: File[]) => {
    const existingNames = new Set(mods.map(m => m.originalFile?.name || m.name));
    const newItems: ModFile[] = [];

    files.forEach(file => {
      if (!existingNames.has(file.name)) {
        newItems.push({
          id: Math.random().toString(36).substring(2, 9),
          originalFile: file,
          name: cleanModName(file.name),
          status: 'pending',
          fileSize: file.size,
        });
      }
    });

    if (newItems.length > 0) {
      setMods(prev => [...prev, ...newItems]);
      showToast('info', 'Mods added', `Added ${newItems.length} mod file${newItems.length > 1 ? 's' : ''}`);
    }
  }, [mods]);

  // Remove individual mod
  const removeMod = useCallback((id: string) => {
    setMods(prev => prev.filter(m => m.id !== id));
  }, []);

  // Clear all mods
  const clearMods = useCallback(() => {
    setMods([]);
    showToast('info', 'List cleared', 'Removed all mods from list');
  }, []);

  // Toggle version pinning (skip this update)
  const togglePin = useCallback((id: string) => {
    setMods(prev => prev.map(m => {
      if (m.id === id) {
        const nextPinned = !m.isPinned;
        showToast('info', nextPinned ? 'Mod pinned' : 'Mod unpinned', `${m.name} will ${nextPinned ? 'skip updates' : 'receive updates'}`);
        return { ...m, isPinned: nextPinned };
      }
      return m;
    }));
  }, []);

  // Override loader or MC version for an individual mod
  const setModOverride = useCallback((id: string, customLoader?: ModLoader, customVersion?: string) => {
    setMods(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, customLoader, customVersion };
      }
      return m;
    }));
    showToast('success', 'Override saved', 'Mod compatibility parameters updated');
  }, []);

  // Select a specific version release for a mod
  const selectModVersion = useCallback((modId: string, selectedVersion: ModrinthVersion) => {
    setMods(prev => prev.map(m => {
      if (m.id === modId) {
        const primaryFile = selectedVersion.files.find(f => f.primary) || selectedVersion.files[0];
        return {
          ...m,
          versionId: selectedVersion.id,
          versionNumber: selectedVersion.version_number,
          versionType: selectedVersion.version_type || 'release',
          downloadUrl: primaryFile?.url,
          fileName: primaryFile?.filename,
          fileSize: primaryFile?.size || m.fileSize,
          changelog: selectedVersion.changelog,
          status: 'found',
          rawDependencies: selectedVersion.dependencies || [],
        };
      }
      return m;
    }));
    showToast('success', 'Version selected', `Switched to version ${selectedVersion.version_number}`);
  }, []);

  // Single Mod Identification (Phase 1)
  const identifyAndFetchMod = useCallback(async (
    mod: ModFile,
    globalLoader: ModLoader,
    globalMcVersion: string
  ): Promise<ModFile> => {
    let workingMod: ModFile = { ...mod, status: 'checking' };
    const effectiveLoader = mod.customLoader || globalLoader;
    const effectiveVersion = mod.customVersion || globalMcVersion;

    try {
      // 1. Identification via SHA-1 Hash
      let projectId = workingMod.projectId;
      let iconUrl = workingMod.iconUrl;
      let sha1 = workingMod.sha1;
      let source: 'modrinth' | 'curseforge' = workingMod.source || 'modrinth';

      if (!projectId && workingMod.originalFile) {
        if (!sha1) {
          sha1 = await computeSHA1(workingMod.originalFile);
          workingMod.sha1 = sha1;
        }

        const versionFromHash = await modrinthApi.getVersionByHash(sha1);
        if (versionFromHash) {
          projectId = versionFromHash.project_id;
          source = 'modrinth';
        }
      }

      // 2. Fallback to Modrinth search by clean name
      if (!projectId) {
        try {
          const searchResults = await modrinthApi.searchMod(workingMod.name, effectiveLoader);
          if (searchResults.hits.length > 0) {
            projectId = searchResults.hits[0].project_id;
            iconUrl = searchResults.hits[0].icon_url;
            source = 'modrinth';
          }
        } catch (e) {
          // ignore search error
        }
      }

      // 3. Fallback to CurseForge search
      if (!projectId) {
        try {
          const cfResults = await curseforgeApi.searchMod(workingMod.name, effectiveLoader);
          if (cfResults.hits.length > 0) {
            projectId = cfResults.hits[0].project_id;
            iconUrl = cfResults.hits[0].icon_url;
            source = 'curseforge';
          }
        } catch (e) {
          // ignore search error
        }
      }

      if (!projectId) {
        return { ...workingMod, status: 'missing' };
      }

      // 4. Fetch all available versions for loader & MC version
      let availableVersions: ModrinthVersion[] = [];
      let projectData = null;

      if (source === 'modrinth') {
        const [versions, proj] = await Promise.all([
          modrinthApi.getProjectVersions(projectId, [effectiveLoader], [effectiveVersion]).catch(() => []),
          modrinthApi.getProject(projectId).catch(() => null),
        ]);
        availableVersions = versions;
        projectData = proj;
      } else {
        const [versions, proj] = await Promise.all([
          curseforgeApi.getProjectVersions(projectId, [effectiveLoader], [effectiveVersion]).catch(() => []),
          curseforgeApi.getProject(projectId).catch(() => null),
        ]);
        availableVersions = versions;
        projectData = proj;
      }

      if (!availableVersions || availableVersions.length === 0) {
        return {
          ...workingMod,
          projectId,
          iconUrl: projectData?.icon_url || iconUrl,
          status: 'missing',
          source,
          availableVersions: [],
        };
      }

      // Pick selected version or default to the newest version
      const currentVersion = availableVersions[0];
      const primaryFile = currentVersion.files.find(f => f.primary) || currentVersion.files[0];

      return {
        ...workingMod,
        projectId,
        versionId: currentVersion.id,
        versionNumber: currentVersion.version_number,
        versionType: currentVersion.version_type || 'release',
        downloadUrl: primaryFile?.url,
        fileName: primaryFile?.filename,
        iconUrl: projectData?.icon_url || iconUrl,
        changelog: currentVersion.changelog,
        fileSize: primaryFile?.size || workingMod.fileSize,
        status: workingMod.isPinned ? 'up-to-date' : 'found',
        source,
        availableVersions,
        rawDependencies: currentVersion.dependencies || [],
      };
    } catch (err) {
      console.error(`Check failed for mod ${workingMod.name}:`, err);
      return { ...workingMod, status: 'error' };
    }
  }, []);

  // Resolve dependencies across the entire mod list (Phase 2)
  const resolveDependenciesForModList = useCallback(async (modList: ModFile[]): Promise<ModFile[]> => {
    // Collect all known project IDs in the current mod list
    const knownProjectIds = new Set<string>();
    modList.forEach(m => {
      if (m.projectId) knownProjectIds.add(m.projectId.toLowerCase());
      if (m.name) knownProjectIds.add(m.name.toLowerCase());
    });

    const projectCache = new Map<string, string>();

    return await Promise.all(modList.map(async (mod) => {
      if (!mod.rawDependencies || mod.rawDependencies.length === 0) {
        return { ...mod, missingDependencies: [] };
      }

      const missing: MissingDependencyInfo[] = [];

      for (const dep of mod.rawDependencies) {
        if (dep.dependency_type === 'required' && dep.project_id) {
          const depId = dep.project_id.toLowerCase();

          // If not in our known installed mods list
          if (!knownProjectIds.has(depId)) {
            let depName = projectCache.get(depId);
            if (!depName) {
              try {
                const depProj = await modrinthApi.getProject(dep.project_id);
                depName = depProj.title;
                projectCache.set(depId, depName);
              } catch {
                depName = dep.file_name || dep.project_id;
              }
            }

            missing.push({
              id: dep.project_id,
              name: depName,
              required: true,
              source: 'modrinth',
            });
          }
        }
      }

      return {
        ...mod,
        missingDependencies: missing,
      };
    }));
  }, []);

  // Per-Mod Retry Action
  const retryMod = useCallback(async (id: string, globalLoader: ModLoader, globalMcVersion: string) => {
    const targetMod = mods.find(m => m.id === id);
    if (!targetMod) return;

    setMods(prev => prev.map(m => m.id === id ? { ...m, status: 'checking' } : m));
    const identified = await identifyAndFetchMod(targetMod, globalLoader, globalMcVersion);
    
    // Update and re-verify dependencies
    const updatedList = mods.map(m => m.id === id ? identified : m);
    const withDeps = await resolveDependenciesForModList(updatedList);
    setMods(withDeps);
    showToast('info', 'Check complete', `${identified.name}: ${identified.status}`);
  }, [mods, identifyAndFetchMod, resolveDependenciesForModList]);

  // Full Batch Check Updates (Two-Phase Execution)
  const checkUpdates = useCallback(async (globalLoader: ModLoader, globalMcVersion: string) => {
    if (mods.length === 0) return;

    setIsChecking(true);
    const total = mods.length;
    let working = [...mods];

    setBatchProgress({
      total,
      current: 0,
      currentModName: '',
      phase: 'hashing',
      percent: 0,
    });

    // Phase 1: Sequential identification of all mod files
    for (let i = 0; i < total; i++) {
      const currentMod = working[i];
      setBatchProgress({
        total,
        current: i + 1,
        currentModName: currentMod.name,
        phase: 'identifying',
        percent: Math.round(((i + 1) / total) * 75),
      });

      // Update checking status
      setMods(prev => prev.map((m, idx) => idx === i ? { ...m, status: 'checking' } : m));

      const updated = await identifyAndFetchMod(currentMod, globalLoader, globalMcVersion);
      working[i] = updated;

      setMods(prev => prev.map((m, idx) => idx === i ? updated : m));
    }

    // Phase 2: Resolve dependencies after all mods are identified
    setBatchProgress({
      total,
      current: total,
      currentModName: 'Resolving dependencies across modpack...',
      phase: 'resolving',
      percent: 90,
    });

    const finalWithDependencies = await resolveDependenciesForModList(working);
    setMods(finalWithDependencies);

    setBatchProgress({
      total,
      current: total,
      currentModName: 'Scan complete!',
      phase: 'idle',
      percent: 100,
    });

    setIsChecking(false);

    const foundCount = finalWithDependencies.filter(m => m.status === 'found').length;
    showToast('success', 'Scan finished', `Found updates for ${foundCount} of ${total} mods`);
  }, [mods, identifyAndFetchMod, resolveDependenciesForModList]);

  // Add dependency to mod list
  const addDependency = useCallback(async (
    projectId: string,
    modName: string,
    globalLoader: ModLoader,
    globalMcVersion: string
  ) => {
    const existing = mods.find(m => m.projectId === projectId || m.name.toLowerCase() === modName.toLowerCase());
    if (existing) {
      showToast('info', 'Already in list', `${modName} is already added`);
      return;
    }

    const tempMod: ModFile = {
      id: Math.random().toString(36).substring(2, 9),
      name: modName,
      projectId,
      status: 'checking',
    };

    setMods(prev => [...prev, tempMod]);

    try {
      const resolved = await identifyAndFetchMod(tempMod, globalLoader, globalMcVersion);
      setMods(prev => {
        const nextList = prev.map(m => m.id === tempMod.id ? resolved : m);
        return nextList;
      });
      showToast('success', 'Dependency added', `${modName} added to mod list`);
    } catch {
      setMods(prev => prev.map(m => m.id === tempMod.id ? { ...m, status: 'error' } : m));
    }
  }, [mods, identifyAndFetchMod]);

  // Resolve all missing dependencies at once
  const resolveAllDependencies = useCallback(async (globalLoader: ModLoader, globalMcVersion: string) => {
    const missingSet = new Map<string, string>();
    mods.forEach(m => {
      m.missingDependencies?.forEach(dep => {
        if (!missingSet.has(dep.id)) {
          missingSet.set(dep.id, dep.name);
        }
      });
    });

    if (missingSet.size === 0) {
      showToast('info', 'All clear', 'No missing dependencies found');
      return;
    }

    showToast('info', 'Resolving dependencies', `Adding ${missingSet.size} required libraries...`);

    for (const [id, name] of missingSet.entries()) {
      await addDependency(id, name, globalLoader, globalMcVersion);
    }
  }, [mods, addDependency]);

  // Single Mod Download
  const downloadOne = useCallback(async (mod: ModFile) => {
    if (!mod.downloadUrl) {
      showToast('error', 'Download unavailable', `No download URL for ${mod.name}`);
      return;
    }

    setDownloadingId(mod.id);
    try {
      const res = await fetch(mod.downloadUrl);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      saveAs(blob, mod.fileName || `${mod.name}.jar`);
      showToast('success', 'Downloaded', `Saved ${mod.fileName || mod.name}`);
    } catch (err) {
      console.error(err);
      showToast('error', 'Download failed', `Could not download ${mod.name}`);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  // Bulk ZIP Download
  const downloadAll = useCallback(async (mcVersion: string, loader: ModLoader) => {
    const updatable = mods.filter(m => m.status === 'found' && m.downloadUrl && !m.isPinned);
    if (updatable.length === 0) {
      showToast('warning', 'No updates ready', 'No unpinned mods with updates found');
      return;
    }

    setIsDownloadingAll(true);
    const zip = new JSZip();
    const total = updatable.length;

    setBatchProgress({
      total,
      current: 0,
      currentModName: 'Initializing archive...',
      phase: 'downloading',
      percent: 0,
    });

    let completed = 0;

    for (let i = 0; i < total; i++) {
      const mod = updatable[i];
      setBatchProgress({
        total,
        current: i + 1,
        currentModName: mod.fileName || mod.name,
        phase: 'downloading',
        percent: Math.round(((i + 1) / total) * 90),
      });

      try {
        const res = await fetch(mod.downloadUrl!);
        if (res.ok) {
          const blob = await res.blob();
          zip.file(mod.fileName || `${mod.name}.jar`, blob);
          completed++;
        }
      } catch (err) {
        console.error(`Failed to pack ${mod.name}`, err);
      }
    }

    setBatchProgress({
      total,
      current: total,
      currentModName: 'Generating ZIP file...',
      phase: 'downloading',
      percent: 95,
    });

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `mods-${loader}-${mcVersion}.zip`);
      showToast('success', 'Archive ready', `Downloaded ${completed} updated mods in ZIP archive`);
    } catch (err) {
      showToast('error', 'Packaging failed', 'Could not build ZIP file');
    } finally {
      setIsDownloadingAll(false);
      setBatchProgress({
        total: 0,
        current: 0,
        currentModName: '',
        phase: 'idle',
        percent: 0,
      });
    }
  }, [mods]);

  // Export Manifest
  const exportManifest = useCallback((targetMcVersion: string, targetLoader: ModLoader) => {
    const manifest = buildModpackManifest(mods, targetMcVersion, targetLoader);
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    saveAs(blob, `modpack-manifest-${targetLoader}-${targetMcVersion}.json`);
    showToast('success', 'Manifest exported', 'Saved modpack manifest JSON');
  }, [mods]);

  // Import Manifest
  const importManifest = useCallback((jsonString: string) => {
    const parsed = parseModpackManifest(jsonString);
    if (!parsed) {
      showToast('error', 'Invalid manifest', 'The JSON file could not be parsed');
      return null;
    }

    const importedMods: ModFile[] = parsed.mods.map(m => ({
      id: Math.random().toString(36).substring(2, 9),
      name: m.name,
      projectId: m.projectId,
      versionNumber: m.versionNumber,
      fileName: m.fileName,
      sha1: m.sha1,
      isPinned: m.isPinned,
      customLoader: m.customLoader,
      customVersion: m.customVersion,
      status: 'pending',
      source: m.source || 'modrinth',
    }));

    setMods(importedMods);
    showToast('success', 'Manifest loaded', `Loaded ${importedMods.length} mods from manifest`);
    return parsed;
  }, []);

  // Load mods from a profile
  const loadProfileMods = useCallback((profileMods: Array<{
    name: string;
    projectId?: string;
    fileName?: string;
    isPinned?: boolean;
    customLoader?: ModLoader;
    customVersion?: string;
  }>) => {
    const loaded: ModFile[] = profileMods.map(m => ({
      id: Math.random().toString(36).substring(2, 9),
      name: m.name,
      projectId: m.projectId,
      fileName: m.fileName,
      isPinned: m.isPinned,
      customLoader: m.customLoader,
      customVersion: m.customVersion,
      status: 'pending',
    }));
    setMods(loaded);
  }, []);

  // All installed project IDs for fast lookups
  const allProjectIds = useMemo(() => {
    return mods.map(m => m.projectId).filter(Boolean) as string[];
  }, [mods]);

  return {
    mods,
    setMods,
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
  };
};
