import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  EditorAdjustments,
  EditorOperation,
  EditorSelection,
  OriginalImage
} from '@/features/editor/types/editor'
import { isSupportedImageFile } from '@/features/editor/utils/isSupportedImageFile'
import { readImageDimensions } from '@/features/editor/utils/readImageDimensions'

const defaultAdjustments: EditorAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0
}

export const useEditorStore = defineStore('editor', () => {
  let imageLoadRequestId = 0
  const originalImage = ref<OriginalImage | null>(null)
  const operations = ref<EditorOperation[]>([])
  const selection = ref<EditorSelection | null>(null)
  const adjustments = ref<EditorAdjustments>({ ...defaultAdjustments })
  const uploadError = ref<string | null>(null)
  const isLoadingImage = ref(false)

  const hasImage = computed(() => originalImage.value !== null)
  const imageDisplayUrl = computed(() => originalImage.value?.objectUrl ?? null)
  const hasEdits = computed(() => {
    return (
      operations.value.length > 0 ||
      selection.value !== null ||
      adjustments.value.brightness !== defaultAdjustments.brightness ||
      adjustments.value.contrast !== defaultAdjustments.contrast ||
      adjustments.value.saturation !== defaultAdjustments.saturation
    )
  })

  async function loadImage(file: File) {
    const requestId = ++imageLoadRequestId
    uploadError.value = null

    if (!isSupportedImageFile(file)) {
      isLoadingImage.value = false
      uploadError.value = 'Please choose a valid image file.'
      return
    }

    const objectUrl = URL.createObjectURL(file)
    isLoadingImage.value = true

    try {
      const dimensions = await readImageDimensions(objectUrl)

      if (requestId !== imageLoadRequestId) {
        URL.revokeObjectURL(objectUrl)
        return
      }

      revokeOriginalObjectUrl()

      originalImage.value = {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        objectUrl,
        naturalWidth: dimensions.naturalWidth,
        naturalHeight: dimensions.naturalHeight,
        createdAt: new Date().toISOString()
      }
      resetEdits()
    } catch (error) {
      URL.revokeObjectURL(objectUrl)
      if (requestId === imageLoadRequestId) {
        uploadError.value = error instanceof Error ? error.message : 'The selected image could not be loaded.'
      }
    } finally {
      if (requestId === imageLoadRequestId) {
        isLoadingImage.value = false
      }
    }
  }

  function resetEdits() {
    operations.value = []
    selection.value = null
    adjustments.value = { ...defaultAdjustments }
  }

  function removeImage() {
    imageLoadRequestId += 1
    revokeOriginalObjectUrl()
    originalImage.value = null
    uploadError.value = null
    resetEdits()
  }

  function clearUploadError() {
    uploadError.value = null
  }

  function revokeOriginalObjectUrl() {
    if (originalImage.value?.objectUrl) {
      URL.revokeObjectURL(originalImage.value.objectUrl)
    }
  }

  return {
    originalImage,
    operations,
    selection,
    adjustments,
    uploadError,
    isLoadingImage,
    hasImage,
    imageDisplayUrl,
    hasEdits,
    loadImage,
    resetEdits,
    removeImage,
    clearUploadError
  }
})
