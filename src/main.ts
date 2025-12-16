import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient } from './api/client/queryClient'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(VueQueryPlugin, { queryClient })
app.use(createPinia())
app.use(router)

app.mount('#app')
