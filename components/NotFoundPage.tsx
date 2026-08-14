import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Home, ArrowLeft, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from './Button';

interface NotFoundPageProps {
  onGoHome?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onGoHome }) => {
  const handleHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-6 select-none relative overflow-hidden font-sans">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/30 via-black to-black pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto text-center z-10 py-16">
        {/* Glowing Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/40 border border-red-900/60 text-red-400 text-xs font-mono mb-6"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Error 404: Chunk Not Found</span>
        </motion.div>

        {/* 404 Visual Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative mb-6"
        >
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-[0_0_50px_-10px_rgba(239,68,68,0.2)] ring-1 ring-red-500/20">
            <Compass className="w-12 h-12 sm:w-14 sm:h-14 text-red-400 animate-[spin_10s_linear_infinite]" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs text-zinc-400">
            ?
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3"
        >
          Beyond The World Border
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-sm text-zinc-400 leading-relaxed mb-8 max-w-md"
        >
          The coordinates you entered lead into the Void. The page or resource you are looking for has been moved, uninstalled, or never generated.
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto"
        >
          <Button
            variant="primary"
            className="w-full sm:w-auto px-6 py-3 text-xs"
            onClick={handleHome}
            icon={<Home className="w-4 h-4" />}
          >
            Return to Mod Updater
          </Button>

          <Button
            variant="outline"
            className="w-full sm:w-auto px-5 py-3 text-xs border-zinc-800 hover:border-zinc-700"
            onClick={() => window.history.back()}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back
          </Button>
        </motion.div>

        {/* Technical Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-10 p-3 rounded-xl bg-zinc-950/60 border border-zinc-900 text-[11px] font-mono text-zinc-600"
        >
          Location: <span className="text-zinc-400">{typeof window !== 'undefined' ? window.location.pathname : '/404'}</span>
        </motion.div>
      </div>

      {/* Footer Branding */}
      <div className="text-center py-4 text-xs text-zinc-600 z-10">
        MC Mod Updater • Part of <a href="https://sednium.com" className="text-zinc-500 hover:text-[#1bd96a] transition-colors">Sednium</a>
      </div>
    </div>
  );
};
