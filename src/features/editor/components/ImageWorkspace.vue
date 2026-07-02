<template>
  <main class="image-workspace">
    <div v-if="editor.hasImage" class="image-workspace__stage">
      <div class="image-workspace__canvas">
        <img
          v-if="editor.originalImage && editor.imageDisplayUrl"
          :alt="editor.originalImage.name"
          :src="editor.imageDisplayUrl"
          class="image-workspace__image"
        />
      </div>
      <div v-if="editor.originalImage" class="image-workspace__meta">
        <span>{{ editor.originalImage.name }}</span>
        <span>{{ imageDetails }}</span>
      </div>
    </div>

    <UploadEmptyState v-else />
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UploadEmptyState from '@/features/editor/components/UploadEmptyState.vue'
import { useEditorStore } from '@/features/editor/store/useEditorStore'
import { formatFileSize } from '@/features/editor/utils/formatFileSize'

const editor = useEditorStore()

const imageDetails = computed(() => {
  if (!editor.originalImage) {
    return ''
  }

  return `${editor.originalImage.naturalWidth} x ${editor.originalImage.naturalHeight} px | ${formatFileSize(editor.originalImage.size)} | ${editor.originalImage.mimeType}`
})
</script>

<style scoped>
.image-workspace {
  display: grid;
  min-width: 0;
  padding: 24px;
}

.image-workspace__stage {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 16px;
  min-height: 0;
}

.image-workspace__canvas {
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

.image-workspace__image {
  display: block;
  max-width: min(100%, 1200px);
  max-height: min(72vh, 760px);
  object-fit: contain;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}

.image-workspace__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  justify-content: space-between;
  color: rgb(var(--v-theme-on-background), 0.72);
  font-size: 0.86rem;
}

@media (max-width: 960px) {
  .image-workspace {
    min-height: calc(100vh - 64px);
    padding: 16px;
  }

  .image-workspace__canvas {
    min-height: 380px;
  }

  .image-workspace__image {
    max-height: 58vh;
  }
}
</style>
