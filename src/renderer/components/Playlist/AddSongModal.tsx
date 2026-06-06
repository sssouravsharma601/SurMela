import React, { useState } from 'react';
import { X, FolderOpen } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AddSongModalProps {
  playlistId: string;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddSongModal({ playlistId, onClose, onAdded }: AddSongModalProps) {
  const [form, setForm] = useState({
    title: '', singer: '', album: '', year: new Date().getFullYear(),
    genre: 'Bollywood', duration: 0, filePath: '', youtubeUrl: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key: string, value: string | number) => setForm(f => ({ ...f, [key]: value }));

  const browseFile = async () => {
    const files = await window.electronAPI?.dialog.openFile() ?? [];
    if (files.length > 0) set('filePath', files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.singer) return;
    setLoading(true);
    try {
      const song = await window.electronAPI?.songs.insert({
        id: uuidv4(),
        title: form.title,
        singer: form.singer,
        album: form.album,
        year: form.year,
        genre: form.genre,
        duration: form.duration,
        filePath: form.filePath || null,
        artworkPath: null,
        youtubeUrl: form.youtubeUrl || null,
      });
      if (song) {
        await window.electronAPI?.playlists.addSong(playlistId, song.id);
        onAdded();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-800 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Add Song</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'title', label: 'Song Title *', type: 'text', required: true },
            { key: 'singer', label: 'Singer *', type: 'text', required: true },
            { key: 'album', label: 'Album / Movie', type: 'text' },
            { key: 'genre', label: 'Genre', type: 'text' },
            { key: 'year', label: 'Year', type: 'number' },
            { key: 'duration', label: 'Duration (seconds)', type: 'number' },
            { key: 'youtubeUrl', label: 'YouTube URL (optional)', type: 'url' },
          ].map(({ key, label, type, required }) => (
            <div key={key}>
              <label className="block text-xs text-white/50 mb-1">{label}</label>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={e => set(key, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                required={required}
                className="w-full bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-primary-500 transition-colors"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs text-white/50 mb-1">Local File Path</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.filePath}
                onChange={e => set('filePath', e.target.value)}
                placeholder="Select audio file..."
                className="flex-1 bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-primary-500"
              />
              <button
                type="button"
                onClick={browseFile}
                className="px-3 py-2 bg-surface-600 hover:bg-surface-500 text-white/70 hover:text-white rounded-lg transition-colors"
              >
                <FolderOpen size={16} />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg bg-surface-600 text-white/60 hover:text-white transition-colors text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.title || !form.singer}
              className="flex-1 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white transition-colors text-sm disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Song'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
