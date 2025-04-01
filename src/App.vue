<script setup>
import { ref } from 'vue'

// Create a ref for the editor content
const editorContent = ref('')

import { umoEditorConfig } from './utils/umoEditorConfig'

</script>

<template>
  <umo-editor v-bind="umoEditorConfig">
    <template #page_header="props">
        <img 
          src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2f4831e82472e9204de6edae9/topics/open-source/open-source.png" 
          alt="Open Source" 
          style="height: 24px; vertical-align: middle; margin-right: 8px;"
          loading="lazy"
        />
      <span>I Love open source bro wtf FINALLY</span>
    </template>
    <template #page_footer="props">
      <span>Page {{ props['page-number'] }} of {{ props['total-pages'] }}</span>
    </template>
  </umo-editor>
</template>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

#app {
  display: flex;
  width: 100vw;
}
</style>
