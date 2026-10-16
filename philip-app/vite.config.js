import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import process from 'node:process'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');
  let apiOrigin = '';
  if (/^https?:\/\//.test(env.VITE_API_URL || '')) apiOrigin = new URL(env.VITE_API_URL).origin;
  return {
  server: {
    proxy: Object.fromEntries(['/api', '/uploads'].map(route => [route, {
      target: process.env.LOCAL_API_TARGET || 'http://localhost:5000', changeOrigin: true,
    }])),
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'production-security-policy',
      apply: 'build',
      transformIndexHtml: () => [{ tag: 'meta', attrs: {
        'http-equiv': 'Content-Security-Policy',
        content: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self' ${apiOrigin}; object-src 'none'; base-uri 'self'; form-action 'self'`,
      }, injectTo: 'head-prepend' }],
    },
  ],
  resolve: {
    alias: {
    },
  },
  };
})
