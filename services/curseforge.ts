import { ModLoader, ModrinthSearchResult, ModrinthVersion, ModrinthProject } from '../types';

// Curseforge Minecraft Game ID is 432
const CF_GAME_ID = 432;
// Public proxy / Direct API endpoint with fallback
const CF_API_BASE = 'https://api.curseforge.com/v1';

// Modloader type mapping for CurseForge:
// 1 = Any, 4 = Fabric, 1 = Forge, 5 = NeoForge, 6 = Quilt
export const mapLoaderToCurseForge = (loader?: string): number => {
  switch (loader?.toLowerCase()) {
    case 'forge': return 1;
    case 'fabric': return 4;
    case 'quilt': return 5;
    case 'neoforge': return 6;
    default: return 0;
  }
};

/**
 * Searches CurseForge for a mod by query string and mod loader.
 * Returns in ModrinthSearchResult format for transparent fallback.
 */
export const searchMod = async (query: string, loader?: string): Promise<ModrinthSearchResult> => {
  try {
    const modLoaderType = mapLoaderToCurseForge(loader);
    let url = `https://api.curseforge.com/v1/mods/search?gameId=${CF_GAME_ID}&searchFilter=${encodeURIComponent(query)}&pageSize=3`;
    if (modLoaderType > 0) {
      url += `&modLoaderType=${modLoaderType}`;
    }

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!res.ok) {
      return { hits: [] };
    }

    const json = await res.json();
    const hits = (json.data || []).map((item: any) => ({
      project_id: String(item.id),
      title: item.name || query,
      icon_url: item.logo?.url || item.logo?.thumbnailUrl || '',
      author: item.authors?.[0]?.name || 'Unknown',
      description: item.summary || ''
    }));

    return { hits };
  } catch (error) {
    return { hits: [] };
  }
};

/**
 * Looks up version by fingerprint/hash if available
 */
export const getVersionByHash = async (_hash: string): Promise<ModrinthVersion | null> => {
  return null;
};

/**
 * Fetches mod details from CurseForge by mod ID
 */
export const getProject = async (projectId: string): Promise<ModrinthProject> => {
  try {
    const res = await fetch(`${CF_API_BASE}/mods/${projectId}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      throw new Error(`CurseForge project fetch failed (${res.status})`);
    }

    const json = await res.json();
    const data = json.data;

    return {
      id: String(data.id),
      title: data.name,
      description: data.summary || '',
      icon_url: data.logo?.url || ''
    };
  } catch (error) {
    return {
      id: projectId,
      title: `Mod ${projectId}`,
      description: '',
      icon_url: ''
    };
  }
};

/**
 * Fetches all available versions for a CurseForge project matching loader & game version
 */
export const getProjectVersions = async (
  projectId: string,
  loaders?: string[],
  gameVersions?: string[]
): Promise<ModrinthVersion[]> => {
  try {
    const loaderName = loaders?.[0]?.toLowerCase() || '';
    const targetMc = gameVersions?.[0];

    const res = await fetch(`${CF_API_BASE}/mods/${projectId}/files?pageSize=20`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) return [];

    const json = await res.json();
    const files: any[] = json.data || [];

    return files
      .filter((file: any) => {
        const gv: string[] = file.gameVersions || [];
        const matchesMc = targetMc ? gv.some(v => v.includes(targetMc)) : true;
        const matchesLoader = loaderName ? gv.some(v => v.toLowerCase().includes(loaderName)) : true;
        return matchesMc && matchesLoader;
      })
      .map((matchedFile: any) => ({
        id: String(matchedFile.id),
        project_id: projectId,
        version_number: matchedFile.displayName || matchedFile.fileName,
        version_type: matchedFile.releaseType === 1 ? 'release' : matchedFile.releaseType === 2 ? 'beta' : 'alpha',
        changelog: matchedFile.changelog || undefined,
        date_published: matchedFile.fileDate,
        files: [
          {
            url: matchedFile.downloadUrl || `https://www.curseforge.com/api/v1/mods/${projectId}/files/${matchedFile.id}/download`,
            filename: matchedFile.fileName,
            primary: true,
            size: matchedFile.fileLength
          }
        ],
        dependencies: []
      }));
  } catch {
    return [];
  }
};

/**
 * Fetches the latest version for a CurseForge project matching loader & game version
 */
export const getLatestVersion = async (
  projectId: string,
  loaders: string[],
  gameVersions: string[]
): Promise<ModrinthVersion | null> => {
  const versions = await getProjectVersions(projectId, loaders, gameVersions);
  return versions.length > 0 ? versions[0] : null;
};
