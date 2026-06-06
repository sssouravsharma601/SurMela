import React, { useState } from 'react';
import { Play, Pause, Heart, MoreHorizontal, Trash2, ExternalLink, Plus } from 'lucide-react';
import { Song } from '../../../shared/types';
import { formatDuration } from '../../services/formatUtils';
import { useAppStore } from '../../store/appStore';
import clsx from 'clsx';

interface SongRowProps {
  song: Song;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove?: () => void;
  onFavorite: () => void;
  playlistId?: string | null;
}

export default function SongRow({
  song, index, isActive, isPlaying, onPlay, onRemove, onFavorite, playlistId,
}: SongRowProps) {
  const { playlists } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleYoutube = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (song.youtubeUrl) window.open(song.youtubeUrl, '_blank');
  };

  const addToPlaylist = async (pid: string) => {
    await window.electronAPI?.playlists.addSong(pid, song.id);
    setMenuOpen(false);
  };

  return (
    <div
      className={clsx(
        'group flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors cursor-pointer relative',
        isActive && 'bg-primary-600/10'
      )}
      onDoubleClick={onPlay}
    >
      {/* Index / play indicator */}
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        {isActive ? (
          <div className="flex items-end gap-0.5 h-4 text-primary-400">
            {isPlaying ? (
              <>
                <div className="equalizer-bar h-full" />
                <div className="equalizer-bar h-3" />
                <div className="equalizer-bar h-4" />
                <div className="equalizer-bar h-2" />
              </>
            ) : (
              <Pause size={14} className="fill-current" />
            )}
          </div>
        ) : (
          <>
            <span className="text-sm text-white/30 group-hover:hidden">{index + 1}</span>
            <button onClick={onPlay} className="hidden group-hover:flex text-white hover:text-primary-400 transition-colors">
              <Play size={14} fill="currentColor" />
            </button>
          </>
        )}
      </div>

      {/* Artwork */}
      <div className="w-9 h-9 rounded flex-shrink-0 overflow-hidden bg-surface-600">
        {song.artworkPath ? (
          <img src={`file://${song.artworkPath}`} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-800 to-surface-600 text-xs font-bold text-primary-300">
            {song.title[0]}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-medium truncate', isActive ? 'text-primary-300' : 'text-white')}>
          {song.title}
        </p>
        <p className="text-xs text-white/40 truncate">{song.singer} • {song.album}</p>
      </div>

      <span className="text-xs text-white/30 w-16 text-center hidden md:block">{song.genre}</span>
      <span className="text-xs text-white/30 w-10 text-center hidden md:block">{song.year}</span>
      <span className="text-xs text-white/30 w-12 text-right">{formatDuration(song.duration)}</span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={e => { e.stopPropagation(); onFavorite(); }} className={clsx('p-1.5 rounded transition-colors', song.isFavorite ? 'text-red-400' : 'text-white/40 hover:text-red-400')}>
          <Heart size={14} fill={song.isFavorite ? 'currentColor' : 'none'} />
        </button>
        {song.youtubeUrl && (
          <button onClick={handleYoutube} className="p-1.5 rounded text-white/40 hover:text-white transition-colors" title="Open in YouTube">
            <ExternalLink size={14} />
          </button>
        )}
        <div className="relative">
          <button onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="p-1.5 rounded text-white/40 hover:text-white transition-colors">
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 bottom-8 z-50 bg-surface-700 border border-white/10 rounded-lg shadow-xl py-1 w-48"
              onClick={e => e.stopPropagation()}
            >
              <p className="px-3 py-1.5 text-xs text-white/40 font-semibold uppercase tracking-wider">Add to playlist</p>
              {playlists.filter(p => p.id !== playlistId).map(p => (
                <button
                  key={p.id}
                  onClick={() => addToPlaylist(p.id)}
                  className="w-full px-3 py-1.5 text-sm text-left text-white/70 hover:bg-white/5 flex items-center gap-2"
                >
                  <Plus size={12} /> {p.name}
                </button>
              ))}
              {onRemove && (
                <>
                  <div className="h-px bg-white/10 my-1" />
                  <button onClick={() => { onRemove(); setMenuOpen(false); }} className="w-full px-3 py-1.5 text-sm text-left text-red-400 hover:bg-white/5 flex items-center gap-2">
                    <Trash2 size={12} /> Remove from playlist
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
