# SurMela 🎵

A modern cross-platform desktop music player and playlist manager built with **Electron + React + TypeScript**.

## Features

- **100+ songs** pre-loaded from male singers spanning 1990s–present (Bollywood, Sufi, Pop, Indie)
- **Full audio playback**: Play, Pause, Stop, Next, Previous, Seek ±5s
- **Repeat modes**: None, Repeat One, Repeat All
- **Shuffle** playback
- **Volume control** with mute/unmute and slider
- **Multiple playlists**: Create, rename, delete, add/remove songs
- **Library view** of all songs with grid and list modes
- **Search** by song name, singer, album, genre, or year (instant results)
- **Favorites**, **Recently Played**, **Most Played** views
- **Dark / Light theme** with modern UI
- **Keyboard shortcuts** for all major actions
- **SQLite persistence** for playlists and settings
- **Session recovery**: remembers last playlist and position
- YouTube URL storage + open-in-browser support
- Album artwork display
- Custom frameless titlebar with minimize/maximize/close/fullscreen

---

## Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| Play / Pause | `Space` |
| Next Song | `Ctrl/Cmd + →` |
| Previous Song | `Ctrl/Cmd + ←` |
| Volume Up | `Ctrl/Cmd + ↑` |
| Volume Down | `Ctrl/Cmd + ↓` |
| Search | `Ctrl/Cmd + F` |
| Mute | `Ctrl/Cmd + M` |
| Fullscreen | `F11` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Shell | Electron 31 |
| UI Framework | React 18 + TypeScript |
| Bundler | Vite 5 |
| State Management | Zustand |
| Styling | Tailwind CSS 3 |
| Audio | Howler.js |
| Database | SQLite (better-sqlite3) |
| Settings | electron-store |

---

## Project Structure

```
SurMela/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # App bootstrap, BrowserWindow
│   │   ├── database.ts # SQLite schema, seed data, queries
│   │   ├── ipc.ts      # IPC handlers
│   │   └── preload.ts  # Context bridge API
│   ├── renderer/       # React app (Vite)
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Player/     # PlayerBar
│   │   │   ├── Playlist/   # PlaylistView, SongRow, SongCard
│   │   │   ├── Library/    # LibraryView, SongListView
│   │   │   ├── Search/     # SearchView
│   │   │   ├── TitleBar/   # Custom titlebar
│   │   │   └── UI/         # Sidebar, MainContent
│   │   ├── hooks/          # useAudio, useKeyboardShortcuts
│   │   ├── services/       # audioService, formatUtils
│   │   ├── store/          # Zustand stores (player, app)
│   │   └── styles/
│   └── shared/
│       └── types.ts    # Shared TypeScript types
├── tests/              # Jest unit tests
├── resources/          # App icons
└── dist/               # Build output
```

---

## Database Schema

```sql
songs          -- All song metadata
playlists      -- Playlist definitions
playlist_songs -- Many-to-many join (ordered)
settings       -- Key/value app settings
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
cd SurMela
npm install
```

### Development

```bash
npm run dev
```

This starts the Vite dev server on `http://localhost:5173` and launches Electron in dev mode.

### Build

```bash
# Build both main and renderer
npm run build

# Package for macOS
npm run dist:mac

# Package for Windows
npm run dist:win
```

Packaged apps are output to `release/`.

### Run Tests

```bash
npm test
```

---

## Adding Your Music

1. Click **"Add Song"** in any playlist
2. Fill in song metadata (Title and Singer are required)
3. Browse to select a local `.mp3` / `.flac` / `.wav` file
4. Optionally paste a YouTube URL for songs you don't have locally

---

## Copyright Notice

SurMela does **not** download or distribute copyrighted audio. It is a local music player. YouTube URLs are stored as metadata links only — clicking them opens the URL in your system browser. Users are responsible for ensuring they have the right to play any audio files added to the app.

---

## License

MIT © Sourav Sharma
