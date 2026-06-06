import { Song, AppSettings } from '../../shared/types';

interface ElectronAPI {
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    fullscreen: () => Promise<void>;
  };
  dialog: {
    openFile: () => Promise<string[]>;
    openFolder: () => Promise<string | null>;
  };
  scanner: {
    scanFolder: (folderPath: string) => Promise<{ matched: number; unmatched: string[]; total: number }>;
    linkFile: (songId: string, filePath: string) => Promise<boolean>;
  };
  songs: {
    getAll: () => Promise<Song[]>;
    getById: (id: string) => Promise<Song | null>;
    search: (query: string, filters: Record<string, string | number>) => Promise<Song[]>;
    insert: (song: Partial<Song>) => Promise<Song>;
    update: (id: string, updates: Partial<Song>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    incrementPlayCount: (id: string) => Promise<void>;
    toggleFavorite: (id: string) => Promise<boolean>;
    getRecentlyPlayed: (limit?: number) => Promise<Song[]>;
    getMostPlayed: (limit?: number) => Promise<Song[]>;
    getFavorites: () => Promise<Song[]>;
  };
  playlists: {
    getAll: () => Promise<{
      id: string; name: string; description: string;
      createdAt: string; updatedAt: string; isDefault: number; songCount: number;
    }[]>;
    getSongs: (playlistId: string) => Promise<Song[]>;
    create: (name: string, description: string) => Promise<string>;
    rename: (id: string, name: string) => Promise<void>;
    delete: (id: string) => Promise<void>;
    addSong: (playlistId: string, songId: string) => Promise<void>;
    removeSong: (playlistId: string, songId: string) => Promise<void>;
    reorder: (playlistId: string, songIds: string[]) => Promise<void>;
  };
  settings: {
    getAll: () => Promise<AppSettings>;
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
