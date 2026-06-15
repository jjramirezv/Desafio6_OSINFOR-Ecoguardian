import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Demo frontend. El puerto 8000 y 8123 ya estan ocupados (Laravel),
// asi que el dev server usa el 5173 por defecto de Vite.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
});
