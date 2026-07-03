export interface OriginalImage {
  id: string
  file: File
  name: string
  mimeType: string
  size: number
  objectUrl: string
  naturalWidth: number
  naturalHeight: number
  createdAt: string
}

export interface EditorAdjustments {
  brightness: number
  contrast: number
  saturation: number
}

export type EditorAdjustmentKey = keyof EditorAdjustments

export type EditorFilterName = 'none' | 'greyscale' | 'sepia'

export type EditorPreviewMode = 'original' | 'current'

export interface EditorCrop {
  x: number
  y: number
  width: number
  height: number
}

export interface EditorSelection {
  x: number
  y: number
  width: number
  height: number
}

export interface EditorOperation {
  id: string
  type: string
  createdAt: string
  payload: Record<string, unknown>
}

export interface EditedImageExportInput {
  adjustments: EditorAdjustments
  crop: EditorCrop | null
  filter: EditorFilterName
  originalImage: OriginalImage
}

export interface EditedImageExport {
  blob: Blob
  filename: string
  mimeType: string
}

export interface EditedImageDownload {
  filename: string
  objectUrl: string
}

export interface EditorOperationsExportSource {
  fileName: string
  mimeType: string
  width: number
  height: number
}

export interface CropOperationExport {
  type: 'crop'
  x: number
  y: number
  width: number
  height: number
}

export interface AdjustmentOperationExport extends EditorAdjustments {
  type: 'adjust'
}

export interface FilterOperationExport {
  type: 'filter'
  name: Exclude<EditorFilterName, 'none'>
}

export type EditorOperationExport =
  | CropOperationExport
  | AdjustmentOperationExport
  | FilterOperationExport

export interface EditorOperationsExport {
  schemaVersion: 1
  source: EditorOperationsExportSource
  operations: EditorOperationExport[]
  exportedAt: string
}
