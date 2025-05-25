import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
 plugins: [react()],
 server: {
   host: true, // This makes the server accessible externally (from Docker)
   port: 3000  // Explicitly set the port to 3000
 }
})
