<template>
  <div class="document-page">
    <DocumentLoader 
      @select-document="handleDocumentSelect" 
    />
    
    <!-- Editor will completely reinitialize when key changes -->
    <Editor
      v-if="selectedDocument"
      :key="editorKey"
      :document-data="selectedDocument"
      @editor-ready="handleEditorReady"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DocumentLoader from '../components/DocumentLoader.vue'
import Editor from '../components/Editor.vue'

const selectedDocument = ref(null)
const editorKey = ref(0) // Used to force editor reinitialization
const editorInstance = ref(null)

const handleDocumentSelect = async (document) => {
  // First, increment key to force editor recreation
  editorKey.value++
  
  // Then set the document data
  selectedDocument.value = document
}

const handleEditorReady = (editor) => {
  editorInstance.value = editor
  console.log('Editor fully initialized with document:', selectedDocument.value?.title)
}
</script>

<style scoped>
.document-page {
  display: flex;
  gap: 20px;
  padding: 20px;
}
</style> 