<template>
  <section
    class="upload-empty-state"
    :aria-busy="editor.isLoadingImage"
    :class="{ 'upload-empty-state--dragging': isDragging }"
    role="button"
    tabindex="0"
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    @click="fileInput?.click()"
    @keydown.enter.prevent="fileInput?.click()"
    @keydown.space.prevent="fileInput?.click()"
  >
    <div class="upload-empty-state__content">
      <v-avatar color="surface-light" size="72">
        <v-icon color="primary" :icon="editor.isLoadingImage ? 'mdi-loading' : 'mdi-tray-arrow-up'" size="34" />
      </v-avatar>

      <div class="upload-empty-state__copy">
        <h2>{{ editor.isLoadingImage ? 'Preparing image' : 'Upload an image to begin' }}</h2>
        <p>{{ editor.isLoadingImage ? 'Reading dimensions and preparing a non-destructive preview.' : 'Drop a PNG, JPEG or WebP file here. The original stays untouched while edits are stored as operations.' }}</p>
      </div>

      <v-btn
        color="primary"
        :disabled="editor.isLoadingImage"
        :loading="editor.isLoadingImage"
        prepend-icon="mdi-image-plus"
        size="large"
        @click.stop="fileInput?.click()"
      >
        Choose image
      </v-btn>

      <p class="upload-empty-state__hint">Image files only. Large images are supported, but export may take longer.</p>

      <input
        ref="fileInput"
        accept="image/*"
        class="upload-empty-state__input"
        type="file"
        @change="handleInputChange"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '@/features/editor/store/useEditorStore'

const editor = useEditorStore()
const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)

async function selectFile(file: File | undefined) {
  if (!file) {
    return
  }

  await editor.loadImage(file)
}

async function handleDrop(event: DragEvent) {
  isDragging.value = false
  await selectFile(event.dataTransfer?.files.item(0) ?? undefined)
}

async function handleInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  await selectFile(input.files?.item(0) ?? undefined)
  input.value = ''
}
</script>

<style scoped>
.upload-empty-state {
  display: grid;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  place-items: center;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.22);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(var(--v-theme-surface), 0.88), rgba(var(--v-theme-surface-bright), 0.72)),
    rgb(var(--v-theme-background));
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    transform 160ms ease;
}

.upload-empty-state:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 3px;
}

.upload-empty-state--dragging {
  border-color: rgb(var(--v-theme-primary));
  transform: scale(0.998);
}

.upload-empty-state__content {
  display: grid;
  justify-items: center;
  gap: 24px;
  width: min(100%, 520px);
  max-width: 100%;
  min-width: 0;
  padding: 32px;
  text-align: center;
}

.upload-empty-state__copy {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.upload-empty-state__copy h2 {
  margin: 0;
  font-size: clamp(1.6rem, 4vw, 2.5rem);
  font-weight: 760;
  line-height: 1.05;
}

.upload-empty-state__copy p {
  max-width: 34rem;
  margin: 0;
  color: rgb(var(--v-theme-on-surface), 0.68);
  font-size: 1rem;
  line-height: 1.6;
}

.upload-empty-state__input {
  display: none;
}

.upload-empty-state__hint {
  margin: 0;
  color: rgb(var(--v-theme-on-surface), 0.52);
  font-size: 0.82rem;
  line-height: 1.45;
}

@media (max-width: 640px) {
  .upload-empty-state {
    min-height: 0;
  }

  .upload-empty-state__content {
    gap: 16px;
    padding: 16px;
  }

  .upload-empty-state__copy h2 {
    font-size: 1.55rem;
  }

  .upload-empty-state__copy p {
    font-size: 0.9rem;
    line-height: 1.45;
  }

  .upload-empty-state__hint {
    font-size: 0.76rem;
  }
}
</style>
