import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/app/App.vue'
import { vuetify } from '@/app/plugins/vuetify'
import '@/app/styles/main.scss'

createApp(App).use(createPinia()).use(vuetify).mount('#app')
