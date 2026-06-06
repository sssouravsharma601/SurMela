import React, { useState } from 'react';
import { X, FolderOpen, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface ScanFolderModalProps {
  onClose: () => void;
  onDone: () => void;
}

type State = 'idle' | 'scanning' | 'done' | 'error';

export default function ScanFolderModal({ onClose, onDone }: ScanFolderModalProps) {
  const [state, setState] = useState<State>('idle');
  const [result, setResult] = useState<{ matched: number; unmatched: string[]; total: number } | null>(null);
  const [folderPath, setFolderPath] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const browse = async () => {
    const folder = await window.electronAPI?.dialog.openFolder();
    if (folder) setFolderPath(folder);
  };

  const scan = async () => {
    if (!folderPath) return;
    setState('scanning');
    try {
      const res = await window.electronAPI?.scanner.scanFolder(folderPath);
      if (!res) throw new Error('No result returned');
      setResult(res);
      setState('done');
    } catch (err) {
      setErrorMsg(String(err));
      setState('error');
    }
  };

  const handleDone = () => {
    onDone();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-800 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Scan Music Folder</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <p className="text-sm text-white/50 mb-4">
          Point to a folder containing your downloaded MP3 files. SurMela will automatically match them to songs in your library by filename.
        </p>

        {/* Folder picker */}
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={folderPath}
            onChange={e => setFolderPath(e.target.value)}
            placeholder="Select or paste folder path..."
            className="flex-1 bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-primary-500"
          />
          <button
            onClick={browse}
            className="px-3 py-2 bg-surface-600 hover:bg-surface-500 text-white/70 hover:text-white rounded-lg transition-colors"
          >
            <FolderOpen size={16} />
          </button>
        </div>

        {/* Result */}
        {state === 'scanning' && (
          <div className="flex items-center gap-3 p-4 bg-surface-700 rounded-xl mb-4">
            <Loader size={20} className="text-primary-400 animate-spin" />
            <span className="text-sm text-white/70">Scanning folder and matching songs...</span>
          </div>
        )}

        {state === 'done' && result && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3 p-4 bg-green-900/30 border border-green-500/30 rounded-xl">
              <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">
                  Matched {result.matched} of {result.total} audio files
                </p>
                <p className="text-xs text-white/50 mt-0.5">
                  Matched songs are now linked and ready to play.
                </p>
              </div>
            </div>

            {result.unmatched.length > 0 && (
              <div className="p-4 bg-amber-900/20 border border-amber-500/20 rounded-xl">
                <p className="text-sm text-amber-300 mb-2 font-medium">
                  {result.unmatched.length} files not matched:
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {result.unmatched.map((f, i) => (
                    <p key={i} className="text-xs text-white/40 font-mono truncate">{f}</p>
                  ))}
                </div>
                <p className="text-xs text-white/30 mt-2">
                  Tip: rename files to match song titles, or use "Add file" on individual songs.
                </p>
              </div>
            )}
          </div>
        )}

        {state === 'error' && (
          <div className="flex items-start gap-3 p-4 bg-red-900/30 border border-red-500/30 rounded-xl mb-4">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{errorMsg}</p>
          </div>
        )}

        {/* Naming tips */}
        {state === 'idle' && (
          <div className="p-3 bg-surface-700/60 rounded-lg mb-4">
            <p className="text-xs text-white/40 font-semibold mb-1 uppercase tracking-wider">Filename tips for best matching</p>
            <ul className="text-xs text-white/35 space-y-0.5 list-disc list-inside">
              <li>Name files after the song title: <span className="text-white/50 font-mono">Tum Hi Ho.mp3</span></li>
              <li>Or include singer: <span className="text-white/50 font-mono">Arijit Singh - Tum Hi Ho.mp3</span></li>
              <li>Subfolders are scanned recursively</li>
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-surface-600 text-white/60 hover:text-white transition-colors text-sm">
            {state === 'done' ? 'Close' : 'Cancel'}
          </button>
          {state === 'done' ? (
            <button onClick={handleDone} className="flex-1 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white transition-colors text-sm font-medium">
              Refresh Playlist
            </button>
          ) : (
            <button
              onClick={scan}
              disabled={!folderPath || state === 'scanning'}
              className="flex-1 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {state === 'scanning' ? 'Scanning...' : 'Scan Folder'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
