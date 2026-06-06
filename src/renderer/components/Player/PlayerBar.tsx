import React, { useCallback } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Repeat, Repeat1, Shuffle, FastForward, Rewind, Heart,
} from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { useAudio } from '../../hooks/useAudio';
import { audioService } from '../../services/audioService';
import { formatDuration } from '../../services/formatUtils';
import clsx from 'clsx';

interface PlayerBarProps {
  onNext: () => void;
  onPrev: () => void;
}

export default function PlayerBar({ onNext, onPrev }: PlayerBarProps) {
  const {
    currentSong, isPlaying, position, duration, isBuffering,
    volume, muted, repeatMode, shuffle,
    setVolume, setMuted, setRepeatMode, setShuffle,
  } = usePlayerStore();

  const { togglePlayPause, seek, seekForward, seekBackward } = useAudio();

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    seek(parseFloat(e.target.value));
  }, [seek]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    window.electronAPI?.settings.set('volume', String(v));
  }, [setVolume]);

  const cycleRepeat = () => {
    const modes = ['none', 'all', 'one'] as const;
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(next);
    window.electronAPI?.settings.set('repeatMode', next);
  };

  const toggleShuffle = () => {
    setShuffle(!shuffle);
    window.electronAPI?.settings.set('shuffle', String(!shuffle));
  };

  const toggleMute = () => {
    setMuted(!muted);
    window.electronAPI?.settings.set('muted', String(!muted));
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div className="bg-surface-800 border-t border-white/5 px-4 py-3 flex flex-col gap-2 flex-shrink-0">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/40 w-10 text-right">{formatDuration(position)}</span>
        <div className="flex-1 relative group progress-bar">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={position}
            step={0.5}
            onChange={handleSeek}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-1"
          />
        </div>
        <span className="text-xs text-white/40 w-10">{formatDuration(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center">
        {/* Song info */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-surface-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {currentSong?.artworkPath ? (
              <img src={`file://${currentSong.artworkPath}`} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className={clsx(
                'w-full h-full flex items-center justify-center text-lg font-bold',
                'bg-gradient-to-br from-primary-700 to-primary-900 text-primary-200'
              )}>
                {currentSong?.title?.[0] ?? '♪'}
              </div>
            )}
          </div>
          {currentSong && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentSong.title}</p>
              <p className="text-xs text-white/50 truncate">{currentSong.singer}</p>
            </div>
          )}
        </div>

        {/* Center controls */}
        <div className="flex items-center gap-2">
          <button onClick={toggleShuffle} className={clsx('p-2 rounded-lg transition-colors', shuffle ? 'text-primary-400' : 'text-white/40 hover:text-white')} title="Shuffle">
            <Shuffle size={16} />
          </button>
          <button onClick={seekBackward} className="p-2 rounded-lg text-white/60 hover:text-white transition-colors" title="Back 5s">
            <Rewind size={18} />
          </button>
          <button onClick={onPrev} className="p-2 rounded-lg text-white/80 hover:text-white transition-colors" title="Previous">
            <SkipBack size={20} />
          </button>
          <button
            onClick={togglePlayPause}
            disabled={!currentSong}
            className="w-10 h-10 rounded-full bg-primary-600 hover:bg-primary-500 flex items-center justify-center transition-colors disabled:opacity-40"
            title="Play/Pause"
          >
            {isBuffering ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause size={18} fill="white" />
            ) : (
              <Play size={18} fill="white" className="ml-0.5" />
            )}
          </button>
          <button onClick={onNext} className="p-2 rounded-lg text-white/80 hover:text-white transition-colors" title="Next">
            <SkipForward size={20} />
          </button>
          <button onClick={seekForward} className="p-2 rounded-lg text-white/60 hover:text-white transition-colors" title="Forward 5s">
            <FastForward size={18} />
          </button>
          <button onClick={cycleRepeat} className={clsx('p-2 rounded-lg transition-colors', repeatMode !== 'none' ? 'text-primary-400' : 'text-white/40 hover:text-white')} title="Repeat">
            {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        {/* Volume */}
        <div className="flex-1 flex items-center justify-end gap-2">
          <button onClick={toggleMute} className="text-white/50 hover:text-white transition-colors">
            {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 accent-primary-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
