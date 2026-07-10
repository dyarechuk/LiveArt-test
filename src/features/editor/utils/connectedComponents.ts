export interface TransparentRegionFillOptions {
  alphaThreshold: number
  fillAlpha: number
  maxHoleAreaRatio: number
}

export function fillInternalTransparentRegions(
  imageData: ImageData,
  options: TransparentRegionFillOptions
) {
  const { width, height, data } = imageData
  const pixelCount = width * height
  const maxHoleArea = Math.floor(pixelCount * options.maxHoleAreaRatio)

  if (maxHoleArea < 1) {
    return 0
  }

  const visited = new Uint8Array(pixelCount)
  const queue = new Int32Array(pixelCount)
  const regionPixels = new Int32Array(maxHoleArea + 1)
  let filledRegions = 0

  for (let startPixel = 0; startPixel < pixelCount; startPixel += 1) {
    if (visited[startPixel] || !isTransparent(data, startPixel, options.alphaThreshold)) {
      continue
    }

    let head = 0
    let tail = 0
    let touchesBorder = false
    let canFill = true
    let regionLength = 0

    visited[startPixel] = 1
    queue[tail] = startPixel
    tail += 1

    while (head < tail) {
      const pixel = queue[head]
      head += 1

      const x = pixel % width
      const y = Math.floor(pixel / width)

      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        touchesBorder = true
        canFill = false
      }

      if (canFill) {
        if (regionLength < regionPixels.length) {
          regionPixels[regionLength] = pixel
          regionLength += 1
        } else {
          canFill = false
          regionLength = 0
        }
      }

      if (x > 0) {
        tail = enqueueTransparentNeighbor(queue, tail, visited, data, pixel - 1, options.alphaThreshold)
      }

      if (x < width - 1) {
        tail = enqueueTransparentNeighbor(queue, tail, visited, data, pixel + 1, options.alphaThreshold)
      }

      if (y > 0) {
        tail = enqueueTransparentNeighbor(queue, tail, visited, data, pixel - width, options.alphaThreshold)
      }

      if (y < height - 1) {
        tail = enqueueTransparentNeighbor(queue, tail, visited, data, pixel + width, options.alphaThreshold)
      }
    }

    if (!touchesBorder && canFill && regionLength <= maxHoleArea) {
      for (let index = 0; index < regionLength; index += 1) {
        data[regionPixels[index] * 4 + 3] = options.fillAlpha
      }

      filledRegions += 1
    }
  }

  return filledRegions
}

function enqueueTransparentNeighbor(
  queue: Int32Array,
  tail: number,
  visited: Uint8Array,
  data: Uint8ClampedArray,
  pixel: number,
  alphaThreshold: number
) {
  if (!visited[pixel] && isTransparent(data, pixel, alphaThreshold)) {
    visited[pixel] = 1
    queue[tail] = pixel
    return tail + 1
  }

  return tail
}

function isTransparent(data: Uint8ClampedArray, pixel: number, alphaThreshold: number) {
  return data[pixel * 4 + 3] < alphaThreshold
}
