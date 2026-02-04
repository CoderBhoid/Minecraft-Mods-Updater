import { ModrinthSearchResult, ModrinthVersion, ModrinthGameVersion, ModrinthProject } from '../types';

const BASE_URL = 'https://api.modrinth.com/v2';

// Rate limiting helper: simple delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const searchMod = async (query: string, loader?: string): Promise<ModrinthSearchResult> => {
  let url = `${BASE_URL}/search?query=${encodeURIComponent(query)}&limit=1`;
  
  if (loader) {
    // Filter by loader category. 
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

export const getVersionByHash = async (hash: string): Promise<ModrinthVersion | null> => {
  try {
    const res = await fetch(`${BASE_URL}/version_file/${hash}`);
    if (!res.ok) return null; // 404 means file not found
    return await res.json();
  } catch (e) {
    return null;
  }
};

export const getProject = async (projectId: string): Promise<ModrinthProject> => {
  const res = await fetch(`${BASE_URL}/project/${projectId}`);
  if (!res.ok) throw new Error('Failed to fetch project');
  return res.json();
};

export const getLatestVersion = async (
  projectId: string, 
  loaders: string[], 
  gameVersions: string[]
): Promise<ModrinthVersion | null> => {
  // Modrinth expects JSON arrays in query params: loaders=["fabric"]
  const loadersParam = JSON.stringify(loaders);
  const versionsParam = JSON.stringify(gameVersions);
  
  const url = `${BASE_URL}/project/${projectId}/version?loaders=${encodeURIComponent(loadersParam)}&game_versions=${encodeURIComponent(versionsParam)}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error('Version check failed');
  
  const versions: ModrinthVersion[] = await res.json();
  return versions.length > 0 ? versions[0] : null;
};

export const getGameVersions = async (): Promise<ModrinthGameVersion[]> => {
  const res = await fetch(`${BASE_URL}/tag/game_version`);
  if (!res.ok) throw new Error('Failed to fetch game versions');
  const data: ModrinthGameVersion[] = await res.json();
  
  // Sort by date descending (newest first)
  return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};