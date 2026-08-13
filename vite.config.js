import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dynamic base path resolution for GitHub Pages subdirectories
const repoName = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : '';
const base = repoName ? `/${repoName}/` : './';

// https://vite.dev/config/
export default defineConfig({
  base: base,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/djsiseol-api': {
        target: 'https://www.djsiseol.or.kr',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/djsiseol-api/, '')
      }
    }
  }
})
