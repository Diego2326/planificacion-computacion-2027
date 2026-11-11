import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  base: '/planificacion-computacion-2027/',
  plugins: [svelte()],
});
