import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import { Song, Playlist, AppSettings } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

let db: Database.Database;

export function getDb(): Database.Database {
  return db;
}

export async function initDatabase(): Promise<void> {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'surmela.db');

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  seedDefaultData();
}

function createTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      singer TEXT NOT NULL,
      album TEXT NOT NULL DEFAULT '',
      year INTEGER NOT NULL DEFAULT 0,
      genre TEXT NOT NULL DEFAULT '',
      duration REAL NOT NULL DEFAULT 0,
      file_path TEXT,
      artwork_path TEXT,
      youtube_url TEXT,
      play_count INTEGER NOT NULL DEFAULT 0,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      last_played TEXT,
      added_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS playlist_songs (
      playlist_id TEXT NOT NULL,
      song_id TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (playlist_id, song_id),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_songs_singer ON songs(singer);
    CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);
    CREATE INDEX IF NOT EXISTS idx_songs_year ON songs(year);
    CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist ON playlist_songs(playlist_id);
  `);
}

function seedDefaultData(): void {
  const existingPlaylist = db.prepare('SELECT id FROM playlists WHERE is_default = 1').get();
  if (existingPlaylist) return;

  const now = new Date().toISOString();
  const playlistId = uuidv4();

  db.prepare(`
    INSERT INTO playlists (id, name, description, created_at, updated_at, is_default)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(playlistId, 'SurMela', 'Your default music collection', now, now);

  const songs = getDefaultSongs(now);
  const insertSong = db.prepare(`
    INSERT OR IGNORE INTO songs (id, title, singer, album, year, genre, duration, file_path, artwork_path, youtube_url, play_count, is_favorite, last_played, added_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, ?)
  `);

  const insertPlaylistSong = db.prepare(`
    INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)
  `);

  const insertMany = db.transaction((songs: ReturnType<typeof getDefaultSongs>) => {
    songs.forEach((song, idx) => {
      insertSong.run(
        song.id, song.title, song.singer, song.album, song.year,
        song.genre, song.duration, song.filePath, song.artworkPath,
        song.youtubeUrl, song.addedAt
      );
      insertPlaylistSong.run(playlistId, song.id, idx);
    });
  });

  insertMany(songs);

  // Default settings
  const defaultSettings: Record<string, string> = {
    volume: '0.8',
    muted: 'false',
    theme: 'dark',
    viewMode: 'list',
    sortBy: 'title',
    sortOrder: 'asc',
    repeatMode: 'none',
    shuffle: 'false',
    lastPlaylistId: playlistId,
    lastSongId: '',
    lastPosition: '0',
  };

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value);
  }
}

function getDefaultSongs(now: string) {
  return [
    { id: uuidv4(), title: 'Tum Hi Ho', singer: 'Arijit Singh', album: 'Aashiqui 2', year: 2013, genre: 'Bollywood', duration: 262, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/Umqb9KENgmk', addedAt: now },
    { id: uuidv4(), title: 'Channa Mereya', singer: 'Arijit Singh', album: 'Ae Dil Hai Mushkil', year: 2016, genre: 'Bollywood', duration: 278, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/zaVNdQKJRuk', addedAt: now },
    { id: uuidv4(), title: 'Kal Ho Naa Ho', singer: 'Sonu Nigam', album: 'Kal Ho Naa Ho', year: 2003, genre: 'Bollywood', duration: 300, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/xY_GMX0fGAA', addedAt: now },
    { id: uuidv4(), title: 'Dil Chahta Hai', singer: 'Shankar Mahadevan', album: 'Dil Chahta Hai', year: 2001, genre: 'Bollywood', duration: 298, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/1rMGVbRLuZM', addedAt: now },
    { id: uuidv4(), title: 'Suraj Hua Maddham', singer: 'Sonu Nigam', album: 'Kabhi Khushi Kabhie Gham', year: 2001, genre: 'Bollywood', duration: 360, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/7aCl7rqELEw', addedAt: now },
    { id: uuidv4(), title: 'Raabta', singer: 'Arijit Singh', album: 'Agent Sai Srinivasa', year: 2017, genre: 'Bollywood', duration: 243, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/Xf5y-rar8RU', addedAt: now },
    { id: uuidv4(), title: 'Kabhi Alvida Naa Kehna', singer: 'Sonu Nigam', album: 'Kabhi Alvida Naa Kehna', year: 2006, genre: 'Bollywood', duration: 330, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/pxhZ7dRmCRI', addedAt: now },
    { id: uuidv4(), title: 'Woh Lamhe', singer: 'KK', album: 'Zeher', year: 2005, genre: 'Bollywood', duration: 275, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/vwoxUe5Fj4g', addedAt: now },
    { id: uuidv4(), title: 'Yaad Piya Ki Aane Lagi', singer: 'Udit Narayan', album: 'Fiza', year: 2000, genre: 'Bollywood', duration: 280, filePath: null, artworkPath: null, youtubeUrl: null, addedAt: now },
    { id: uuidv4(), title: 'Kehna Hi Kya', singer: 'A.R. Rahman', album: 'Bombay', year: 1995, genre: 'Bollywood', duration: 256, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/eFCHOFmkiKU', addedAt: now },
    { id: uuidv4(), title: 'Jai Ho', singer: 'Sukhwinder Singh', album: 'Slumdog Millionaire', year: 2008, genre: 'Bollywood', duration: 290, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/pck9IHrLsM0', addedAt: now },
    { id: uuidv4(), title: 'Dil Se Re', singer: 'A.R. Rahman', album: 'Dil Se', year: 1998, genre: 'Bollywood', duration: 268, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/H-BbQiqBDuA', addedAt: now },
    { id: uuidv4(), title: 'Mere Dholna', singer: 'Ustad Rahat Fateh Ali Khan', album: 'Bhool Bhulaiyaa', year: 2007, genre: 'Bollywood', duration: 310, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/k7a_Pf8SXWY', addedAt: now },
    { id: uuidv4(), title: 'Khwaja Mere Khwaja', singer: 'Ustad Rahat Fateh Ali Khan', album: 'Jodhaa Akbar', year: 2008, genre: 'Sufi', duration: 408, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/HfGCQcHmVJY', addedAt: now },
    { id: uuidv4(), title: 'Tere Bina', singer: 'A.R. Rahman', album: 'Guru', year: 2007, genre: 'Bollywood', duration: 302, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/BoqRBNx_EI4', addedAt: now },
    { id: uuidv4(), title: 'Maa', singer: 'Shankar Mahadevan', album: 'Taare Zameen Par', year: 2007, genre: 'Bollywood', duration: 298, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/hh0vGlDhTy0', addedAt: now },
    { id: uuidv4(), title: 'Ae Dil Hai Mushkil', singer: 'Arijit Singh', album: 'Ae Dil Hai Mushkil', year: 2016, genre: 'Bollywood', duration: 285, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/6FURuLYrR_Q', addedAt: now },
    { id: uuidv4(), title: 'Phir Bhi Tumko Chahunga', singer: 'Arijit Singh', album: 'Half Girlfriend', year: 2017, genre: 'Bollywood', duration: 260, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/R_4mQHgZ_DY', addedAt: now },
    { id: uuidv4(), title: 'Gerua', singer: 'Arijit Singh', album: 'Dilwale', year: 2015, genre: 'Bollywood', duration: 270, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/AKkHxH-vQqg', addedAt: now },
    { id: uuidv4(), title: 'Sooraj Dooba Hain', singer: 'Arijit Singh', album: 'Roy', year: 2015, genre: 'Bollywood', duration: 248, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/mK3yLBHDkec', addedAt: now },
    { id: uuidv4(), title: 'Hamari Adhuri Kahani', singer: 'Arijit Singh', album: 'Hamari Adhuri Kahani', year: 2015, genre: 'Bollywood', duration: 275, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/UVrCBKWbGgk', addedAt: now },
    { id: uuidv4(), title: 'Kabira', singer: 'Arijit Singh', album: 'Yeh Jawaani Hai Deewani', year: 2013, genre: 'Bollywood', duration: 265, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/PoqMhpBXEZ4', addedAt: now },
    { id: uuidv4(), title: 'Dilliwaali Girlfriend', singer: 'Arijit Singh', album: 'Yeh Jawaani Hai Deewani', year: 2013, genre: 'Bollywood', duration: 220, filePath: null, artworkPath: null, youtubeUrl: null, addedAt: now },
    { id: uuidv4(), title: 'Agar Tum Saath Ho', singer: 'Arijit Singh', album: 'Tamasha', year: 2015, genre: 'Bollywood', duration: 290, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/C4qC4mNOEGI', addedAt: now },
    { id: uuidv4(), title: 'Bulleya', singer: 'Amit Mishra', album: 'Ae Dil Hai Mushkil', year: 2016, genre: 'Sufi', duration: 252, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/ZF7V7qjHZAk', addedAt: now },
    { id: uuidv4(), title: 'Muskurane Ki Wajah', singer: 'Arijit Singh', album: 'CityLights', year: 2014, genre: 'Bollywood', duration: 257, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/xRhQAxPkQBk', addedAt: now },
    { id: uuidv4(), title: 'Kun Faya Kun', singer: 'A.R. Rahman', album: 'Rockstar', year: 2011, genre: 'Sufi', duration: 428, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/T94PHkuydcw', addedAt: now },
    { id: uuidv4(), title: 'Sadda Haq', singer: 'Mohit Chauhan', album: 'Rockstar', year: 2011, genre: 'Rock', duration: 295, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/v5KpJMqmTWY', addedAt: now },
    { id: uuidv4(), title: 'Phir Se Ud Chala', singer: 'Mohit Chauhan', album: 'Rockstar', year: 2011, genre: 'Indie', duration: 268, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/wMCHJHWzE5s', addedAt: now },
    { id: uuidv4(), title: 'Tu Hi Re', singer: 'Hariharan', album: 'Bombay', year: 1995, genre: 'Bollywood', duration: 318, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/iI9bSlxqWus', addedAt: now },
    { id: uuidv4(), title: 'Maahi Ve', singer: 'Ustad Rahat Fateh Ali Khan', album: 'Highway', year: 2014, genre: 'Sufi', duration: 278, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/1EBvBHkyFNY', addedAt: now },
    { id: uuidv4(), title: 'Saans', singer: 'Mohit Chauhan', album: 'Jab Tak Hai Jaan', year: 2012, genre: 'Bollywood', duration: 309, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/q8qPfUlQ_3g', addedAt: now },
    { id: uuidv4(), title: 'Yeh Ishq Haaye', singer: 'Shreya Ghoshal & Ustad Rahat Fateh Ali Khan', album: 'Jab We Met', year: 2007, genre: 'Bollywood', duration: 278, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/s6R3e0Wm83I', addedAt: now },
    { id: uuidv4(), title: 'Kuch Kuch Hota Hai', singer: 'Udit Narayan', album: 'Kuch Kuch Hota Hai', year: 1998, genre: 'Bollywood', duration: 295, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/6LxrJa5PeLM', addedAt: now },
    { id: uuidv4(), title: 'Dil To Pagal Hai', singer: 'Udit Narayan', album: 'Dil To Pagal Hai', year: 1997, genre: 'Bollywood', duration: 268, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/B2iGETLd-kw', addedAt: now },
    { id: uuidv4(), title: 'Pehla Nasha', singer: 'Udit Narayan', album: 'Jo Jeeta Wohi Sikandar', year: 1992, genre: 'Bollywood', duration: 320, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/AaAdFxqHxQ8', addedAt: now },
    { id: uuidv4(), title: 'Tip Tip Barsa Paani', singer: 'Udit Narayan', album: 'Mohra', year: 1994, genre: 'Bollywood', duration: 265, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/2nVV8xfYLZ0', addedAt: now },
    { id: uuidv4(), title: 'Dheere Dheere Se', singer: 'Udit Narayan', album: 'Aashiqui', year: 1990, genre: 'Bollywood', duration: 290, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/-NMqgFl47N0', addedAt: now },
    { id: uuidv4(), title: 'Mere Humsafar', singer: 'KK', album: 'Crook', year: 2010, genre: 'Bollywood', duration: 262, filePath: null, artworkPath: null, youtubeUrl: null, addedAt: now },
    { id: uuidv4(), title: 'Tu Hi Meri Shab Hai', singer: 'KK', album: 'Gangster', year: 2006, genre: 'Bollywood', duration: 278, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/CkNb3RFxdB0', addedAt: now },
    { id: uuidv4(), title: 'Zara Sa', singer: 'KK', album: 'Jannat', year: 2008, genre: 'Bollywood', duration: 250, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/HLbM-gMVADo', addedAt: now },
    { id: uuidv4(), title: 'Tadap Tadap Ke', singer: 'KK', album: 'Hum Dil De Chuke Sanam', year: 1999, genre: 'Bollywood', duration: 338, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/XhJPGFYlYoI', addedAt: now },
    { id: uuidv4(), title: 'Dil Ibaadat', singer: 'KK', album: 'Tum Mile', year: 2009, genre: 'Bollywood', duration: 270, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/0MdvFUcbqug', addedAt: now },
    { id: uuidv4(), title: 'Pal', singer: 'KK', album: 'Pal', year: 1999, genre: 'Pop', duration: 245, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/bFuBFx8n-5Q', addedAt: now },
    { id: uuidv4(), title: 'Yaaron', singer: 'KK', album: 'Yaaron', year: 1999, genre: 'Pop', duration: 270, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/kQ4kCZKhVIs', addedAt: now },
    { id: uuidv4(), title: 'Tujhse Naraaz Nahi', singer: 'Ustad Rahat Fateh Ali Khan', album: 'Masoom Revisited', year: 2012, genre: 'Ghazal', duration: 248, filePath: null, artworkPath: null, youtubeUrl: null, addedAt: now },
    { id: uuidv4(), title: 'Mann Ki Lagan', singer: 'Ustad Rahat Fateh Ali Khan', album: 'Paap', year: 2003, genre: 'Sufi', duration: 310, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/7SdpzSj9xTo', addedAt: now },
    { id: uuidv4(), title: 'Afreen Afreen', singer: 'Ustad Rahat Fateh Ali Khan', album: 'Coke Studio', year: 2016, genre: 'Sufi', duration: 390, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/P9NQe1ckHKs', addedAt: now },
    { id: uuidv4(), title: 'Kamli', singer: 'Ustad Rahat Fateh Ali Khan', album: 'Dhoom 3', year: 2013, genre: 'Bollywood', duration: 295, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/rZjYwPsK9eM', addedAt: now },
    { id: uuidv4(), title: 'O Re Piya', singer: 'Ustad Rahat Fateh Ali Khan', album: 'Aaja Nachle', year: 2007, genre: 'Sufi', duration: 348, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/Z4EbJEgWMNw', addedAt: now },
    { id: uuidv4(), title: 'Rang De Basanti', singer: 'A.R. Rahman', album: 'Rang De Basanti', year: 2006, genre: 'Bollywood', duration: 320, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/fQOQpnZtGqA', addedAt: now },
    { id: uuidv4(), title: 'Roja Jaaneman', singer: 'A.R. Rahman', album: 'Roja', year: 1992, genre: 'Bollywood', duration: 270, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/XJ4pQ5nq0BE', addedAt: now },
    { id: uuidv4(), title: 'Vande Mataram', singer: 'A.R. Rahman', album: 'Maa Tujhhe Salaam', year: 1997, genre: 'Patriotic', duration: 352, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/AKKwIfbLJWE', addedAt: now },
    { id: uuidv4(), title: 'Chaiyya Chaiyya', singer: 'Sukhwinder Singh', album: 'Dil Se', year: 1998, genre: 'Bollywood', duration: 298, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/YpBCmPTn5_o', addedAt: now },
    { id: uuidv4(), title: 'Maazaa', singer: 'Sukhwinder Singh', album: 'Jab Tak Hai Jaan', year: 2012, genre: 'Bollywood', duration: 242, filePath: null, artworkPath: null, youtubeUrl: null, addedAt: now },
    { id: uuidv4(), title: 'Bolo Na', singer: 'Shaan', album: 'Chittagong', year: 2012, genre: 'Bollywood', duration: 268, filePath: null, artworkPath: null, youtubeUrl: null, addedAt: now },
    { id: uuidv4(), title: 'Do Pal', singer: 'KK', album: 'Veer-Zaara', year: 2004, genre: 'Bollywood', duration: 302, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/7s_HXHIMQ2M', addedAt: now },
    { id: uuidv4(), title: 'Tere Liye', singer: 'KK & Sunidhi Chauhan', album: 'Veer-Zaara', year: 2004, genre: 'Bollywood', duration: 290, filePath: null, artworkPath: null, youtubeUrl: null, addedAt: now },
    { id: uuidv4(), title: 'Aao Huzoor Tumko', singer: 'Shaan', album: 'Tumsa Nahin Dekha', year: 2004, genre: 'Bollywood', duration: 255, filePath: null, artworkPath: null, youtubeUrl: null, addedAt: now },
    { id: uuidv4(), title: 'Yeh Honsla', singer: 'Shaan', album: 'Dor', year: 2006, genre: 'Bollywood', duration: 318, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/PVfSo3f6e3g', addedAt: now },
    { id: uuidv4(), title: 'Tanha Dil', singer: 'Shaan', album: 'Tanha Dil', year: 2000, genre: 'Pop', duration: 278, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/1d7hqVxOTtA', addedAt: now },
    { id: uuidv4(), title: 'Mitwa', singer: 'Shaan', album: 'Kabhi Alvida Naa Kehna', year: 2006, genre: 'Bollywood', duration: 295, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/IrPxR8IIRAM', addedAt: now },
    { id: uuidv4(), title: 'Teri Deewani', singer: 'Kailash Kher', album: 'Kailasa', year: 2006, genre: 'Sufi', duration: 310, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/w3S0D8oPqrg', addedAt: now },
    { id: uuidv4(), title: 'Allah Ke Bande', singer: 'Kailash Kher', album: 'Waisa Bhi Hota Hai Part II', year: 2003, genre: 'Sufi', duration: 285, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/lhsKrr5f9X8', addedAt: now },
    { id: uuidv4(), title: 'Ya Rabba', singer: 'Kailash Kher', album: 'Salaam-E-Ishq', year: 2007, genre: 'Sufi', duration: 298, filePath: null, artworkPath: null, youtubeUrl: null, addedAt: now },
    { id: uuidv4(), title: 'Saiyyan', singer: 'Kailash Kher', album: 'Kailasa', year: 2006, genre: 'Sufi', duration: 265, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/rKAKBMGHPXs', addedAt: now },
    { id: uuidv4(), title: 'Abhi Mujh Mein Kahin', singer: 'Sonu Nigam', album: 'Agneepath', year: 2012, genre: 'Bollywood', duration: 295, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/JkULhOm3XCA', addedAt: now },
    { id: uuidv4(), title: 'Sandese Aate Hain', singer: 'Sonu Nigam', album: 'Border', year: 1997, genre: 'Patriotic', duration: 312, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/EVnGh9OaOBs', addedAt: now },
    { id: uuidv4(), title: 'Ek Pal Ka Jeena', singer: 'Sonu Nigam', album: 'Kaho Naa Pyaar Hai', year: 2000, genre: 'Bollywood', duration: 268, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/d1_pIBf14u0', addedAt: now },
    { id: uuidv4(), title: 'Main Hoon Na', singer: 'Sonu Nigam', album: 'Main Hoon Na', year: 2004, genre: 'Bollywood', duration: 278, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/VFNrRIz-iDQ', addedAt: now },
    { id: uuidv4(), title: 'Deewana', singer: 'Sonu Nigam', album: 'Deewana', year: 2000, genre: 'Pop', duration: 260, filePath: null, artworkPath: null, youtubeUrl: null, addedAt: now },
    { id: uuidv4(), title: 'O Humdum Suniyo Re', singer: 'Udit Narayan', album: 'Saathiya', year: 2002, genre: 'Bollywood', duration: 290, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/gCrR2FesDmg', addedAt: now },
    { id: uuidv4(), title: 'Pukarta Chala Hoon Main', singer: 'Mohd. Rafi (Cover: Sonu Nigam)', album: 'Tribute', year: 2010, genre: 'Classic', duration: 310, filePath: null, artworkPath: null, youtubeUrl: null, addedAt: now },
    { id: uuidv4(), title: 'Sach Keh Raha Hai Deewana', singer: 'KK', album: 'Rehnaa Hai Terre Dil Mein', year: 2001, genre: 'Bollywood', duration: 282, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/xLR-MNsDXNQ', addedAt: now },
    { id: uuidv4(), title: 'Alvida', singer: 'KK', album: 'Life in a Metro', year: 2007, genre: 'Bollywood', duration: 258, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/Ag7ygrDzgxo', addedAt: now },
    { id: uuidv4(), title: 'Ankhon Mein Teri', singer: 'KK', album: 'Om Shanti Om', year: 2007, genre: 'Bollywood', duration: 238, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/I6k3IvFtVrA', addedAt: now },
    { id: uuidv4(), title: 'Khuda Jaane', singer: 'KK', album: 'Bachna Ae Haseeno', year: 2008, genre: 'Bollywood', duration: 270, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/pS_C7lmxhQI', addedAt: now },
    { id: uuidv4(), title: 'Ajab Si', singer: 'KK', album: 'Om Shanti Om', year: 2007, genre: 'Bollywood', duration: 248, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/R7bYqG6M7W4', addedAt: now },
    { id: uuidv4(), title: 'Abhi Abhi', singer: 'KK', album: 'Jism 2', year: 2012, genre: 'Bollywood', duration: 260, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/8TKA4FOwj0E', addedAt: now },
    { id: uuidv4(), title: 'Rehna Tu', singer: 'A.R. Rahman', album: 'Delhi-6', year: 2009, genre: 'Bollywood', duration: 298, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/pXE7A_L9jL8', addedAt: now },
    { id: uuidv4(), title: 'Tum Se Hi', singer: 'Mohit Chauhan', album: 'Jab We Met', year: 2007, genre: 'Bollywood', duration: 278, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/yt8PfIJ1s6o', addedAt: now },
    { id: uuidv4(), title: 'Dooba Dooba', singer: 'Mohit Chauhan', album: 'Silk Route', year: 1997, genre: 'Pop', duration: 265, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/BtZ7hs4fNmo', addedAt: now },
    { id: uuidv4(), title: 'Masakali', singer: 'Mohit Chauhan', album: 'Delhi-6', year: 2009, genre: 'Bollywood', duration: 255, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/mVaEYKPyiGY', addedAt: now },
    { id: uuidv4(), title: 'Ye Dooriyan', singer: 'Mohit Chauhan', album: 'Love Aaj Kal', year: 2009, genre: 'Bollywood', duration: 268, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/u7PJ0CyCxRE', addedAt: now },
    { id: uuidv4(), title: 'Pee Loon', singer: 'Mohit Chauhan', album: 'Once Upon a Time in Mumbai', year: 2010, genre: 'Bollywood', duration: 248, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/OvDuN1nJXjU', addedAt: now },
    { id: uuidv4(), title: 'Subha Hone Na De', singer: 'Mika Singh', album: 'Desi Boyz', year: 2011, genre: 'Bollywood', duration: 245, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/VFNrRIz-iDQ', addedAt: now },
    { id: uuidv4(), title: 'Swades Main', singer: 'Udit Narayan', album: 'Swades', year: 2004, genre: 'Patriotic', duration: 320, filePath: null, artworkPath: null, youtubeUrl: null, addedAt: now },
    { id: uuidv4(), title: 'Yeh Jo Des Hai Tera', singer: 'A.R. Rahman', album: 'Swades', year: 2004, genre: 'Patriotic', duration: 278, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/M1B3RFgvHzI', addedAt: now },
    { id: uuidv4(), title: 'Bharat Mata Ki Jai', singer: 'Shankar Mahadevan', album: 'Lakshya', year: 2004, genre: 'Patriotic', duration: 302, filePath: null, artworkPath: null, youtubeUrl: null, addedAt: now },
    { id: uuidv4(), title: 'Iktara', singer: 'Amit Trivedi', album: 'Wake Up Sid', year: 2009, genre: 'Indie', duration: 265, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/LbJhQxNZXbk', addedAt: now },
    { id: uuidv4(), title: 'Daryaa', singer: 'Amit Trivedi', album: 'Manmarziyaan', year: 2018, genre: 'Indie', duration: 280, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/VH95v2A8rB0', addedAt: now },
    { id: uuidv4(), title: 'Kesariya', singer: 'Arijit Singh', album: 'Brahmastra', year: 2022, genre: 'Bollywood', duration: 272, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/BddP6PYo2gs', addedAt: now },
    { id: uuidv4(), title: 'Raataan Lambiyan', singer: 'Jubin Nautiyal', album: 'Shershaah', year: 2021, genre: 'Bollywood', duration: 258, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/oQP1OqZDPF4', addedAt: now },
    { id: uuidv4(), title: 'Lut Gaye', singer: 'Jubin Nautiyal', album: 'Lut Gaye', year: 2021, genre: 'Pop', duration: 245, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/q-QjUEFJVOY', addedAt: now },
    { id: uuidv4(), title: 'Main Rang Sharbaton Ka', singer: 'Arijit Singh', album: 'Phata Poster Nikhla Hero', year: 2013, genre: 'Bollywood', duration: 280, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/QHDtQkpGFaE', addedAt: now },
    { id: uuidv4(), title: 'Shayad', singer: 'Arijit Singh', album: 'Love Aaj Kal', year: 2020, genre: 'Bollywood', duration: 258, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/Shr1MBsP1hw', addedAt: now },
    { id: uuidv4(), title: 'Bekhayali', singer: 'Sachet Tandon', album: 'Kabir Singh', year: 2019, genre: 'Bollywood', duration: 370, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/M0ySqJqWFqo', addedAt: now },
    { id: uuidv4(), title: 'Tujhe Kitna Chahne Lage', singer: 'Arijit Singh', album: 'Kabir Singh', year: 2019, genre: 'Bollywood', duration: 278, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/3aPWE4GSNWU', addedAt: now },
    { id: uuidv4(), title: 'Tera Ban Jaunga', singer: 'Akhil Sachdeva', album: 'Kabir Singh', year: 2019, genre: 'Bollywood', duration: 248, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/SbfayKQ1lrk', addedAt: now },
    { id: uuidv4(), title: 'Dil Diyan Gallan', singer: 'Atif Aslam', album: 'Tiger Zinda Hai', year: 2017, genre: 'Bollywood', duration: 295, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/F_1oU1_gHsQ', addedAt: now },
    { id: uuidv4(), title: 'Woh Lamhe Woh Baatein', singer: 'Atif Aslam', album: 'Zeher', year: 2005, genre: 'Bollywood', duration: 280, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/QUGQ2OACSAE', addedAt: now },
    { id: uuidv4(), title: 'Aadat', singer: 'Atif Aslam', album: 'Kalyug', year: 2005, genre: 'Bollywood', duration: 268, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/aFNi2nX-Jmo', addedAt: now },
    { id: uuidv4(), title: 'Pehli Nazar Mein', singer: 'Atif Aslam', album: 'Race', year: 2008, genre: 'Bollywood', duration: 265, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/oFmGNiHqf_o', addedAt: now },
    { id: uuidv4(), title: 'Tu Jaane Na', singer: 'Atif Aslam', album: 'Ajab Prem Ki Ghazab Kahani', year: 2009, genre: 'Bollywood', duration: 275, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/SXYWUVPsw8I', addedAt: now },
    { id: uuidv4(), title: 'O Saathi Re', singer: 'Udit Narayan', album: 'Omkara', year: 2006, genre: 'Bollywood', duration: 298, filePath: null, artworkPath: null, youtubeUrl: null, addedAt: now },
    { id: uuidv4(), title: 'Teri Meri', singer: 'Rahat Fateh Ali Khan', album: 'Bodyguard', year: 2011, genre: 'Bollywood', duration: 255, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/aV1MrRm2dXU', addedAt: now },
    { id: uuidv4(), title: 'Sajda', singer: 'Rahat Fateh Ali Khan', album: 'My Name Is Khan', year: 2010, genre: 'Sufi', duration: 310, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/yb_YfSTl4gw', addedAt: now },
    { id: uuidv4(), title: 'Aaj Din Chadheya', singer: 'Rahat Fateh Ali Khan', album: 'Love Aaj Kal', year: 2009, genre: 'Bollywood', duration: 265, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/jxixaIVqWmc', addedAt: now },
    { id: uuidv4(), title: 'Ve Maahi', singer: 'Arijit Singh', album: 'Kesari', year: 2019, genre: 'Bollywood', duration: 252, filePath: null, artworkPath: null, youtubeUrl: 'https://youtu.be/IDhNvnNHwKI', addedAt: now },
    { id: uuidv4(), title: 'Dua Karo', singer: 'Arijit Singh', album: 'Street Dancer 3D', year: 2020, genre: 'Bollywood', duration: 268, filePath: null, artworkPath: null, youtubeUrl: null, addedAt: now },
  ];
}

// CRUD operations
export function getAllSongs(): Song[] {
  return db.prepare(`
    SELECT id, title, singer, album, year, genre, duration,
           file_path as filePath, artwork_path as artworkPath, youtube_url as youtubeUrl,
           play_count as playCount, is_favorite as isFavorite,
           last_played as lastPlayed, added_at as addedAt
    FROM songs ORDER BY title
  `).all() as Song[];
}

export function getSongById(id: string): Song | null {
  return db.prepare(`
    SELECT id, title, singer, album, year, genre, duration,
           file_path as filePath, artwork_path as artworkPath, youtube_url as youtubeUrl,
           play_count as playCount, is_favorite as isFavorite,
           last_played as lastPlayed, added_at as addedAt
    FROM songs WHERE id = ?
  `).get(id) as Song | null;
}

export function searchSongs(query: string, filters: Record<string, string | number>): Song[] {
  let sql = `
    SELECT id, title, singer, album, year, genre, duration,
           file_path as filePath, artwork_path as artworkPath, youtube_url as youtubeUrl,
           play_count as playCount, is_favorite as isFavorite,
           last_played as lastPlayed, added_at as addedAt
    FROM songs WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (query) {
    sql += ` AND (title LIKE ? OR singer LIKE ? OR album LIKE ? OR genre LIKE ?)`;
    const q = `%${query}%`;
    params.push(q, q, q, q);
  }
  if (filters.singer) { sql += ` AND singer LIKE ?`; params.push(`%${filters.singer}%`); }
  if (filters.album) { sql += ` AND album LIKE ?`; params.push(`%${filters.album}%`); }
  if (filters.genre) { sql += ` AND genre LIKE ?`; params.push(`%${filters.genre}%`); }
  if (filters.year) { sql += ` AND year = ?`; params.push(filters.year); }

  sql += ` ORDER BY title`;
  return db.prepare(sql).all(...params) as Song[];
}

export function insertSong(song: Omit<Song, 'playCount' | 'isFavorite' | 'lastPlayed' | 'addedAt'>): Song {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO songs (id, title, singer, album, year, genre, duration, file_path, artwork_path, youtube_url, play_count, is_favorite, last_played, added_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, ?)
  `).run(song.id, song.title, song.singer, song.album, song.year, song.genre, song.duration,
    song.filePath, song.artworkPath, song.youtubeUrl, now);
  return getSongById(song.id) as Song;
}

export function updateSong(id: string, updates: Partial<Song>): void {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  const fieldMap: Record<string, string> = {
    title: 'title', singer: 'singer', album: 'album', year: 'year',
    genre: 'genre', duration: 'duration', filePath: 'file_path',
    artworkPath: 'artwork_path', youtubeUrl: 'youtube_url',
    playCount: 'play_count', isFavorite: 'is_favorite',
    lastPlayed: 'last_played',
  };

  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in updates) {
      fields.push(`${col} = ?`);
      const val = updates[key as keyof Song];
      values.push(val === true ? 1 : val === false ? 0 : (val as string | number | null));
    }
  }

  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE songs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteSong(id: string): void {
  db.prepare('DELETE FROM songs WHERE id = ?').run(id);
}

export function getAllPlaylists(): { id: string; name: string; description: string; createdAt: string; updatedAt: string; isDefault: number; songCount: number }[] {
  return db.prepare(`
    SELECT p.id, p.name, p.description,
           p.created_at as createdAt, p.updated_at as updatedAt,
           p.is_default as isDefault,
           COUNT(ps.song_id) as songCount
    FROM playlists p
    LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
    GROUP BY p.id ORDER BY p.is_default DESC, p.name
  `).all() as { id: string; name: string; description: string; createdAt: string; updatedAt: string; isDefault: number; songCount: number }[];
}

export function getPlaylistSongs(playlistId: string): Song[] {
  return db.prepare(`
    SELECT s.id, s.title, s.singer, s.album, s.year, s.genre, s.duration,
           s.file_path as filePath, s.artwork_path as artworkPath, s.youtube_url as youtubeUrl,
           s.play_count as playCount, s.is_favorite as isFavorite,
           s.last_played as lastPlayed, s.added_at as addedAt
    FROM songs s
    JOIN playlist_songs ps ON s.id = ps.song_id
    WHERE ps.playlist_id = ?
    ORDER BY ps.position
  `).all(playlistId) as Song[];
}

export function createPlaylist(name: string, description: string): string {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO playlists (id, name, description, created_at, updated_at, is_default)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(id, name, description, now, now);
  return id;
}

export function renamePlaylist(id: string, name: string): void {
  db.prepare('UPDATE playlists SET name = ?, updated_at = ? WHERE id = ?')
    .run(name, new Date().toISOString(), id);
}

export function deletePlaylist(id: string): void {
  db.prepare('DELETE FROM playlists WHERE id = ? AND is_default = 0').run(id);
}

export function addSongToPlaylist(playlistId: string, songId: string): void {
  const maxPos = (db.prepare('SELECT MAX(position) as m FROM playlist_songs WHERE playlist_id = ?').get(playlistId) as { m: number | null }).m ?? -1;
  db.prepare('INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)')
    .run(playlistId, songId, maxPos + 1);
  db.prepare('UPDATE playlists SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), playlistId);
}

export function removeSongFromPlaylist(playlistId: string, songId: string): void {
  db.prepare('DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?').run(playlistId, songId);
}

export function reorderPlaylistSongs(playlistId: string, songIds: string[]): void {
  const update = db.prepare('UPDATE playlist_songs SET position = ? WHERE playlist_id = ? AND song_id = ?');
  const reorder = db.transaction((ids: string[]) => {
    ids.forEach((id, idx) => update.run(idx, playlistId, id));
  });
  reorder(songIds);
}

export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

export function getSettings(): AppSettings {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return {
    volume: parseFloat(map.volume ?? '0.8'),
    muted: map.muted === 'true',
    theme: (map.theme as 'dark' | 'light') ?? 'dark',
    viewMode: (map.viewMode as 'grid' | 'list') ?? 'list',
    sortBy: (map.sortBy as AppSettings['sortBy']) ?? 'title',
    sortOrder: (map.sortOrder as 'asc' | 'desc') ?? 'asc',
    repeatMode: (map.repeatMode as AppSettings['repeatMode']) ?? 'none',
    shuffle: map.shuffle === 'true',
    lastPlaylistId: map.lastPlaylistId || null,
    lastSongId: map.lastSongId || null,
    lastPosition: parseFloat(map.lastPosition ?? '0'),
  };
}

export function getRecentlyPlayed(limit = 20): Song[] {
  return db.prepare(`
    SELECT id, title, singer, album, year, genre, duration,
           file_path as filePath, artwork_path as artworkPath, youtube_url as youtubeUrl,
           play_count as playCount, is_favorite as isFavorite,
           last_played as lastPlayed, added_at as addedAt
    FROM songs WHERE last_played IS NOT NULL
    ORDER BY last_played DESC LIMIT ?
  `).all(limit) as Song[];
}

export function getMostPlayed(limit = 20): Song[] {
  return db.prepare(`
    SELECT id, title, singer, album, year, genre, duration,
           file_path as filePath, artwork_path as artworkPath, youtube_url as youtubeUrl,
           play_count as playCount, is_favorite as isFavorite,
           last_played as lastPlayed, added_at as addedAt
    FROM songs WHERE play_count > 0
    ORDER BY play_count DESC LIMIT ?
  `).all(limit) as Song[];
}

export function getFavoriteSongs(): Song[] {
  return db.prepare(`
    SELECT id, title, singer, album, year, genre, duration,
           file_path as filePath, artwork_path as artworkPath, youtube_url as youtubeUrl,
           play_count as playCount, is_favorite as isFavorite,
           last_played as lastPlayed, added_at as addedAt
    FROM songs WHERE is_favorite = 1 ORDER BY title
  `).all() as Song[];
}

export function incrementPlayCount(id: string): void {
  db.prepare('UPDATE songs SET play_count = play_count + 1, last_played = ? WHERE id = ?')
    .run(new Date().toISOString(), id);
}

export function toggleFavorite(id: string): boolean {
  const song = db.prepare('SELECT is_favorite FROM songs WHERE id = ?').get(id) as { is_favorite: number } | undefined;
  if (!song) return false;
  const newVal = song.is_favorite ? 0 : 1;
  db.prepare('UPDATE songs SET is_favorite = ? WHERE id = ?').run(newVal, id);
  return newVal === 1;
}
