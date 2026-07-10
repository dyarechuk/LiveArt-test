import { removeBackground } from '@imgly/background-removal'
import type {
  BackgroundRemovalPostProcessing,
  BackgroundRemovalQuality
} from '@/features/editor/types/editor'
import { postProcessBackgroundRemovalBlob } from '@/features/editor/utils/alphaMaskPostProcessing'

export interface BackgroundRemovalProcessingResult {
  blob: Blob
  postProcessing: BackgroundRemovalPostProcessing
}

export async function removeImageBackgroundWithPostProcessing(
  image: Blob,
  quality: BackgroundRemovalQuality
): Promise<BackgroundRemovalProcessingResult> {
  const result = await removeBackground(image, {
    output: {
      format: 'image/png',
      type: 'foreground'
    }
  })

  return postProcessBackgroundRemovalBlob(result, quality)
}
