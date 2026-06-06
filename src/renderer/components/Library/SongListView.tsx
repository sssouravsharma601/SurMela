import React from 'react';
import { Song } from '../../../shared/types';
import { usePlayerStore } from '../../store/playerStore';
import SongRow from '../Playlist/SongRow';

interface SongListViewProps {
  title: string;
  songs: Song[];
  onPlaySong: (song: Song, autoplay?: boolean) => void;
  onFavoriteToggle: (song: Song) => void;
  emptyMessage: string;
}

export default function SongListView({ title, songs, onPlaySong, onFavoriteToggle, emptyMessage }: SongListViewProps) {
  const { currentSong, isPlaying, setQueue } = usePlayerStore();

  const handlePlay = (song: Song, index: number) => {
    setQueue(songs, index);
    onPlaySong(song, true);
    window.electronAPI?.songs.incrementPlayCount(song.id);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 flex-shrink-0">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="text-sm text-white/40 mt-0.5">{songs.length} songs</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {songs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/30 text-sm">{emptyMessage}</div>
        ) : (
          <div className="divide-y divide-white/5">
            {songs.map((song, idx) => (
              <SongRow
                key={song.id}
                song={song}
                index={idx}
                isActive={currentSong?.id === song.id}
                isPlaying={isPlaying && currentSong?.id === song.id}
                onPlay={() => handlePlay(song, idx)}
                onFavorite={() => onFavoriteToggle(song)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
