import type { EditorAdjustments, EditorFilterName } from '@/features/editor/types/editor'

export function buildAdjustmentFilter(adjustments: EditorAdjustments, filter: EditorFilterName = 'none') {
  const filterParts = [
    `brightness(${adjustments.brightness}%)`,
    `contrast(${adjustments.contrast}%)`,
    `saturate(${adjustments.saturation}%)`
  ]

  if (filter === 'greyscale') {
    filterParts.push('grayscale(100%)')
  }

  if (filter === 'sepia') {
    filterParts.push('sepia(100%)')
  }

  return filterParts.join(' ')
}
