<template>
  <v-app-bar border="b" class="app-header" color="surface" height="64" flat>
    <template #prepend>
      <div class="app-header__brand">
        <v-avatar color="primary" size="36">
          <v-icon icon="mdi-image-edit-outline" size="20" />
        </v-avatar>
        <div>
          <h1>Image Editor</h1>
          <p>Non-destructive editing workspace</p>
        </div>
      </div>
    </template>

    <template #append>
      <v-btn
        :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
        :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
        variant="text"
        @click="toggleTheme"
      />
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

function toggleTheme() {
  theme.change(isDark.value ? 'lightNeutral' : 'darkNeutral')
}
</script>

<style scoped>
.app-header {
  backdrop-filter: blur(16px);
}

.app-header__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding-inline-start: 8px;
}

.app-header__brand h1 {
  margin: 0;
  overflow: hidden;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-header__brand p {
  margin: 2px 0 0;
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface), 0.68);
  font-size: 0.78rem;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 520px) {
  .app-header__brand p {
    display: none;
  }
}
</style>
