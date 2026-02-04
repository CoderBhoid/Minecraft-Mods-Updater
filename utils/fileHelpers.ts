export const cleanModName = (fileName: string): string => {
  return fileName
    .replace('.jar', '')
    // Remove version numbers (v1.0.0, 1.20.1, etc)
    .replace(/[-_]v?\d+(\.\d+)*.*/, '')
    // Remove common separators
    .replace(/[-_]/g, ' ')
    // Remove brackets
    .replace(/[\[\]\(\)]/g, '')
    .trim();
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const computeSHA1 = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};