import { useEffect } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { useAppStore } from '../store/appStore';
import { audioService } from '../services/audioService';

export function useKeyboardShortcuts(
  onPlayPause: () => void,
  onNext: () => void,
  onPrev: () => void,
) {
  const { volume, setVolume, muted, setMuted } = usePlayerStore();
  const { setActiveView, setSearchQuery } = useAppStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.code === 'Space' && !isInput) {
        e.preventDefault();
        onPlayPause();
        return;
      }

      if (ctrl && e.code === 'ArrowRight') {
        e.preventDefault();
        onNext();
        return;
      }

      if (ctrl && e.code === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
        return;
      }

      if (ctrl && e.code === 'ArrowUp') {
        e.preventDefault();
        setVolume(Math.min(1, volume + 0.05));
        return;
      }

      if (ctrl && e.code === 'ArrowDown') {
        e.preventDefault();
        setVolume(Math.max(0, volume - 0.05));
        return;
      }

      if (ctrl && e.code === 'KeyF') {
        e.preventDefault();
        setActiveView('search');
        setTimeout(() => {
          document.querySelector<HTMLInputElement>('[data-search-input]')?.focus();
        }, 100);
        return;
      }

      if (ctrl && e.code === 'KeyM') {
        e.preventDefault();
        setMuted(!muted);
        return;
      }

      if (e.code === 'F11') {
        e.preventDefault();
        window.electronAPI?.window.fullscreen();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [volume, muted, onPlayPause, onNext, onPrev, setVolume, setMuted, setActiveView, setSearchQuery]);
}
