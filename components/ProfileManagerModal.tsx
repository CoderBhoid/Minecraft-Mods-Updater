import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import saveAs from 'file-saver';
import { 
  X, Layers, Plus, Trash2, Check, Download, FolderArchive, 
  ArrowRight, Edit3, Copy, Save, Pin, Package, Share2, 
  FileText, ExternalLink, Link2, Sparkles
} from 'lucide-react';
import { ModpackProfile, ModLoader, ModFile } from '../types';
import { Button } from './Button';
import { showToast } from '../hooks/useToast';
import { LOADERS, MC_RELEASES } from '../constants';
import { 
  formatProfileModListText, 
  generateProfileShareUrl 
} from '../utils/fileHelpers';

interface ProfileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: ModpackProfile[];
  activeProfileId: string | null;
  onSelectProfile: (profile: ModpackProfile) => void;
  onSaveCurrentAsProfile: (name: string, targetProfileId?: string) => void;
  onUpdateProfile?: (id: string, updates: Partial<ModpackProfile>) => void;
  onDuplicateProfile?: (id: string) => void;
  onDeleteProfile: (id: string) => void;
  currentMods: ModFile[];
  currentLoader: ModLoader;
  currentMcVersion: string;
}

export const ProfileManagerModal: React.FC<ProfileManagerModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSelectProfile,
  onSaveCurrentAsProfile,
  onUpdateProfile,
  onDuplicateProfile,
  onDeleteProfile,
  currentMods,
  currentLoader,
  currentMcVersion,
}) => {
  const [newProfileName, setNewProfileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [sharingProfile, setSharingProfile] = useState<ModpackProfile | null>(null);
  const [copyFormatMenuId, setCopyFormatMenuId] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editLoader, setEditLoader] = useState<ModLoader>('fabric');
  const [editMcVersion, setEditMcVersion] = useState('1.21.4');
  const [editMods, setEditMods] = useState<ModpackProfile['mods']>([]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    onSaveCurrentAsProfile(newProfileName.trim());
    setNewProfileName('');
    setIsCreating(false);
    showToast('success', 'Profile created', `Saved profile "${newProfileName.trim()}"`);
  };

  const handleStartEdit = (profile: ModpackProfile) => {
    if (editingProfileId === profile.id) {
      setEditingProfileId(null);
      return;
    }
    setEditingProfileId(profile.id);
    setEditName(profile.name);
    setEditLoader(profile.loader);
    setEditMcVersion(profile.mcVersion);
    setEditMods([...profile.mods]);
  };

  const handleSaveEdit = (profileId: string) => {
    if (!editName.trim()) return;
    onUpdateProfile?.(profileId, {
      name: editName.trim(),
      loader: editLoader,
      mcVersion: editMcVersion,
      mods: editMods,
    });
    setEditingProfileId(null);
    showToast('success', 'Profile updated', `Saved changes to "${editName.trim()}"`);
  };

  const handleRemoveModFromEdit = (index: number) => {
    setEditMods(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleTogglePinModInEdit = (index: number) => {
    setEditMods(prev => prev.map((m, idx) => idx === index ? { ...m, isPinned: !m.isPinned } : m));
  };

  const handleDownloadProfile = (profile: ModpackProfile) => {
    const manifestData = {
      manifestVersion: 1,
      name: profile.name,
      targetMcVersion: profile.mcVersion,
      targetLoader: profile.loader,
      exportedAt: new Date().toISOString(),
      mods: profile.mods,
    };
    const blob = new Blob([JSON.stringify(manifestData, null, 2)], { type: 'application/json' });
    const safeName = profile.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    saveAs(blob, `profile-${safeName}-${profile.loader}-${profile.mcVersion}.json`);
    showToast('success', 'Profile downloaded', `Exported "${profile.name}" JSON manifest`);
  };

  const handleCopyProfileList = (profile: ModpackProfile, format: 'plain' | 'markdown' | 'discord') => {
    const text = formatProfileModListText(profile, format);
    navigator.clipboard.writeText(text);
    showToast('success', 'Copied mod list', `Copied as ${format.toUpperCase()}`);
    setCopyFormatMenuId(null);
  };

  const handleCopyShareLink = (profile: ModpackProfile) => {
    const link = generateProfileShareUrl(profile);
    if (link) {
      navigator.clipboard.writeText(link);
      showToast('success', 'Share link copied', 'Anyone opening this link can import this modpack profile!');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#1bd96a]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Modpack Profile Manager</h3>
                <p className="text-xs text-zinc-500">
                  Open, edit, download, share, and manage your modpack profiles
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            {/* Quick Save Current Session */}
            {isCreating ? (
              <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-zinc-900/60 border border-[#1bd96a]/40 space-y-3 shadow-sm">
                <h4 className="text-xs font-bold text-white">Save Current Setup as New Profile</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 1.21.4 Performance Pack"
                    value={newProfileName}
                    onChange={e => setNewProfileName(e.target.value)}
                    autoFocus
                    className="flex-1 px-4 py-2.5 text-xs bg-zinc-950 border border-zinc-700 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#1bd96a]"
                  />
                  <Button type="submit" variant="primary" className="w-auto px-4 py-2 text-xs rounded-2xl">
                    Save Profile
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-auto px-3 py-2 text-xs rounded-2xl"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </Button>
                </div>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Captures {currentMods.length} mods • {currentLoader.toUpperCase()} {currentMcVersion}
                </p>
              </form>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800">
                <div>
                  <h4 className="text-xs font-bold text-white">Current Session</h4>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    {currentMods.length} mods loaded • {currentLoader.toUpperCase()} {currentMcVersion}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-auto px-3.5 py-1.5 text-xs border-zinc-700 hover:border-[#1bd96a] rounded-2xl"
                  onClick={() => setIsCreating(true)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Save Current Session
                </Button>
              </div>
            )}

            {/* Profile List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Saved Profiles ({profiles.length})
                </h4>
              </div>

              {profiles.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-zinc-800 rounded-2xl p-6">
                  <FolderArchive className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400 font-bold">No saved profiles yet</p>
                  <p className="text-[11px] text-zinc-500 mt-1 max-w-sm mx-auto">
                    Save your current modpack to easily switch between setups, download manifests, or share with friends!
                  </p>
                </div>
              ) : (
                profiles.map(profile => {
                  const isActive = profile.id === activeProfileId;
                  const isEditing = profile.id === editingProfileId;
                  const showCopyMenu = copyFormatMenuId === profile.id;

                  return (
                    <div
                      key={profile.id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isActive
                          ? 'bg-[#1bd96a]/5 border-[#1bd96a]/40 shadow-[0_0_20px_-5px_rgba(27,217,106,0.15)]'
                          : 'bg-zinc-900/20 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {/* Main Profile Header Bar */}
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white truncate">{profile.name}</h4>
                          <p className="text-[11px] text-zinc-400 font-mono mt-1">
                            {profile.loader.toUpperCase()} • {profile.mcVersion} • {profile.mods.length} mods
                          </p>
                          <p className="text-[10px] text-zinc-600 mt-0.5">
                            Last edited: {new Date(profile.updatedAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Actions Area */}
                        <div className="flex flex-col items-stretch sm:w-56 shrink-0 gap-2">
                          {/* Load / Active button */}
                          <Button
                            variant={isActive ? 'secondary' : 'primary'}
                            className="w-full py-2 text-xs rounded-2xl"
                            onClick={() => {
                              onSelectProfile(profile);
                              onClose();
                            }}
                            icon={isActive ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                          >
                            {isActive ? 'Active' : 'Open & Load'}
                          </Button>

                          {/* Action Icons Centered Below */}
                          <div className="flex items-center justify-center gap-2 w-full pt-0.5">
                            {/* Share Profile button */}
                            <button
                              onClick={() => setSharingProfile(profile)}
                              className="p-1.5 text-zinc-400 hover:text-indigo-400 rounded-xl hover:bg-zinc-800 transition-colors"
                              title="Share profile with a link or JSON code"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Download JSON Manifest button */}
                            <button
                              onClick={() => handleDownloadProfile(profile)}
                              className="p-1.5 text-zinc-400 hover:text-cyan-400 rounded-xl hover:bg-zinc-800 transition-colors"
                              title="Download profile as JSON manifest"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Copy Mod List dropdown */}
                            <div className="relative">
                              <button
                                onClick={() => setCopyFormatMenuId(showCopyMenu ? null : profile.id)}
                                className="p-1.5 text-zinc-400 hover:text-[#1bd96a] rounded-xl hover:bg-zinc-800 transition-colors"
                                title="Copy profile mod list as text"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>

                              {showCopyMenu && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setCopyFormatMenuId(null)} />
                                  <div className="absolute right-0 mt-1 w-44 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 text-xs">
                                    <button
                                      onClick={() => handleCopyProfileList(profile, 'markdown')}
                                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-zinc-900 text-zinc-300 hover:text-white"
                                    >
                                      Markdown Table
                                    </button>
                                    <button
                                      onClick={() => handleCopyProfileList(profile, 'discord')}
                                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-zinc-900 text-zinc-300 hover:text-white"
                                    >
                                      Discord Format
                                    </button>
                                    <button
                                      onClick={() => handleCopyProfileList(profile, 'plain')}
                                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-zinc-900 text-zinc-300 hover:text-white"
                                    >
                                      Plain Text
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Overwrite / Sync button */}
                            <button
                              onClick={() => {
                                onSaveCurrentAsProfile(profile.name, profile.id);
                                showToast('success', 'Profile overwritten', `Synced current mods into "${profile.name}"`);
                              }}
                              className="p-1.5 text-zinc-400 hover:text-[#1bd96a] rounded-xl hover:bg-zinc-800 transition-colors"
                              title="Overwrite this profile with current session mods"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit inline toggle */}
                            <button
                              onClick={() => handleStartEdit(profile)}
                              className={`p-1.5 rounded-xl transition-colors ${
                                isEditing
                                ? 'text-[#1bd96a] bg-zinc-800'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                              }`}
                              title="Edit profile name, settings, and mod list"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Duplicate button */}
                            {onDuplicateProfile && (
                              <button
                                onClick={() => {
                                  onDuplicateProfile(profile.id);
                                  showToast('success', 'Profile cloned', `Created duplicate of "${profile.name}"`);
                                }}
                                className="p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
                                title="Duplicate profile"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete button */}
                            <button
                              onClick={() => {
                                if (confirm(`Delete profile "${profile.name}"?`)) {
                                  onDeleteProfile(profile.id);
                                  showToast('info', 'Profile deleted', `Deleted "${profile.name}"`);
                                }
                              }}
                              className="p-1.5 text-zinc-500 hover:text-red-400 rounded-xl hover:bg-zinc-800 transition-colors"
                              title="Delete profile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Edit Drawer */}
                      {isEditing && (
                        <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 space-y-4">
                          <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5 text-[#1bd96a]" />
                            Editing Profile: {profile.name}
                          </h5>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[10px] text-zinc-400 font-medium">Profile Name</label>
                              <input
                                type="text"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                className="w-full mt-1 px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded-xl text-white outline-none focus:border-[#1bd96a]"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-zinc-400 font-medium">Mod Loader</label>
                              <select
                                value={editLoader}
                                onChange={e => setEditLoader(e.target.value as ModLoader)}
                                className="w-full mt-1 px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded-xl text-white outline-none focus:border-[#1bd96a]"
                              >
                                {LOADERS.map(l => (
                                  <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] text-zinc-400 font-medium">Game Version</label>
                              <select
                                value={editMcVersion}
                                onChange={e => setEditMcVersion(e.target.value)}
                                className="w-full mt-1 px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded-xl text-white outline-none focus:border-[#1bd96a]"
                              >
                                {MC_RELEASES.map(v => (
                                  <option key={v} value={v}>{v}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Mods in Profile */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-[10px] text-zinc-400 font-medium">
                                Mods in this Profile ({editMods.length})
                              </label>
                            </div>

                            <div className="max-h-40 overflow-y-auto custom-scrollbar border border-zinc-800 rounded-2xl p-2 space-y-1 bg-zinc-900/40">
                              {editMods.length === 0 ? (
                                <p className="text-[11px] text-zinc-500 text-center py-3">No mods in this profile.</p>
                              ) : (
                                editMods.map((modItem, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <Package className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                      <span className="text-zinc-300 font-mono text-[11px] truncate">{modItem.name}</span>
                                      {modItem.isPinned && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                                          Pinned
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => handleTogglePinModInEdit(idx)}
                                        className={`p-1 rounded-lg transition-colors ${
                                          modItem.isPinned ? 'text-amber-400' : 'text-zinc-500 hover:text-amber-400'
                                        }`}
                                        title={modItem.isPinned ? 'Unpin' : 'Pin'}
                                      >
                                        <Pin className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleRemoveModFromEdit(idx)}
                                        className="p-1 text-zinc-500 hover:text-red-400 rounded-lg transition-colors"
                                        title="Remove from profile"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Save Edit Actions */}
                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              variant="ghost"
                              className="w-auto px-4 py-1.5 text-xs rounded-2xl"
                              onClick={() => setEditingProfileId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="primary"
                              className="w-auto px-5 py-1.5 text-xs rounded-2xl"
                              onClick={() => handleSaveEdit(profile.id)}
                              icon={<Save className="w-3.5 h-3.5" />}
                            >
                              Save Profile Changes
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 flex justify-end">
            <Button variant="secondary" className="w-auto px-5 py-2 text-xs rounded-2xl" onClick={onClose}>
              Close
            </Button>
          </div>
        </motion.div>

        {/* Share Profile Modal Sub-dialog */}
        {sharingProfile && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSharingProfile(null)} />
            <div className="relative w-full max-w-md p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Share2 className="w-5 h-5" />
                  <h4 className="text-sm font-bold text-white">Share Modpack Profile</h4>
                </div>
                <button
                  onClick={() => setSharingProfile(null)}
                  className="p-1 text-zinc-500 hover:text-white rounded-full hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <h5 className="text-xs font-bold text-white">{sharingProfile.name}</h5>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {sharingProfile.loader.toUpperCase()} • {sharingProfile.mcVersion} • {sharingProfile.mods.length} mods
                </p>
              </div>

              {/* Share link input */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                  <Link2 className="w-3 h-3 text-[#1bd96a]" />
                  Direct Web Import Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generateProfileShareUrl(sharingProfile)}
                    className="flex-1 px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 font-mono truncate select-all outline-none"
                  />
                  <Button
                    variant="primary"
                    className="w-auto px-3.5 py-1.5 text-xs rounded-xl"
                    onClick={() => handleCopyShareLink(sharingProfile)}
                  >
                    Copy Link
                  </Button>
                </div>
                <p className="text-[10px] text-zinc-500">
                  Anyone who visits this link will be prompted to import and load this modpack!
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
                <Button
                  variant="outline"
                  className="text-xs py-2 rounded-xl"
                  onClick={() => {
                    handleDownloadProfile(sharingProfile);
                    setSharingProfile(null);
                  }}
                  icon={<Download className="w-3.5 h-3.5 text-cyan-400" />}
                >
                  Download JSON
                </Button>
                <Button
                  variant="outline"
                  className="text-xs py-2 rounded-xl"
                  onClick={() => {
                    handleCopyProfileList(sharingProfile, 'markdown');
                    setSharingProfile(null);
                  }}
                  icon={<FileText className="w-3.5 h-3.5 text-[#1bd96a]" />}
                >
                  Copy Mod List
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
