/*
 * Tests: npm test. Eigene Konfiguration statt vite.config.ts, damit die Tests
 * nichts vom Seiten-Build (Launcher kopieren, Offline-Liste) mitschleppen.
 * Testdateien liegen neben dem Code: apps/<name>/src/**\/*.test.ts
 */
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@lib': resolve(import.meta.dirname, 'lib') },
  },
  test: {
    include: ['apps/**/*.test.ts', 'lib/**/*.test.ts'],
    environment: 'node',
  },
});
