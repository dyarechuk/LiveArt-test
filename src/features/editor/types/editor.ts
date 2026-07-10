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
  highlights: number
  shadows: number
  whites: number
  blacks: number
}

export type EditorAdjustmentKey = keyof EditorAdjustments

export type TonalAdjustmentKey = 'highlights' | 'shadows' | 'whites' | 'blacks'

export type EditorFilterName = 'none' | 'greyscale' | 'sepia'

export type EditorPreviewMode = 'original' | 'current'

export type FilterPresetSchemaVersion = 1

export type BackgroundRemovalStatus = 'idle' | 'processing' | 'applied' | 'error'

export type BackgroundRemovalQuality = 'fast' | 'balanced' | 'product'

export type MaskBrushMode = 'restore' | 'erase'

export type EditorNoticeType = 'info' | 'warning' | 'success'

export interface EditorNotice {
  message: string
  type: EditorNoticeType
}

export interface FilterPreset {
  schemaVersion: FilterPresetSchemaVersion
  type: 'filter-preset'
  name: string
  adjustments: EditorAdjustments
  filter: EditorFilterName
  createdAt: string
}

export type FilterPresetValidationResult =
  | {
      valid: true
      preset: FilterPreset
    }
  | {
      valid: false
      error: string
    }

export interface BackgroundRemovalPostProcessing {
  fillInternalHoles: boolean
  edgeRefinement: boolean
}

export interface BackgroundRemovalState {
  status: BackgroundRemovalStatus
  resultUrl: string | null
  resultMimeType: 'image/png' | null
  quality: BackgroundRemovalQuality | null
  postProcessing: BackgroundRemovalPostProcessing | null
  isMaskRefined: boolean
  errorMessage: string | null
}

export interface BackgroundRemovalResult {
  resultUrl: string
  resultMimeType: 'image/png'
  quality: BackgroundRemovalQuality
  postProcessing: BackgroundRemovalPostProcessing
  isMaskRefined: boolean
}

export interface EditorImageSource {
  name: string
  objectUrl: string
  mimeType: string
  naturalWidth: number
  naturalHeight: number
}

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
  backgroundRemoval: BackgroundRemovalResult | null
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

export interface BackgroundRemovalOperationExport {
  type: 'background-removal'
  model: '@imgly/background-removal'
  quality: BackgroundRemovalQuality
  postProcessing: BackgroundRemovalPostProcessing
  outputMimeType: 'image/png'
}

export interface MaskRefinementOperationExport {
  type: 'mask-refinement'
  mode: 'manual'
  applied: true
}

export interface AdjustmentOperationExport extends EditorAdjustments {
  type: 'adjust'
}

export interface FilterOperationExport {
  type: 'filter'
  name: Exclude<EditorFilterName, 'none'>
}

export type EditorOperationExport =
  | BackgroundRemovalOperationExport
  | MaskRefinementOperationExport
  | CropOperationExport
  | AdjustmentOperationExport
  | FilterOperationExport

export interface EditorOperationsExport {
  schemaVersion: 1
  source: EditorOperationsExportSource
  operations: EditorOperationExport[]
  exportedAt: string
}
