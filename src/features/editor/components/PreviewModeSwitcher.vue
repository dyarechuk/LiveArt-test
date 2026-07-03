<template>
  <section class="preview-mode-switcher">
    <div class="preview-mode-switcher__header">
      <h3>Preview</h3>
      <span>{{ editor.previewMode === 'current' ? 'Current edits' : 'Original source' }}</span>
    </div>

    <v-btn-toggle
      class="preview-mode-switcher__toggle"
      density="comfortable"
      divided
      mandatory
      :model-value="editor.previewMode"
      rounded="lg"
      @update:model-value="setPreviewMode"
    >
      <v-btn :disabled="!editor.hasImage || editor.isCropMode" value="original">
        Original
      </v-btn>
      <v-btn :disabled="!editor.hasImage || editor.isCropMode" value="current">
        Current
      </v-btn>
    </v-btn-toggle>
  </section>
</template>

<script setup lang="ts">
import type { EditorPreviewMode } from '@/features/editor/types/editor'
import { useEditorStore } from '@/features/editor/store/useEditorStore'

const editor = useEditorStore()

function setPreviewMode(mode: EditorPreviewMode | undefined) {
  if (mode) {
    editor.setPreviewMode(mode)
  }
}
</script>

<style scoped>
.preview-mode-switcher {
  display: grid;
  gap: 12px;
}

.preview-mode-switcher__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.preview-mode-switcher h3 {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 720;
}

.preview-mode-switcher__header span {
  color: rgb(var(--v-theme-on-surface), 0.64);
  font-size: 0.8rem;
}

.preview-mode-switcher__toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
}

.preview-mode-switcher__toggle :deep(.v-btn) {
  min-width: 0;
}
</style>
