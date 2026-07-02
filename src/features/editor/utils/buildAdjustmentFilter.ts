import type { EditorAdjustments } from '@/features/editor/types/editor'

export function buildAdjustmentFilter(adjustments: EditorAdjustments) {
  return [
    `brightness(${adjustments.brightness}%)`,
    `contrast(${adjustments.contrast}%)`,
    `saturate(${adjustments.saturation}%)`
  ].join(' ')
}
