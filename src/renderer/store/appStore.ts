import { create } from 'zustand';
import { Song, Theme, ViewMode, SortField, SortOrder } from '../../shared/types';

interface PlaylistInfo {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isDefault: number;
  songCount: number;
}

type ActiveView = 'playlist' | 'library' | 'search' | 'recently-played' | 'most-played' | 'favorites';

interface AppStore {
  playlists: PlaylistInfo[];
  currentPlaylistId: string | null;
  currentPlaylistSongs: Song[];
  theme: Theme;
  viewMode: ViewMode;
  sortBy: SortField;
  sortOrder: SortOrder;
  searchQuery: string;
  searchResults: Song[];
  isSearching: boolean;
  activeView: ActiveView;
  sidebarWidth: number;

  setPlaylists: (playlists: PlaylistInfo[]) => void;
  setCurrentPlaylist: (id: string | null) => void;
  setCurrentPlaylistSongs: (songs: Song[]) => void;
  setTheme: (theme: Theme) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Song[]) => void;
  setIsSearching: (searching: boolean) => void;
  setActiveView: (view: ActiveView) => void;
  updateSongInPlaylist: (song: Song) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  playlists: [],
  currentPlaylistId: null,
  currentPlaylistSongs: [],
  theme: 'dark',
  viewMode: 'list',
  sortBy: 'title',
  sortOrder: 'asc',
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  activeView: 'playlist',
  sidebarWidth: 260,

  setPlaylists: (playlists) => set({ playlists }),
  setCurrentPlaylist: (id) => set({ currentPlaylistId: id }),
  setCurrentPlaylistSongs: (songs) => set({ currentPlaylistSongs: songs }),
  setTheme: (theme) => set({ theme }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setActiveView: (activeView) => set({ activeView }),
  updateSongInPlaylist: (song) => set((state) => ({
    currentPlaylistSongs: state.currentPlaylistSongs.map(s => s.id === song.id ? song : s),
  })),
}));
