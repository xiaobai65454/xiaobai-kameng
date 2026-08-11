'use client';

import { useState, useCallback } from 'react';

interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface UseToastReturn {
  toast: (props: Toast) => void;
  toasts: Toast[];
  dismiss: () => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: Toast) => {
    const newToast = { title, description, variant };
    setToasts((prev) => [...prev, newToast]);
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
  }, []);

  const dismiss = useCallback(() => {
    setToasts([]);
  }, []);

  return { toast, toasts, dismiss };
}
