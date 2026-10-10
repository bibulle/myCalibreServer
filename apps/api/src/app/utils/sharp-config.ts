import { Logger } from '@nestjs/common';
import * as sharpNs from 'sharp';
// cf. books.service.ts: the namespace is not callable with the ESM typings of sharp 0.35
const sharp = sharpNs as unknown as typeof sharpNs.default;

export const SHARP_DEFAULT_CONCURRENCY = 1;
export const SHARP_DEFAULT_CACHE_MEMORY_MB = 16;

function readInt(value: string | undefined, min: number): number | undefined {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isInteger(parsed) && parsed >= min ? parsed : undefined;
}

/**
 * Bound what sharp/libvips may use. By default libvips starts one thread per CPU core of
 * the *node* (it ignores the container CPU limit) and keeps a 50 MB operation cache plus
 * 20 open files: far too much for a small pod doing background thumbnails.
 */
export function configureSharp(env: NodeJS.ProcessEnv = process.env): { concurrency: number; cacheMemoryMb: number } {
  const concurrency = readInt(env.SHARP_CONCURRENCY, 1) ?? SHARP_DEFAULT_CONCURRENCY;
  const cacheMemoryMb = readInt(env.SHARP_CACHE_MEMORY_MB, 0) ?? SHARP_DEFAULT_CACHE_MEMORY_MB;

  sharp.concurrency(concurrency);
  sharp.cache(cacheMemoryMb === 0 ? false : { memory: cacheMemoryMb, files: 0, items: 100 });

  Logger.log(`sharp : concurrency=${concurrency}, cache=${cacheMemoryMb} MB`, 'SharpConfig');
  return { concurrency, cacheMemoryMb };
}
