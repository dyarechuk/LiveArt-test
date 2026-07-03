import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  EditorAdjustmentKey,
  EditorAdjustments,
  EditorCrop,
  EditorFilterName,
  EditorNotice,
  EditorPreviewMode,
  EditedImageDownload,
  EditorOperation,
  EditorSelection,
  OriginalImage
} from '@/features/editor/types/editor'
import { buildAdjustmentFilter } from '@/features/editor/utils/buildAdjustmentFilter'
import {
  createEditedImageDownload,
  exportEditedImage,
  revokeEditedImageDownload,
  triggerEditedImageDownload
} from '@/features/editor/utils/exportEditedImage'
import {
  createOperationsJsonDownload,
  triggerOperationsJsonDownload
} from '@/features/editor/utils/exportOperationsJson'
import { isSupportedImageFile } from '@/features/editor/utils/isSupportedImageFile'
import { readImageDimensions } from '@/features/editor/utils/readImageDimensions'

const defaultAdjustments: EditorAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100
}

const largeImagePixelThreshold = 32_000_000
const largeImageSizeThreshold = 25 * 1024 * 1024

export const useEditorStore = defineStore('editor', () => {
  let imageLoadRequestId = 0
  const originalImage = ref<OriginalImage | null>(null)
  const selection = ref<EditorSelection | null>(null)
  const adjustments = ref<EditorAdjustments>({ ...defaultAdjustments })
  const filter = ref<EditorFilterName>('none')
  const crop = ref<EditorCrop | null>(null)
  const previewMode = ref<EditorPreviewMode>('current')
  const isCropMode = ref(false)
  const uploadError = ref<string | null>(null)
  const exportError = ref<string | null>(null)
  const exportMessage = ref<string | null>(null)
  const editorNotice = ref<EditorNotice | null>(null)
  const exportDownload = ref<EditedImageDownload | null>(null)
  const operationsDownload = ref<EditedImageDownload | null>(null)
  const isLoadingImage = ref(false)
  const isExporting = ref(false)
  const isExportingOperations = ref(false)

  const hasImage = computed(() => originalImage.value !== null)
  const isBusy = computed(() => isLoadingImage.value || isExporting.value || isExportingOperations.value)
  const previewFilter = computed(() => buildAdjustmentFilter(adjustments.value, filter.value))
  const displayCrop = computed(() => (previewMode.value === 'current' ? crop.value : null))
  const displayFilter = computed(() => (previewMode.value === 'current' ? previewFilter.value : 'none'))
  const operations = computed<EditorOperation[]>(() => {
    const editorOperations: EditorOperation[] = []

    if (crop.value) {
      editorOperations.push({
        id: 'crop',
        type: 'crop',
        createdAt: originalImage.value?.createdAt ?? '',
        payload: { ...crop.value }
      })
    }

    if (
      adjustments.value.brightness !== defaultAdjustments.brightness ||
      adjustments.value.contrast !== defaultAdjustments.contrast ||
      adjustments.value.saturation !== defaultAdjustments.saturation
    ) {
      editorOperations.push({
        id: 'adjustments',
        type: 'adjustments',
        createdAt: originalImage.value?.createdAt ?? '',
        payload: { ...adjustments.value }
      })
    }

    if (filter.value !== 'none') {
      editorOperations.push({
        id: 'filter',
        type: 'filter',
        createdAt: originalImage.value?.createdAt ?? '',
        payload: {
          name: filter.value
        }
      })
    }

    return editorOperations
  })
  const hasEdits = computed(() => {
    return (
      crop.value !== null ||
      selection.value !== null ||
      adjustments.value.brightness !== defaultAdjustments.brightness ||
      adjustments.value.contrast !== defaultAdjustments.contrast ||
      adjustments.value.saturation !== defaultAdjustments.saturation ||
      filter.value !== 'none'
    )
  })

  async function loadImage(file: File) {
    const requestId = ++imageLoadRequestId
    uploadError.value = null
    exportError.value = null
    exportMessage.value = null
    editorNotice.value = null
    clearExportDownload()
    clearOperationsDownload()

    if (!isSupportedImageFile(file)) {
      isLoadingImage.value = false
      uploadError.value = 'Please choose a valid image file such as PNG, JPEG or WebP.'
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

      const nextImage: OriginalImage = {
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
      originalImage.value = nextImage
      resetEdits()
      editorNotice.value = buildImageLoadNotice(nextImage)
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
    selection.value = null
    crop.value = null
    isCropMode.value = false
    adjustments.value = { ...defaultAdjustments }
    filter.value = 'none'
    previewMode.value = 'current'
    clearGeneratedDownloads()
  }

  function setAdjustment(key: EditorAdjustmentKey, value: number) {
    adjustments.value[key] = clampAdjustmentValue(value)
    clearGeneratedDownloads()
  }

  function resetAdjustment(key: EditorAdjustmentKey) {
    adjustments.value[key] = defaultAdjustments[key]
    clearGeneratedDownloads()
  }

  function resetAllAdjustments() {
    adjustments.value = { ...defaultAdjustments }
    clearGeneratedDownloads()
  }

  function setFilter(nextFilter: EditorFilterName) {
    filter.value = nextFilter
    clearGeneratedDownloads()
  }

  function resetFilter() {
    filter.value = 'none'
    clearGeneratedDownloads()
  }

  function openCropMode() {
    if (originalImage.value) {
      previewMode.value = 'current'
      isCropMode.value = true
    }
  }

  function setPreviewMode(mode: EditorPreviewMode) {
    previewMode.value = mode
  }

  function cancelCropMode() {
    isCropMode.value = false
  }

  function applyCrop(nextCrop: EditorCrop) {
    crop.value = {
      x: Math.round(nextCrop.x),
      y: Math.round(nextCrop.y),
      width: Math.round(nextCrop.width),
      height: Math.round(nextCrop.height)
    }
    isCropMode.value = false
    clearGeneratedDownloads()
  }

  function resetCrop() {
    crop.value = null
    isCropMode.value = false
    clearGeneratedDownloads()
  }

  function removeImage() {
    imageLoadRequestId += 1
    revokeOriginalObjectUrl()
    originalImage.value = null
    uploadError.value = null
    exportError.value = null
    exportMessage.value = null
    editorNotice.value = null
    clearExportDownload()
    clearOperationsDownload()
    resetEdits()
  }

  function clearUploadError() {
    uploadError.value = null
  }

  function clearExportError() {
    exportError.value = null
  }

  function clearExportMessage() {
    exportMessage.value = null
  }

  function clearEditorNotice() {
    editorNotice.value = null
  }

  function clearExportDownload() {
    revokeEditedImageDownload(exportDownload.value)
    exportDownload.value = null
  }

  function clearOperationsDownload() {
    revokeEditedImageDownload(operationsDownload.value)
    operationsDownload.value = null
  }

  function clearGeneratedDownloads() {
    exportMessage.value = null
    clearExportDownload()
    clearOperationsDownload()
  }

  async function exportImage() {
    if (!originalImage.value) {
      exportError.value = 'Upload an image before exporting.'
      return
    }

    exportError.value = null
    exportMessage.value = null
    editorNotice.value = null
    isExporting.value = true

    try {
      const exportedImage = await exportEditedImage({
        adjustments: adjustments.value,
        crop: crop.value,
        filter: filter.value,
        originalImage: originalImage.value
      })
      clearExportDownload()
      exportDownload.value = createEditedImageDownload(exportedImage)
      triggerEditedImageDownload(exportDownload.value)
      exportMessage.value = `Export ready: ${exportedImage.filename}`
    } catch (error) {
      exportError.value = error instanceof Error ? error.message : 'The edited image could not be exported.'
    } finally {
      isExporting.value = false
    }
  }

  async function exportOperationsJson() {
    if (!originalImage.value) {
      exportError.value = 'Upload an image before exporting operations.'
      return
    }

    exportError.value = null
    exportMessage.value = null
    editorNotice.value = null
    isExportingOperations.value = true

    try {
      clearOperationsDownload()
      operationsDownload.value = createOperationsJsonDownload({
        adjustments: adjustments.value,
        crop: crop.value,
        filter: filter.value,
        originalImage: originalImage.value
      })
      triggerOperationsJsonDownload(operationsDownload.value)
      exportMessage.value = `Operations JSON ready: ${operationsDownload.value.filename}`
    } catch (error) {
      exportError.value = error instanceof Error ? error.message : 'The operations JSON could not be exported.'
    } finally {
      isExportingOperations.value = false
    }
  }

  function revokeOriginalObjectUrl() {
    if (originalImage.value?.objectUrl) {
      URL.revokeObjectURL(originalImage.value.objectUrl)
    }
  }

  function clampAdjustmentValue(value: number) {
    return Math.min(200, Math.max(0, Math.round(value)))
  }

  function buildImageLoadNotice(image: OriginalImage): EditorNotice {
    const isLargeImage =
      image.naturalWidth * image.naturalHeight >= largeImagePixelThreshold ||
      image.size >= largeImageSizeThreshold

    if (isLargeImage) {
      return {
        message: 'Large image loaded. Preview remains live, but crop and export may take a little longer.',
        type: 'warning'
      }
    }

    return {
      message: `Image loaded: ${image.name}`,
      type: 'success'
    }
  }

  return {
    originalImage,
    operations,
    selection,
    adjustments,
    filter,
    crop,
    previewMode,
    isCropMode,
    uploadError,
    exportError,
    exportMessage,
    editorNotice,
    exportDownload,
    operationsDownload,
    isLoadingImage,
    isExporting,
    isExportingOperations,
    hasImage,
    isBusy,
    previewFilter,
    displayCrop,
    displayFilter,
    hasEdits,
    loadImage,
    resetEdits,
    setAdjustment,
    resetAdjustment,
    resetAllAdjustments,
    setFilter,
    resetFilter,
    setPreviewMode,
    openCropMode,
    cancelCropMode,
    applyCrop,
    resetCrop,
    removeImage,
    clearUploadError,
    clearExportError,
    clearExportMessage,
    clearEditorNotice,
    clearExportDownload,
    clearOperationsDownload,
    exportImage,
    exportOperationsJson
  }
})
