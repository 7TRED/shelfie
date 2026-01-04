import React, { useEffect } from 'react';
import { CheckCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300 w-[90%] md:w-auto">
        <div className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 md:min-w-[300px]">
            {type === 'success' ? <CheckCircle className="text-emerald-400 shrink-0" size={20} /> : <Info className="text-blue-400 shrink-0" size={20} />}
            <span className="font-medium text-sm flex-grow truncate">{message}</span>
            <button onClick={onClose} className="text-slate-500 hover:text-white shrink-0"><X size={16} /></button>
        </div>
    </div>
  );
};

export default Toast;
