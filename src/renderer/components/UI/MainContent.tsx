import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Song } from '../../../shared/types';
import PlaylistView from '../Playlist/PlaylistView';
import LibraryView from '../Library/LibraryView';
import SearchView from '../Search/SearchView';
import SongListView from '../Library/SongListView';

interface MainContentProps {
  onPlaySong: (song: Song, autoplay?: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function MainContent({ onPlaySong, onNext, onPrev }: MainContentProps) {
  const { activeView, setCurrentPlaylistSongs } = useAppStore();
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [mostPlayed, setMostPlayed] = useState<Song[]>([]);
  const [favorites, setFavorites] = useState<Song[]>([]);

  useEffect(() => {
    if (activeView === 'recently-played') {
      window.electronAPI?.songs.getRecentlyPlayed(50).then(setRecentSongs);
    } else if (activeView === 'most-played') {
      window.electronAPI?.songs.getMostPlayed(50).then(setMostPlayed);
    } else if (activeView === 'favorites') {
      window.electronAPI?.songs.getFavorites().then(setFavorites);
    }
  }, [activeView]);

  const handleFavoriteToggle = async (song: Song) => {
    await window.electronAPI?.songs.toggleFavorite(song.id);
    if (activeView === 'favorites') {
      window.electronAPI?.songs.getFavorites().then(setFavorites);
    }
  };

  switch (activeView) {
    case 'playlist':
      return <PlaylistView onPlaySong={onPlaySong} />;
    case 'library':
      return <LibraryView onPlaySong={onPlaySong} />;
    case 'search':
      return <SearchView onPlaySong={onPlaySong} />;
    case 'recently-played':
      return (
        <SongListView
          title="Recently Played"
          songs={recentSongs}
          onPlaySong={onPlaySong}
          onFavoriteToggle={handleFavoriteToggle}
          emptyMessage="No recently played songs"
        />
      );
    case 'most-played':
      return (
        <SongListView
          title="Most Played"
          songs={mostPlayed}
          onPlaySong={onPlaySong}
          onFavoriteToggle={handleFavoriteToggle}
          emptyMessage="No songs played yet"
        />
      );
    case 'favorites':
      return (
        <SongListView
          title="Favorites"
          songs={favorites}
          onPlaySong={onPlaySong}
          onFavoriteToggle={handleFavoriteToggle}
          emptyMessage="No favorite songs yet"
        />
      );
    default:
      return <PlaylistView onPlaySong={onPlaySong} />;
  }
}
