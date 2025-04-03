<template>
  <div class="editor-container">
    <umo-editor 
      v-bind="editorOptions"
      @editor-ready="handleEditorReady"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { UmoEditor } from '@umoteam/editor'
import { umoEditorConfig } from '../utils/umoEditorConfig'

const props = defineProps({
  documentData: {
    type: Object,
    default: () => null
  },
  editorKey: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['editor-ready'])

const editorOptions = ref({
  ...umoEditorConfig,
})

// Handle editor initialization
const handleEditorReady = (editor) => {
  if (props.documentData) {
    // Only set document data after editor is fully initialized
    editor.setContent(props.documentData.content)
    
    // Update any other document-specific configurations
    if (props.documentData.title) {
      editor.setTitle(props.documentData.title)
    }
  }
  
  emit('editor-ready', editor)
}
</script>

<style scoped>
.editor-container {
  width: 100%;
  height: 100%;
  padding: 20px;
}
</style> 