import { ModrinthSearchResult, ModrinthVersion, ModrinthGameVersion, ModrinthProject } from '../types';

const BASE_URL = 'https://api.modrinth.com/v2';

/**
 * Searches Modrinth for a mod matching the query and loader.
 */
export const searchMod = async (query: string, loader?: string): Promise<ModrinthSearchResult> => {
  let url = `${BASE_URL}/search?query=${encodeURIComponent(query)}&limit=1`;
  
  if (loader) {
    // If quilt, we also accept fabric as many fabric mods work on quilt.
    const categories = loader === 'quilt' 
      ? [`categories:${loader}`, 'categories:fabric'] 
      : [`categories:${loader}`];
      
    // Modrinth Facets: [[A, B]] means A OR B
    const facets = JSON.stringify([categories]);
    url += `&facets=${encodeURIComponent(facets)}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
};

/**
 * Looks up version metadata by exact SHA-1 file hash.
 */
export const getVersionByHash = async (hash: string): Promise<ModrinthVersion | null> => {
  try {
    const res = await fetch(`${BASE_URL}/version_file/${hash}`);
    if (!res.ok) return null; // 404 means file not found in Modrinth database
    return await res.json();
  } catch (e) {
    return null;
  }
};

/**
 * Fetches project details by project ID or slug.
 */
export const getProject = async (projectId: string): Promise<ModrinthProject> => {
  const res = await fetch(`${BASE_URL}/project/${projectId}`);
  if (!res.ok) throw new Error('Failed to fetch project');
  return res.json();
};

/**
 * Fetches all available versions for a project with optional loader/gameVersion filters.
 */
export const getProjectVersions = async (
  projectId: string,
  loaders?: string[],
  gameVersions?: string[]
): Promise<ModrinthVersion[]> => {
  try {
    let url = `${BASE_URL}/project/${projectId}/version`;
    const params: string[] = [];
    if (loaders && loaders.length > 0) {
      params.push(`loaders=${encodeURIComponent(JSON.stringify(loaders))}`);
    }
    if (gameVersions && gameVersions.length > 0) {
      params.push(`game_versions=${encodeURIComponent(JSON.stringify(gameVersions))}`);
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error(`Failed to fetch versions for ${projectId}`, err);
    return [];
  }
};

/**
 * Fetches the latest compatible version for a project.
 */
export const getLatestVersion = async (
  projectId: string, 
  loaders: string[], 
  gameVersions: string[]
): Promise<ModrinthVersion | null> => {
  const versions = await getProjectVersions(projectId, loaders, gameVersions);
  return versions.length > 0 ? versions[0] : null;
};

/**
 * Fetches all official Minecraft release and snapshot tags.
 */
export const getGameVersions = async (): Promise<ModrinthGameVersion[]> => {
  const res = await fetch(`${BASE_URL}/tag/game_version`);
  if (!res.ok) throw new Error('Failed to fetch game versions');
  const data: ModrinthGameVersion[] = await res.json();
  
  // Sort by date descending (newest first)
  return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};