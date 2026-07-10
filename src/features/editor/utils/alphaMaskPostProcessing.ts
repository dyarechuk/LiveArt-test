import type {
  BackgroundRemovalPostProcessing,
  BackgroundRemovalQuality
} from '@/features/editor/types/editor'
import { fillInternalTransparentRegions } from '@/features/editor/utils/connectedComponents'

interface AlphaPostProcessingConfig {
  alphaThreshold: number
  edgeRefinement: boolean
  fillAlpha: number
  fillInternalHoles: boolean
  maxHoleAreaRatio: number
}

export interface AlphaPostProcessingResult {
  blob: Blob
  postProcessing: BackgroundRemovalPostProcessing
}

const alphaPostProcessingConfigs: Record<BackgroundRemovalQuality, AlphaPostProcessingConfig> = {
  fast: {
    alphaThreshold: 10,
    edgeRefinement: false,
    fillAlpha: 255,
    fillInternalHoles: false,
    maxHoleAreaRatio: 0
  },
  balanced: {
    alphaThreshold: 20,
    edgeRefinement: true,
    fillAlpha: 255,
    fillInternalHoles: true,
    maxHoleAreaRatio: 0.015
  },
  product: {
    alphaThreshold: 40,
    edgeRefinement: true,
    fillAlpha: 255,
    fillInternalHoles: true,
    maxHoleAreaRatio: 0.08
  }
}

export async function postProcessBackgroundRemovalBlob(
  blob: Blob,
  quality: BackgroundRemovalQuality
): Promise<AlphaPostProcessingResult> {
  const config = alphaPostProcessingConfigs[quality]
  const postProcessing: BackgroundRemovalPostProcessing = {
    fillInternalHoles: config.fillInternalHoles,
    edgeRefinement: config.edgeRefinement
  }

  if (!config.fillInternalHoles && !config.edgeRefinement) {
    return {
      blob,
      postProcessing
    }
  }

  const bitmap = await createImageBitmap(blob)

  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })

    if (!context) {
      throw new Error('Canvas post-processing is not available in this browser.')
    }

    canvas.width = bitmap.width
    canvas.height = bitmap.height
    context.drawImage(bitmap, 0, 0)

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    if (config.fillInternalHoles) {
      fillInternalTransparentRegions(imageData, {
        alphaThreshold: config.alphaThreshold,
        fillAlpha: config.fillAlpha,
        maxHoleAreaRatio: config.maxHoleAreaRatio
      })
    }

    if (config.edgeRefinement) {
      smoothAlphaEdges(imageData, config.alphaThreshold)
    }

    context.putImageData(imageData, 0, 0)

    return {
      blob: await canvasToPngBlob(canvas),
      postProcessing
    }
  } finally {
    bitmap.close()
  }
}

function smoothAlphaEdges(imageData: ImageData, alphaThreshold: number) {
  const { width, height, data } = imageData
  const sourceAlpha = new Uint8ClampedArray(width * height)

  for (let pixel = 0; pixel < sourceAlpha.length; pixel += 1) {
    sourceAlpha[pixel] = data[pixel * 4 + 3]
  }

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const pixel = y * width + x
      const alpha = sourceAlpha[pixel]

      if (alpha === 0) {
        continue
      }

      let hasTransparentNeighbor = false
      let hasForegroundNeighbor = false
      let alphaSum = 0
      let sampleCount = 0

      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          const neighborAlpha = sourceAlpha[(y + offsetY) * width + x + offsetX]
          alphaSum += neighborAlpha
          sampleCount += 1

          if (neighborAlpha < alphaThreshold) {
            hasTransparentNeighbor = true
          } else {
            hasForegroundNeighbor = true
          }
        }
      }

      if (hasTransparentNeighbor && hasForegroundNeighbor) {
        const averageAlpha = alphaSum / sampleCount
        data[pixel * 4 + 3] = clampAlpha(Math.round(alpha * 0.82 + averageAlpha * 0.18))
      }
    }
  }
}

function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('The background-removed image could not be post-processed.'))
        return
      }

      resolve(blob)
    }, 'image/png')
  })
}

function clampAlpha(value: number) {
  return Math.min(255, Math.max(0, value))
}
