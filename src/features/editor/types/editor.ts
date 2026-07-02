export interface EditorImage {
  id: string
  file: File
  name: string
  size: number
  type: string
  previewUrl: string
  createdAt: string
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
