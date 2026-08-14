/**
 * Type-safe, namespaced localStorage utility for MC Mod Updater
 */
const PREFIX = 'mcmodupdater:';

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(`${PREFIX}${key}`);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn(`Failed to read key ${key} from storage:`, e);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn(`Failed to save key ${key} to storage:`, e);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(`${PREFIX}${key}`);
    } catch (e) {
      console.warn(`Failed to remove key ${key} from storage:`, e);
    }
  }
};
