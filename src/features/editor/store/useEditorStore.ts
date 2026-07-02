import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { EditorImage, EditorOperation, EditorSelection } from '@/features/editor/types/editor'

export const useEditorStore = defineStore('editor', () => {
  const sourceImage = ref<EditorImage | null>(null)
  const operations = ref<EditorOperation[]>([])
  const selection = ref<EditorSelection | null>(null)

  const hasImage = computed(() => sourceImage.value !== null)

  function loadImage(file: File) {
    clearPreviewUrl()

    sourceImage.value = {
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      previewUrl: URL.createObjectURL(file),
      createdAt: new Date().toISOString()
    }
    operations.value = []
    selection.value = null
  }

  function resetImage() {
    clearPreviewUrl()
    sourceImage.value = null
    operations.value = []
    selection.value = null
  }

  function clearPreviewUrl() {
    if (sourceImage.value?.previewUrl) {
      URL.revokeObjectURL(sourceImage.value.previewUrl)
    }
  }

  return {
    sourceImage,
    operations,
    selection,
    hasImage,
    loadImage,
    resetImage
  }
})
