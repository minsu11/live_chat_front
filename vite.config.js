import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import vuetify from 'vite-plugin-vuetify'


// https://vite.dev/config/
export default defineConfig({
    plugins: [
    vue(),
    vueDevTools(),
      vuetify(),
  ],
    define: {
      global: 'window',
    },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
    server: {
        port:8080,
        proxy: {
            '/api': {
                target: 'https://chatalk.store',
                changeOrigin: true,
                secure:false,
            },
            '/auth':{
                target: 'https://chatalk.store',
                changeOrigin: true,
            },
            '/ws': {
                target: 'https://chatalk.store',
                changeOrigin: true,
                ws: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/ws/, '/ws'), // 이 부분은 그대로지만 명시해두는 게 좋아

            },
          '/uploads': {
            target: 'https://chatalk.store',
            changeOrigin: true,
            ws: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/ws/, '/ws'), // 이 부분은 그대로지만 명시해두는 게 좋아

          }

        }
    },
})
