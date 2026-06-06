import React, { useState, useCallback, useRef } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Song } from '../../../shared/types';
import { usePlayerStore } from '../../store/playerStore';
import SongRow from '../Playlist/SongRow';

interface SearchViewProps {
  onPlaySong: (song: Song, autoplay?: boolean) => void;
}

export default function SearchView({ onPlaySong }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [searching, setSearching] = useState(false);
  const [filters, setFilters] = useState({ singer: '', genre: '', year: '' });
  const [showFilters, setShowFilters] = useState(false);
  const { currentSong, isPlaying, setQueue } = usePlayerStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string, f: typeof filters) => {
    if (!q.trim() && !f.singer && !f.genre && !f.year) {
      setResults([]);
      return;
    }
    setSearching(true);
    const filterMap: Record<string, string | number> = {};
    if (f.singer) filterMap.singer = f.singer;
    if (f.genre) filterMap.genre = f.genre;
    if (f.year) filterMap.year = parseInt(f.year);
    const res = await window.electronAPI?.songs.search(q, filterMap) ?? [];
    setResults(res);
    setSearching(false);
  }, []);

  const handleQuery = (q: string) => {
    setQuery(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(q, filters), 300);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(query, newFilters), 300);
  };

  const handlePlay = (song: Song, index: number) => {
    setQueue(results, index);
    onPlaySong(song, true);
    window.electronAPI?.songs.incrementPlayCount(song.id);
  };

  const handleFavorite = async (song: Song) => {
    await window.electronAPI?.songs.toggleFavorite(song.id);
    setResults(prev => prev.map(s => s.id === song.id ? { ...s, isFavorite: !s.isFavorite } : s));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search header */}
      <div className="px-6 py-4 border-b border-white/5 flex-shrink-0 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            data-search-input
            type="text"
            value={query}
            onChange={e => handleQuery(e.target.value)}
            placeholder="Search songs, singers, albums..."
            className="w-full bg-surface-700 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-primary-500 transition-colors"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-700 text-sm text-white/50 hover:text-white transition-colors"
          >
            <Filter size={13} /> Filters
          </button>
          {results.length > 0 && (
            <span className="text-sm text-white/30">{results.length} results</span>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'singer', placeholder: 'Singer' },
              { key: 'genre', placeholder: 'Genre' },
              { key: 'year', placeholder: 'Year' },
            ].map(({ key, placeholder }) => (
              <input
                key={key}
                type={key === 'year' ? 'number' : 'text'}
                value={filters[key as keyof typeof filters]}
                onChange={e => handleFilterChange(key, e.target.value)}
                placeholder={placeholder}
                className="bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-primary-500"
              />
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {searching ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30">
            <Search size={48} className="mb-3 opacity-20" />
            <p>{query ? 'No songs found' : 'Search your music library'}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {results.map((song, idx) => (
              <SongRow
                key={song.id}
                song={song}
                index={idx}
                isActive={currentSong?.id === song.id}
                isPlaying={isPlaying && currentSong?.id === song.id}
                onPlay={() => handlePlay(song, idx)}
                onFavorite={() => handleFavorite(song)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
