import React from 'react';
import { 
  Search, ShieldCheck, Download, HardDrive, Layers, FolderOpen, 
  Sparkles, ArrowRight, Zap 
} from 'lucide-react';
import { Button } from './Button';

interface LandingPageProps {
  onSelectFolder?: () => void;
  onOpenProfiles?: () => void;
  onBrowseFiles?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectFolder,
  onOpenProfiles,
  onBrowseFiles,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-12 max-w-6xl mx-auto w-full animate-in fade-in duration-700 space-y-12">
      {/* Hero Welcome Banner */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 font-mono mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#1bd96a]" />
          <span>Next-Gen Minecraft Mod Maintenance</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
          Keep Your Modpacks <span className="text-[#1bd96a] [text-shadow:_0_0_20px_rgb(27_217_106_/_40%)]">Updated</span> & Clean
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Drop your mods folder or individual `.jar` files to automatically check for updates across Modrinth & CurseForge, resolve missing dependencies, and download everything in one click.
        </p>

        {/* Quick CTAs on Landing */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onBrowseFiles && (
            <Button
              variant="primary"
              className="w-auto px-6 py-3 text-xs"
              onClick={onBrowseFiles}
              icon={<FolderOpen className="w-4 h-4" />}
            >
              Select JAR Files
            </Button>
          )}

          {onSelectFolder && (
            <Button
              variant="outline"
              className="w-auto px-5 py-3 text-xs border-zinc-800 hover:border-[#1bd96a]"
              onClick={onSelectFolder}
              icon={<HardDrive className="w-4 h-4 text-[#1bd96a]" />}
            >
              Link Mods Folder
            </Button>
          )}

          {onOpenProfiles && (
            <Button
              variant="secondary"
              className="w-auto px-5 py-3 text-xs"
              onClick={onOpenProfiles}
              icon={<Layers className="w-4 h-4 text-purple-400" />}
            >
              Modpack Profiles
            </Button>
          )}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full text-left">
        <div className="space-y-3.5 p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/60 hover:border-[#1bd96a]/40 transition-all duration-300 group backdrop-blur-sm">
          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 group-hover:border-[#1bd96a]/50 transition-colors shadow-inner">
            <Search className="w-6 h-6 text-[#1bd96a]" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-[#1bd96a] transition-colors">
            Smart Dual-Source Scanning
          </h3>
          <p className="text-zinc-400 leading-relaxed text-xs">
            Combines client-side SHA-1 hash verification with smart name matching across Modrinth API v2 and CurseForge.
          </p>
        </div>

        <div className="space-y-3.5 p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/60 hover:border-[#1bd96a]/40 transition-all duration-300 group backdrop-blur-sm">
          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 group-hover:border-[#1bd96a]/50 transition-colors shadow-inner">
            <ShieldCheck className="w-6 h-6 text-[#1bd96a]" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-[#1bd96a] transition-colors">
            Dependency Resolver
          </h3>
          <p className="text-zinc-400 leading-relaxed text-xs">
            Automatically maps and warns about missing library requirements before you launch the game, with one-click resolution.
          </p>
        </div>

        <div className="space-y-3.5 p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/60 hover:border-[#1bd96a]/40 transition-all duration-300 group md:col-span-2 lg:col-span-1 backdrop-blur-sm">
          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800 group-hover:border-[#1bd96a]/50 transition-colors shadow-inner">
            <Download className="w-6 h-6 text-[#1bd96a]" />
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-[#1bd96a] transition-colors">
            Bulk Bundles & Direct Sync
          </h3>
          <p className="text-zinc-400 leading-relaxed text-xs">
            Download your entire updated modpack as a zipped archive, or sync directly to disk with the File System Access API.
          </p>
        </div>
      </div>
    </div>
  );
};