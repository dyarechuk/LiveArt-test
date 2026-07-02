export function readImageDimensions(sourceUrl: string) {
  return new Promise<{ naturalWidth: number; naturalHeight: number }>((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      resolve({
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight
      })
    }

    image.onerror = () => {
      reject(new Error('The selected file could not be loaded as an image.'))
    }

    image.src = sourceUrl
  })
}
