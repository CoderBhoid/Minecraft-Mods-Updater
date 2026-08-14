import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastItem } from '../hooks/useToast';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-[#1bd96a] shrink-0" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />;
      default: return <Info className="w-5 h-5 text-cyan-400 shrink-0" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-[#1bd96a]/40 shadow-[0_0_20px_-5px_rgba(27,217,106,0.25)]';
      case 'warning': return 'border-yellow-500/40 shadow-[0_0_20px_-5px_rgba(234,179,8,0.25)]';
      case 'error': return 'border-red-500/40 shadow-[0_0_20px_-5px_rgba(239,68,68,0.25)]';
      default: return 'border-zinc-700 shadow-lg';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-zinc-950/95 backdrop-blur-md border ${getBorderColor(toast.type)} text-left`}
          >
            {getIcon(toast.type)}
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-white tracking-wide">{toast.title}</h5>
              {toast.message && (
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed break-words">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 -mr-1 text-zinc-500 hover:text-zinc-300 rounded transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
