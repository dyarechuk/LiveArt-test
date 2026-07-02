<template>
  <aside class="editing-panel">
    <div class="editing-panel__header">
      <div>
        <p class="editing-panel__eyebrow">Editor</p>
        <h2>Adjustments</h2>
      </div>
      <v-btn
        aria-label="Reset workspace"
        :disabled="!editor.hasImage"
        icon="mdi-refresh"
        variant="text"
        @click="editor.resetImage"
      />
    </div>

    <v-divider />

    <section class="editing-panel__section">
      <h3>Source</h3>
      <dl class="editing-panel__source">
        <div>
          <dt>Status</dt>
          <dd>{{ editor.hasImage ? 'Image loaded' : 'Waiting for upload' }}</dd>
        </div>
        <div v-if="editor.sourceImage">
          <dt>File</dt>
          <dd>{{ editor.sourceImage.name }}</dd>
        </div>
        <div v-if="editor.sourceImage">
          <dt>Size</dt>
          <dd>{{ formatFileSize(editor.sourceImage.size) }}</dd>
        </div>
      </dl>
    </section>

    <v-divider />

    <section class="editing-panel__section">
      <h3>Foundation</h3>
      <v-list bg-color="transparent" density="compact" lines="two">
        <v-list-item prepend-icon="mdi-layers-outline" title="Original preserved" subtitle="Future edits can derive previews without mutating the source file." />
        <v-list-item prepend-icon="mdi-history" title="Operation-ready state" subtitle="The store is prepared for ordered edit operations and selection state." />
        <v-list-item prepend-icon="mdi-monitor-dashboard" title="Responsive shell" subtitle="Workspace and controls adapt across desktop and smaller screens." />
      </v-list>
    </section>

    <v-divider />

    <section class="editing-panel__section editing-panel__section--muted">
      <h3>Next controls</h3>
      <v-slider disabled label="Brightness" max="100" min="-100" model-value="0" />
      <v-slider disabled label="Contrast" max="100" min="-100" model-value="0" />
      <v-slider disabled label="Saturation" max="100" min="-100" model-value="0" />
    </section>
  </aside>
</template>

<script setup lang="ts">
import { useEditorStore } from '@/features/editor/store/useEditorStore'
import { formatFileSize } from '@/features/editor/utils/formatFileSize'

const editor = useEditorStore()
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

.editing-panel__section--muted {
  opacity: 0.62;
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

@media (max-width: 960px) {
  .editing-panel {
    max-height: none;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.1);
    border-left: 0;
  }
}
</style>
