import type { MaskBrushMode } from '@/features/editor/types/editor'

export interface MaskBrushPoint {
  x: number
  y: number
}

export interface MaskDirtyRect {
  height: number
  width: number
  x: number
  y: number
}

export interface MaskUndoPatch {
  imageData: ImageData
  rect: MaskDirtyRect
}

export interface MaskRefinementSource {
  originalUrl: string
  resultUrl: string
}

export async function createMaskRefinementImageData(source: MaskRefinementSource) {
  const [originalImage, resultImage] = await Promise.all([
    loadImage(source.originalUrl),
    loadImage(source.resultUrl)
  ])
  const width = resultImage.naturalWidth
  const height = resultImage.naturalHeight
  const originalImageData = drawImageToImageData(originalImage, width, height)
  const resultImageData = drawImageToImageData(resultImage, width, height)

  for (let index = 0; index < resultImageData.data.length; index += 4) {
    resultImageData.data[index] = originalImageData.data[index]
    resultImageData.data[index + 1] = originalImageData.data[index + 1]
    resultImageData.data[index + 2] = originalImageData.data[index + 2]
  }

  return resultImageData
}

export function applyMaskBrushSegment(
  imageData: ImageData,
  from: MaskBrushPoint,
  to: MaskBrushPoint,
  brushSize: number,
  mode: MaskBrushMode
) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y)
  const spacing = Math.max(1, (brushSize / 2) * 0.28)
  const stepCount = Math.max(1, Math.ceil(distance / spacing))

  for (let step = 0; step <= stepCount; step += 1) {
    const progress = step / stepCount
    applyCircularBrush(imageData, {
      x: from.x + (to.x - from.x) * progress,
      y: from.y + (to.y - from.y) * progress
    }, brushSize, mode)
  }

  return getBrushSegmentRect(from, to, brushSize, imageData.width, imageData.height)
}

export function drawImageDataToCanvas(canvas: HTMLCanvasElement, imageData: ImageData) {
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas rendering is not available in this browser.')
  }

  canvas.width = imageData.width
  canvas.height = imageData.height
  context.putImageData(imageData, 0, 0)
}

export function getBrushSegmentRect(
  from: MaskBrushPoint,
  to: MaskBrushPoint,
  brushSize: number,
  imageWidth: number,
  imageHeight: number
): MaskDirtyRect | null {
  const radius = Math.ceil(brushSize / 2)
  const minX = Math.max(0, Math.floor(Math.min(from.x, to.x) - radius))
  const maxX = Math.min(imageWidth, Math.ceil(Math.max(from.x, to.x) + radius + 1))
  const minY = Math.max(0, Math.floor(Math.min(from.y, to.y) - radius))
  const maxY = Math.min(imageHeight, Math.ceil(Math.max(from.y, to.y) + radius + 1))
  const width = maxX - minX
  const height = maxY - minY

  if (width <= 0 || height <= 0) {
    return null
  }

  return {
    height,
    width,
    x: minX,
    y: minY
  }
}

export function copyImageDataRegion(imageData: ImageData, rect: MaskDirtyRect) {
  const region = new Uint8ClampedArray(rect.width * rect.height * 4)

  for (let row = 0; row < rect.height; row += 1) {
    const sourceStart = ((rect.y + row) * imageData.width + rect.x) * 4
    const sourceEnd = sourceStart + rect.width * 4
    region.set(imageData.data.subarray(sourceStart, sourceEnd), row * rect.width * 4)
  }

  return new ImageData(region, rect.width, rect.height)
}

export function createUndoPatch(imageData: ImageData, rect: MaskDirtyRect): MaskUndoPatch {
  return {
    imageData: copyImageDataRegion(imageData, rect),
    rect
  }
}

export function restoreUndoPatch(imageData: ImageData, patch: MaskUndoPatch) {
  for (let row = 0; row < patch.rect.height; row += 1) {
    const targetStart = ((patch.rect.y + row) * imageData.width + patch.rect.x) * 4
    const sourceStart = row * patch.rect.width * 4
    const sourceEnd = sourceStart + patch.rect.width * 4
    imageData.data.set(patch.imageData.data.subarray(sourceStart, sourceEnd), targetStart)
  }
}

export function putImageDataRegion(
  canvas: HTMLCanvasElement,
  imageData: ImageData,
  rect: MaskDirtyRect
) {
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas rendering is not available in this browser.')
  }

  context.putImageData(copyImageDataRegion(imageData, rect), rect.x, rect.y)
}

export function imageDataToPngBlob(imageData: ImageData) {
  const canvas = document.createElement('canvas')
  drawImageDataToCanvas(canvas, imageData)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('The refined mask could not be exported.'))
        return
      }

      resolve(blob)
    }, 'image/png')
  })
}

function applyCircularBrush(
  imageData: ImageData,
  point: MaskBrushPoint,
  brushSize: number,
  mode: MaskBrushMode
) {
  const radius = brushSize / 2
  const radiusSquared = radius * radius
  const minX = Math.max(0, Math.floor(point.x - radius))
  const maxX = Math.min(imageData.width - 1, Math.ceil(point.x + radius))
  const minY = Math.max(0, Math.floor(point.y - radius))
  const maxY = Math.min(imageData.height - 1, Math.ceil(point.y + radius))
  const nextAlpha = mode === 'restore' ? 255 : 0

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const deltaX = x - point.x
      const deltaY = y - point.y

      if (deltaX * deltaX + deltaY * deltaY <= radiusSquared) {
        imageData.data[(y * imageData.width + x) * 4 + 3] = nextAlpha
      }
    }
  }
}

function drawImageToImageData(image: HTMLImageElement, width: number, height: number) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    throw new Error('Canvas rendering is not available in this browser.')
  }

  canvas.width = width
  canvas.height = height
  context.drawImage(image, 0, 0, width, height)

  return context.getImageData(0, 0, width, height)
}

function loadImage(sourceUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      resolve(image)
    }

    image.onerror = () => {
      reject(new Error('The mask refinement image could not be loaded.'))
    }

    image.src = sourceUrl
  })
}
