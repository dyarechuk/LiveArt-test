import type { EditedImageDownload } from '@/features/editor/types/editor'

export function triggerFileDownload(download: EditedImageDownload) {
  const link = document.createElement('a')

  link.href = download.objectUrl
  link.download = download.filename
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
}
