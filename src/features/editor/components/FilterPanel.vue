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
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EditorFilterName } from '@/features/editor/types/editor'
import { useEditorStore } from '@/features/editor/store/useEditorStore'

const editor = useEditorStore()
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
</script>

<style scoped>
.filter-panel {
  display: grid;
  gap: 12px;
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
}

.filter-panel__toggle :deep(.v-btn) {
  min-width: 0;
}
</style>
