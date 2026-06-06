import React, { useEffect, useState } from 'react';
import { Song } from '../../../shared/types';
import { usePlayerStore } from '../../store/playerStore';
import SongRow from '../Playlist/SongRow';
import { useAppStore } from '../../store/appStore';

interface LibraryViewProps {
  onPlaySong: (song: Song, autoplay?: boolean) => void;
}

export default function LibraryView({ onPlaySong }: LibraryViewProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const { currentSong, isPlaying, setQueue } = usePlayerStore();
  const { viewMode } = useAppStore();

  useEffect(() => {
    window.electronAPI?.songs.getAll().then(setSongs);
  }, []);

  const handlePlay = (song: Song, index: number) => {
    setQueue(songs, index);
    onPlaySong(song, true);
    window.electronAPI?.songs.incrementPlayCount(song.id);
  };

  const handleFavorite = async (song: Song) => {
    await window.electronAPI?.songs.toggleFavorite(song.id);
    setSongs(prev => prev.map(s => s.id === song.id ? { ...s, isFavorite: !s.isFavorite } : s));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 flex-shrink-0">
        <h1 className="text-xl font-bold text-white">Library</h1>
        <p className="text-sm text-white/40 mt-0.5">{songs.length} songs total</p>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {songs.map((song, idx) => (
          <SongRow
            key={song.id}
            song={song}
            index={idx}
            isActive={currentSong?.id === song.id}
            isPlaying={isPlaying && currentSong?.id === song.id}
            onPlay={() => handlePlay(song, idx)}
            onFavorite={() => handleFavorite(song)}
          />
        ))}
      </div>
    </div>
  );
}
