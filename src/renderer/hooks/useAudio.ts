import { useEffect, useCallback } from 'react';
import { audioService } from '../services/audioService';
import { usePlayerStore } from '../store/playerStore';
import { Song } from '../../shared/types';

export function useAudio() {
  const {
    currentSong, isPlaying, volume, muted, repeatMode, shuffle,
    setIsPlaying, setPosition, setDuration, setIsBuffering,
    nextSong, queue, queueIndex, setQueue,
  } = usePlayerStore();

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

    const onEnded = () => {
      const next = nextSong();
      if (next) {
        playSong(next, true);
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
  }, [nextSong, setIsPlaying, setPosition, setDuration, setIsBuffering]);

  const playSong = useCallback((song: Song, autoplay = true) => {
    setIsBuffering(true);
    audioService.load(song, autoplay);
  }, [setIsBuffering]);

  const togglePlayPause = useCallback(() => {
    if (!currentSong) return;
    if (isPlaying) {
      audioService.pause();
    } else {
      audioService.play();
    }
  }, [currentSong, isPlaying]);

  const seek = useCallback((seconds: number) => {
    audioService.seek(seconds);
    setPosition(seconds);
  }, [setPosition]);

  const seekForward = useCallback(() => audioService.seekRelative(5), []);
  const seekBackward = useCallback(() => audioService.seekRelative(-5), []);

  useEffect(() => {
    audioService.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    audioService.mute(muted);
  }, [muted]);

  return { playSong, togglePlayPause, seek, seekForward, seekBackward };
}
