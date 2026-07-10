import type {
  EditorAdjustments,
  EditorFilterName,
  TonalAdjustmentKey
} from '@/features/editor/types/editor'

export type TonalAdjustments = Pick<EditorAdjustments, TonalAdjustmentKey>

export function applyImageAdjustments(
  imageData: ImageData,
  adjustments: EditorAdjustments,
  filter: EditorFilterName
) {
  const hasBaseAdjustments =
    adjustments.brightness !== 100 ||
    adjustments.contrast !== 100 ||
    adjustments.saturation !== 100
  const hasTonalAdjustments =
    adjustments.highlights !== 0 ||
    adjustments.shadows !== 0 ||
    adjustments.whites !== 0 ||
    adjustments.blacks !== 0
  const hasFilter = filter !== 'none'

  if (!hasBaseAdjustments && !hasTonalAdjustments && !hasFilter) {
    return imageData
  }

  const brightness = adjustments.brightness / 100
  const contrast = adjustments.contrast / 100
  const saturation = adjustments.saturation / 100
  const highlights = adjustments.highlights / 100
  const shadows = adjustments.shadows / 100
  const whites = adjustments.whites / 100
  const blacks = adjustments.blacks / 100
  const data = imageData.data

  for (let index = 0; index < data.length; index += 4) {
    let red = data[index] / 255
    let green = data[index + 1] / 255
    let blue = data[index + 2] / 255

    if (hasBaseAdjustments) {
      red *= brightness
      green *= brightness
      blue *= brightness

      red = (red - 0.5) * contrast + 0.5
      green = (green - 0.5) * contrast + 0.5
      blue = (blue - 0.5) * contrast + 0.5

      const saturationLuminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
      red = saturationLuminance + (red - saturationLuminance) * saturation
      green = saturationLuminance + (green - saturationLuminance) * saturation
      blue = saturationLuminance + (blue - saturationLuminance) * saturation
    }

    if (hasTonalAdjustments) {
      const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
      const blackMask = 1 - smoothstep(0, 0.34, luminance)
      const shadowMask = (1 - smoothstep(0.18, 0.72, luminance)) * smoothstep(0.02, 0.28, luminance)
      const highlightMask = smoothstep(0.32, 0.86, luminance) * (1 - smoothstep(0.88, 1, luminance))
      const whiteMask = smoothstep(0.66, 1, luminance)

      const blackWeight = blacks * blackMask * 0.26
      const shadowWeight = shadows * shadowMask * 0.32
      const highlightWeight = highlights * highlightMask * 0.3
      const whiteWeight = whites * whiteMask * 0.24

      if (blackWeight > 0) {
        red += (1 - red) * blackWeight
        green += (1 - green) * blackWeight
        blue += (1 - blue) * blackWeight
      } else if (blackWeight < 0) {
        red += red * blackWeight
        green += green * blackWeight
        blue += blue * blackWeight
      }

      if (shadowWeight > 0) {
        red += (1 - red) * shadowWeight
        green += (1 - green) * shadowWeight
        blue += (1 - blue) * shadowWeight
      } else if (shadowWeight < 0) {
        red += red * shadowWeight
        green += green * shadowWeight
        blue += blue * shadowWeight
      }

      if (highlightWeight > 0) {
        red += (1 - red) * highlightWeight
        green += (1 - green) * highlightWeight
        blue += (1 - blue) * highlightWeight
      } else if (highlightWeight < 0) {
        red += red * highlightWeight
        green += green * highlightWeight
        blue += blue * highlightWeight
      }

      if (whiteWeight > 0) {
        red += (1 - red) * whiteWeight
        green += (1 - green) * whiteWeight
        blue += (1 - blue) * whiteWeight
      } else if (whiteWeight < 0) {
        red += red * whiteWeight
        green += green * whiteWeight
        blue += blue * whiteWeight
      }
    }

    if (filter === 'greyscale') {
      const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
      red = luminance
      green = luminance
      blue = luminance
    } else if (filter === 'sepia') {
      const sourceRed = red
      const sourceGreen = green
      const sourceBlue = blue
      red = sourceRed * 0.393 + sourceGreen * 0.769 + sourceBlue * 0.189
      green = sourceRed * 0.349 + sourceGreen * 0.686 + sourceBlue * 0.168
      blue = sourceRed * 0.272 + sourceGreen * 0.534 + sourceBlue * 0.131
    }

    data[index] = toByte(red)
    data[index + 1] = toByte(green)
    data[index + 2] = toByte(blue)
  }

  return imageData
}

export function applyTonalAdjustments(
  imageData: ImageData,
  adjustments: TonalAdjustments
) {
  return applyImageAdjustments(
    imageData,
    {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      highlights: adjustments.highlights,
      shadows: adjustments.shadows,
      whites: adjustments.whites,
      blacks: adjustments.blacks
    },
    'none'
  )
}

function smoothstep(edgeStart: number, edgeEnd: number, value: number) {
  const progress = clamp01((value - edgeStart) / (edgeEnd - edgeStart))

  return progress * progress * (3 - 2 * progress)
}

function toByte(value: number) {
  if (value <= 0) {
    return 0
  }

  if (value >= 1) {
    return 255
  }

  return Math.round(value * 255)
}

function clamp01(value: number) {
  if (value <= 0) {
    return 0
  }

  if (value >= 1) {
    return 1
  }

  return value
}
