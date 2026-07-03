<template>
  <main class="image-workspace">
    <div v-if="editor.hasImage" class="image-workspace__stage">
      <CropEditor
        v-if="editor.originalImage && editor.isCropMode"
        :crop="editor.crop"
        :image="editor.originalImage"
        @apply="editor.applyCrop"
        @cancel="editor.cancelCropMode"
      />
      <ImagePreview
        v-else-if="editor.originalImage"
        :crop="editor.displayCrop"
        :filter="editor.displayFilter"
        :image="editor.originalImage"
      />
      <div v-if="editor.originalImage" class="image-workspace__meta">
        <span>{{ editor.originalImage.name }}</span>
        <span>{{ previewDetails }}</span>
      </div>
    </div>

    <UploadEmptyState v-else />
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CropEditor from '@/features/editor/components/CropEditor.vue'
import ImagePreview from '@/features/editor/components/ImagePreview.vue'
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

const previewDetails = computed(() => {
  if (!imageDetails.value) {
    return ''
  }

  return `${editor.previewMode === 'current' ? 'Current preview' : 'Original preview'} | ${imageDetails.value}`
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
}
</style>
