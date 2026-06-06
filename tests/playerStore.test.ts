import { usePlayerStore } from '../src/renderer/store/playerStore';
import { Song } from '../src/shared/types';

const mockSong = (id: string): Song => ({
  id,
  title: `Song ${id}`,
  singer: 'Test Singer',
  album: 'Test Album',
  year: 2020,
  genre: 'Bollywood',
  duration: 200,
  filePath: null,
  artworkPath: null,
  youtubeUrl: null,
  playCount: 0,
  isFavorite: false,
  lastPlayed: null,
  addedAt: new Date().toISOString(),
});

describe('playerStore', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      queue: [],
      queueIndex: -1,
      currentSong: null,
      repeatMode: 'none',
      shuffle: false,
    });
  });

  it('setQueue sets current song', () => {
    const songs = [mockSong('a'), mockSong('b'), mockSong('c')];
    usePlayerStore.getState().setQueue(songs, 1);
    expect(usePlayerStore.getState().currentSong?.id).toBe('b');
    expect(usePlayerStore.getState().queueIndex).toBe(1);
  });

  it('nextSong advances index', () => {
    const songs = [mockSong('a'), mockSong('b'), mockSong('c')];
    usePlayerStore.getState().setQueue(songs, 0);
    const next = usePlayerStore.getState().nextSong();
    expect(next?.id).toBe('b');
    expect(usePlayerStore.getState().queueIndex).toBe(1);
  });

  it('nextSong returns null at end with repeatMode none', () => {
    const songs = [mockSong('a')];
    usePlayerStore.getState().setQueue(songs, 0);
    const next = usePlayerStore.getState().nextSong();
    expect(next).toBeNull();
  });

  it('nextSong wraps with repeatMode all', () => {
    const songs = [mockSong('a'), mockSong('b')];
    usePlayerStore.setState({ queue: songs, queueIndex: 1, repeatMode: 'all' });
    const next = usePlayerStore.getState().nextSong();
    expect(next?.id).toBe('a');
  });

  it('prevSong goes back', () => {
    const songs = [mockSong('a'), mockSong('b'), mockSong('c')];
    usePlayerStore.getState().setQueue(songs, 2);
    const prev = usePlayerStore.getState().prevSong();
    expect(prev?.id).toBe('b');
  });

  it('repeatMode one returns same song', () => {
    const songs = [mockSong('x'), mockSong('y')];
    usePlayerStore.setState({ queue: songs, queueIndex: 0, repeatMode: 'one', currentSong: songs[0] });
    const next = usePlayerStore.getState().nextSong();
    expect(next?.id).toBe('x');
  });
});
