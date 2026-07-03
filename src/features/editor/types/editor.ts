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
