import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

const ReloadPrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-[200] animate-slide-up w-full max-w-[320px]">
        <div className="bg-slate-800 border border-slate-700 text-white p-4 rounded-xl shadow-2xl flex flex-col gap-3">
            <div className="flex items-start gap-3">
                <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400 shrink-0">
                    <RefreshCw size={20} className="animate-spin-slow" />
                </div>
                <div>
                    <h4 className="font-bold text-sm text-slate-100">Update Available</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        A new version of Shelfie is available. Update to get the latest features.
                    </p>
                </div>
            </div>
            <div className="flex gap-2 mt-1">
                <button 
                    onClick={() => updateServiceWorker(true)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-3 rounded-lg transition-colors shadow-lg shadow-indigo-900/20"
                >
                    Update Now
                </button>
                <button 
                    onClick={close}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold py-2.5 px-3 rounded-lg transition-colors"
                >
                    Dismiss
                </button>
            </div>
        </div>
    </div>
  );
};

export default ReloadPrompt;