import { defineConfig } from 'tsup';

export default defineConfig([
  // Library
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    target: 'es2022',
    sourcemap: true,
    splitting: false,
  },
  // CLI
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    dts: false,
    target: 'es2022',
    sourcemap: false,
    splitting: false,
    banner: { js: '#!/usr/bin/env bun' },
  },
]);
