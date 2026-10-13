import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Demo build: base tương đối để mở được từ mọi đường dẫn static hosting.
  base: process.env.VITE_DEMO === '1' ? './' : '/',
})
