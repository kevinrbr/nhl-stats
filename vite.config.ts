import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
  proxy: {
    '/api-nhl': {
      target: 'https://api-web.nhle.com',
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/api-nhl/, ''),

      configure: (proxy) => {
        proxy.on('proxyRes', (proxyRes) => {
          const location = proxyRes.headers.location;
          if (location && location.startsWith('https://api-web.nhle.com')) {
            proxyRes.headers.location = location.replace(
              'https://api-web.nhle.com',
              '/api-nhl'
            );
          }
        });
      },
    },
  },
}
})
