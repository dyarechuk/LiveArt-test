<template>
  <div class="image-preview">
    <img
      :alt="image.name"
      class="image-preview__image"
      :src="image.objectUrl"
      :style="{ filter }"
    />
  </div>
</template>

<script setup lang="ts">
import type { OriginalImage } from '@/features/editor/types/editor'

defineProps<{
  filter: string
  image: OriginalImage
}>()
</script>

<style scoped>
.image-preview {
  display: grid;
  min-height: 520px;
  overflow: hidden;
  place-items: center;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  background-color: rgba(var(--v-theme-surface), 0.72);
  background-image:
    linear-gradient(45deg, rgba(var(--v-theme-on-surface), 0.05) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(var(--v-theme-on-surface), 0.05) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(var(--v-theme-on-surface), 0.05) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(var(--v-theme-on-surface), 0.05) 75%);
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0;
  background-size: 20px 20px;
}

.image-preview__image {
  display: block;
  max-width: min(100%, 1200px);
  max-height: min(72vh, 760px);
  object-fit: contain;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}

@media (max-width: 960px) {
  .image-preview {
    min-height: 380px;
  }

  .image-preview__image {
    max-height: 58vh;
  }
}
</style>
