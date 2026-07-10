<template>
  <div class="image-preview" :class="{ 'image-preview--transparent': hasTransparency }">
    <div
      class="image-preview__frame"
      :class="crop ? 'image-preview__frame--cropped' : 'image-preview__frame--fit'"
      :style="previewStyle"
    >
      <canvas
        ref="canvasElement"
        :aria-label="image.name"
        class="image-preview__image"
        :class="crop ? 'image-preview__image--cropped' : 'image-preview__image--fit'"
        role="img"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type {
  EditorAdjustments,
  EditorCrop,
  EditorFilterName,
  EditorImageSource
} from '@/features/editor/types/editor'
import { applyImageAdjustments } from '@/features/editor/utils/tonalAdjustments'

const props = defineProps<{
  adjustments: EditorAdjustments
  crop: EditorCrop | null
  filter: EditorFilterName
  hasTransparency: boolean
  image: EditorImageSource
}>()

interface PreviewCrop {
  height: number
  width: number
  x: number
  y: number
}

interface PreviewSize {
  height: number
  width: number
}

const desktopPreviewMaxDimension = 1400
const mobilePreviewMaxDimension = 900
const canvasElement = ref<HTMLCanvasElement>()

let loadedImage: HTMLImageElement | null = null
let loadedImageUrl = ''
let loadRequestId = 0
let baseCanvas: HTMLCanvasElement | null = null
let baseContext: CanvasRenderingContext2D | null = null
let baseImageData: ImageData | null = null
let workingImageData: ImageData | null = null
let displayContext: CanvasRenderingContext2D | null = null
let structuralFrame = 0
let renderFrame = 0
let renderVersion = 0
let previewMaxDimension = getPreviewMaxDimension()

const previewStyle = computed(() => {
  if (!props.crop) {
    return {
      '--preview-natural-height': `${props.image.naturalHeight}px`
    }
  }

  const cropAspectRatio = props.crop.width / props.crop.height

  return {
    aspectRatio: `${props.crop.width} / ${props.crop.height}`,
    '--crop-aspect-ratio': `${cropAspectRatio}`,
    '--crop-natural-width': `${props.crop.width}px`
  }
})

watch(
  () => props.image.objectUrl,
  async (sourceUrl) => {
    const requestId = ++loadRequestId
    loadedImage = null
    loadedImageUrl = sourceUrl
    clearPreviewCache()

    try {
      const image = await loadImage(sourceUrl)

      if (requestId !== loadRequestId || loadedImageUrl !== sourceUrl) {
        return
      }

      loadedImage = image
      scheduleBasePreviewBuild()
    } catch {
      clearCanvas()
    }
  },
  { immediate: true }
)

onMounted(() => {
  window.addEventListener('resize', handlePreviewResize)
  scheduleBasePreviewBuild()
})

watch(
  () => [
    props.image.naturalWidth,
    props.image.naturalHeight,
    props.crop?.x ?? 0,
    props.crop?.y ?? 0,
    props.crop?.width ?? 0,
    props.crop?.height ?? 0
  ],
  () => {
    scheduleBasePreviewBuild()
  }
)

watch(
  () => [
    props.adjustments.brightness,
    props.adjustments.contrast,
    props.adjustments.saturation,
    props.adjustments.highlights,
    props.adjustments.shadows,
    props.adjustments.whites,
    props.adjustments.blacks,
    props.filter
  ],
  () => {
    schedulePreviewRender()
  }
)

onBeforeUnmount(() => {
  loadRequestId += 1
  window.removeEventListener('resize', handlePreviewResize)

  if (structuralFrame) {
    cancelAnimationFrame(structuralFrame)
    structuralFrame = 0
  }

  if (renderFrame) {
    cancelAnimationFrame(renderFrame)
    renderFrame = 0
  }
})

function handlePreviewResize() {
  const nextPreviewMaxDimension = getPreviewMaxDimension()

  if (nextPreviewMaxDimension !== previewMaxDimension) {
    previewMaxDimension = nextPreviewMaxDimension
    scheduleBasePreviewBuild()
  }
}

function scheduleBasePreviewBuild() {
  if (structuralFrame) {
    cancelAnimationFrame(structuralFrame)
  }

  structuralFrame = requestAnimationFrame(() => {
    structuralFrame = 0
    buildBasePreview()
  })
}

function schedulePreviewRender() {
  if (renderFrame) {
    return
  }

  const requestedVersion = ++renderVersion

  renderFrame = requestAnimationFrame(() => {
    renderFrame = 0
    renderPreview(requestedVersion)
  })
}

function buildBasePreview() {
  if (!canvasElement.value || !loadedImage) {
    return
  }

  const crop = normalizeCrop()
  const previewSize = getPreviewSize(crop.width, crop.height)
  const canvas = getBaseCanvas()
  const context = getBaseContext()

  if (!context) {
    return
  }

  canvas.width = previewSize.width
  canvas.height = previewSize.height
  canvasElement.value.width = previewSize.width
  canvasElement.value.height = previewSize.height
  context.clearRect(0, 0, previewSize.width, previewSize.height)
  context.drawImage(
    loadedImage,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    previewSize.width,
    previewSize.height
  )
  baseImageData = context.getImageData(0, 0, previewSize.width, previewSize.height)
  workingImageData = null
  schedulePreviewRender()
}

function renderPreview(requestedVersion: number) {
  if (!canvasElement.value || !baseImageData || requestedVersion !== renderVersion) {
    return
  }

  const context = getDisplayContext()

  if (!context) {
    return
  }

  const imageData = getWorkingImageData(baseImageData)
  imageData.data.set(baseImageData.data)
  applyImageAdjustments(imageData, props.adjustments, props.filter)
  context.putImageData(imageData, 0, 0)
}

function clearCanvas() {
  if (!canvasElement.value) {
    return
  }

  const context = canvasElement.value.getContext('2d')

  if (context) {
    context.clearRect(0, 0, canvasElement.value.width, canvasElement.value.height)
  }
}

function clearPreviewCache() {
  baseImageData = null
  workingImageData = null
  renderVersion += 1
}

function normalizeCrop(): PreviewCrop {
  if (!props.crop) {
    return {
      x: 0,
      y: 0,
      width: props.image.naturalWidth,
      height: props.image.naturalHeight
    }
  }

  const x = Math.min(Math.max(0, props.crop.x), props.image.naturalWidth - 1)
  const y = Math.min(Math.max(0, props.crop.y), props.image.naturalHeight - 1)
  const width = Math.min(Math.max(1, props.crop.width), props.image.naturalWidth - x)
  const height = Math.min(Math.max(1, props.crop.height), props.image.naturalHeight - y)

  return {
    x,
    y,
    width,
    height
  }
}

function getPreviewSize(width: number, height: number): PreviewSize {
  const scale = Math.min(1, previewMaxDimension / width, previewMaxDimension / height)

  return {
    height: Math.max(1, Math.round(height * scale)),
    width: Math.max(1, Math.round(width * scale))
  }
}

function getBaseCanvas() {
  if (!baseCanvas) {
    baseCanvas = document.createElement('canvas')
  }

  return baseCanvas
}

function getBaseContext() {
  const canvas = getBaseCanvas()

  if (!baseContext) {
    baseContext = canvas.getContext('2d', { willReadFrequently: true })
  }

  return baseContext
}

function getDisplayContext() {
  if (!canvasElement.value) {
    return null
  }

  if (!displayContext) {
    displayContext = canvasElement.value.getContext('2d')
  }

  return displayContext
}

function getWorkingImageData(baseData: ImageData) {
  if (
    !workingImageData ||
    workingImageData.width !== baseData.width ||
    workingImageData.height !== baseData.height
  ) {
    workingImageData = new ImageData(
      new Uint8ClampedArray(baseData.data.length),
      baseData.width,
      baseData.height
    )
  }

  return workingImageData
}

function getPreviewMaxDimension() {
  if (window.matchMedia('(max-width: 768px)').matches) {
    return mobilePreviewMaxDimension
  }

  return desktopPreviewMaxDimension
}

function loadImage(sourceUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      resolve(image)
    }

    image.onerror = () => {
      reject(new Error('The preview image could not be loaded.'))
    }

    image.src = sourceUrl
  })
}
</script>

<style scoped>
.image-preview {
  --preview-max-height: calc(100dvh - var(--app-header-height) - 128px);
  display: grid;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  place-items: center;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  background-color: rgba(var(--v-theme-surface), 0.72);
  background-image:
    linear-gradient(45deg, rgba(var(--v-theme-on-surface), 0.08) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(var(--v-theme-on-surface), 0.08) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(var(--v-theme-on-surface), 0.08) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(var(--v-theme-on-surface), 0.08) 75%);
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0;
  background-size: 20px 20px;
}

.image-preview--transparent {
  background-color: rgba(var(--v-theme-surface), 0.48);
}

.image-preview__frame {
  position: relative;
  width: 100%;
  max-width: 100%;
  height: 100%;
  max-height: 100%;
  min-width: 0;
  min-height: 0;
  place-items: center;
}

.image-preview__frame--fit {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.image-preview__frame--cropped {
  display: grid;
  width: min(
    100%,
    var(--crop-natural-width),
    calc(min(72vh, 760px) * var(--crop-aspect-ratio))
  );
  height: auto;
  max-height: 100%;
  aspect-ratio: var(--crop-aspect-ratio);
  overflow: hidden;
  place-items: center;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}

.image-preview__image {
  display: block;
  min-width: 0;
  min-height: 0;
  opacity: 1;
  object-fit: contain;
  visibility: visible;
}

.image-preview__image--fit {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: min(100%, var(--preview-max-height), var(--preview-natural-height));
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}

.image-preview__image--cropped {
  width: 100%;
  height: 100%;
  object-fit: fill;
  box-shadow: none;
}

@media (max-width: 960px) {
  .image-preview__image {
    max-height: 100%;
  }

  .image-preview__image--fit {
    max-height: min(100%, 58svh, var(--preview-natural-height));
  }

  .image-preview__frame {
    max-height: 100%;
  }

  .image-preview__frame--cropped {
    width: min(
      100%,
      var(--crop-natural-width),
      calc(58vh * var(--crop-aspect-ratio))
    );
    max-height: none;
  }
}

@media (max-width: 768px) {
  .image-preview {
    height: 100%;
    min-height: 0;
    --preview-max-height: 52svh;
  }

  .image-preview__frame {
    max-width: 100%;
    max-height: 100%;
  }

  .image-preview__frame--cropped {
    width: min(
      100%,
      var(--crop-natural-width),
      calc(52svh * var(--crop-aspect-ratio))
    );
  }

  .image-preview__image {
    max-width: 100%;
    max-height: 100%;
  }

  .image-preview__image--fit {
    max-height: min(100%, var(--preview-max-height), var(--preview-natural-height));
  }
}
</style>
