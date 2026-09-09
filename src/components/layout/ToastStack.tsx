import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ToastStack: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0">
      {toasts.map(t => (
        <div
          key={t.id}
          role="alert"
          className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-soft-lg text-sm
            ${t.tone === 'error'
              ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-900 dark:text-red-200'
              : 'bg-heritage-green-50 border-heritage-green-200 text-heritage-green-800 dark:bg-heritage-dark-card dark:border-heritage-dark-border dark:text-heritage-dark-text'
            }`}
        >
          {t.tone === 'error'
            ? <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            : <CheckCircle2 size={16} className="shrink-0 mt-0.5" />}
          <p className="flex-1 leading-snug">{t.message}</p>
          <button onClick={() => dismissToast(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
};
