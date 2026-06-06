import { IpcMain } from 'electron';
import * as db from './database';
import { Song } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

export function registerIpcHandlers(ipcMain: IpcMain): void {
  // Songs
  ipcMain.handle('songs:getAll', () => {
    const songs = db.getAllSongs();
    console.log('[IPC] songs:getAll →', songs.length, 'songs');
    return songs;
  });
  ipcMain.handle('songs:getById', (_e, id: string) => db.getSongById(id));
  ipcMain.handle('songs:search', (_e, query: string, filters: Record<string, string | number>) => db.searchSongs(query, filters));
  ipcMain.handle('songs:insert', (_e, song: Omit<Song, 'id' | 'playCount' | 'isFavorite' | 'lastPlayed' | 'addedAt'>) => {
    return db.insertSong({ ...song, id: uuidv4() });
  });
  ipcMain.handle('songs:update', (_e, id: string, updates: Partial<Song>) => db.updateSong(id, updates));
  ipcMain.handle('songs:delete', (_e, id: string) => db.deleteSong(id));
  ipcMain.handle('songs:incrementPlayCount', (_e, id: string) => db.incrementPlayCount(id));
  ipcMain.handle('songs:toggleFavorite', (_e, id: string) => db.toggleFavorite(id));
  ipcMain.handle('songs:getRecentlyPlayed', (_e, limit?: number) => db.getRecentlyPlayed(limit));
  ipcMain.handle('songs:getMostPlayed', (_e, limit?: number) => db.getMostPlayed(limit));
  ipcMain.handle('songs:getFavorites', () => db.getFavoriteSongs());

  // Playlists
  ipcMain.handle('playlists:getAll', () => {
    const pl = db.getAllPlaylists();
    console.log('[IPC] playlists:getAll →', pl.map(p => `${p.name}(${p.songCount})`));
    return pl;
  });
  ipcMain.handle('playlists:getSongs', (_e, playlistId: string) => {
    const songs = db.getPlaylistSongs(playlistId);
    console.log('[IPC] playlists:getSongs', playlistId, '→', songs.length, 'songs');
    return songs;
  });
  ipcMain.handle('playlists:create', (_e, name: string, description: string) => db.createPlaylist(name, description));
  ipcMain.handle('playlists:rename', (_e, id: string, name: string) => db.renamePlaylist(id, name));
  ipcMain.handle('playlists:delete', (_e, id: string) => db.deletePlaylist(id));
  ipcMain.handle('playlists:addSong', (_e, playlistId: string, songId: string) => db.addSongToPlaylist(playlistId, songId));
  ipcMain.handle('playlists:removeSong', (_e, playlistId: string, songId: string) => db.removeSongFromPlaylist(playlistId, songId));
  ipcMain.handle('playlists:reorder', (_e, playlistId: string, songIds: string[]) => db.reorderPlaylistSongs(playlistId, songIds));

  // Settings
  ipcMain.handle('settings:getAll', () => db.getSettings());
  ipcMain.handle('settings:get', (_e, key: string) => db.getSetting(key));
  ipcMain.handle('settings:set', (_e, key: string, value: string) => db.setSetting(key, value));
}
