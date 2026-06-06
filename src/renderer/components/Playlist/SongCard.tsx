import React from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import { Song } from '../../../shared/types';
import { formatDuration } from '../../services/formatUtils';
import clsx from 'clsx';

interface SongCardProps {
  song: Song;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onFavorite: () => void;
}

export default function SongCard({ song, isActive, isPlaying, onPlay, onFavorite }: SongCardProps) {
  return (
    <div
      className={clsx(
        'group rounded-xl p-3 bg-surface-800 hover:bg-surface-700 transition-colors cursor-pointer',
        isActive && 'ring-1 ring-primary-500'
      )}
      onDoubleClick={onPlay}
    >
      <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-surface-600">
        {song.artworkPath ? (
          <img src={`file://${song.artworkPath}`} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-800 to-surface-600 text-2xl font-bold text-primary-300">
            {song.title[0]}
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={e => { e.stopPropagation(); onPlay(); }}
            className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center hover:bg-primary-400 transition-colors"
          >
            {isPlaying && isActive ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="ml-0.5" />}
          </button>
        </div>
        {isActive && isPlaying && (
          <div className="absolute bottom-2 left-2 flex items-end gap-0.5 h-4 text-primary-400">
            <div className="equalizer-bar h-full" />
            <div className="equalizer-bar h-3" />
            <div className="equalizer-bar h-4" />
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className={clsx('text-sm font-medium truncate', isActive ? 'text-primary-300' : 'text-white')}>
            {song.title}
          </p>
          <p className="text-xs text-white/40 truncate">{song.singer}</p>
          <p className="text-xs text-white/25">{song.year} • {formatDuration(song.duration)}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onFavorite(); }}
          className={clsx('p-1 flex-shrink-0 transition-colors', song.isFavorite ? 'text-red-400' : 'text-white/20 hover:text-red-400')}
        >
          <Heart size={13} fill={song.isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  );
}
