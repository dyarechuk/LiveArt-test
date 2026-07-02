import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  },
  theme: {
    defaultTheme: 'darkNeutral',
    themes: {
      darkNeutral: {
        dark: true,
        colors: {
          background: '#101214',
          surface: '#171a1f',
          'surface-bright': '#20242b',
          'surface-light': '#262b33',
          primary: '#7dd3fc',
          secondary: '#c4b5fd',
          accent: '#f8d477',
          error: '#f87171',
          info: '#60a5fa',
          success: '#34d399',
          warning: '#fbbf24'
        }
      },
      lightNeutral: {
        dark: false,
        colors: {
          background: '#f4f6f8',
          surface: '#ffffff',
          'surface-bright': '#ffffff',
          'surface-light': '#edf1f5',
          primary: '#0369a1',
          secondary: '#6d5dfc',
          accent: '#b45309',
          error: '#dc2626',
          info: '#2563eb',
          success: '#059669',
          warning: '#d97706'
        }
      }
    }
  },
  defaults: {
    VBtn: {
      rounded: 'lg',
      variant: 'flat'
    },
    VCard: {
      rounded: 'lg',
      elevation: 0
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable'
    },
    VSlider: {
      color: 'primary',
      trackColor: 'surface-light'
    }
  }
})
