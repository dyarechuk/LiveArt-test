<template>
  <div class="image-preview">
    <div
      class="image-preview__frame"
      :class="{ 'image-preview__frame--cropped': crop }"
      :style="previewStyle"
    >
      <img
        :alt="image.name"
        class="image-preview__image"
        :class="{ 'image-preview__image--cropped': crop }"
        :src="image.objectUrl"
        :style="imageStyle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EditorCrop, OriginalImage } from '@/features/editor/types/editor'

const props = defineProps<{
  crop: EditorCrop | null
  filter: string
  image: OriginalImage
}>()

const previewStyle = computed(() => {
  if (!props.crop) {
    return {}
  }

  const cropAspectRatio = props.crop.width / props.crop.height

  return {
    aspectRatio: `${props.crop.width} / ${props.crop.height}`,
    '--crop-aspect-ratio': `${cropAspectRatio}`,
    '--crop-natural-width': `${props.crop.width}px`
  }
})

const imageStyle = computed(() => {
  if (!props.crop) {
    return {
      filter: props.filter
    }
  }

  return {
    filter: props.filter,
    height: `${(props.image.naturalHeight / props.crop.height) * 100}%`,
    left: `${(-props.crop.x / props.crop.width) * 100}%`,
    maxHeight: 'none',
    maxWidth: 'none',
    position: 'absolute',
    top: `${(-props.crop.y / props.crop.height) * 100}%`,
    width: `${(props.image.naturalWidth / props.crop.width) * 100}%`
  }
})
</script>

<style scoped>
.image-preview {
  display: grid;
  min-height: 520px;
  overflow: hidden;
  place-items: center;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  background-color: rgba(var(--v-theme-surface), 0.72);
  background-image:
    linear-gradient(45deg, rgba(var(--v-theme-on-surface), 0.05) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(var(--v-theme-on-surface), 0.05) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(var(--v-theme-on-surface), 0.05) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(var(--v-theme-on-surface), 0.05) 75%);
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0;
  background-size: 20px 20px;
}

.image-preview__frame {
  position: relative;
  display: grid;
  width: fit-content;
  max-width: min(100%, 1200px);
  max-height: min(72vh, 760px);
  overflow: hidden;
  place-items: center;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}

.image-preview__frame--cropped {
  width: min(100%, var(--crop-natural-width), calc(min(72vh, 760px) * var(--crop-aspect-ratio)));
  max-height: none;
}

.image-preview__image {
  display: block;
  max-width: min(100%, 1200px);
  max-height: min(72vh, 760px);
  object-fit: contain;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}

.image-preview__image--cropped {
  object-fit: fill;
  box-shadow: none;
}

@media (max-width: 960px) {
  .image-preview {
    min-height: 380px;
  }

  .image-preview__image {
    max-height: 58vh;
  }

  .image-preview__frame {
    max-height: 58vh;
  }

  .image-preview__frame--cropped {
    width: min(100%, var(--crop-natural-width), calc(58vh * var(--crop-aspect-ratio)));
    max-height: none;
  }
}
</style>
