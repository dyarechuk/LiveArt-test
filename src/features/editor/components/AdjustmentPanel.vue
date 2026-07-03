<template>
  <section class="adjustment-panel">
    <div class="adjustment-panel__header">
      <h3>Adjustments</h3>
      <v-btn
        :disabled="controlsDisabled"
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
          <span class="adjustment-panel__value">{{ editor.adjustments[control.key] }}%</span>
        </div>
        <div class="adjustment-panel__row">
          <v-slider
            color="primary"
            density="comfortable"
            :disabled="controlsDisabled"
            hide-details
            max="200"
            min="0"
            :model-value="editor.adjustments[control.key]"
            step="1"
            track-color="surface-light"
            :aria-label="control.label"
            @update:model-value="setAdjustment(control.key, $event)"
          />
          <v-btn
            :aria-label="`Reset ${control.label.toLowerCase()}`"
            :disabled="controlsDisabled"
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
import { computed } from 'vue'
import type { EditorAdjustmentKey } from '@/features/editor/types/editor'
import { useEditorStore } from '@/features/editor/store/useEditorStore'

interface AdjustmentControl {
  key: EditorAdjustmentKey
  label: string
}

const editor = useEditorStore()
const controlsDisabled = computed(() => !editor.hasImage || editor.isBusy || editor.isCropMode)
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
  min-width: 0;
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
  min-width: 0;
}

.adjustment-panel__control {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.adjustment-panel__label {
  justify-content: space-between;
  gap: 12px;
  color: rgb(var(--v-theme-on-surface), 0.76);
  font-size: 0.86rem;
}

.adjustment-panel__value {
  min-width: 44px;
  color: rgb(var(--v-theme-on-surface), 0.88);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.adjustment-panel__row {
  gap: 8px;
  min-width: 0;
}

.adjustment-panel__row :deep(.v-slider) {
  min-width: 0;
}

@media (max-width: 768px) {
  .adjustment-panel {
    gap: 12px;
  }

  .adjustment-panel__header {
    gap: 8px;
  }

  .adjustment-panel__controls {
    gap: 12px;
  }

  .adjustment-panel__control {
    gap: 4px;
  }

  .adjustment-panel__label {
    font-size: 0.8rem;
  }

  .adjustment-panel__value {
    min-width: 40px;
  }
}
</style>
