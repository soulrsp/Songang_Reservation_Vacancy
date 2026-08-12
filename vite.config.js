import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub 레포지토리 이름을 자동 인식하여 웹 경로 설정
const repoName = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : '';
const base = repoName ? `/${repoName}/` : './';

export default defineConfig({
  base: base,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
