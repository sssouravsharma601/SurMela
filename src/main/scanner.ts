import fs from 'fs';
import path from 'path';
import { getDb } from './database';

const AUDIO_EXTS = new Set(['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac']);

interface ScanResult {
  matched: number;
  unmatched: string[];
  total: number;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  // Count matching words
  const wa = new Set(na.split(' '));
  const wb = nb.split(' ');
  const common = wb.filter(w => wa.has(w)).length;
  const total = Math.max(wa.size, wb.length);
  return total > 0 ? common / total : 0;
}

function collectAudioFiles(dir: string, out: string[] = []): string[] {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectAudioFiles(full, out);
      } else if (AUDIO_EXTS.has(path.extname(entry.name).toLowerCase())) {
        out.push(full);
      }
    }
  } catch {
    // skip unreadable dirs
  }
  return out;
}

export function scanMusicFolder(folderPath: string): ScanResult {
  const db = getDb();
  const audioFiles = collectAudioFiles(folderPath);

  type SongRow = { id: string; title: string; singer: string };
  const songs = db.prepare('SELECT id, title, singer FROM songs WHERE file_path IS NULL').all() as SongRow[];

  const updateStmt = db.prepare('UPDATE songs SET file_path = ? WHERE id = ?');
  const matched: Set<string> = new Set();
  const unmatched: string[] = [];

  for (const filePath of audioFiles) {
    const filename = path.basename(filePath, path.extname(filePath));

    let bestSong: SongRow | null = null;
    let bestScore = 0;

    for (const song of songs) {
      if (matched.has(song.id)) continue;

      // Score against title alone, and title + singer combined
      const scoreTitle = similarity(filename, song.title);
      const scoreCombined = similarity(filename, `${song.title} ${song.singer}`);
      const score = Math.max(scoreTitle, scoreCombined);

      if (score > bestScore) {
        bestScore = score;
        bestSong = song;
      }
    }

    if (bestSong && bestScore >= 0.5) {
      updateStmt.run(filePath, bestSong.id);
      matched.add(bestSong.id);
      console.log(`[Scanner] Matched: "${path.basename(filePath)}" → "${bestSong.title}" (score: ${bestScore.toFixed(2)})`);
    } else {
      unmatched.push(path.basename(filePath));
      console.log(`[Scanner] No match: "${path.basename(filePath)}" (best score: ${bestScore.toFixed(2)})`);
    }
  }

  return {
    matched: matched.size,
    unmatched,
    total: audioFiles.length,
  };
}
