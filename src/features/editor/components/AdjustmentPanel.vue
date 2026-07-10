<template>
  <section class="adjustment-panel">
    <div class="adjustment-panel__header">
      <h3>Adjustments</h3>
      <v-btn
        :disabled="controlsDisabled"
        prepend-icon="mdi-refresh"
        size="small"
        variant="tonal"
        @click="resetAllAdjustments"
      >
        Reset all
      </v-btn>
    </div>

    <div class="adjustment-panel__controls">
      <div v-for="control in controls" :key="control.key" class="adjustment-panel__control">
        <div class="adjustment-panel__label">
          <span>{{ control.label }}</span>
          <span class="adjustment-panel__value">{{ formatAdjustmentValue(control) }}</span>
        </div>
        <div class="adjustment-panel__row">
          <v-slider
            color="primary"
            density="comfortable"
            :disabled="controlsDisabled"
            hide-details
            :max="control.max"
            :min="control.min"
            :model-value="localAdjustments[control.key]"
            :step="control.step"
            track-color="surface-light"
            :aria-label="control.label"
            @end="commitAdjustment(control.key)"
            @update:model-value="queueAdjustment(control.key, $event)"
          />
          <v-btn
            :aria-label="`Reset ${control.label.toLowerCase()}`"
            :disabled="controlsDisabled"
            icon="mdi-restore"
            size="small"
            variant="text"
            @click="resetAdjustment(control.key)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { EditorAdjustmentKey, EditorAdjustments } from '@/features/editor/types/editor'
import { useEditorStore } from '@/features/editor/store/useEditorStore'

interface AdjustmentControl {
  key: EditorAdjustmentKey
  label: string
  max: number
  min: number
  step: number
  suffix?: string
}

const editor = useEditorStore()
const controlsDisabled = computed(() => !editor.hasImage || editor.isBusy || editor.isCropMode)
const localAdjustments = ref<EditorAdjustments>({ ...editor.adjustments })
const pendingAdjustments = new Map<EditorAdjustmentKey, number>()
let commitFrame = 0
const controls: AdjustmentControl[] = [
  {
    key: 'brightness',
    label: 'Brightness',
    max: 200,
    min: 0,
    step: 1,
    suffix: '%'
  },
  {
    key: 'contrast',
    label: 'Contrast',
    max: 200,
    min: 0,
    step: 1,
    suffix: '%'
  },
  {
    key: 'saturation',
    label: 'Saturation',
    max: 200,
    min: 0,
    step: 1,
    suffix: '%'
  },
  {
    key: 'highlights',
    label: 'Highlights',
    max: 100,
    min: -100,
    step: 1
  },
  {
    key: 'shadows',
    label: 'Shadows',
    max: 100,
    min: -100,
    step: 1
  },
  {
    key: 'whites',
    label: 'Whites',
    max: 100,
    min: -100,
    step: 1
  },
  {
    key: 'blacks',
    label: 'Blacks',
    max: 100,
    min: -100,
    step: 1
  }
]

watch(
  () => ({ ...editor.adjustments }),
  (adjustments) => {
    if (commitFrame === 0 && pendingAdjustments.size === 0) {
      localAdjustments.value = { ...adjustments }
    }
  }
)

onBeforeUnmount(() => {
  flushPendingAdjustments()
})

function queueAdjustment(key: EditorAdjustmentKey, value: number | string) {
  const nextValue = Number(value)

  localAdjustments.value = {
    ...localAdjustments.value,
    [key]: nextValue
  }
  pendingAdjustments.set(key, nextValue)
  scheduleAdjustmentCommit()
}

function commitAdjustment(key: EditorAdjustmentKey, value?: number | string) {
  if (value !== undefined) {
    const nextValue = Number(value)

    localAdjustments.value = {
      ...localAdjustments.value,
      [key]: nextValue
    }
    pendingAdjustments.set(key, nextValue)
  }

  flushPendingAdjustments()
}

function resetAdjustment(key: EditorAdjustmentKey) {
  flushPendingAdjustments()
  editor.resetAdjustment(key)
  localAdjustments.value = { ...editor.adjustments }
}

function resetAllAdjustments() {
  flushPendingAdjustments()
  editor.resetAllAdjustments()
  localAdjustments.value = { ...editor.adjustments }
}

function scheduleAdjustmentCommit() {
  if (commitFrame) {
    return
  }

  commitFrame = requestAnimationFrame(() => {
    commitFrame = 0
    commitPendingAdjustments()
  })
}

function flushPendingAdjustments() {
  if (commitFrame) {
    cancelAnimationFrame(commitFrame)
    commitFrame = 0
  }

  commitPendingAdjustments()
}

function commitPendingAdjustments() {
  if (pendingAdjustments.size === 0) {
    return
  }

  for (const [key, value] of pendingAdjustments) {
    editor.setAdjustment(key, value)
  }

  pendingAdjustments.clear()
}

function formatAdjustmentValue(control: AdjustmentControl) {
  const value = localAdjustments.value[control.key]

  if (control.suffix) {
    return `${value}${control.suffix}`
  }

  return value > 0 ? `+${value}` : `${value}`
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
  gap: 14px;
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
