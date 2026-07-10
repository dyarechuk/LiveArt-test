import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  BackgroundRemovalPostProcessing,
  BackgroundRemovalQuality,
  BackgroundRemovalResult,
  BackgroundRemovalState,
  EditorAdjustmentKey,
  EditorAdjustments,
  EditorCrop,
  EditorFilterName,
  EditorImageSource,
  EditorNotice,
  EditorPreviewMode,
  EditedImageDownload,
  EditorOperation,
  EditorSelection,
  MaskBrushMode,
  OriginalImage,
  TonalAdjustmentKey
} from '@/features/editor/types/editor'
import { removeImageBackgroundWithPostProcessing } from '@/features/editor/utils/backgroundRemoval'
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
import {
  createFilterPresetDownload,
  parseFilterPresetJson,
  triggerFilterPresetDownload
} from '@/features/editor/utils/filterPresetJson'
import { isSupportedImageFile } from '@/features/editor/utils/isSupportedImageFile'
import { readImageDimensions } from '@/features/editor/utils/readImageDimensions'

const defaultAdjustments: EditorAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0
}

const adjustmentKeys: EditorAdjustmentKey[] = [
  'brightness',
  'contrast',
  'saturation',
  'highlights',
  'shadows',
  'whites',
  'blacks'
]

const tonalAdjustmentKeys: TonalAdjustmentKey[] = [
  'highlights',
  'shadows',
  'whites',
  'blacks'
]

const defaultBackgroundRemovalQuality: BackgroundRemovalQuality = 'balanced'

const defaultBackgroundRemovalPostProcessing: BackgroundRemovalPostProcessing = {
  fillInternalHoles: false,
  edgeRefinement: false
}

const defaultBackgroundRemovalState: BackgroundRemovalState = {
  status: 'idle',
  resultUrl: null,
  resultMimeType: null,
  quality: null,
  postProcessing: null,
  isMaskRefined: false,
  errorMessage: null
}

const defaultMaskBrushSize = 40

const largeImagePixelThreshold = 32_000_000
const largeImageSizeThreshold = 25 * 1024 * 1024

export const useEditorStore = defineStore('editor', () => {
  let imageLoadRequestId = 0
  const originalImage = ref<OriginalImage | null>(null)
  const selection = ref<EditorSelection | null>(null)
  const adjustments = ref<EditorAdjustments>({ ...defaultAdjustments })
  const filter = ref<EditorFilterName>('none')
  const crop = ref<EditorCrop | null>(null)
  const backgroundRemoval = ref<BackgroundRemovalState>({ ...defaultBackgroundRemovalState })
  const backgroundRemovalQuality = ref<BackgroundRemovalQuality>(defaultBackgroundRemovalQuality)
  const isMaskRefinementOpen = ref(false)
  const maskBrushMode = ref<MaskBrushMode>('restore')
  const maskBrushSize = ref(defaultMaskBrushSize)
  const canUndoMaskStroke = ref(false)
  const previewMode = ref<EditorPreviewMode>('current')
  const isCropMode = ref(false)
  const uploadError = ref<string | null>(null)
  const exportError = ref<string | null>(null)
  const exportMessage = ref<string | null>(null)
  const editorNotice = ref<EditorNotice | null>(null)
  const exportDownload = ref<EditedImageDownload | null>(null)
  const operationsDownload = ref<EditedImageDownload | null>(null)
  const filterPresetDownload = ref<EditedImageDownload | null>(null)
  const isLoadingImage = ref(false)
  const isExporting = ref(false)
  const isExportingOperations = ref(false)
  const isExportingFilterPreset = ref(false)
  const isImportingFilterPreset = ref(false)

  const hasImage = computed(() => originalImage.value !== null)
  const backgroundRemovalResult = computed<BackgroundRemovalResult | null>(() => {
    if (
      backgroundRemoval.value.status === 'applied' &&
      backgroundRemoval.value.resultUrl &&
      backgroundRemoval.value.resultMimeType
    ) {
      return {
        resultUrl: backgroundRemoval.value.resultUrl,
        resultMimeType: backgroundRemoval.value.resultMimeType,
        quality: backgroundRemoval.value.quality ?? backgroundRemovalQuality.value,
        postProcessing: backgroundRemoval.value.postProcessing ?? defaultBackgroundRemovalPostProcessing,
        isMaskRefined: backgroundRemoval.value.isMaskRefined
      }
    }

    return null
  })
  const isBackgroundRemovalApplied = computed(() => backgroundRemovalResult.value !== null)
  const canRefineMask = computed(() => {
    return backgroundRemoval.value.status === 'applied' && Boolean(backgroundRemoval.value.resultUrl)
  })
  const previewImageSource = computed<EditorImageSource | null>(() => {
    if (!originalImage.value) {
      return null
    }

    if (previewMode.value === 'current' && backgroundRemovalResult.value) {
      return {
        name: originalImage.value.name,
        objectUrl: backgroundRemovalResult.value.resultUrl,
        mimeType: backgroundRemovalResult.value.resultMimeType,
        naturalWidth: originalImage.value.naturalWidth,
        naturalHeight: originalImage.value.naturalHeight
      }
    }

    return originalImage.value
  })
  const cropImageSource = computed<EditorImageSource | null>(() => {
    if (!originalImage.value) {
      return null
    }

    if (backgroundRemovalResult.value) {
      return {
        name: originalImage.value.name,
        objectUrl: backgroundRemovalResult.value.resultUrl,
        mimeType: backgroundRemovalResult.value.resultMimeType,
        naturalWidth: originalImage.value.naturalWidth,
        naturalHeight: originalImage.value.naturalHeight
      }
    }

    return originalImage.value
  })
  const previewHasTransparency = computed(() => {
    return previewMode.value === 'current' && isBackgroundRemovalApplied.value
  })
  const cropHasTransparency = computed(() => isBackgroundRemovalApplied.value)
  const isBusy = computed(() => {
    return (
      isLoadingImage.value ||
      isExporting.value ||
      isExportingOperations.value ||
      isExportingFilterPreset.value ||
      isImportingFilterPreset.value ||
      backgroundRemoval.value.status === 'processing'
    )
  })
  const displayAdjustments = computed<EditorAdjustments>(() => {
    return previewMode.value === 'current' ? adjustments.value : defaultAdjustments
  })
  const displayCrop = computed(() => (previewMode.value === 'current' ? crop.value : null))
  const displayFilter = computed<EditorFilterName>(() => (previewMode.value === 'current' ? filter.value : 'none'))
  const operations = computed<EditorOperation[]>(() => {
    const editorOperations: EditorOperation[] = []

    if (backgroundRemovalResult.value) {
      editorOperations.push({
        id: 'background-removal',
        type: 'background-removal',
        createdAt: originalImage.value?.createdAt ?? '',
        payload: {
          model: '@imgly/background-removal',
          quality: backgroundRemovalResult.value.quality,
          postProcessing: backgroundRemovalResult.value.postProcessing,
          outputMimeType: backgroundRemovalResult.value.resultMimeType
        }
      })

      if (backgroundRemovalResult.value.isMaskRefined) {
        editorOperations.push({
          id: 'mask-refinement',
          type: 'mask-refinement',
          createdAt: originalImage.value?.createdAt ?? '',
          payload: {
            mode: 'manual',
            applied: true
          }
        })
      }
    }

    if (crop.value) {
      editorOperations.push({
        id: 'crop',
        type: 'crop',
        createdAt: originalImage.value?.createdAt ?? '',
        payload: { ...crop.value }
      })
    }

    if (hasAdjustmentChanges()) {
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
      backgroundRemovalResult.value !== null ||
      selection.value !== null ||
      hasAdjustmentChanges() ||
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
    clearFilterPresetDownload()

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
      clearBackgroundRemoval()

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
    clearBackgroundRemoval()
    adjustments.value = { ...defaultAdjustments }
    filter.value = 'none'
    previewMode.value = 'current'
    clearGeneratedDownloads()
  }

  function setAdjustment(key: EditorAdjustmentKey, value: number) {
    const nextValue = clampAdjustmentValue(key, value)

    if (adjustments.value[key] === nextValue) {
      return
    }

    adjustments.value[key] = nextValue
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

  function setBackgroundRemovalQuality(quality: BackgroundRemovalQuality) {
    backgroundRemovalQuality.value = quality
  }

  function openMaskRefinement() {
    if (!canRefineMask.value) {
      exportError.value = 'Remove the background before refining the mask.'
      return
    }

    isMaskRefinementOpen.value = true
    canUndoMaskStroke.value = false
    exportError.value = null
    exportMessage.value = null
    editorNotice.value = null
  }

  function closeMaskRefinement() {
    isMaskRefinementOpen.value = false
    canUndoMaskStroke.value = false
  }

  function cancelMaskRefinement() {
    closeMaskRefinement()
  }

  function setMaskBrushMode(mode: MaskBrushMode) {
    maskBrushMode.value = mode
  }

  function setMaskBrushSize(size: number) {
    maskBrushSize.value = Math.min(300, Math.max(5, Math.round(size / 5) * 5))
  }

  function setCanUndoMaskStroke(canUndo: boolean) {
    canUndoMaskStroke.value = canUndo
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
    clearFilterPresetDownload()
    clearBackgroundRemoval()
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

  function clearFilterPresetDownload() {
    revokeEditedImageDownload(filterPresetDownload.value)
    filterPresetDownload.value = null
  }

  function revokeBackgroundRemovalResult() {
    if (backgroundRemoval.value.resultUrl) {
      URL.revokeObjectURL(backgroundRemoval.value.resultUrl)
    }
  }

  function startBackgroundRemoval(quality: BackgroundRemovalQuality = backgroundRemovalQuality.value) {
    revokeBackgroundRemovalResult()
    backgroundRemoval.value = {
      status: 'processing',
      resultUrl: null,
      resultMimeType: null,
      quality,
      postProcessing: null,
      isMaskRefined: false,
      errorMessage: null
    }
    exportError.value = null
    exportMessage.value = null
    editorNotice.value = null
    clearGeneratedDownloads()
  }

  function applyBackgroundRemovalResult(
    blob: Blob,
    quality: BackgroundRemovalQuality,
    postProcessing: BackgroundRemovalPostProcessing
  ) {
    revokeBackgroundRemovalResult()
    backgroundRemoval.value = {
      status: 'applied',
      resultUrl: URL.createObjectURL(blob),
      resultMimeType: 'image/png',
      quality,
      postProcessing,
      isMaskRefined: false,
      errorMessage: null
    }
    previewMode.value = 'current'
    clearGeneratedDownloads()
  }

  function setBackgroundRemovalError(message: string) {
    revokeBackgroundRemovalResult()
    backgroundRemoval.value = {
      status: 'error',
      resultUrl: null,
      resultMimeType: null,
      quality: backgroundRemovalQuality.value,
      postProcessing: null,
      isMaskRefined: false,
      errorMessage: message
    }
    exportError.value = message
  }

  function clearBackgroundRemoval() {
    revokeBackgroundRemovalResult()
    backgroundRemoval.value = { ...defaultBackgroundRemovalState }
    closeMaskRefinement()
    canUndoMaskStroke.value = false
    clearGeneratedDownloads()
  }

  function applyMaskRefinementResult(blob: Blob) {
    const currentBackgroundRemoval = backgroundRemovalResult.value

    if (!currentBackgroundRemoval) {
      exportError.value = 'Remove the background before refining the mask.'
      return
    }

    revokeBackgroundRemovalResult()
    backgroundRemoval.value = {
      status: 'applied',
      resultUrl: URL.createObjectURL(blob),
      resultMimeType: 'image/png',
      quality: currentBackgroundRemoval.quality,
      postProcessing: currentBackgroundRemoval.postProcessing,
      isMaskRefined: true,
      errorMessage: null
    }
    closeMaskRefinement()
    canUndoMaskStroke.value = false
    previewMode.value = 'current'
    exportError.value = null
    exportMessage.value = 'Mask refinement applied.'
    editorNotice.value = null
    clearExportDownload()
    clearOperationsDownload()
    clearFilterPresetDownload()
  }

  function clearGeneratedDownloads() {
    exportMessage.value = null
    clearExportDownload()
    clearOperationsDownload()
    clearFilterPresetDownload()
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
        backgroundRemoval: backgroundRemovalResult.value,
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
        backgroundRemoval: backgroundRemovalResult.value,
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

  async function removeImageBackground() {
    if (!originalImage.value) {
      exportError.value = 'Upload an image before removing the background.'
      return
    }

    if (backgroundRemoval.value.status === 'processing') {
      return
    }

    const requestId = imageLoadRequestId
    const sourceImage = originalImage.value
    const quality = backgroundRemovalQuality.value
    startBackgroundRemoval(quality)

    try {
      const result = await removeImageBackgroundWithPostProcessing(sourceImage.file, quality)

      if (requestId !== imageLoadRequestId || originalImage.value?.id !== sourceImage.id) {
        return
      }

      applyBackgroundRemovalResult(result.blob, quality, result.postProcessing)
      exportMessage.value = 'Background removed successfully.'
    } catch (error) {
      if (requestId !== imageLoadRequestId || originalImage.value?.id !== sourceImage.id) {
        return
      }

      setBackgroundRemovalError(
        error instanceof Error ? error.message : 'Background removal failed. Please try another image.'
      )
    }
  }

  function exportFilterPreset() {
    if (!originalImage.value) {
      exportError.value = 'Upload an image before exporting a filter preset.'
      return
    }

    exportError.value = null
    exportMessage.value = null
    editorNotice.value = null
    isExportingFilterPreset.value = true

    try {
      clearFilterPresetDownload()
      filterPresetDownload.value = createFilterPresetDownload({
        adjustments: adjustments.value,
        filter: filter.value,
        name: buildCurrentPresetName()
      })
      triggerFilterPresetDownload(filterPresetDownload.value)
      exportMessage.value = `Filter preset ready: ${filterPresetDownload.value.filename}`
    } catch (error) {
      exportError.value = error instanceof Error ? error.message : 'The filter preset could not be exported.'
    } finally {
      isExportingFilterPreset.value = false
    }
  }

  async function importFilterPreset(file: File | undefined) {
    if (!originalImage.value) {
      exportError.value = 'Upload an image before importing a filter preset.'
      return
    }

    if (!file) {
      return
    }

    if (!file.name.toLowerCase().endsWith('.json')) {
      exportError.value = 'Choose a JSON filter preset file.'
      return
    }

    exportError.value = null
    exportMessage.value = null
    editorNotice.value = null
    isImportingFilterPreset.value = true

    try {
      const validationResult = parseFilterPresetJson(await file.text())

      if (!validationResult.valid) {
        exportError.value = validationResult.error
        return
      }

      adjustments.value = {
        brightness: clampAdjustmentValue('brightness', validationResult.preset.adjustments.brightness),
        contrast: clampAdjustmentValue('contrast', validationResult.preset.adjustments.contrast),
        saturation: clampAdjustmentValue('saturation', validationResult.preset.adjustments.saturation),
        highlights: clampAdjustmentValue('highlights', validationResult.preset.adjustments.highlights),
        shadows: clampAdjustmentValue('shadows', validationResult.preset.adjustments.shadows),
        whites: clampAdjustmentValue('whites', validationResult.preset.adjustments.whites),
        blacks: clampAdjustmentValue('blacks', validationResult.preset.adjustments.blacks)
      }
      filter.value = validationResult.preset.filter
      previewMode.value = 'current'
      clearGeneratedDownloads()
      exportMessage.value = `Filter preset applied: ${validationResult.preset.name}`
    } catch (error) {
      exportError.value = error instanceof Error ? error.message : 'The filter preset could not be imported.'
    } finally {
      isImportingFilterPreset.value = false
    }
  }

  function revokeOriginalObjectUrl() {
    if (originalImage.value?.objectUrl) {
      URL.revokeObjectURL(originalImage.value.objectUrl)
    }
  }

  function clampAdjustmentValue(key: EditorAdjustmentKey, value: number) {
    if (tonalAdjustmentKeys.includes(key as TonalAdjustmentKey)) {
      return Math.min(100, Math.max(-100, Math.round(value)))
    }

    return Math.min(200, Math.max(0, Math.round(value)))
  }

  function hasAdjustmentChanges() {
    return adjustmentKeys.some((key) => adjustments.value[key] !== defaultAdjustments[key])
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

  function buildCurrentPresetName() {
    if (filter.value === 'sepia') {
      return 'Sepia Filter Preset'
    }

    if (filter.value === 'greyscale') {
      return 'Greyscale Filter Preset'
    }

    if (hasAdjustmentChanges()) {
      return 'Custom Adjustment Preset'
    }

    return 'Neutral Filter Preset'
  }

  return {
    originalImage,
    operations,
    selection,
    adjustments,
    filter,
    crop,
    backgroundRemoval,
    backgroundRemovalQuality,
    isMaskRefinementOpen,
    maskBrushMode,
    maskBrushSize,
    canUndoMaskStroke,
    previewMode,
    isCropMode,
    uploadError,
    exportError,
    exportMessage,
    editorNotice,
    isLoadingImage,
    isExporting,
    isExportingOperations,
    isExportingFilterPreset,
    isImportingFilterPreset,
    hasImage,
    backgroundRemovalResult,
    isBackgroundRemovalApplied,
    canRefineMask,
    previewImageSource,
    cropImageSource,
    previewHasTransparency,
    cropHasTransparency,
    isBusy,
    displayAdjustments,
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
    setBackgroundRemovalQuality,
    openMaskRefinement,
    closeMaskRefinement,
    cancelMaskRefinement,
    setMaskBrushMode,
    setMaskBrushSize,
    setCanUndoMaskStroke,
    setPreviewMode,
    openCropMode,
    cancelCropMode,
    applyCrop,
    resetCrop,
    removeImageBackground,
    startBackgroundRemoval,
    applyBackgroundRemovalResult,
    clearBackgroundRemoval,
    setBackgroundRemovalError,
    applyMaskRefinementResult,
    removeImage,
    clearUploadError,
    clearExportError,
    clearExportMessage,
    clearEditorNotice,
    exportImage,
    exportOperationsJson,
    exportFilterPreset,
    importFilterPreset
  }
})
