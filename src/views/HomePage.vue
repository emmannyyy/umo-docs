<template>
  <div class="home-container">
    <header class="home-header">
      <div class="logo-container">
        <img src="/vite.svg" alt="Logo" class="logo" />
        <h1>UmoEditor</h1>
      </div>
      <div class="actions">
        <button @click="createNewDocument" class="btn-primary">New Document</button>
        <div class="user-profile">
          <span class="username">Guest User</span>
          <div class="avatar">G</div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="toolbar">
        <div class="search-container">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search documents..."
            class="search-input"
          />
        </div>
        <div class="view-options">
          <button 
            class="view-btn" 
            :class="{ active: viewType === 'grid' }"
            @click="viewType = 'grid'"
          >
            <i class="fas fa-th-large"></i> Grid
          </button>
          <button 
            class="view-btn" 
            :class="{ active: viewType === 'list' }"
            @click="viewType = 'list'"
          >
            <i class="fas fa-list"></i> List
          </button>
        </div>
        <div class="sort-options">
          <select v-model="sortBy" class="sort-select">
            <option value="updated_at">Last Modified</option>
            <option value="title">Title</option>
            <option value="created_at">Created Date</option>
          </select>
        </div>
      </div>

      <div class="documents-section">
        <h2>Recent Documents</h2>
        
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>Loading documents...</p>
        </div>
        
        <div v-else-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div v-else-if="filteredDocuments.length === 0" class="empty-state">
          <div class="empty-icon">📄</div>
          <h3>No documents found</h3>
          <p v-if="searchQuery">No results matching "{{ searchQuery }}"</p>
          <p v-else>Create your first document to get started</p>
          <button @click="createNewDocument" class="btn-primary">Create New Document</button>
        </div>
        
        <div 
          v-else 
          :class="['documents-container', `view-${viewType}`]"
        >
          <div 
            v-for="doc in filteredDocuments" 
            :key="doc.id"
            class="document-card"
            @click="openDocument(doc.id)"
          >
            <div class="document-preview">
              <div class="preview-content">
                <h3>{{ doc.title || 'Untitled Document' }}</h3>
                <p>{{ getContentPreview(doc.content) }}</p>
              </div>
            </div>
            <div class="document-info">
              <div class="document-title">{{ doc.title || 'Untitled Document' }}</div>
              <div class="document-date">Last edited {{ formatDate(doc.updated_at) }}</div>
            </div>
            <div class="document-actions">
              <button @click.stop="renameDocument(doc)" class="action-btn" title="Rename">
                <i class="fas fa-edit"></i>
              </button>
              <button @click.stop="duplicateDocument(doc)" class="action-btn" title="Duplicate">
                <i class="fas fa-copy"></i>
              </button>
              <button @click.stop="confirmDelete(doc)" class="action-btn delete" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- Rename Modal -->
    <div v-if="showRenameModal" class="modal-overlay">
      <div class="modal-content small-modal">
        <h3>Rename Document</h3>
        <input 
          type="text" 
          v-model="tempDocumentTitle" 
          placeholder="Document title"
          class="modal-input"
          ref="titleInput"
          @keyup.enter="saveRename"
        />
        <div class="modal-actions">
          <button @click="cancelRename" class="btn-secondary">Cancel</button>
          <button @click="saveRename" class="btn-primary">Save</button>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content small-modal">
        <h3>Delete Document</h3>
        <p>Are you sure you want to delete "{{ selectedDocument?.title || 'Untitled Document' }}"?</p>
        <p class="warning">This action cannot be undone.</p>
        <div class="modal-actions">
          <button @click="cancelDelete" class="btn-secondary">Cancel</button>
          <button @click="confirmDeleteAction" class="btn-danger">Delete</button>
        </div>
      </div>
    </div>
    
    <!-- Notification Toast -->
    <div v-if="showNotification" :class="['notification', `notification-${notificationType}`]">
      {{ notificationMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getUserDocuments, deleteDocument } from '../services/documentService'

const router = useRouter()

// State
const documents = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const viewType = ref('grid')
const sortBy = ref('updated_at')

// Modal state
const showRenameModal = ref(false)
const showDeleteModal = ref(false)
const selectedDocument = ref(null)
const tempDocumentTitle = ref('')

// Notification state
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref('success')

// Load documents on component mount
onMounted(async () => {
  try {
    await fetchDocuments()
  } catch (err) {
    error.value = `Error loading documents: ${err.message}`
  } finally {
    loading.value = false
  }
})

// Fetch documents from the API
const fetchDocuments = async () => {
  loading.value = true
  error.value = null
  
  try {
    // If you have user authentication, replace null with the user ID
    const fetchedDocuments = await getUserDocuments(null)
    documents.value = fetchedDocuments
  } catch (err) {
    error.value = `Error loading documents: ${err.message}`
    notify(`Failed to load documents: ${err.message}`, 'error')
  } finally {
    loading.value = false
  }
}

// Filter and sort documents
const filteredDocuments = computed(() => {
  let filtered = [...documents.value]
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(doc => {
      const title = (doc.title || 'Untitled Document').toLowerCase()
      const content = getContentPreview(doc.content).toLowerCase()
      return title.includes(query) || content.includes(query)
    })
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    if (sortBy.value === 'title') {
      const titleA = (a.title || 'Untitled Document').toLowerCase()
      const titleB = (b.title || 'Untitled Document').toLowerCase()
      return titleA.localeCompare(titleB)
    } else if (sortBy.value === 'created_at') {
      return new Date(b.created_at) - new Date(a.created_at)
    } else {
      // Default to updated_at
      return new Date(b.updated_at) - new Date(a.updated_at)
    }
  })
  
  return filtered
})

// Document actions
const createNewDocument = () => {
  router.push('/editor')
}

const openDocument = (id) => {
  router.push(`/editor/${id}`)
}

const renameDocument = (doc) => {
  selectedDocument.value = doc
  tempDocumentTitle.value = doc.title || ''
  showRenameModal.value = true
  
  // Focus the input field after modal is shown
  nextTick(() => {
    if (document.querySelector('.modal-input')) {
      document.querySelector('.modal-input').focus()
    }
  })
}

const saveRename = async () => {
  if (!selectedDocument.value) return
  
  try {
    // Update document title in database
    // This will be implemented in documentService
    // await updateDocumentTitle(selectedDocument.value.id, tempDocumentTitle.value)
    
    // For now, just update locally
    const doc = documents.value.find(d => d.id === selectedDocument.value.id)
    if (doc) {
      doc.title = tempDocumentTitle.value || 'Untitled Document'
    }
    
    notify(`Document renamed to "${tempDocumentTitle.value}"`)
    showRenameModal.value = false
  } catch (err) {
    notify(`Failed to rename document: ${err.message}`, 'error')
  }
}

const cancelRename = () => {
  showRenameModal.value = false
  selectedDocument.value = null
}

const duplicateDocument = async (doc) => {
  // This will be implemented later
  notify('Document duplication not implemented yet', 'info')
}

const confirmDelete = (doc) => {
  selectedDocument.value = doc
  showDeleteModal.value = true
}

const confirmDeleteAction = async () => {
  if (!selectedDocument.value) return
  
  try {
    await deleteDocument(selectedDocument.value.id)
    
    // Remove from local array
    documents.value = documents.value.filter(
      doc => doc.id !== selectedDocument.value.id
    )
    
    notify(`Document "${selectedDocument.value.title || 'Untitled Document'}" deleted`)
    showDeleteModal.value = false
    selectedDocument.value = null
  } catch (err) {
    notify(`Failed to delete document: ${err.message}`, 'error')
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  selectedDocument.value = null
}

// Notification system
const notify = (message, type = 'success', duration = 3000) => {
  notificationMessage.value = message
  notificationType.value = type
  showNotification.value = true
  
  setTimeout(() => {
    showNotification.value = false
  }, duration)
}

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    // Today, show time
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString()
  }
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
  return textContent.substring(0, 100).replace(/\n/g, ' ') + 
    (textContent.length > 100 ? '...' : '')
}
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f9fa;
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  height: 32px;
  width: auto;
}

.home-header h1 {
  font-size: 20px;
  font-weight: 500;
  color: #202124;
  margin: 0;
}

.actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #5f6368;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #4285f4;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.main-content {
  flex: 1;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  overflow-y: auto;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.search-container {
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.view-options, .sort-options {
  display: flex;
  align-items: center;
}

.view-btn {
  background: none;
  border: 1px solid #ddd;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 14px;
}

.view-btn:first-child {
  border-radius: 4px 0 0 4px;
}

.view-btn:last-child {
  border-radius: 0 4px 4px 0;
  border-left: none;
}

.view-btn.active {
  background-color: #f1f3f4;
  color: #1a73e8;
}

.sort-select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
}

.documents-section h2 {
  font-size: 18px;
  font-weight: 500;
  color: #202124;
  margin: 0 0 16px 0;
}

.documents-container {
  display: grid;
  gap: 16px;
}

.view-grid {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.view-list {
  grid-template-columns: 1fr;
}

.document-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.view-list .document-card {
  flex-direction: row;
  align-items: center;
  height: 72px;
}

.document-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.document-preview {
  height: 120px;
  background-color: #f1f3f4;
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  overflow: hidden;
}

.view-list .document-preview {
  height: 100%;
  width: 120px;
  border-bottom: none;
  border-right: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.preview-content {
  font-size: 12px;
  color: #5f6368;
  line-height: 1.5;
  overflow: hidden;
  height: 100%;
}

.preview-content h3 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 14px;
  color: #202124;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-info {
  padding: 12px;
  flex-grow: 1;
}

.document-title {
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-date {
  font-size: 12px;
  color: #5f6368;
}

.document-actions {
  display: flex;
  padding: 8px;
  gap: 8px;
  justify-content: flex-end;
  background-color: #f8f9fa;
  opacity: 0;
  transition: opacity 0.2s;
}

.view-list .document-actions {
  padding-right: 16px;
}

.document-card:hover .document-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #5f6368;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: #e8eaed;
}

.action-btn.delete:hover {
  color: #ea4335;
  background-color: #fee8e6;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  color: #5f6368;
}

.spinner {
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 3px solid #1a73e8;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 48px 0;
  color: #5f6368;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #202124;
}

.empty-state p {
  margin: 0 0 24px 0;
}

.error-message {
  background-color: #fee8e6;
  color: #ea4335;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 24px;
}

.btn-primary {
  background-color: #1a73e8;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #1765cc;
}

.btn-secondary {
  background-color: #f1f3f4;
  color: #5f6368;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #e8eaed;
}

.btn-danger {
  background-color: #ea4335;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-danger:hover {
  background-color: #d93025;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.small-modal {
  width: 320px;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #202124;
}

.modal-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.warning {
  color: #ea4335;
  margin-bottom: 16px;
  font-size: 14px;
}

/* Notification Toast */
.notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 16px;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: slide-in 0.3s ease-out forwards;
  max-width: 300px;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-success {
  background-color: #0f9d58;
}

.notification-error {
  background-color: #ea4335;
}

.notification-info {
  background-color: #1a73e8;
}

/* Add Font Awesome icons */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
</style> 