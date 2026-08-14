export type ModLoader = 'fabric' | 'forge' | 'neoforge' | 'quilt';

export type ModStatus = 'pending' | 'checking' | 'found' | 'missing' | 'error' | 'up-to-date';

export type ModSource = 'modrinth' | 'curseforge';

export interface MissingDependencyInfo {
  id: string;
  name: string;
  required?: boolean;
  source?: ModSource;
}

export interface ModrinthDependency {
  version_id: string | null;
  project_id: string | null;
  file_name: string | null;
  dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded';
}

export interface ModrinthVersion {
  id: string;
  project_id: string;
  name?: string;
  version_number: string;
  version_type?: 'release' | 'beta' | 'alpha';
  changelog?: string;
  date_published?: string;
  loaders?: string[];
  game_versions?: string[];
  files: {
    url: string;
    filename: string;
    primary: boolean;
    size?: number;
    hashes?: {
      sha1?: string;
      sha512?: string;
    };
  }[];
  dependencies?: ModrinthDependency[];
}

export interface ModFile {
  id: string; // Unique internal ID
  originalFile?: File;
  name: string; // Parsed clean name
  status: ModStatus;
  downloadUrl?: string;
  fileName?: string; // The new filename from server
  iconUrl?: string;
  projectId?: string;
  versionId?: string;
  versionNumber?: string;
  versionType?: 'release' | 'beta' | 'alpha';
  sha1?: string;
  fileSize?: number;
  changelog?: string;
  isPinned?: boolean;
  customLoader?: ModLoader;
  customVersion?: string;
  source?: ModSource;
  availableVersions?: ModrinthVersion[];
  missingDependencies?: MissingDependencyInfo[];
  rawDependencies?: ModrinthDependency[];
}

export interface ModrinthSearchResult {
  hits: {
    project_id: string;
    title: string;
    icon_url: string;
    author: string;
    description?: string;
  }[];
}

export interface ModrinthProject {
  id: string;
  title: string;
  description: string;
  icon_url: string;
}

export interface ModrinthGameVersion {
  version: string;
  version_type: 'release' | 'snapshot' | 'alpha' | 'beta';
  date: string;
  major: boolean;
}

export interface ModpackProfile {
  id: string;
  name: string;
  mcVersion: string;
  loader: ModLoader;
  versionType: 'release' | 'snapshot';
  mods: Array<{
    name: string;
    projectId?: string;
    fileName?: string;
    isPinned?: boolean;
    customLoader?: ModLoader;
    customVersion?: string;
  }>;
  createdAt: number;
  updatedAt: number;
}

export interface ModpackManifest {
  manifestVersion: number;
  name: string;
  targetMcVersion: string;
  targetLoader: ModLoader;
  exportedAt: string;
  mods: Array<{
    name: string;
    projectId?: string;
    versionNumber?: string;
    fileName?: string;
    sha1?: string;
    isPinned?: boolean;
    customLoader?: ModLoader;
    customVersion?: string;
    source?: ModSource;
  }>;
}

export interface BatchProgress {
  total: number;
  current: number;
  currentModName: string;
  phase: 'idle' | 'hashing' | 'identifying' | 'resolving' | 'downloading' | 'syncing';
  percent: number;
}

export type SortOption = 'status' | 'name-asc' | 'name-desc' | 'size-desc';

export type FilterStatus = 'all' | 'found' | 'up-to-date' | 'missing' | 'error' | 'pinned';