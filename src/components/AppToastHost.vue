<template>
  <v-snackbar
    v-model="showUploadError"
    class="app-toast-host"
    color="error"
    location="top right"
    max-width="380"
    min-width="280"
    multi-line
    timeout="5000"
    variant="flat"
  >
    <div class="app-toast-host__content">
      <v-icon icon="mdi-alert-circle" size="20" />
      <span>{{ editor.uploadError }}</span>
    </div>

    <template #actions>
      <v-btn icon="mdi-close" variant="text" @click="editor.clearUploadError" />
    </template>
  </v-snackbar>

  <v-snackbar
    v-model="showEditorNotice"
    class="app-toast-host"
    :color="editor.editorNotice?.type"
    location="top right"
    max-width="380"
    min-width="280"
    multi-line
    timeout="4200"
    variant="flat"
  >
    <div class="app-toast-host__content">
      <v-icon :icon="noticeIcon" size="20" />
      <span>{{ editor.editorNotice?.message }}</span>
    </div>

    <template #actions>
      <v-btn icon="mdi-close" variant="text" @click="editor.clearEditorNotice" />
    </template>
  </v-snackbar>

  <v-snackbar
    v-model="showExportError"
    class="app-toast-host"
    color="error"
    location="top right"
    max-width="380"
    min-width="280"
    multi-line
    timeout="5000"
    variant="flat"
  >
    <div class="app-toast-host__content">
      <v-icon icon="mdi-alert-circle" size="20" />
      <span>{{ editor.exportError }}</span>
    </div>

    <template #actions>
      <v-btn icon="mdi-close" variant="text" @click="editor.clearExportError" />
    </template>
  </v-snackbar>

  <v-snackbar
    v-model="showExportMessage"
    class="app-toast-host"
    color="success"
    location="top right"
    max-width="380"
    min-width="280"
    multi-line
    timeout="5000"
    variant="flat"
  >
    <div class="app-toast-host__content">
      <v-icon icon="mdi-check-circle" size="20" />
      <span>{{ editor.exportMessage }}</span>
    </div>

    <template #actions>
      <v-btn icon="mdi-close" variant="text" @click="editor.clearExportMessage" />
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/features/editor/store/useEditorStore'

const editor = useEditorStore()

const showUploadError = computed({
  get: () => Boolean(editor.uploadError),
  set: (value) => {
    if (!value) {
      editor.clearUploadError()
    }
  }
})

const showExportError = computed({
  get: () => Boolean(editor.exportError),
  set: (value) => {
    if (!value) {
      editor.clearExportError()
    }
  }
})

const showExportMessage = computed({
  get: () => Boolean(editor.exportMessage),
  set: (value) => {
    if (!value) {
      editor.clearExportMessage()
    }
  }
})

const showEditorNotice = computed({
  get: () => Boolean(editor.editorNotice),
  set: (value) => {
    if (!value) {
      editor.clearEditorNotice()
    }
  }
})

const noticeIcon = computed(() => {
  if (editor.editorNotice?.type === 'warning') {
    return 'mdi-alert'
  }

  if (editor.editorNotice?.type === 'success') {
    return 'mdi-check-circle'
  }

  return 'mdi-information'
})
</script>

<style scoped>
.app-toast-host__content {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  line-height: 1.4;
}

.app-toast-host__content span {
  overflow-wrap: anywhere;
}
</style>
