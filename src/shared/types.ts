export interface Song {
  id: string;
  title: string;
  singer: string;
  album: string;
  year: number;
  genre: string;
  duration: number; // seconds
  filePath: string | null;
  artworkPath: string | null;
  youtubeUrl: string | null;
  playCount: number;
  isFavorite: boolean;
  lastPlayed: string | null;
  addedAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  songIds: string[];
  isDefault: boolean;
}

export interface PlaylistWithSongs extends Playlist {
  songs: Song[];
}

export interface AppSettings {
  volume: number;
  muted: boolean;
  theme: 'dark' | 'light';
  viewMode: 'grid' | 'list';
  sortBy: 'title' | 'singer' | 'year' | 'genre' | 'duration';
  sortOrder: 'asc' | 'desc';
  repeatMode: 'none' | 'one' | 'all';
  shuffle: boolean;
  lastPlaylistId: string | null;
  lastSongId: string | null;
  lastPosition: number;
}

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  isBuffering: boolean;
  volume: number;
  muted: boolean;
  repeatMode: 'none' | 'one' | 'all';
  shuffle: boolean;
  queue: Song[];
  queueIndex: number;
}

export interface SearchFilters {
  query: string;
  singer?: string;
  album?: string;
  genre?: string;
  year?: number;
}

export interface SearchResult {
  songs: Song[];
  total: number;
}

export interface IpcResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export type SortField = 'title' | 'singer' | 'year' | 'genre' | 'duration';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';
export type Theme = 'dark' | 'light';
export type RepeatMode = 'none' | 'one' | 'all';
