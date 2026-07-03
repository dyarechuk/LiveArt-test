<template>
  <section class="crop-editor">
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
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 16px;
}

.crop-editor__canvas {
  display: grid;
  min-height: 520px;
  overflow: hidden;
  place-items: center;
  border: 1px solid rgba(var(--v-theme-primary), 0.44);
  border-radius: 8px;
  background: rgba(var(--v-theme-surface), 0.72);
}

.crop-editor__image {
  display: block;
  max-width: 100%;
  max-height: min(72vh, 760px);
}

.crop-editor__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

@media (max-width: 960px) {
  .crop-editor__canvas {
    min-height: 380px;
  }
}
</style>
