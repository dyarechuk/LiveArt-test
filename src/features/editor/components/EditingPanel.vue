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

    <v-divider />

    <v-alert
      v-if="editor.uploadError"
      closable
      density="comfortable"
      type="error"
      variant="tonal"
      @click:close="editor.clearUploadError"
    >
      {{ editor.uploadError }}
    </v-alert>

    <section class="editing-panel__section">
      <h3>Source</h3>
      <dl class="editing-panel__source">
        <div>
          <dt>Status</dt>
          <dd>{{ editor.hasImage ? 'Image loaded' : 'Waiting for upload' }}</dd>
        </div>
        <div v-if="editor.originalImage">
          <dt>File</dt>
          <dd>{{ editor.originalImage.name }}</dd>
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

    <v-divider />

    <section class="editing-panel__section">
      <h3>Actions</h3>
      <div class="editing-panel__actions">
        <v-btn
          :loading="editor.isLoadingImage"
          block
          color="primary"
          prepend-icon="mdi-image-plus"
          @click="fileInput?.click()"
        >
          {{ editor.hasImage ? 'Replace image' : 'Choose image' }}
        </v-btn>
        <v-btn
          :disabled="!editor.hasImage"
          block
          prepend-icon="mdi-crop"
          variant="tonal"
          @click="editor.openCropMode"
        >
          {{ editor.crop ? 'Edit crop' : 'Crop image' }}
        </v-btn>
        <v-btn
          :disabled="!editor.crop"
          block
          prepend-icon="mdi-crop-free"
          variant="tonal"
          @click="editor.resetCrop"
        >
          Reset crop
        </v-btn>
        <v-btn
          :disabled="!editor.hasImage"
          block
          prepend-icon="mdi-refresh"
          variant="tonal"
          @click="editor.resetEdits"
        >
          Reset all
        </v-btn>
        <v-btn
          :disabled="!editor.hasImage"
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

    <v-divider />

    <section class="editing-panel__section">
      <AdjustmentPanel />
    </section>

    <v-divider />

    <section class="editing-panel__section">
      <h3>State model</h3>
      <v-list bg-color="transparent" density="compact" lines="two">
        <v-list-item prepend-icon="mdi-layers-outline" title="Original preserved" subtitle="The uploaded file and source URL are stored separately from edit operations." />
        <v-list-item prepend-icon="mdi-crop" title="Crop" :subtitle="editor.crop ? `${editor.crop.width} x ${editor.crop.height} px` : 'No crop applied'" />
        <v-list-item prepend-icon="mdi-history" title="Edit operations" :subtitle="`${editor.operations.length} queued operations`" />
        <v-list-item prepend-icon="mdi-select-drag" title="Selection" :subtitle="editor.selection ? 'Active selection' : 'No active selection'" />
      </v-list>
    </section>

  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AdjustmentPanel from '@/features/editor/components/AdjustmentPanel.vue'
import { useEditorStore } from '@/features/editor/store/useEditorStore'
import { formatFileSize } from '@/features/editor/utils/formatFileSize'

const editor = useEditorStore()
const fileInput = ref<HTMLInputElement>()

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
  gap: 20px;
  min-width: 0;
  max-height: calc(100vh - 64px);
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
  overflow-wrap: anywhere;
  font-size: 0.94rem;
}

.editing-panel__actions {
  display: grid;
  gap: 10px;
}

.editing-panel__input {
  display: none;
}

@media (max-width: 960px) {
  .editing-panel {
    max-height: none;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.1);
    border-left: 0;
  }
}
</style>
