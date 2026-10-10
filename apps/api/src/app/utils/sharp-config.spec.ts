import * as sharpNs from 'sharp';
import { configureSharp, SHARP_DEFAULT_CACHE_MEMORY_MB, SHARP_DEFAULT_CONCURRENCY } from './sharp-config';

const sharp = sharpNs as unknown as typeof sharpNs.default;

describe('configureSharp', () => {
  let concurrencySpy: jest.SpyInstance;
  let cacheSpy: jest.SpyInstance;

  beforeEach(() => {
    concurrencySpy = jest.spyOn(sharp, 'concurrency').mockReturnValue(1);
    cacheSpy = jest.spyOn(sharp, 'cache').mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should apply small defaults when nothing is configured', () => {
    const result = configureSharp({});

    expect(result).toEqual({ concurrency: SHARP_DEFAULT_CONCURRENCY, cacheMemoryMb: SHARP_DEFAULT_CACHE_MEMORY_MB });
    expect(concurrencySpy).toHaveBeenCalledWith(SHARP_DEFAULT_CONCURRENCY);
    expect(cacheSpy).toHaveBeenCalledWith({ memory: SHARP_DEFAULT_CACHE_MEMORY_MB, files: 0, items: 100 });
  });

  it('should use the values from the environment', () => {
    const result = configureSharp({ SHARP_CONCURRENCY: '3', SHARP_CACHE_MEMORY_MB: '64' });

    expect(result).toEqual({ concurrency: 3, cacheMemoryMb: 64 });
    expect(concurrencySpy).toHaveBeenCalledWith(3);
    expect(cacheSpy).toHaveBeenCalledWith({ memory: 64, files: 0, items: 100 });
  });

  it('should disable the cache when SHARP_CACHE_MEMORY_MB is 0', () => {
    configureSharp({ SHARP_CACHE_MEMORY_MB: '0' });

    expect(cacheSpy).toHaveBeenCalledWith(false);
  });

  it('should fall back to the defaults on invalid values', () => {
    const result = configureSharp({ SHARP_CONCURRENCY: '0', SHARP_CACHE_MEMORY_MB: 'abc' });

    expect(result).toEqual({ concurrency: SHARP_DEFAULT_CONCURRENCY, cacheMemoryMb: SHARP_DEFAULT_CACHE_MEMORY_MB });
  });
});
