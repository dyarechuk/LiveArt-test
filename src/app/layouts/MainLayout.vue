<template>
  <v-layout class="app-layout">
    <AppHeader />
    <v-main>
      <EditorView />
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import EditorView from '@/features/editor/EditorView.vue'
</script>
