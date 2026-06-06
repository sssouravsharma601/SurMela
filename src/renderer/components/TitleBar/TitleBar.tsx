import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const isMac = navigator.platform.toLowerCase().includes('mac');

  useEffect(() => {
    window.electronAPI?.window.isMaximized().then(setIsMaximized);
  }, []);

  const handleMaximize = async () => {
    await window.electronAPI?.window.maximize();
    const max = await window.electronAPI?.window.isMaximized();
    setIsMaximized(max ?? false);
  };

  if (isMac) {
    return (
      <div className="drag-region h-10 flex items-center px-4 bg-surface-800 border-b border-white/5 flex-shrink-0">
        <div className="no-drag w-14" />
        <span className="text-sm font-semibold text-white/60 mx-auto">SurMela</span>
      </div>
    );
  }

  return (
    <div className="drag-region h-10 flex items-center bg-surface-800 border-b border-white/5 flex-shrink-0">
      <div className="flex items-center gap-2 px-4">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center">
          <span className="text-xs font-bold">S</span>
        </div>
        <span className="text-sm font-semibold text-white/80">SurMela</span>
      </div>
      <div className="no-drag ml-auto flex">
        <button
          onClick={() => window.electronAPI?.window.minimize()}
          className="w-12 h-10 flex items-center justify-center hover:bg-white/10 transition-colors"
          title="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          className="w-12 h-10 flex items-center justify-center hover:bg-white/10 transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? <Square size={12} /> : <Maximize2 size={12} />}
        </button>
        <button
          onClick={() => window.electronAPI?.window.close()}
          className="w-12 h-10 flex items-center justify-center hover:bg-red-500 transition-colors"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
