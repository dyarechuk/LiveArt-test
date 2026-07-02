export function isSupportedImageFile(file: File) {
  return file.type.startsWith('image/') && file.type.length > 'image/'.length
}
