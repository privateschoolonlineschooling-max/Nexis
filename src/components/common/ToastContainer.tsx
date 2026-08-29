import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl shadow-lg border text-xs font-medium backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200 ${
              isSuccess
                ? 'bg-white/95 dark:bg-neutral-900/95 border-emerald-500/40 text-gray-900 dark:text-neutral-100 shadow-emerald-500/10'
                : isError
                ? 'bg-white/95 dark:bg-neutral-900/95 border-red-500/40 text-gray-900 dark:text-neutral-100 shadow-red-500/10'
                : isWarning
                ? 'bg-white/95 dark:bg-neutral-900/95 border-amber-500/40 text-gray-900 dark:text-neutral-100 shadow-amber-500/10'
                : 'bg-white/95 dark:bg-neutral-900/95 border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-neutral-100'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
              {isError && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-4 h-4 text-blue-500 shrink-0" />}
              <span className="truncate">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
