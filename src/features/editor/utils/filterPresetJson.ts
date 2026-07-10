import type {
  EditedImageDownload,
  EditorAdjustments,
  EditorFilterName,
  FilterPreset,
  FilterPresetValidationResult
} from '@/features/editor/types/editor'
import { triggerFileDownload } from '@/features/editor/utils/downloadFile'

interface FilterPresetInput {
  adjustments: EditorAdjustments
  filter: EditorFilterName
  name?: string
}

const schemaVersion = 1
const filterPresetType = 'filter-preset'
const defaultPresetName = 'Image Editor Filter Preset'
const supportedFilters: readonly EditorFilterName[] = ['none', 'greyscale', 'sepia']

export function buildFilterPreset(input: FilterPresetInput): FilterPreset {
  return {
    schemaVersion,
    type: filterPresetType,
    name: normalizePresetName(input.name),
    adjustments: {
      brightness: input.adjustments.brightness,
      contrast: input.adjustments.contrast,
      saturation: input.adjustments.saturation,
      highlights: input.adjustments.highlights,
      shadows: input.adjustments.shadows,
      whites: input.adjustments.whites,
      blacks: input.adjustments.blacks
    },
    filter: input.filter,
    createdAt: new Date().toISOString()
  }
}

export function createFilterPresetDownload(input: FilterPresetInput): EditedImageDownload {
  const preset = buildFilterPreset(input)
  const json = JSON.stringify(preset, null, 2)
  const blob = new Blob([json], {
    type: 'application/json'
  })

  return {
    filename: buildFilterPresetFilename(preset),
    objectUrl: URL.createObjectURL(blob)
  }
}

export function triggerFilterPresetDownload(download: EditedImageDownload) {
  triggerFileDownload(download)
}

export function parseFilterPresetJson(json: string): FilterPresetValidationResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(json)
  } catch {
    return {
      valid: false,
      error: 'The selected file is not valid JSON.'
    }
  }

  return validateFilterPreset(parsed)
}

function validateFilterPreset(value: unknown): FilterPresetValidationResult {
  if (!isRecord(value)) {
    return invalidPreset()
  }

  if (value.schemaVersion !== schemaVersion || value.type !== filterPresetType) {
    return invalidPreset()
  }

  if (typeof value.name !== 'string' || value.name.trim().length === 0) {
    return invalidPreset()
  }

  if (typeof value.createdAt !== 'string' || value.createdAt.trim().length === 0) {
    return invalidPreset()
  }

  const adjustments = value.adjustments

  if (!isRecord(adjustments)) {
    return invalidPreset()
  }

  const brightness = adjustments.brightness
  const contrast = adjustments.contrast
  const saturation = adjustments.saturation
  const highlights = 'highlights' in adjustments ? adjustments.highlights : 0
  const shadows = 'shadows' in adjustments ? adjustments.shadows : 0
  const whites = 'whites' in adjustments ? adjustments.whites : 0
  const blacks = 'blacks' in adjustments ? adjustments.blacks : 0

  if (
    !isPrimaryAdjustmentValue(brightness) ||
    !isPrimaryAdjustmentValue(contrast) ||
    !isPrimaryAdjustmentValue(saturation) ||
    !isTonalAdjustmentValue(highlights) ||
    !isTonalAdjustmentValue(shadows) ||
    !isTonalAdjustmentValue(whites) ||
    !isTonalAdjustmentValue(blacks) ||
    !isSupportedFilter(value.filter)
  ) {
    return invalidPreset()
  }

  return {
    valid: true,
    preset: {
      schemaVersion,
      type: filterPresetType,
      name: value.name.trim(),
      adjustments: {
        brightness,
        contrast,
        saturation,
        highlights,
        shadows,
        whites,
        blacks
      },
      filter: value.filter,
      createdAt: value.createdAt
    }
  }
}

function invalidPreset(): FilterPresetValidationResult {
  return {
    valid: false,
    error: 'The selected JSON file is not a valid filter preset.'
  }
}

function normalizePresetName(name: string | undefined) {
  const normalizedName = name?.trim()

  return normalizedName || defaultPresetName
}

function buildFilterPresetFilename(preset: FilterPreset) {
  const safeName = preset.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const timestamp = preset.createdAt.replace(/[:.]/g, '-')

  return `${safeName || 'filter-preset'}-${timestamp}.json`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPrimaryAdjustmentValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 200
}

function isTonalAdjustmentValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= -100 && value <= 100
}

function isSupportedFilter(value: unknown): value is EditorFilterName {
  return supportedFilters.includes(value as EditorFilterName)
}
