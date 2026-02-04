import React from 'react';
import { Search, ShieldCheck, Download } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col px-6 py-12 max-w-6xl mx-auto w-full animate-in fade-in duration-700">

      {/* SEO Features Grid - Centered vertically in available space */}
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full text-left">
          <div className="space-y-4 p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 hover:border-[#1bd96a]/30 transition-colors group">
            <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800 group-hover:border-[#1bd96a]/50 transition-colors">
              <Search className="w-6 h-6 text-[#1bd96a]" />
            </div>
            <h3 className="text-xl text-white group-hover:text-[#1bd96a] transition-colors">Smart Detection</h3>
            <p className="text-zinc-500 leading-relaxed text-sm">
              We use SHA1 hash matching to instantly identify your exact mod versions against the Modrinth database with 100% accuracy.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 hover:border-[#1bd96a]/30 transition-colors group">
            <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800 group-hover:border-[#1bd96a]/50 transition-colors">
              <ShieldCheck className="w-6 h-6 text-[#1bd96a]" />
            </div>
            <h3 className="text-xl text-white group-hover:text-[#1bd96a] transition-colors">Dependency Resolver</h3>
            <p className="text-zinc-500 leading-relaxed text-sm">
              Our intelligent scanner identifies missing required libraries and APIs, alerting you before you launch the game.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-2xl bg-zinc-900/20 border border-zinc-800/50 hover:border-[#1bd96a]/30 transition-colors group md:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-800 group-hover:border-[#1bd96a]/50 transition-colors">
              <Download className="w-6 h-6 text-[#1bd96a]" />
            </div>
            <h3 className="text-xl text-white group-hover:text-[#1bd96a] transition-colors">Bulk Updates</h3>
            <p className="text-zinc-500 leading-relaxed text-sm">
              Update your entire modpack in seconds. Download all updated jars as a single ZIP file, ready for your mods folder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};