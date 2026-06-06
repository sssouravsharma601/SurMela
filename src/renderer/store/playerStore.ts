import { create } from 'zustand';
import { Song, RepeatMode } from '../../shared/types';

interface PlayerStore {
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  isBuffering: boolean;
  volume: number;
  muted: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  queue: Song[];
  queueIndex: number;

  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setIsBuffering: (buffering: boolean) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setShuffle: (shuffle: boolean) => void;
  setQueue: (songs: Song[], startIndex?: number) => void;
  nextSong: () => Song | null;
  prevSong: () => Song | null;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  isBuffering: false,
  volume: 0.8,
  muted: false,
  repeatMode: 'none',
  shuffle: false,
  queue: [],
  queueIndex: -1,

  setCurrentSong: (song) => set({ currentSong: song }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPosition: (position) => set({ position }),
  setDuration: (duration) => set({ duration }),
  setIsBuffering: (buffering) => set({ isBuffering: buffering }),
  setVolume: (volume) => set({ volume }),
  setMuted: (muted) => set({ muted }),
  setRepeatMode: (mode) => set({ repeatMode: mode }),
  setShuffle: (shuffle) => set({ shuffle }),

  setQueue: (songs, startIndex = 0) => set({
    queue: songs,
    queueIndex: startIndex,
    currentSong: songs[startIndex] ?? null,
  }),

  nextSong: () => {
    const { queue, queueIndex, repeatMode, shuffle } = get();
    if (queue.length === 0) return null;

    let nextIndex: number;
    if (repeatMode === 'one') {
      nextIndex = queueIndex;
    } else if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') nextIndex = 0;
        else return null;
      }
    }

    const nextSong = queue[nextIndex];
    set({ queueIndex: nextIndex, currentSong: nextSong });
    return nextSong;
  },

  prevSong: () => {
    const { queue, queueIndex } = get();
    if (queue.length === 0) return null;

    const prevIndex = queueIndex > 0 ? queueIndex - 1 : 0;
    const prevSong = queue[prevIndex];
    set({ queueIndex: prevIndex, currentSong: prevSong });
    return prevSong;
  },
}));
