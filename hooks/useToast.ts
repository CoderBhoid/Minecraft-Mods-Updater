import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

let toastListeners: Array<(toast: ToastItem) => void> = [];

export const showToast = (type: ToastType, title: string, message?: string, duration = 3500) => {
  const toast: ToastItem = {
    id: Math.random().toString(36).substring(2, 9),
    type,
    title,
    message,
    duration,
  };
  toastListeners.forEach(fn => fn(toast));
};

export const useToastManager = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((toast: ToastItem) => {
    setToasts(prev => [...prev, toast]);
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        removeToast(toast.id);
      }, toast.duration);
    }
  }, [removeToast]);

  return { toasts, addToast, removeToast };
};
