import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')

    return {
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
            port: 8080,
            proxy: {
                '/api': {
                    target: env.VITE_PROXY_TARGET,
                    changeOrigin: true,
                    secure: false,
                    ws: true,
                },
                '/auth': {
                    target: env.VITE_PROXY_TARGET,
                    changeOrigin: true,
                    secure: false,
                    ws: true,
                },
                '/uploads': {
                    target: env.VITE_PROXY_TARGET,
                    changeOrigin: true,
                    secure: false,
                },
                '/ws': {
                    target: env.VITE_PROXY_TARGET,
                    changeOrigin: true,
                    secure: false,
                    ws: true,
                },
                '/ws-chat': {
                    target: env.VITE_PROXY_TARGET,
                    changeOrigin: true,
                    secure: false,
                    ws: true,
                },
            },
        },
    }
})