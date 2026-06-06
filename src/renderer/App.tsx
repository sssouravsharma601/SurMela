import React, { useEffect, useCallback } from 'react';
import { useAppStore } from './store/appStore';
import { usePlayerStore } from './store/playerStore';
import { useAudio } from './hooks/useAudio';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { audioService } from './services/audioService';
import TitleBar from './components/TitleBar/TitleBar';
import Sidebar from './components/UI/Sidebar';
import PlayerBar from './components/Player/PlayerBar';
import MainContent from './components/UI/MainContent';
import { Song } from '../shared/types';

export default function App() {
  const { theme, setTheme, setPlaylists, setCurrentPlaylist, setCurrentPlaylistSongs } = useAppStore();
  const {
    setVolume, setMuted, setRepeatMode, setShuffle,
    nextSong, prevSong, currentSong, setCurrentSong, setQueue,
  } = usePlayerStore();

  const { playSong, togglePlayPause } = useAudio();

  const handleNext = useCallback(() => {
    const next = nextSong();
    if (next) {
      playSong(next, true);
      window.electronAPI?.songs.incrementPlayCount(next.id);
    }
  }, [nextSong, playSong]);

  const handlePrev = useCallback(() => {
    const prev = prevSong();
    if (prev) {
      playSong(prev, true);
    }
  }, [prevSong, playSong]);

  useKeyboardShortcuts(togglePlayPause, handleNext, handlePrev);

  useEffect(() => {
    async function init() {
      if (!window.electronAPI) return;

      const settings = await window.electronAPI.settings.getAll();
      setTheme(settings.theme);
      setVolume(settings.volume);
      setMuted(settings.muted);
      setRepeatMode(settings.repeatMode);
      setShuffle(settings.shuffle);

      const playlists = await window.electronAPI.playlists.getAll();
      setPlaylists(playlists);

      const targetId = settings.lastPlaylistId ?? playlists[0]?.id;
      if (targetId) {
        setCurrentPlaylist(targetId);
        const songs = await window.electronAPI.playlists.getSongs(targetId);
        setCurrentPlaylistSongs(songs);
        setQueue(songs, 0);
      }
    }

    init();
  }, []);

  // Persist settings on change
  useEffect(() => {
    window.electronAPI?.settings.set('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} h-screen flex flex-col overflow-hidden`}>
      <div className="flex flex-col h-full bg-surface-900 text-white">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar onNext={handleNext} onPrev={handlePrev} onPlaySong={playSong} />
          <MainContent onPlaySong={playSong} onNext={handleNext} onPrev={handlePrev} />
        </div>
        <PlayerBar onNext={handleNext} onPrev={handlePrev} />
      </div>
    </div>
  );
}
