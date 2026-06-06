import React, { useState, useCallback } from 'react';
import { LayoutGrid, List, ArrowUpDown, ExternalLink, Plus } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { usePlayerStore } from '../../store/playerStore';
import { Song, SortField } from '../../../shared/types';
import SongRow from './SongRow';
import SongCard from './SongCard';
import AddSongModal from './AddSongModal';
import clsx from 'clsx';

interface PlaylistViewProps {
  onPlaySong: (song: Song, autoplay?: boolean) => void;
}

export default function PlaylistView({ onPlaySong }: PlaylistViewProps) {
  const {
    playlists, currentPlaylistId, currentPlaylistSongs,
    viewMode, setViewMode, sortBy, setSortBy, sortOrder, setSortOrder,
    setCurrentPlaylistSongs,
  } = useAppStore();
  const { currentSong, isPlaying, setQueue } = usePlayerStore();

  const [showAddSong, setShowAddSong] = useState(false);

  const playlist = playlists.find(p => p.id === currentPlaylistId);

  const sorted = [...currentPlaylistSongs].sort((a, b) => {
    const aVal = a[sortBy as keyof Song];
    const bVal = b[sortBy as keyof Song];
    const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const handlePlay = useCallback((song: Song, index: number) => {
    setQueue(sorted, index);
    onPlaySong(song, true);
    window.electronAPI?.songs.incrementPlayCount(song.id);
  }, [sorted, setQueue, onPlaySong]);

  const handleRemove = async (song: Song) => {
    if (!currentPlaylistId) return;
    await window.electronAPI?.playlists.removeSong(currentPlaylistId, song.id);
    const updated = await window.electronAPI?.playlists.getSongs(currentPlaylistId) ?? [];
    setCurrentPlaylistSongs(updated);
    setQueue(updated, 0);
  };

  const handleFavorite = async (song: Song) => {
    await window.electronAPI?.songs.toggleFavorite(song.id);
    const updated = currentPlaylistSongs.map(s =>
      s.id === song.id ? { ...s, isFavorite: !s.isFavorite } : s
    );
    setCurrentPlaylistSongs(updated);
  };

  const sortFields: { field: SortField; label: string }[] = [
    { field: 'title', label: 'Title' },
    { field: 'singer', label: 'Singer' },
    { field: 'year', label: 'Year' },
    { field: 'genre', label: 'Genre' },
    { field: 'duration', label: 'Duration' },
  ];

  const handleSortField = (field: SortField) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center gap-4 flex-shrink-0">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{playlist?.name ?? 'Playlist'}</h1>
          <p className="text-sm text-white/40 mt-0.5">{currentPlaylistSongs.length} songs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddSong(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600/20 text-primary-300 hover:bg-primary-600/30 transition-colors text-sm"
          >
            <Plus size={14} /> Add Song
          </button>

          {/* Sort */}
          <div className="flex items-center gap-1 bg-surface-700 rounded-lg p-1">
            {sortFields.map(({ field, label }) => (
              <button
                key={field}
                onClick={() => handleSortField(field)}
                className={clsx(
                  'px-2 py-1 rounded text-xs transition-colors flex items-center gap-1',
                  sortBy === field ? 'bg-surface-500 text-white' : 'text-white/40 hover:text-white'
                )}
              >
                {label}
                {sortBy === field && <ArrowUpDown size={10} />}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-surface-700 rounded-lg p-1">
            <button onClick={() => setViewMode('list')} className={clsx('p-1.5 rounded transition-colors', viewMode === 'list' ? 'bg-surface-500 text-white' : 'text-white/40 hover:text-white')}>
              <List size={14} />
            </button>
            <button onClick={() => setViewMode('grid')} className={clsx('p-1.5 rounded transition-colors', viewMode === 'grid' ? 'bg-surface-500 text-white' : 'text-white/40 hover:text-white')}>
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Song list */}
      <div className="flex-1 overflow-y-auto">
        {currentPlaylistSongs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30">
            <p className="text-lg">No songs in this playlist</p>
            <p className="text-sm mt-1">Click "Add Song" to get started</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="divide-y divide-white/5">
            {sorted.map((song, idx) => (
              <SongRow
                key={song.id}
                song={song}
                index={idx}
                isActive={currentSong?.id === song.id}
                isPlaying={isPlaying && currentSong?.id === song.id}
                onPlay={() => handlePlay(song, idx)}
                onRemove={() => handleRemove(song)}
                onFavorite={() => handleFavorite(song)}
                playlistId={currentPlaylistId}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sorted.map((song, idx) => (
              <SongCard
                key={song.id}
                song={song}
                isActive={currentSong?.id === song.id}
                isPlaying={isPlaying && currentSong?.id === song.id}
                onPlay={() => handlePlay(song, idx)}
                onFavorite={() => handleFavorite(song)}
              />
            ))}
          </div>
        )}
      </div>

      {showAddSong && (
        <AddSongModal
          playlistId={currentPlaylistId!}
          onClose={() => setShowAddSong(false)}
          onAdded={async () => {
            const updated = await window.electronAPI?.playlists.getSongs(currentPlaylistId!) ?? [];
            setCurrentPlaylistSongs(updated);
            setQueue(updated, 0);
            setShowAddSong(false);
          }}
        />
      )}
    </div>
  );
}
