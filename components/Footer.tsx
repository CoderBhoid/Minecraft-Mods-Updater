import React from 'react';

interface FooterProps {
  showInfo: boolean;
}

export const Footer: React.FC<FooterProps> = ({ showInfo }) => {
  return (
    <div className="py-10 border-t border-zinc-900 w-full mt-auto bg-black z-10 relative">
      <div className="px-6 max-w-7xl mx-auto w-full">
        {showInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h4 className="text-white mb-3">About MC Mod Updater</h4>
              <p className="text-sm text-zinc-600 leading-relaxed">
                MC Mod Updater is a client-side utility designed to streamline the process of maintaining Minecraft modpacks.
                Your files are never uploaded to any server, guaranteeing privacy and security.
              </p>
            </div>
            <div>
              <h4 className="text-white mb-3">Powered by Modrinth</h4>
              <p className="text-sm text-zinc-600 leading-relaxed">
                We leverage the open-source Modrinth API to provide the most up-to-date and reliable mod information.
                Support the modding community by downloading mods from their official sources.
              </p>
            </div>
          </div>
        )}
        <div className="text-center text-xs text-zinc-700">
          Made By <span className="text-[#1bd96a] font-medium [text-shadow:_0_0_10px_rgb(27_217_106_/_40%)]">Sednium</span> and Maintained with love by <a href="https://github.com/CoderBhoid" target="_blank" rel="noopener noreferrer" className="text-[#1bd96a] font-medium transition-all [text-shadow:_0_0_10px_rgb(27_217_106_/_40%)] hover:[text-shadow:_0_0_20px_rgb(27_217_106_/_80%)] hover:text-[#1bd96a]">Bhoid</a>
        </div>
      </div>
    </div>
  );
};