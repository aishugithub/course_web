import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ⚠️ Change ONLY this line per course — must match your GitHub repo name
// exactly (including case), since GitHub Pages serves the site from
// https://<user>.github.io/<repo-name>/ and every asset path is built
// relative to this "base" value.
export default defineConfig({
  plugins: [react()],
  base: '/course_web/',
})
