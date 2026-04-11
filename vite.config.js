import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: '/atividade-avaliativa-qualidade-de-software/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
