import type {
  EditorOperationsExport,
  EditorOperationsExportSource,
  EditedImageDownload,
  EditedImageExportInput
} from '@/features/editor/types/editor'
import { triggerFileDownload } from '@/features/editor/utils/downloadFile'

export function buildOperationsExport(input: EditedImageExportInput): EditorOperationsExport {
  return {
    schemaVersion: 1,
    source: buildSource(input),
    operations: buildOperations(input),
    exportedAt: new Date().toISOString()
  }
}

export function createOperationsJsonDownload(input: EditedImageExportInput): EditedImageDownload {
  const operationsExport = buildOperationsExport(input)
  const json = JSON.stringify(operationsExport, null, 2)
  const blob = new Blob([json], {
    type: 'application/json'
  })

  return {
    filename: buildOperationsFilename(input.originalImage.name),
    objectUrl: URL.createObjectURL(blob)
  }
}

export function triggerOperationsJsonDownload(download: EditedImageDownload) {
  triggerFileDownload(download)
}

function buildSource(input: EditedImageExportInput): EditorOperationsExportSource {
  return {
    fileName: input.originalImage.name,
    mimeType: input.originalImage.mimeType,
    width: input.originalImage.naturalWidth,
    height: input.originalImage.naturalHeight
  }
}

function buildOperations(input: EditedImageExportInput): EditorOperationsExport['operations'] {
  const operations: EditorOperationsExport['operations'] = []

  if (input.crop) {
    operations.push({
      type: 'crop',
      x: input.crop.x,
      y: input.crop.y,
      width: input.crop.width,
      height: input.crop.height
    })
  }

  operations.push({
    type: 'adjust',
    brightness: input.adjustments.brightness,
    contrast: input.adjustments.contrast,
    saturation: input.adjustments.saturation
  })

  if (input.filter !== 'none') {
    operations.push({
      type: 'filter',
      name: input.filter
    })
  }

  return operations
}

function buildOperationsFilename(sourceName: string) {
  const baseName = sourceName.replace(/\.[^/.]+$/, '') || 'image'

  return `${baseName}-operations.json`
}
