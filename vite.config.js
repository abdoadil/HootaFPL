import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/HootaFPL/', // 👈 هذا هو السطر الأهم الذي يحل الشاشة البيضاء
})