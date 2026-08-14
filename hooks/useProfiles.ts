import { useState, useEffect, useCallback } from 'react';
import { ModpackProfile, ModLoader, ModFile } from '../types';
import { storage } from '../utils/storage';

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<ModpackProfile[]>(() => {
    return storage.get<ModpackProfile[]>('profiles', []);
  });

  const [activeProfileId, setActiveProfileId] = useState<string | null>(() => {
    return storage.get<string | null>('activeProfileId', null);
  });

  useEffect(() => {
    storage.set('profiles', profiles);
  }, [profiles]);

  useEffect(() => {
    storage.set('activeProfileId', activeProfileId);
  }, [activeProfileId]);

  // Save or update active profile with mods
  const saveProfile = useCallback((
    name: string,
    mcVersion: string,
    loader: ModLoader,
    versionType: 'release' | 'snapshot',
    mods: ModFile[],
    targetProfileId?: string
  ): ModpackProfile => {
    const idToUpdate = targetProfileId || activeProfileId;
    const existingIndex = profiles.findIndex(p => p.id === idToUpdate);
    const modEntries = mods.map(m => ({
      name: m.name,
      projectId: m.projectId,
      fileName: m.fileName || m.originalFile?.name,
      isPinned: m.isPinned,
      customLoader: m.customLoader,
      customVersion: m.customVersion,
    }));

    if (existingIndex >= 0 && idToUpdate) {
      const updated: ModpackProfile = {
        ...profiles[existingIndex],
        name: name || profiles[existingIndex].name,
        mcVersion,
        loader,
        versionType,
        mods: modEntries,
        updatedAt: Date.now(),
      };
      setProfiles(prev => {
        const next = [...prev];
        next[existingIndex] = updated;
        return next;
      });
      return updated;
    } else {
      const newProfile: ModpackProfile = {
        id: Math.random().toString(36).substring(2, 9),
        name: name || 'Untitled Modpack',
        mcVersion,
        loader,
        versionType,
        mods: modEntries,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setProfiles(prev => [newProfile, ...prev]);
      setActiveProfileId(newProfile.id);
      return newProfile;
    }
  }, [activeProfileId, profiles]);

  // Create a brand new profile
  const createNewProfile = useCallback((
    name: string,
    mcVersion: string,
    loader: ModLoader,
    versionType: 'release' | 'snapshot',
    mods: ModFile[] = []
  ): ModpackProfile => {
    const newProfile: ModpackProfile = {
      id: Math.random().toString(36).substring(2, 9),
      name: name || 'Untitled Modpack',
      mcVersion,
      loader,
      versionType,
      mods: mods.map(m => ({
        name: m.name,
        projectId: m.projectId,
        fileName: m.fileName || m.originalFile?.name,
        isPinned: m.isPinned,
        customLoader: m.customLoader,
        customVersion: m.customVersion,
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProfiles(prev => [newProfile, ...prev]);
    setActiveProfileId(newProfile.id);
    return newProfile;
  }, []);

  // Update profile metadata and contents directly
  const updateProfile = useCallback((
    id: string,
    updates: Partial<ModpackProfile>
  ) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...updates,
          updatedAt: Date.now(),
        };
      }
      return p;
    }));
  }, []);

  // Duplicate an existing profile
  const duplicateProfile = useCallback((id: string): ModpackProfile | null => {
    const source = profiles.find(p => p.id === id);
    if (!source) return null;

    const cloned: ModpackProfile = {
      ...source,
      id: Math.random().toString(36).substring(2, 9),
      name: `${source.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setProfiles(prev => [cloned, ...prev]);
    return cloned;
  }, [profiles]);

  // Delete a profile
  const deleteProfile = useCallback((id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    if (activeProfileId === id) {
      setActiveProfileId(null);
    }
  }, [activeProfileId]);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || null;

  return {
    profiles,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    saveProfile,
    createNewProfile,
    updateProfile,
    duplicateProfile,
    deleteProfile,
  };
};
