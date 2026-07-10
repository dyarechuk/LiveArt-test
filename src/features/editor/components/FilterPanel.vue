<template>
  <section class="filter-panel">
    <div class="filter-panel__header">
      <h3>Filter</h3>
      <span>{{ selectedFilterLabel }}</span>
    </div>

    <v-btn-toggle
      class="filter-panel__toggle"
      density="comfortable"
      divided
      mandatory
      :model-value="editor.filter"
      rounded="lg"
      @update:model-value="setFilter"
    >
      <v-btn :disabled="controlsDisabled" value="none">
        None
      </v-btn>
      <v-btn :disabled="controlsDisabled" value="greyscale">
        Greyscale
      </v-btn>
      <v-btn :disabled="controlsDisabled" value="sepia">
        Sepia
      </v-btn>
    </v-btn-toggle>

    <div class="filter-panel__preset-actions">
      <v-btn
        block
        class="filter-panel__preset-action"
        :disabled="controlsDisabled"
        :loading="editor.isExportingFilterPreset"
        prepend-icon="mdi-download"
        variant="tonal"
        @click="editor.exportFilterPreset"
      >
        Export Filter Preset
      </v-btn>
      <v-btn
        block
        class="filter-panel__preset-action"
        :disabled="controlsDisabled"
        :loading="editor.isImportingFilterPreset"
        prepend-icon="mdi-upload"
        variant="tonal"
        @click="presetInput?.click()"
      >
        Import Filter Preset
      </v-btn>
      <input
        ref="presetInput"
        accept=".json,application/json"
        class="filter-panel__input"
        type="file"
        @change="handlePresetInputChange"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { EditorFilterName } from '@/features/editor/types/editor'
import { useEditorStore } from '@/features/editor/store/useEditorStore'

const editor = useEditorStore()
const presetInput = ref<HTMLInputElement>()
const controlsDisabled = computed(() => !editor.hasImage || editor.isBusy || editor.isCropMode)
const filterLabels: Record<EditorFilterName, string> = {
  none: 'No filter',
  greyscale: 'Greyscale',
  sepia: 'Sepia'
}

const selectedFilterLabel = computed(() => filterLabels[editor.filter])

function setFilter(filter: EditorFilterName | undefined) {
  if (filter) {
    editor.setFilter(filter)
  }
}

async function handlePresetInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.item(0) ?? undefined

  await editor.importFilterPreset(file)
  input.value = ''
}
</script>

<style scoped>
.filter-panel {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.filter-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.filter-panel h3 {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 720;
}

.filter-panel__header span {
  color: rgb(var(--v-theme-on-surface), 0.64);
  font-size: 0.8rem;
}

.filter-panel__toggle {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
  min-width: 0;
}

.filter-panel__toggle :deep(.v-btn) {
  min-width: 0;
  padding-inline: 6px;
  font-size: 0.86rem;
  letter-spacing: 0;
  text-transform: none;
}

.filter-panel__toggle :deep(.v-btn__content),
.filter-panel__preset-action :deep(.v-btn__content) {
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  font-size: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-panel__preset-actions {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.filter-panel__preset-action {
  min-width: 0;
  font-size: 0.95rem;
}

.filter-panel__preset-action :deep(.v-btn__content) {
  text-align: center;
}

.filter-panel__input {
  display: none;
}

@media (max-width: 960px) {
  .filter-panel__toggle :deep(.v-btn),
  .filter-panel__preset-action {
    font-size: 0.82rem;
  }
}

@media (max-width: 768px) {
  .filter-panel {
    gap: 10px;
  }

  .filter-panel__toggle :deep(.v-btn) {
    padding-inline: 4px;
    font-size: clamp(0.72rem, 2vw, 0.82rem);
  }

  .filter-panel__preset-actions {
    gap: 6px;
  }

  .filter-panel__preset-action {
    font-size: clamp(0.72rem, 2vw, 0.85rem);
  }
}
</style>
