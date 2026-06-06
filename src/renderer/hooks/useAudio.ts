import { useEffect, useCallback, useRef } from 'react';
import { audioService } from '../services/audioService';
import { usePlayerStore } from '../store/playerStore';
import { Song } from '../../shared/types';

export function useAudio() {
  const {
    currentSong, isPlaying, volume, muted,
    setIsPlaying, setPosition, setDuration, setIsBuffering, setCurrentSong,
    nextSong,
  } = usePlayerStore();

  const nextSongRef = useRef(nextSong);
  nextSongRef.current = nextSong;

  const playSong = useCallback((song: Song, autoplay = true) => {
    if (!song.filePath) {
      // No local file — just mark it as selected (don't try to load audio)
      setCurrentSong(song);
      setIsPlaying(false);
      setPosition(0);
      setDuration(song.duration ?? 0);
      setIsBuffering(false);
      return;
    }
    setIsBuffering(true);
    audioService.load(song, autoplay);
  }, [setCurrentSong, setIsPlaying, setPosition, setDuration, setIsBuffering]);

  const playSongRef = useRef(playSong);
  playSongRef.current = playSong;

  useEffect(() => {
    const onProgress = (data: unknown) => {
      const { position, duration } = data as { position: number; duration: number };
      setPosition(position);
      setDuration(duration);
    };

    const onPlay = () => { setIsPlaying(true); setIsBuffering(false); };
    const onPause = () => setIsPlaying(false);
    const onStop = () => { setIsPlaying(false); setPosition(0); };
    const onLoaded = (data: unknown) => {
      const { duration } = data as { duration: number };
      setDuration(duration);
      setIsBuffering(false);
    };

    // Only auto-advance when a song naturally finishes playing
    const onEnded = () => {
      const next = nextSongRef.current();
      if (next) {
        playSongRef.current(next, true);
        window.electronAPI?.songs.incrementPlayCount(next.id);
      } else {
        setIsPlaying(false);
        setPosition(0);
      }
    };

    const onError = () => {
      setIsPlaying(false);
      setIsBuffering(false);
    };

    audioService.on('progress', onProgress);
    audioService.on('play', onPlay);
    audioService.on('pause', onPause);
    audioService.on('stop', onStop);
    audioService.on('loaded', onLoaded);
    audioService.on('ended', onEnded);
    audioService.on('error', onError);

    return () => {
      audioService.off('progress', onProgress);
      audioService.off('play', onPlay);
      audioService.off('pause', onPause);
      audioService.off('stop', onStop);
      audioService.off('loaded', onLoaded);
      audioService.off('ended', onEnded);
      audioService.off('error', onError);
    };
  }, [setIsPlaying, setPosition, setDuration, setIsBuffering]);

  const togglePlayPause = useCallback(() => {
    if (!currentSong) return;
    if (!currentSong.filePath) return; // can't play without a file
    if (isPlaying) audioService.pause();
    else audioService.play();
  }, [currentSong, isPlaying]);

  const seek = useCallback((seconds: number) => {
    audioService.seek(seconds);
    setPosition(seconds);
  }, [setPosition]);

  const seekForward = useCallback(() => audioService.seekRelative(5), []);
  const seekBackward = useCallback(() => audioService.seekRelative(-5), []);

  useEffect(() => { audioService.setVolume(volume); }, [volume]);
  useEffect(() => { audioService.mute(muted); }, [muted]);

  return { playSong, togglePlayPause, seek, seekForward, seekBackward };
}
