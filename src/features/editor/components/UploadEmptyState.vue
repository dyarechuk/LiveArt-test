<template>
  <section
    class="upload-empty-state"
    :class="{ 'upload-empty-state--dragging': isDragging }"
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <div class="upload-empty-state__content">
      <v-avatar color="surface-light" size="72">
        <v-icon color="primary" icon="mdi-tray-arrow-up" size="34" />
      </v-avatar>

      <div class="upload-empty-state__copy">
        <h2>Upload an image to begin</h2>
        <p>Start from a local file. The original remains untouched while edits are prepared separately.</p>
      </div>

      <v-btn color="primary" prepend-icon="mdi-image-plus" size="large" @click="fileInput?.click()">
        Choose image
      </v-btn>

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
  min-height: calc(100vh - 112px);
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

.upload-empty-state--dragging {
  border-color: rgb(var(--v-theme-primary));
  transform: scale(0.998);
}

.upload-empty-state__content {
  display: grid;
  justify-items: center;
  gap: 24px;
  width: min(100%, 520px);
  padding: 32px;
  text-align: center;
}

.upload-empty-state__copy {
  display: grid;
  gap: 8px;
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

@media (max-width: 640px) {
  .upload-empty-state {
    min-height: calc(100vh - 96px);
  }

  .upload-empty-state__content {
    padding: 20px;
  }
}
</style>
