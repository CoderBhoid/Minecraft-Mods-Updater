export type ModLoader = 'fabric' | 'forge' | 'neoforge' | 'quilt';

export type ModStatus = 'pending' | 'checking' | 'found' | 'missing' | 'error' | 'up-to-date';

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
  missingDependencies?: { id: string; name: string }[];
}

export interface ModrinthSearchResult {
  hits: {
    project_id: string;
    title: string;
    icon_url: string;
    author: string;
  }[];
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
  version_number: string;
  files: {
    url: string;
    filename: string;
    primary: boolean;
  }[];
  dependencies?: ModrinthDependency[];
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