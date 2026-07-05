<template>
  <aside class="editing-panel">
    <div class="editing-panel__header">
      <div>
        <p class="editing-panel__eyebrow">Editor</p>
        <h2>Adjustments</h2>
      </div>
      <div class="editing-panel__header-actions">
        <v-btn
          aria-label="Reset all edits"
          :disabled="!editor.hasImage"
          icon="mdi-refresh"
          variant="text"
          @click="editor.resetEdits"
        />
        <v-btn
          aria-label="Remove image"
          :disabled="!editor.hasImage"
          icon="mdi-delete-outline"
          variant="text"
          @click="editor.removeImage"
        />
      </div>
    </div>

    <section class="editing-panel__section editing-panel__section--actions">
      <h3>Actions</h3>
      <div class="editing-panel__actions">
        <v-btn
          class="editing-panel__action editing-panel__action--upload"
          :loading="editor.isLoadingImage"
          block
          color="primary"
          :disabled="editor.isExporting || editor.isExportingOperations"
          prepend-icon="mdi-image-plus"
          @click="fileInput?.click()"
        >
          {{ editor.hasImage ? 'Replace image' : 'Choose image' }}
        </v-btn>
        <v-btn
          class="editing-panel__action editing-panel__action--crop"
          :disabled="!editor.hasImage || editor.isBusy"
          block
          prepend-icon="mdi-crop"
          variant="tonal"
          @click="editor.openCropMode"
        >
          {{ editor.crop ? 'Edit crop' : 'Crop image' }}
        </v-btn>
        <v-btn
          class="editing-panel__action editing-panel__action--export"
          :disabled="!editor.hasImage || editor.isCropMode || editor.isLoadingImage || editor.isExportingOperations"
          :loading="editor.isExporting"
          block
          color="success"
          prepend-icon="mdi-download"
          @click="editor.exportImage"
        >
          Export image
        </v-btn>
        <v-btn
          class="editing-panel__action editing-panel__action--json"
          :disabled="!editor.hasImage || editor.isCropMode || editor.isLoadingImage || editor.isExporting"
          :loading="editor.isExportingOperations"
          block
          prepend-icon="mdi-code-json"
          variant="tonal"
          @click="editor.exportOperationsJson"
        >
          Export operations JSON
        </v-btn>
        <v-btn
          class="editing-panel__action editing-panel__action--reset-crop"
          :disabled="!editor.crop || editor.isBusy"
          block
          prepend-icon="mdi-crop-free"
          variant="tonal"
          @click="editor.resetCrop"
        >
          Reset crop
        </v-btn>
        <v-btn
          class="editing-panel__action editing-panel__action--reset"
          :disabled="!editor.hasImage || editor.isBusy"
          block
          prepend-icon="mdi-refresh"
          variant="tonal"
          @click="editor.resetEdits"
        >
          Reset all
        </v-btn>
        <v-btn
          class="editing-panel__action editing-panel__action--remove"
          :disabled="!editor.hasImage || editor.isBusy"
          block
          color="error"
          prepend-icon="mdi-delete-outline"
          variant="tonal"
          @click="editor.removeImage"
        >
          Remove image
        </v-btn>
        <input
          ref="fileInput"
          accept="image/*"
          class="editing-panel__input"
          type="file"
          @change="handleInputChange"
        />
      </div>
    </section>

    <v-divider class="editing-panel__divider editing-panel__divider--actions" />

    <section class="editing-panel__section editing-panel__section--adjustments">
      <AdjustmentPanel />
    </section>

    <v-divider class="editing-panel__divider editing-panel__divider--adjustments" />

    <section class="editing-panel__section editing-panel__section--filter">
      <FilterPanel />
    </section>

    <v-divider class="editing-panel__divider editing-panel__divider--filter" />

    <section class="editing-panel__section editing-panel__section--preview">
      <PreviewModeSwitcher />
    </section>

    <v-divider class="editing-panel__divider editing-panel__divider--preview" />

    <section class="editing-panel__section editing-panel__section--source">
      <h3>Source</h3>
      <dl class="editing-panel__source">
        <div>
          <dt>Status</dt>
          <dd>{{ sourceStatus }}</dd>
        </div>
        <div v-if="editor.originalImage">
          <dt>File</dt>
          <dd :title="editor.originalImage.name">{{ editor.originalImage.name }}</dd>
        </div>
        <div v-if="editor.originalImage">
          <dt>Type</dt>
          <dd>{{ editor.originalImage.mimeType }}</dd>
        </div>
        <div v-if="editor.originalImage">
          <dt>Dimensions</dt>
          <dd>{{ editor.originalImage.naturalWidth }} x {{ editor.originalImage.naturalHeight }} px</dd>
        </div>
        <div v-if="editor.originalImage">
          <dt>Size</dt>
          <dd>{{ formatFileSize(editor.originalImage.size) }}</dd>
        </div>
      </dl>
    </section>

    <v-divider class="editing-panel__divider editing-panel__divider--source" />

    <section class="editing-panel__section editing-panel__section--state">
      <h3>State model</h3>
      <v-list bg-color="transparent" density="compact" lines="two">
        <v-list-item prepend-icon="mdi-layers-outline" title="Original preserved" subtitle="The uploaded file and source URL are stored separately from edit operations." />
        <v-list-item prepend-icon="mdi-crop" title="Crop" :subtitle="editor.crop ? `${editor.crop.width} x ${editor.crop.height} px` : 'No crop applied'" />
        <v-list-item prepend-icon="mdi-filter-outline" title="Filter" :subtitle="editor.filter" />
        <v-list-item prepend-icon="mdi-history" title="Edit operations" :subtitle="`${editor.operations.length} queued operations`" />
        <v-list-item prepend-icon="mdi-select-drag" title="Selection" :subtitle="editor.selection ? 'Active selection' : 'No active selection'" />
      </v-list>
    </section>

  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AdjustmentPanel from '@/features/editor/components/AdjustmentPanel.vue'
import FilterPanel from '@/features/editor/components/FilterPanel.vue'
import PreviewModeSwitcher from '@/features/editor/components/PreviewModeSwitcher.vue'
import { useEditorStore } from '@/features/editor/store/useEditorStore'
import { formatFileSize } from '@/features/editor/utils/formatFileSize'

const editor = useEditorStore()
const fileInput = ref<HTMLInputElement>()

const sourceStatus = computed(() => {
  if (editor.isLoadingImage) {
    return 'Preparing image'
  }

  if (editor.isCropMode) {
    return 'Crop mode active'
  }

  if (editor.hasImage) {
    return editor.hasEdits ? 'Image loaded with edits' : 'Image loaded'
  }

  return 'Waiting for upload'
})

async function handleInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.item(0) ?? undefined

  if (file) {
    await editor.loadImage(file)
  }

  input.value = ''
}
</script>

<style scoped>
.editing-panel {
  display: flex;
  flex-direction: column;
  flex: 0 0 380px;
  gap: 20px;
  width: 100%;
  max-width: 380px;
  min-width: 0;
  max-height: calc(100vh - 64px);
  overflow-x: hidden;
  overflow-y: auto;
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgba(var(--v-theme-surface), 0.94);
  padding: 24px;
}

.editing-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.editing-panel__header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.editing-panel__eyebrow,
.editing-panel h2,
.editing-panel h3 {
  margin: 0;
}

.editing-panel__eyebrow {
  color: rgb(var(--v-theme-primary));
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.editing-panel h2 {
  margin-top: 4px;
  font-size: 1.4rem;
  line-height: 1.2;
}

.editing-panel h3 {
  font-size: 0.92rem;
  font-weight: 720;
}

.editing-panel__section {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.editing-panel__divider {
  flex: 0 0 auto;
}

.editing-panel__source {
  display: grid;
  gap: 12px;
  margin: 0;
}

.editing-panel__source div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.editing-panel__source dt {
  color: rgb(var(--v-theme-on-surface), 0.58);
  font-size: 0.78rem;
}

.editing-panel__source dd {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: 0.94rem;
  overflow-wrap: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editing-panel__actions {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.editing-panel__action {
  min-width: 0;
  font-size: 0.95rem;
}

.editing-panel__action :deep(.v-btn__content) {
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  font-size: inherit;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editing-panel__input {
  display: none;
}

@media (max-width: 960px) {
  .editing-panel {
    flex: none;
    width: 100%;
    max-width: none;
    max-height: none;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.1);
    border-left: 0;
  }

  .editing-panel__action {
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) {
  .editing-panel {
    position: sticky;
    bottom: 0;
    z-index: 5;
    gap: 12px;
    max-height: min(68svh, 620px);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 12px 10px calc(12px + env(safe-area-inset-bottom));
    border-radius: 12px 12px 0 0;
    box-shadow: 0 -18px 42px rgba(0, 0, 0, 0.32);
  }

  .editing-panel__header {
    display: none;
  }

  .editing-panel__section {
    gap: 10px;
  }

  .editing-panel h3 {
    font-size: 0.84rem;
  }

  .editing-panel__divider--source,
  .editing-panel__section--state {
    display: none;
  }

  .editing-panel__actions {
    gap: 8px;
  }

  .editing-panel__action {
    width: 100%;
    font-size: clamp(0.72rem, 2vw, 0.85rem);
  }

  .editing-panel__source {
    gap: 8px;
  }

  .editing-panel__source dt {
    font-size: 0.74rem;
  }

  .editing-panel__source dd {
    font-size: 0.84rem;
  }
}
</style>
