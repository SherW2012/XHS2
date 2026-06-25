import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 相对 base：构建产物可放在任意子路径 / 对象存储 / CDN 下直接运行
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
});
