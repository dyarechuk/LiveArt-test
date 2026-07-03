import type {
  EditedImageDownload,
  EditedImageExport,
  EditedImageExportInput
} from '@/features/editor/types/editor'
import { buildAdjustmentFilter } from '@/features/editor/utils/buildAdjustmentFilter'
import { triggerFileDownload } from '@/features/editor/utils/downloadFile'

const supportedExportMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])

export async function exportEditedImage(input: EditedImageExportInput): Promise<EditedImageExport> {
  const image = await loadImage(input.originalImage.objectUrl)
  const crop = normalizeCrop(input)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas rendering is not available in this browser.')
  }

  canvas.width = Math.max(1, Math.round(crop.width))
  canvas.height = Math.max(1, Math.round(crop.height))
  context.filter = buildAdjustmentFilter(input.adjustments, input.filter)
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height
  )

  const mimeType = getExportMimeType(input.originalImage.mimeType)
  const blob = await canvasToBlob(canvas, mimeType)
  const outputMimeType = blob.type || mimeType

  return {
    blob,
    filename: buildExportFilename(input.originalImage.name, outputMimeType),
    mimeType: outputMimeType
  }
}

export function createEditedImageDownload(exportedImage: EditedImageExport): EditedImageDownload {
  return {
    filename: exportedImage.filename,
    objectUrl: URL.createObjectURL(exportedImage.blob)
  }
}

export function triggerEditedImageDownload(download: EditedImageDownload) {
  triggerFileDownload(download)
}

export function revokeEditedImageDownload(download: EditedImageDownload | null) {
  if (download) {
    URL.revokeObjectURL(download.objectUrl)
  }
}

function loadImage(sourceUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      resolve(image)
    }

    image.onerror = () => {
      reject(new Error('The original image could not be loaded for export.'))
    }

    image.src = sourceUrl
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('The edited image could not be exported.'))
        return
      }

      resolve(blob)
    }, mimeType)
  })
}

function normalizeCrop(input: EditedImageExportInput) {
  const sourceWidth = input.originalImage.naturalWidth
  const sourceHeight = input.originalImage.naturalHeight

  if (!input.crop) {
    return {
      x: 0,
      y: 0,
      width: sourceWidth,
      height: sourceHeight
    }
  }

  const x = Math.min(Math.max(0, input.crop.x), sourceWidth - 1)
  const y = Math.min(Math.max(0, input.crop.y), sourceHeight - 1)
  const width = Math.min(Math.max(1, input.crop.width), sourceWidth - x)
  const height = Math.min(Math.max(1, input.crop.height), sourceHeight - y)

  return {
    x,
    y,
    width,
    height
  }
}

function getExportMimeType(sourceMimeType: string) {
  if (supportedExportMimeTypes.has(sourceMimeType)) {
    return sourceMimeType
  }

  return 'image/png'
}

function buildExportFilename(sourceName: string, mimeType: string) {
  const extension = getExtensionForMimeType(mimeType)
  const baseName = sourceName.replace(/\.[^/.]+$/, '') || 'image'

  return `${baseName}-edited.${extension}`
}

function getExtensionForMimeType(mimeType: string) {
  if (mimeType === 'image/jpeg') {
    return 'jpg'
  }

  if (mimeType === 'image/webp') {
    return 'webp'
  }

  return 'png'
}
