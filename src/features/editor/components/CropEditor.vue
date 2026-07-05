<template>
  <section
    class="crop-editor"
    tabindex="0"
    @keydown.enter.prevent="applyCrop"
    @keydown.esc.prevent="emit('cancel')"
  >
    <div class="crop-editor__header">
      <div>
        <h2>Crop image</h2>
        <p>Adjust the frame, then apply or cancel to return to the editor.</p>
      </div>
      <v-btn icon="mdi-close" variant="text" aria-label="Cancel crop" @click="emit('cancel')" />
    </div>

    <div class="crop-editor__canvas">
      <img ref="imageElement" :alt="image.name" class="crop-editor__image" :src="image.objectUrl" />
    </div>

    <div class="crop-editor__actions">
      <v-btn color="primary" prepend-icon="mdi-check" @click="applyCrop">
        Apply crop
      </v-btn>
      <v-btn prepend-icon="mdi-close" variant="tonal" @click="emit('cancel')">
        Cancel
      </v-btn>
    </div>
  </section>
</template>

<script setup lang="ts">
import 'cropperjs/dist/cropper.css'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Cropper from 'cropperjs'
import type { EditorCrop, OriginalImage } from '@/features/editor/types/editor'

const props = defineProps<{
  crop: EditorCrop | null
  image: OriginalImage
}>()

const emit = defineEmits<{
  apply: [crop: EditorCrop]
  cancel: []
}>()

const imageElement = ref<HTMLImageElement>()
let cropper: Cropper | null = null

onMounted(async () => {
  await nextTick()
  createCropper()
})

onBeforeUnmount(() => {
  destroyCropper()
})

watch(
  () => props.image.objectUrl,
  async () => {
    destroyCropper()
    await nextTick()
    createCropper()
  }
)

function createCropper() {
  if (!imageElement.value) {
    return
  }

  cropper = new Cropper(imageElement.value, {
    autoCropArea: 0.8,
    background: false,
    checkOrientation: false,
    responsive: true,
    viewMode: 1,
    ready() {
      if (props.crop && cropper) {
        cropper.setData(props.crop)
      }
    }
  })
}

function destroyCropper() {
  cropper?.destroy()
  cropper = null
}

function applyCrop() {
  if (!cropper) {
    return
  }

  const cropData = cropper.getData(true)

  emit('apply', {
    x: cropData.x,
    y: cropData.y,
    width: cropData.width,
    height: cropData.height
  })
}
</script>

<style scoped>
.crop-editor {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 16px;
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
}

.crop-editor:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}

.crop-editor__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  min-height: 0;
}

.crop-editor__header h2,
.crop-editor__header p {
  margin: 0;
}

.crop-editor__header h2 {
  font-size: 1.2rem;
  line-height: 1.25;
}

.crop-editor__header p {
  margin-top: 4px;
  color: rgb(var(--v-theme-on-background), 0.62);
  font-size: 0.9rem;
}

.crop-editor__canvas {
  display: grid;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  place-items: center;
  border: 1px solid rgba(var(--v-theme-primary), 0.44);
  border-radius: 8px;
  background: rgba(var(--v-theme-surface), 0.72);
}

.crop-editor__image {
  display: block;
  max-width: 100%;
  max-height: 100%;
}

.crop-editor__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  min-width: 0;
  min-height: 0;
}

.crop-editor__canvas :deep(.cropper-container) {
  max-width: 100%;
  max-height: 100%;
}

@media (max-width: 768px) {
  .crop-editor {
    gap: 10px;
  }

  .crop-editor__header {
    gap: 8px;
  }

  .crop-editor__header h2 {
    font-size: 1rem;
  }

  .crop-editor__header p {
    font-size: 0.78rem;
    line-height: 1.35;
  }

  .crop-editor__canvas {
    height: auto;
    min-height: 0;
  }

  .crop-editor__image {
    max-height: 100%;
  }

  .crop-editor__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .crop-editor__actions :deep(.v-btn) {
    min-width: 0;
  }
}

@media (max-width: 420px) {
  .crop-editor__actions {
    grid-template-columns: 1fr;
  }
}
</style>
