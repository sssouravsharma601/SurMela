import { contextBridge, ipcRenderer } from 'electron';

const invoke = (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  window: {
    minimize: () => invoke('window:minimize'),
    maximize: () => invoke('window:maximize'),
    close: () => invoke('window:close'),
    isMaximized: () => invoke('window:isMaximized'),
    fullscreen: () => invoke('window:fullscreen'),
  },

  // Dialog
  dialog: {
    openFile: () => invoke('dialog:openFile'),
    openFolder: () => invoke('dialog:openFolder'),
  },

  // Music folder scanner
  scanner: {
    scanFolder: (folderPath: string) => invoke('songs:scanFolder', folderPath),
    linkFile: (songId: string, filePath: string) => invoke('songs:linkFile', songId, filePath),
  },

  // Songs
  songs: {
    getAll: () => invoke('songs:getAll'),
    getById: (id: string) => invoke('songs:getById', id),
    search: (query: string, filters: Record<string, string | number>) => invoke('songs:search', query, filters),
    insert: (song: unknown) => invoke('songs:insert', song),
    update: (id: string, updates: unknown) => invoke('songs:update', id, updates),
    delete: (id: string) => invoke('songs:delete', id),
    incrementPlayCount: (id: string) => invoke('songs:incrementPlayCount', id),
    toggleFavorite: (id: string) => invoke('songs:toggleFavorite', id),
    getRecentlyPlayed: (limit?: number) => invoke('songs:getRecentlyPlayed', limit),
    getMostPlayed: (limit?: number) => invoke('songs:getMostPlayed', limit),
    getFavorites: () => invoke('songs:getFavorites'),
  },

  // Playlists
  playlists: {
    getAll: () => invoke('playlists:getAll'),
    getSongs: (playlistId: string) => invoke('playlists:getSongs', playlistId),
    create: (name: string, description: string) => invoke('playlists:create', name, description),
    rename: (id: string, name: string) => invoke('playlists:rename', id, name),
    delete: (id: string) => invoke('playlists:delete', id),
    addSong: (playlistId: string, songId: string) => invoke('playlists:addSong', playlistId, songId),
    removeSong: (playlistId: string, songId: string) => invoke('playlists:removeSong', playlistId, songId),
    reorder: (playlistId: string, songIds: string[]) => invoke('playlists:reorder', playlistId, songIds),
  },

  // Settings
  settings: {
    getAll: () => invoke('settings:getAll'),
    get: (key: string) => invoke('settings:get', key),
    set: (key: string, value: string) => invoke('settings:set', key, value),
  },
});
