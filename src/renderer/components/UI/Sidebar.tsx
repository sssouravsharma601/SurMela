import React, { useState, useEffect } from 'react';
import {
  Music2, ListMusic, Clock, BarChart2, Heart, Search,
  Plus, Pencil, Trash2, ChevronDown, ChevronRight, Moon, Sun, FolderSearch,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { usePlayerStore } from '../../store/playerStore';
import { Song } from '../../../shared/types';
import ScanFolderModal from './ScanFolderModal';
import clsx from 'clsx';

interface SidebarProps {
  onNext: () => void;
  onPrev: () => void;
  onPlaySong: (song: Song, autoplay?: boolean) => void;
}

export default function Sidebar({ onPlaySong }: SidebarProps) {
  const {
    playlists, currentPlaylistId, theme, activeView,
    setTheme, setCurrentPlaylist, setCurrentPlaylistSongs, setActiveView, setPlaylists,
  } = useAppStore();
  const { setQueue } = usePlayerStore();

  const [playlistsOpen, setPlaylistsOpen] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [showScan, setShowScan] = useState(false);

  // On first load: fetch playlists and auto-select the first one
  useEffect(() => {
    async function bootstrap() {
      if (!window.electronAPI) return;
      const pls = await window.electronAPI.playlists.getAll();
      setPlaylists(pls);
      if (pls.length > 0 && !currentPlaylistId) {
        setCurrentPlaylist(pls[0].id);
        setActiveView('playlist');
      }
    }
    bootstrap();
  }, []);
  const [renameValue, setRenameValue] = useState('');

  const loadPlaylist = async (id: string) => {
    setCurrentPlaylist(id);
    setActiveView('playlist');
    const songs = await window.electronAPI?.playlists.getSongs(id) ?? [];
    setCurrentPlaylistSongs(songs);
    setQueue(songs, 0);
    window.electronAPI?.settings.set('lastPlaylistId', id);
  };

  const createPlaylist = async () => {
    const id = await window.electronAPI?.playlists.create('New Playlist', '');
    const updated = await window.electronAPI?.playlists.getAll() ?? [];
    setPlaylists(updated);
    if (id) {
      setRenamingId(id);
      setRenameValue('New Playlist');
    }
  };

  const deletePlaylist = async (id: string) => {
    await window.electronAPI?.playlists.delete(id);
    const updated = await window.electronAPI?.playlists.getAll() ?? [];
    setPlaylists(updated);
    if (currentPlaylistId === id && updated.length > 0) {
      loadPlaylist(updated[0].id);
    }
  };

  const finishRename = async (id: string) => {
    if (renameValue.trim()) {
      await window.electronAPI?.playlists.rename(id, renameValue.trim());
      const updated = await window.electronAPI?.playlists.getAll() ?? [];
      setPlaylists(updated);
    }
    setRenamingId(null);
  };

  const navItems = [
    { id: 'library' as const, icon: Music2, label: 'Library' },
    { id: 'recently-played' as const, icon: Clock, label: 'Recently Played' },
    { id: 'most-played' as const, icon: BarChart2, label: 'Most Played' },
    { id: 'favorites' as const, icon: Heart, label: 'Favorites' },
    { id: 'search' as const, icon: Search, label: 'Search' },
  ];

  return (
    <div className="w-64 flex-shrink-0 bg-surface-800 border-r border-white/5 flex flex-col overflow-hidden">
      {/* Nav items */}
      <div className="p-3 space-y-1">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveView(id)}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              activeView === id
                ? 'bg-primary-600/30 text-primary-300'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="h-px bg-white/5 mx-3" />

      {/* Playlists */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setPlaylistsOpen(!playlistsOpen)}
            className="flex items-center gap-1 text-xs font-semibold text-white/40 uppercase tracking-wider hover:text-white/70 transition-colors"
          >
            {playlistsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Playlists
          </button>
          <button
            onClick={createPlaylist}
            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            title="New Playlist"
          >
            <Plus size={14} />
          </button>
        </div>

        {playlistsOpen && (
          <div className="space-y-0.5">
            {playlists.map(pl => (
              <div
                key={pl.id}
                className={clsx(
                  'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                  activeView === 'playlist' && currentPlaylistId === pl.id
                    ? 'bg-primary-600/30 text-primary-300'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
                onClick={() => loadPlaylist(pl.id)}
              >
                <ListMusic size={14} className="flex-shrink-0" />
                {renamingId === pl.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={() => finishRename(pl.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') finishRename(pl.id);
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 bg-surface-600 text-white text-sm px-1 rounded outline-none"
                  />
                ) : (
                  <span className="flex-1 text-sm truncate">{pl.name}</span>
                )}
                <span className="text-xs text-white/30">{pl.songCount}</span>
                {!pl.isDefault && (
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setRenamingId(pl.id);
                        setRenameValue(pl.name);
                      }}
                      className="p-0.5 hover:text-primary-400 transition-colors"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deletePlaylist(pl.id); }}
                      className="p-0.5 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <button
          onClick={() => setShowScan(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary-400 hover:text-primary-300 hover:bg-primary-600/10 transition-colors font-medium"
        >
          <FolderSearch size={15} />
          Scan Music Folder
        </button>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      {showScan && (
        <ScanFolderModal
          onClose={() => setShowScan(false)}
          onDone={async () => {
            // Refresh playlists song counts after scan
            const pls = await window.electronAPI?.playlists.getAll() ?? [];
            setPlaylists(pls);
          }}
        />
      )}
    </div>
  );
}
