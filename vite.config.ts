/// <reference types="vitest" />
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Lists every emitted file under assets/ (bundles, fonts, photos) in dist/precache.json,
// relative to the base, so the service worker can keep exactly those cached offline.
// .woff is skipped: every browser that runs the worker uses the .woff2 next to it.
function precacheManifest(): Plugin {
  return {
    name: 'ff-precache-manifest',
    apply: 'build',
    writeBundle(options, bundle) {
      const files = Object.keys(bundle)
        .filter((f) => f.startsWith('assets/') && !f.endsWith('.woff'))
        .sort();
      writeFileSync(join(options.dir!, 'precache.json'), JSON.stringify(files));
    },
  };
}

// Build-only: the dev server injects inline scripts (React refresh preamble) this CSP blocks.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'ff-csp',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
    ],
  };
}

export default defineConfig({
  // Where the app is served from. GitHub Pages serves project sites under
  // /<repo-name>/, so CI sets BASE_PATH; locally it stays at the root.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), precacheManifest(), contentSecurityPolicy()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
