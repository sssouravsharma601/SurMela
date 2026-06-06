import { formatDuration } from '../src/renderer/services/formatUtils';

describe('formatDuration', () => {
  it('formats 0 seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('formats seconds under 1 minute', () => {
    expect(formatDuration(45)).toBe('0:45');
  });

  it('formats exactly 1 minute', () => {
    expect(formatDuration(60)).toBe('1:00');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(265)).toBe('4:25');
  });

  it('formats over an hour', () => {
    expect(formatDuration(3661)).toBe('61:01');
  });

  it('handles NaN gracefully', () => {
    expect(formatDuration(NaN)).toBe('0:00');
  });
});
