import { useState, useEffect, useCallback } from 'react';
import { ModLoader, SortOption, FilterStatus } from '../types';
import { MC_RELEASES } from '../constants';
import { storage } from '../utils/storage';

interface SavedSettings {
  versionType: 'release' | 'snapshot';
  mcVersion: string;
  loader: ModLoader;
  sortBy: SortOption;
  hasCustomVersion?: boolean;
}

const DEFAULT_SETTINGS: SavedSettings = {
  versionType: 'release',
  mcVersion: MC_RELEASES[0],
  loader: 'fabric',
  sortBy: 'status',
  hasCustomVersion: false,
};

export const useModSettings = () => {
  const [settings, setSettings] = useState<SavedSettings>(() => {
    return storage.get<SavedSettings>('settings', DEFAULT_SETTINGS);
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Save settings whenever they change
  useEffect(() => {
    storage.set('settings', settings);
  }, [settings]);

  const setVersionType = useCallback((versionType: 'release' | 'snapshot') => {
    setSettings(prev => ({ ...prev, versionType }));
  }, []);

  const setMcVersion = useCallback((mcVersion: string, isManualChoice = true) => {
    setSettings(prev => ({ 
      ...prev, 
      mcVersion, 
      hasCustomVersion: isManualChoice ? true : prev.hasCustomVersion 
    }));
  }, []);

  const setLoader = useCallback((loader: ModLoader) => {
    setSettings(prev => ({ ...prev, loader }));
  }, []);

  const setSortBy = useCallback((sortBy: SortOption) => {
    setSettings(prev => ({ ...prev, sortBy }));
  }, []);

  return {
    versionType: settings.versionType,
    setVersionType,
    mcVersion: settings.mcVersion,
    hasCustomVersion: Boolean(settings.hasCustomVersion),
    setMcVersion,
    loader: settings.loader,
    setLoader,
    sortBy: settings.sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
  };
};
