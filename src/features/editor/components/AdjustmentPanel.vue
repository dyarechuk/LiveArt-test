<template>
  <section class="adjustment-panel">
    <div class="adjustment-panel__header">
      <h3>Adjustments</h3>
      <v-btn
        :disabled="!editor.hasImage"
        prepend-icon="mdi-refresh"
        size="small"
        variant="tonal"
        @click="editor.resetAllAdjustments"
      >
        Reset all
      </v-btn>
    </div>

    <div class="adjustment-panel__controls">
      <div v-for="control in controls" :key="control.key" class="adjustment-panel__control">
        <div class="adjustment-panel__label">
          <span>{{ control.label }}</span>
          <span>{{ editor.adjustments[control.key] }}%</span>
        </div>
        <div class="adjustment-panel__row">
          <v-slider
            color="primary"
            density="comfortable"
            :disabled="!editor.hasImage"
            hide-details
            max="200"
            min="0"
            :model-value="editor.adjustments[control.key]"
            step="1"
            track-color="surface-light"
            @update:model-value="setAdjustment(control.key, $event)"
          />
          <v-btn
            :aria-label="`Reset ${control.label.toLowerCase()}`"
            :disabled="!editor.hasImage"
            icon="mdi-restore"
            size="small"
            variant="text"
            @click="editor.resetAdjustment(control.key)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { EditorAdjustmentKey } from '@/features/editor/types/editor'
import { useEditorStore } from '@/features/editor/store/useEditorStore'

interface AdjustmentControl {
  key: EditorAdjustmentKey
  label: string
}

const editor = useEditorStore()
const controls: AdjustmentControl[] = [
  {
    key: 'brightness',
    label: 'Brightness'
  },
  {
    key: 'contrast',
    label: 'Contrast'
  },
  {
    key: 'saturation',
    label: 'Saturation'
  }
]

function setAdjustment(key: EditorAdjustmentKey, value: number | string) {
  editor.setAdjustment(key, Number(value))
}
</script>

<style scoped>
.adjustment-panel {
  display: grid;
  gap: 16px;
}

.adjustment-panel__header,
.adjustment-panel__label,
.adjustment-panel__row {
  display: flex;
  align-items: center;
}

.adjustment-panel__header {
  justify-content: space-between;
  gap: 12px;
}

.adjustment-panel h3 {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 720;
}

.adjustment-panel__controls {
  display: grid;
  gap: 18px;
}

.adjustment-panel__control {
  display: grid;
  gap: 8px;
}

.adjustment-panel__label {
  justify-content: space-between;
  color: rgb(var(--v-theme-on-surface), 0.76);
  font-size: 0.86rem;
}

.adjustment-panel__row {
  gap: 8px;
}

.adjustment-panel__row :deep(.v-slider) {
  min-width: 0;
}
</style>
