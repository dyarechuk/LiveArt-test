<template>
  <aside
    ref="panelElement"
    class="editing-panel"
    :aria-busy="isBackgroundRemovalProcessing"
    :class="{ 'editing-panel--locked': isBackgroundRemovalProcessing }"
  >
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
          :disabled="editor.isBusy"
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
          class="editing-panel__action editing-panel__action--background"
          :disabled="!editor.hasImage || editor.isBusy || editor.isCropMode"
          :loading="editor.backgroundRemoval.status === 'processing'"
          block
          prepend-icon="mdi-image-minus"
          variant="tonal"
          @click="editor.removeImageBackground"
        >
          {{ editor.backgroundRemoval.status === 'processing' ? 'Removing background...' : 'Remove Background' }}
        </v-btn>
        <div class="editing-panel__background-quality">
          <v-btn-toggle
            class="editing-panel__quality-toggle"
            density="compact"
            divided
            mandatory
            :model-value="editor.backgroundRemovalQuality"
            variant="outlined"
            @update:model-value="setBackgroundRemovalQuality"
          >
            <v-btn
              v-for="option in backgroundRemovalQualityOptions"
              :key="option.value"
              :disabled="editor.backgroundRemoval.status === 'processing'"
              :value="option.value"
            >
              {{ option.label }}
            </v-btn>
          </v-btn-toggle>
          <p class="editing-panel__background-help">
            Fast is quicker. Balanced works for most photos. Product preserves packaging and internal details better.
          </p>
        </div>
        <v-btn
          v-if="editor.isBackgroundRemovalApplied || editor.backgroundRemoval.status === 'error'"
          class="editing-panel__action editing-panel__action--restore-background"
          :disabled="editor.backgroundRemoval.status === 'processing'"
          block
          prepend-icon="mdi-image-refresh-outline"
          variant="tonal"
          @click="editor.clearBackgroundRemoval"
        >
          Restore Background
        </v-btn>
        <v-chip
          v-if="editor.isBackgroundRemovalApplied"
          class="editing-panel__background-status"
          color="success"
          density="comfortable"
          prepend-icon="mdi-check-circle-outline"
          size="small"
          variant="tonal"
        >
          {{ editor.backgroundRemovalResult?.isMaskRefined ? 'Mask refined' : 'Background removed' }}
        </v-chip>
        <v-btn
          v-if="editor.canRefineMask"
          class="editing-panel__action editing-panel__action--refine-mask"
          :disabled="editor.isBusy || editor.isCropMode"
          block
          prepend-icon="mdi-brush"
          variant="tonal"
          @click="editor.openMaskRefinement()"
        >
          Refine Mask
        </v-btn>
        <v-btn
          class="editing-panel__action editing-panel__action--export"
          :disabled="!editor.hasImage || editor.isCropMode || editor.isLoadingImage || editor.isExportingOperations || editor.backgroundRemoval.status === 'processing'"
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
          :disabled="!editor.hasImage || editor.isCropMode || editor.isLoadingImage || editor.isExporting || editor.backgroundRemoval.status === 'processing'"
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

    <div
      v-if="isBackgroundRemovalProcessing"
      class="editing-panel__processing-overlay"
      role="status"
      aria-live="polite"
    >
      <div class="editing-panel__processing-card">
        <v-icon class="editing-panel__processing-icon" icon="mdi-loading" size="28" />
        <strong>Removing background...</strong>
        <span>Controls will unlock when processing finishes.</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AdjustmentPanel from '@/features/editor/components/AdjustmentPanel.vue'
import FilterPanel from '@/features/editor/components/FilterPanel.vue'
import PreviewModeSwitcher from '@/features/editor/components/PreviewModeSwitcher.vue'
import { useEditorStore } from '@/features/editor/store/useEditorStore'
import type { BackgroundRemovalQuality } from '@/features/editor/types/editor'
import { formatFileSize } from '@/features/editor/utils/formatFileSize'

const editor = useEditorStore()
const fileInput = ref<HTMLInputElement>()
const panelElement = ref<HTMLElement>()
const isBackgroundRemovalProcessing = computed(() => editor.backgroundRemoval.status === 'processing')
const backgroundRemovalQualityOptions: Array<{
  label: string
  value: BackgroundRemovalQuality
}> = [
  {
    label: 'Fast',
    value: 'fast'
  },
  {
    label: 'Balanced',
    value: 'balanced'
  },
  {
    label: 'Product',
    value: 'product'
  }
]

watch(isBackgroundRemovalProcessing, (isProcessing) => {
  if (isProcessing && panelElement.value) {
    panelElement.value.scrollTop = 0
  }
})

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

function setBackgroundRemovalQuality(value: BackgroundRemovalQuality | null) {
  if (value) {
    editor.setBackgroundRemovalQuality(value)
  }
}
</script>

<style scoped>
.editing-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 0 0 380px;
  gap: 20px;
  width: 100%;
  max-width: 380px;
  min-width: 0;
  max-height: calc(100dvh - var(--app-header-height));
  overflow-x: hidden;
  overflow-y: auto;
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgba(var(--v-theme-surface), 0.94);
  padding: 24px;
}

.editing-panel--locked {
  overflow-y: hidden;
}

.editing-panel--locked > :not(.editing-panel__processing-overlay) {
  pointer-events: none;
  user-select: none;
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

.editing-panel__background-quality {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.editing-panel__quality-toggle {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
  min-width: 0;
}

.editing-panel__quality-toggle :deep(.v-btn) {
  min-width: 0;
  padding-inline: 8px;
  font-size: 0.88rem;
}

.editing-panel__quality-toggle :deep(.v-btn__content) {
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  font-size: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editing-panel__background-help {
  margin: 0;
  color: rgb(var(--v-theme-on-surface), 0.62);
  font-size: 0.76rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.editing-panel__background-status {
  justify-self: stretch;
  max-width: 100%;
  min-width: 0;
}

.editing-panel__background-status :deep(.v-chip__content) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editing-panel__input {
  display: none;
}

.editing-panel__processing-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: grid;
  padding: 24px;
  place-items: center;
  background: rgba(var(--v-theme-surface), 0.74);
  backdrop-filter: blur(8px);
  cursor: progress;
  touch-action: none;
}

.editing-panel__processing-card {
  display: grid;
  gap: 8px;
  width: min(100%, 280px);
  min-width: 0;
  padding: 18px;
  place-items: center;
  border: 1px solid rgba(var(--v-theme-primary), 0.28);
  border-radius: 8px;
  background: rgba(var(--v-theme-surface-bright), 0.94);
  box-shadow: 0 18px 54px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.editing-panel__processing-card strong {
  font-size: 0.98rem;
}

.editing-panel__processing-card span {
  color: rgb(var(--v-theme-on-surface), 0.68);
  font-size: 0.8rem;
  line-height: 1.35;
}

.editing-panel__processing-icon {
  color: rgb(var(--v-theme-primary));
  animation: editing-panel-spin 0.9s linear infinite;
}

@keyframes editing-panel-spin {
  to {
    transform: rotate(360deg);
  }
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

  .editing-panel__quality-toggle :deep(.v-btn) {
    font-size: 0.86rem;
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

  .editing-panel__quality-toggle :deep(.v-btn) {
    padding-inline: 4px;
    font-size: clamp(0.72rem, 2vw, 0.85rem);
  }

  .editing-panel__background-help {
    font-size: 0.72rem;
  }

  .editing-panel__processing-overlay {
    padding: 12px;
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
