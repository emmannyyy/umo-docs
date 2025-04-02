<template>
  <div class="document-loader">
    <h3>Your Documents</h3>
    
    <div class="document-actions">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Search documents..."
        class="search-input"
      />
    </div>
    
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading documents...</p>
    </div>
    
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    
    <div v-else-if="filteredDocuments.length === 0 && !searchQuery" class="no-documents">
      No documents found. Start creating!
    </div>
    
    <div v-else-if="filteredDocuments.length === 0 && searchQuery" class="no-documents">
      No documents matching "{{ searchQuery }}".
    </div>
    
    <div v-else class="document-list">
      <div 
        v-for="doc in filteredDocuments" 
        :key="doc.id" 
        class="document-item"
        @click="selectDocument(doc)"
      >
        <div class="document-info">
          <div class="document-title">{{ doc.title || 'Untitled Document' }}</div>
          <div class="document-date">Last updated: {{ formatDate(doc.updated_at) }}</div>
        </div>
        <div class="document-preview" v-if="doc.content">
          <div class="preview-content">{{ getContentPreview(doc.content) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUserDocuments, getDocumentById } from '../services/documentService'

const documents = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')

// Emit events for parent component
const emit = defineEmits(['select-document'])

// Filter documents based on search query
const filteredDocuments = computed(() => {
  if (!searchQuery.value) return documents.value
  
  const query = searchQuery.value.toLowerCase()
  return documents.value.filter(doc => {
    const title = (doc.title || '').toLowerCase()
    const content = getContentPreview(doc.content).toLowerCase()
    return title.includes(query) || content.includes(query)
  })
})

onMounted(async () => {
  try {
    // If you have user authentication, replace null with the user ID
    const fetchedDocuments = await getUserDocuments(null)
    documents.value = fetchedDocuments
  } catch (err) {
    error.value = `Error loading documents: ${err.message}`
  } finally {
    loading.value = false
  }
})

const selectDocument = async (doc) => {
  try {
    loading.value = true
    console.log('Selected document:', doc)
    
    // Get the full document data
    const fullDoc = await getDocumentById(doc.id)
    
    if (!fullDoc) {
      throw new Error('Document not found or could not be loaded')
    }
    
    console.log('Full document data ready to emit:', fullDoc)
    emit('select-document', fullDoc)
  } catch (err) {
    console.error('Error in document selection:', err)
    error.value = `Error loading document: ${err.message}`
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const getContentPreview = (content) => {
  if (!content) return 'No content'
  
  // Handle different possible content formats
  let textContent = ''
  
  if (typeof content === 'string') {
    textContent = content
  } else if (content.text) {
    textContent = content.text
  } else if (content.html) {
    // Extract text from HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content.html
    textContent = tempDiv.textContent || tempDiv.innerText || ''
  } else if (typeof content === 'object') {
    // Try to extract some text from the object
    textContent = JSON.stringify(content).substring(0, 100)
  }
  
  // Limit preview length
  return textContent.substring(0, 150) + (textContent.length > 150 ? '...' : '')
}
</script>

<style scoped>
.document-loader {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h3 {
  margin-bottom: 20px;
  font-size: 1.5rem;
}

.document-actions {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.loading, .error, .no-documents {
  padding: 20px;
  text-align: center;
  color: #666;
  margin-top: 20px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #f44336;
}

.document-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.document-item {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.document-item:hover {
  background-color: #f5f5f5;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.document-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.document-title {
  font-weight: bold;
  font-size: 16px;
}

.document-date {
  font-size: 0.8rem;
  color: #777;
}

.document-preview {
  margin-top: 5px;
  color: #555;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

.preview-content {
  color: #666;
  font-style: italic;
}
</style> 