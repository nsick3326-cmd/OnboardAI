import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, Sparkles, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, description, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, description, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => addToast({ type: 'success', title, description }),
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) => addToast({ type: 'info', title, description }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string) => addToast({ type: 'warning', title, description }),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) => addToast({ type: 'error', title, description }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, info, warning, error }}>
      {children}
      {/* Toast container floating bottom-right */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const typeConfigs = {
            success: {
              icon: <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />,
              border: 'border-teal-200/80',
              bg: 'bg-white',
              badgeBg: 'bg-teal-50',
              accent: 'bg-[#18B89A]',
            },
            info: {
              icon: <Sparkles className="w-5 h-5 text-[#7655F7] shrink-0" />,
              border: 'border-violet-200/80',
              bg: 'bg-white',
              badgeBg: 'bg-violet-50',
              accent: 'bg-[#7655F7]',
            },
            warning: {
              icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
              border: 'border-amber-200/80',
              bg: 'bg-white',
              badgeBg: 'bg-amber-50',
              accent: 'bg-amber-500',
            },
            error: {
              icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
              border: 'border-rose-200/80',
              bg: 'bg-white',
              badgeBg: 'bg-rose-50',
              accent: 'bg-rose-600',
            },
          };

          const config = typeConfigs[toast.type];

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-dropdown border ${config.border} ${config.bg} backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200 transition-all hover:translate-x-[-2px]`}
            >
              <div className={`p-1.5 rounded-xl ${config.badgeBg}`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs font-bold text-[#17182B] leading-tight">{toast.title}</p>
                {toast.description && (
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                aria-label="Close notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

