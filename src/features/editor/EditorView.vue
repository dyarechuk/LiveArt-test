<template>
  <section class="editor-view">
    <ImageWorkspace />
    <EditingPanel />
  </section>
  <MaskRefinementDialog />
</template>

<script setup lang="ts">
import ImageWorkspace from '@/features/editor/components/ImageWorkspace.vue'
import EditingPanel from '@/features/editor/components/EditingPanel.vue'
import MaskRefinementDialog from '@/features/editor/components/MaskRefinementDialog.vue'
</script>

<style scoped>
.editor-view {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
  width: 100%;
  max-width: 100%;
  height: calc(100dvh - var(--app-header-height));
  min-height: 0;
  overflow-x: hidden;
  overflow-y: hidden;
  background:
    radial-gradient(circle at 15% 0%, rgba(var(--v-theme-primary), 0.16), transparent 26rem),
    rgb(var(--v-theme-background));
}

@media (max-width: 960px) {
  .editor-view {
    display: flex;
    flex-direction: column;
    height: auto;
    min-height: auto;
    overflow-y: visible;
  }
}
</style>
