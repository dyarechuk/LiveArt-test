<template>
  <section class="editor-view">
    <ImageWorkspace />
    <EditingPanel />
  </section>
</template>

<script setup lang="ts">
import ImageWorkspace from '@/features/editor/components/ImageWorkspace.vue'
import EditingPanel from '@/features/editor/components/EditingPanel.vue'
</script>

<style scoped>
.editor-view {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
  width: 100%;
  max-width: 100%;
  min-height: calc(100vh - 64px);
  overflow-x: hidden;
  background:
    radial-gradient(circle at 15% 0%, rgba(var(--v-theme-primary), 0.16), transparent 26rem),
    rgb(var(--v-theme-background));
}

@media (max-width: 960px) {
  .editor-view {
    display: flex;
    flex-direction: column;
    min-height: auto;
  }
}
</style>
