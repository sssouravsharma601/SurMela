import React, { useEffect, useCallback, useState } from 'react';
import { useAppStore } from './store/appStore';
import { usePlayerStore } from './store/playerStore';
import { useAudio } from './hooks/useAudio';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import TitleBar from './components/TitleBar/TitleBar';
import Sidebar from './components/UI/Sidebar';
import PlayerBar from './components/Player/PlayerBar';
import MainContent from './components/UI/MainContent';
import { Song } from '../shared/types';

export default function App() {
  const { theme, setTheme } = useAppStore();
  const { setVolume, setMuted, setRepeatMode, setShuffle, nextSong, prevSong } = usePlayerStore();
  const [initError, setInitError] = useState<string | null>(null);

  const { playSong, togglePlayPause } = useAudio();

  const handleNext = useCallback(() => {
    const next = nextSong();
    if (next) { playSong(next, true); window.electronAPI?.songs.incrementPlayCount(next.id); }
  }, [nextSong, playSong]);

  const handlePrev = useCallback(() => {
    const prev = prevSong();
    if (prev) playSong(prev, true);
  }, [prevSong, playSong]);

  useKeyboardShortcuts(togglePlayPause, handleNext, handlePrev);

  // Load only settings — Sidebar fetches playlists, PlaylistView fetches songs
  useEffect(() => {
    if (!window.electronAPI) {
      setInitError('Electron API not available — preload script failed to inject');
      return;
    }
    window.electronAPI.settings.getAll().then((settings) => {
      if (!settings) return;
      setTheme(settings.theme ?? 'dark');
      setVolume(settings.volume ?? 0.8);
      setMuted(settings.muted ?? false);
      setRepeatMode(settings.repeatMode ?? 'none');
      setShuffle(settings.shuffle ?? false);
    }).catch((err) => setInitError(String(err)));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.electronAPI?.settings.set('theme', theme);
  }, [theme]);

  if (initError) {
    return (
      <div className="h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
        <div className="bg-red-900/40 border border-red-500/50 rounded-xl p-6 max-w-2xl w-full">
          <h2 className="text-red-400 font-bold text-lg mb-3">Startup Error</h2>
          <pre className="text-sm text-red-200 whitespace-pre-wrap break-all">{initError}</pre>
        </div>
      </div>
    );
  }

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
