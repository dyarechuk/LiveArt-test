<template>
  <main class="image-workspace">
    <div v-if="editor.hasImage" class="image-workspace__stage">
      <CropEditor
        v-if="editor.cropImageSource && editor.isCropMode"
        :crop="editor.crop"
        :has-transparency="editor.cropHasTransparency"
        :image="editor.cropImageSource"
        @apply="editor.applyCrop"
        @cancel="editor.cancelCropMode"
      />
      <ImagePreview
        v-else-if="editor.previewImageSource"
        :adjustments="editor.displayAdjustments"
        :crop="editor.displayCrop"
        :filter="editor.displayFilter"
        :has-transparency="editor.previewHasTransparency"
        :image="editor.previewImageSource"
      />
      <div v-if="editor.originalImage" class="image-workspace__meta">
        <span class="image-workspace__filename" :title="editor.originalImage.name">{{ editor.originalImage.name }}</span>
        <span class="image-workspace__details">{{ previewDetails }}</span>
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
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 24px;
}

.image-workspace__stage {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 16px;
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
}

.image-workspace__meta {
  display: flex;
  align-items: center;
  gap: 8px 16px;
  justify-content: space-between;
  min-width: 0;
  color: rgb(var(--v-theme-on-background), 0.72);
  font-size: 0.86rem;
}

.image-workspace__filename {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-workspace__details {
  flex: 0 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
  text-align: right;
}

@media (max-width: 960px) {
  .image-workspace {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .image-workspace {
    padding: 8px;
  }

  .image-workspace__stage {
    gap: 8px;
  }

  .image-workspace__meta {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
    font-size: 0.78rem;
  }

  .image-workspace__filename,
  .image-workspace__details {
    width: 100%;
    max-width: 100%;
    text-align: left;
  }

  .image-workspace__details {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}
</style>
