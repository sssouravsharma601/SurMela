import { Howl, Howler } from 'howler';
import { Song } from '../../shared/types';

type AudioEventCallback = (data?: unknown) => void;

class AudioService {
  private howl: Howl | null = null;
  private currentSong: Song | null = null;
  private listeners: Map<string, AudioEventCallback[]> = new Map();
  private progressInterval: ReturnType<typeof setInterval> | null = null;

  on(event: string, callback: AudioEventCallback): void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: AudioEventCallback): void {
    const cbs = this.listeners.get(event);
    if (cbs) this.listeners.set(event, cbs.filter(c => c !== callback));
  }

  private emit(event: string, data?: unknown): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  load(song: Song, autoplay = false): void {
    this.stop();
    this.currentSong = song;

    if (!song.filePath) {
      this.emit('noLocalFile', song);
      return;
    }

    this.howl = new Howl({
      src: [`file://${song.filePath}`],
      html5: true,
      volume: Howler.volume(),
      onload: () => {
        this.emit('loaded', { duration: this.howl?.duration() ?? 0 });
        if (autoplay) this.play();
      },
      onplay: () => {
        this.startProgressTracking();
        this.emit('play');
      },
      onpause: () => {
        this.stopProgressTracking();
        this.emit('pause');
      },
      onstop: () => {
        this.stopProgressTracking();
        this.emit('stop');
      },
      onend: () => {
        this.stopProgressTracking();
        this.emit('ended');
      },
      onloaderror: (_id, err) => {
        this.emit('error', err);
      },
      onplayerror: (_id, err) => {
        this.emit('error', err);
      },
    });
  }

  play(): void {
    this.howl?.play();
  }

  pause(): void {
    this.howl?.pause();
  }

  stop(): void {
    if (this.howl) {
      this.howl.unload();
      this.howl = null;
    }
    this.stopProgressTracking();
  }

  seek(seconds: number): void {
    this.howl?.seek(seconds);
  }

  seekRelative(delta: number): void {
    const current = (this.howl?.seek() as number) ?? 0;
    this.seek(Math.max(0, Math.min(current + delta, this.duration())));
  }

  duration(): number {
    return this.howl?.duration() ?? 0;
  }

  position(): number {
    return (this.howl?.seek() as number) ?? 0;
  }

  isPlaying(): boolean {
    return this.howl?.playing() ?? false;
  }

  setVolume(volume: number): void {
    Howler.volume(Math.max(0, Math.min(1, volume)));
  }

  getVolume(): number {
    return Howler.volume();
  }

  mute(muted: boolean): void {
    Howler.mute(muted);
  }

  private startProgressTracking(): void {
    this.stopProgressTracking();
    this.progressInterval = setInterval(() => {
      this.emit('progress', {
        position: this.position(),
        duration: this.duration(),
      });
    }, 500);
  }

  private stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }
}

export const audioService = new AudioService();
