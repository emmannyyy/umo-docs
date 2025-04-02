<template>
  <div class="editor-container">
    <app-editor 
      :document-id="documentId"
      @document-loaded="handleDocumentLoaded"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppEditor from '../components/AppEditor.vue'

const route = useRoute()
const documentId = ref(null)
const documentTitle = ref('New Document')

// Extract document ID from route params
watch(() => route.params.id, (newId) => {
  documentId.value = newId
}, { immediate: true })

// Update document title when document is loaded
const handleDocumentLoaded = (documentInfo) => {
  if (documentInfo && documentInfo.title) {
    documentTitle.value = documentInfo.title
    document.title = `${documentInfo.title} - UmoEditor`
  }
}
</script>

<style scoped>
.editor-container {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}
</style> 