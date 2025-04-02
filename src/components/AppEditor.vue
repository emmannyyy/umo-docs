<template>
  <div class="app-container">
    <!-- Document Header -->
    <div class="document-header">
      <div class="document-title-container">
        <h1 @click="editDocumentTitle" class="document-title">{{ documentTitle }}</h1>
        <button @click="createNewDocument" class="new-doc-button">New Document</button>
      </div>
      <div class="document-actions">
        <button @click="goToHome" class="back-button">
          <i class="fas fa-chevron-left"></i> Documents
        </button>
      </div>
    </div>
    
    <!-- Editor -->
    <umo-editor ref="editorRef" v-bind="umoEditorConfig" @save="onSave">
      <!-- Home menu slot-->
      <template #toolbar_base="props">
        <span>
          <button 
            @click="printEditorContent" 
            class="print-button"
          >
            Print Editor Content
          </button>
        </span>
      </template>

      <!-- insert slot -->
      <template #toolbar_insert="props">
        <span>
          <button @click="insertHeader" class="insert-header">
            Edit Header
          </button>
        </span>
      </template>

      <template #page_header="props">
        <div class="centered-header">
          <img 
            :src="logoUrl" 
            alt="Header Logo" 
            class="header-logo"
            loading="lazy"
          />
          <span>{{ headerText }}</span>
        </div>
      </template>
      
      <template #page_footer="props">
        <div class="centered-footer">
          <span>Page {{ props['page-number'] }} of {{ props['total-pages'] }}</span>
        </div>
      </template>
    </umo-editor>
  </div>

  <!-- Header Edit Modal -->
  <div v-if="showModal" class="modal-overlay">
    <div class="modal-content">
      <h3>Edit Header</h3>
      
      <div class="form-group">
        <label for="header-text">Header Text</label>
        <input 
          type="text" 
          id="header-text"
          v-model="tempHeaderText" 
          class="header-input"
          placeholder="Enter header text"
        />
      </div>
      
      <div class="form-group">
        <label for="logo-url">Logo URL</label>
        <input 
          type="text" 
          id="logo-url"
          v-model="tempLogoUrl" 
          class="header-input"
          placeholder="Enter logo URL"
        />
      </div>
      
      <div class="form-group">
        <label>Choose Predefined Logo</label>
        <div class="logo-options">
          <div 
            v-for="logo in logoOptions" 
            :key="logo.url" 
            class="logo-option"
            :class="{ 'selected': tempLogoUrl === logo.url }"
            @click="tempLogoUrl = logo.url"
          >
            <img :src="logo.url" :alt="logo.name" class="logo-preview" />
            <span>{{ logo.name }}</span>
          </div>
        </div>
      </div>
      
      <div class="logo-preview-container">
        <label>Preview</label>
        <div class="header-preview">
          <img 
            :src="tempLogoUrl" 
            alt="Logo Preview" 
            class="logo-preview-image"
          />
          <span>{{ tempHeaderText }}</span>
        </div>
      </div>
      
      <div class="modal-buttons">
        <button @click="saveHeaderText" class="save-button">Save</button>
        <button @click="cancelHeaderEdit" class="cancel-button">Cancel</button>
      </div>
    </div>
  </div>
  
  <!-- Document Title Modal -->
  <div v-if="showTitleModal" class="modal-overlay">
    <div class="modal-content title-modal">
      <h3>Document Title</h3>
      
      <div class="form-group">
        <label for="document-title">Title</label>
        <input 
          type="text" 
          id="document-title"
          v-model="tempDocumentTitle" 
          class="header-input"
          placeholder="Enter document title"
          autofocus
        />
      </div>
      
      <div class="modal-buttons">
        <button @click="saveDocumentTitle" class="save-button">Save</button>
        <button @click="cancelTitleEdit" class="cancel-button">Cancel</button>
      </div>
    </div>
  </div>
  
  <!-- Notification Toast -->
  <div v-if="showNotification" :class="['notification', `notification-${notificationType}`]">
    {{ notificationMessage }}
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { saveDocument, getDocumentById } from '../services/documentService'
import { umoEditorConfig } from '../utils/umoEditorConfig'

// Component props
const props = defineProps({
  documentId: {
    type: String,
    default: null
  }
})

// Component events
const emit = defineEmits(['document-loaded'])

const router = useRouter()

// Add success notification system
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref('success')

// Editor reference
const editorRef = ref(null)

// Show a notification message to the user
const notify = (message, type = 'success', duration = 3000) => {
  notificationMessage.value = message
  notificationType.value = type
  showNotification.value = true
  
  // Auto-hide notification after duration
  setTimeout(() => {
    showNotification.value = false
  }, duration)
}

// Create a ref for the editor content
const editorContent = ref('')
// Header text ref
const headerText = ref('I Love open source bro wtf FINALLY')
// Logo URL ref
const logoUrl = ref('/vite.svg')
// Modal visibility state
const showModal = ref(false)
// Document title modal visibility
const showTitleModal = ref(false)
// Temporary input for the modal
const tempHeaderText = ref('')
const tempLogoUrl = ref('')

// Document tracking
const currentDocumentId = ref(null)
const documentTitle = ref('Untitled Document')
const tempDocumentTitle = ref('')

// Load document by ID
const loadDocument = async (id) => {
  try {
    if (!id) return
    
    console.log('Loading document:', id)
    
    // Get document from database
    const document = await getDocumentById(id)
    
    if (!document) {
      throw new Error('Document not found')
    }
    
    // Store document ID
    currentDocumentId.value = document.id
    
    // Set document title
    if (document.title) {
      documentTitle.value = document.title
    }
    
    // Add a slight delay to ensure editor is ready
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Safeguard check for editor reference
    if (!editorRef.value) {
      console.error('Editor reference is not available')
      throw new Error('Editor not initialized')
    }
    
    // Log the available editor methods to help debugging
    console.log('Available editor methods:', 
      Object.keys(editorRef.value).filter(key => typeof editorRef.value[key] === 'function'))
    
    // Check if content exists
    if (!document.content) {
      console.warn('Document has no content, creating empty document')
      editorRef.value.setContent(`<h1>${document.title || 'Untitled Document'}</h1>`, {
        emitUpdate: true
      })
    } else {
      // Directly try to extract HTML content in a way that's most likely to succeed
      let htmlContent = null
      
      if (typeof document.content === 'string') {
        // If content is a string, use it directly
        htmlContent = document.content
        console.log('Using string content directly')
      } else if (document.content.html) {
        // If content has html property, use that
        htmlContent = document.content.html
        console.log('Using content.html property')
      } else if (document.content.original) {
        // Try using original
        htmlContent = document.content.original
        console.log('Using content.original property')
      } else if (document.content.text) {
        // Try text property
        htmlContent = document.content.text
        console.log('Using content.text property')
      } else if (document.content.json) {
        // For JSON, we'll handle it separately
        console.log('Content appears to be JSON, handling specifically')
      } else {
        // Last resort
        htmlContent = `<h1>${document.title || 'Untitled Document'}</h1><p>Content could not be parsed.</p>`
        console.warn('No usable content found, using placeholder')
      }
      
      // Load content into editor with fallback mechanisms
      try {
        if (htmlContent) {
          // Try with most direct method first
          console.log('Setting content with direct HTML')
          editorRef.value.setContent(htmlContent)
        } 
        // If we have JSON content, try that
        else if (document.content.json) {
          const editor = editorRef.value.getEditor()
          if (editor && editor._value) {
            console.log('Setting content with JSON via editor commands')
            editor._value.commands.setContent(document.content.json)
          } else {
            throw new Error('Editor instance not available for JSON content')
          }
        }
      } catch (setContentError) {
        // If the first attempt failed, try alternate method
        console.error('First content setting attempt failed:', setContentError)
        try {
          // Try alternate method with HTML string
          const simpleContent = `<h1>${document.title || 'Untitled Document'}</h1><p>Document loaded with recovery method.</p>`
          console.log('Trying recovery with simple content')
          editorRef.value.setContent(simpleContent)
        } catch (recoveryError) {
          console.error('Recovery attempt also failed:', recoveryError)
          throw new Error('Could not set document content after multiple attempts')
        }
      }
    }
    
    // Try to set page and document settings, but don't fail if these don't work
    try {
      if (document.page) {
        console.log('Setting page options')
        editorRef.value.setPage(document.page)
      }
      
      if (document.document_info) {
        console.log('Setting document options')
        editorRef.value.setDocument(document.document_info)
      }
    } catch (settingsError) {
      console.warn('Could not set page or document settings:', settingsError)
      // Don't fail the whole loading process for this
    }
    
    // Set header text and logo if available
    if (document.header_text) {
      headerText.value = document.header_text
    }
    
    if (document.logo_url) {
      logoUrl.value = document.logo_url
    }
    
    // Show success message
    notify(`Document "${documentTitle.value}" loaded successfully`)
    console.log('Document loading completed successfully')
    
    // Notify parent
    emit('document-loaded', {
      id: document.id,
      title: documentTitle.value
    })
  } catch (error) {
    console.error('Error loading document:', error)
    notify('Failed to load document. See console for details.', 'error')
  }
}

// Create a new document
const createNewDocument = () => {
  // Reset document state
  currentDocumentId.value = null
  documentTitle.value = 'Untitled Document'
  headerText.value = 'I Love open source bro wtf FINALLY'
  logoUrl.value = '/vite.svg'
  
  // Clear editor content
  if (editorRef.value) {
    editorRef.value.setContent('')
  }
  
  // Notify parent
  emit('document-loaded', {
    id: null,
    title: documentTitle.value
  })
  
  // Update browser title
  document.title = 'New Document - UmoEditor'
}

// Watch for changes in document ID prop
watch(() => props.documentId, async (newId) => {
  if (newId && newId !== currentDocumentId.value) {
    currentDocumentId.value = newId
    await loadDocument(newId)
  } else if (!newId) {
    // Reset to new document if no ID provided
    createNewDocument()
  }
}, { immediate: true })

// Print editor content
const printEditorContent = () => {
  const editorContent = editorRef.value.getContent()
  console.log(editorRef.value.getOptions())
  console.log(editorRef.value.getEditor())
  console.log(editorContent)
}

// Header functions
const insertHeader = () => {
  tempHeaderText.value = headerText.value
  tempLogoUrl.value = logoUrl.value
  showModal.value = true
}

const saveHeaderText = () => {
  headerText.value = tempHeaderText.value
  logoUrl.value = tempLogoUrl.value
  showModal.value = false
}

const cancelHeaderEdit = () => {
  showModal.value = false
}

// Helper function to save the current document
const saveCurrentDocument = async () => {
  if (!editorRef.value) return
  
  // Save current document with current state
  await onSave(
    editorRef.value.getContent(),
    editorRef.value.getOptions().page,
    editorRef.value.getOptions().document
  )
}

// Document title functions
const editDocumentTitle = () => {
  tempDocumentTitle.value = documentTitle.value
  showTitleModal.value = true
}

const saveDocumentTitle = () => {
  documentTitle.value = tempDocumentTitle.value || 'Untitled Document'
  showTitleModal.value = false
  
  // If we have a document ID, update the title in database too
  if (currentDocumentId.value) {
    saveCurrentDocument()
  }
  
  // Update page title
  document.title = `${documentTitle.value} - UmoEditor`
}

const cancelTitleEdit = () => {
  showTitleModal.value = false
}

// Navigation functions
const goToHome = () => {
  router.push('/')
}

// Save document to Supabase
const onSave = async (content, page, document) => {
  try {
    console.log('Save requested with content:', content)
    console.log('Page settings:', page)
    console.log('Document info:', document)
    
    // Get content in multiple formats for better compatibility
    let htmlContent = ''
    let jsonContent = null
    
    if (editorRef.value) {
      try {
        htmlContent = editorRef.value.getHTML()
        jsonContent = editorRef.value.getJSON()
        console.log('Retrieved HTML content:', htmlContent.substring(0, 100) + '...')
        console.log('Retrieved JSON content:', jsonContent)
      } catch (err) {
        console.error('Error getting editor content:', err)
      }
    }
    
    // Format the document data
    const documentData = {
      content: {
        html: htmlContent,
        json: jsonContent,
        original: content // Keep the original content too
      },
      page,
      document_info: document,
      header_text: headerText.value,
      logo_url: logoUrl.value,
      title: documentTitle.value,
      // If you have authentication, add user_id here
    }
    
    // If we have a document ID, include it for update
    if (currentDocumentId.value) {
      documentData.id = currentDocumentId.value
    }
    
    console.log('Saving document data:', documentData)
    
    // Save to Supabase using the document service
    const { data, error } = await saveDocument(documentData)
    
    if (error) {
      console.error("Error saving document:", error)
      notify('Failed to save document. See console for details.', 'error')
      return false
    }
    
    // Store the document ID for future updates
    if (data && data.length > 0) {
      currentDocumentId.value = data[0].id
      console.log("Document saved successfully with ID:", currentDocumentId.value)
      
      // If this was a new document, update the URL
      if (!props.documentId) {
        router.replace(`/editor/${currentDocumentId.value}`)
      }
    }
    
    // Show success message
    notify(`Document "${documentTitle.value}" saved successfully`)
    console.log('Document saving completed successfully')
    
    return true
  } catch (err) {
    console.error("Failed to save document:", err)
    notify('Failed to save document. See console for details.', 'error')
    return false
  }
}

// Predefined logo options for easy selection
const logoOptions = [
  { name: 'Vite', url: '/vite.svg' },
  { name: 'GitHub', url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' },
  { name: 'Vue', url: 'https://vuejs.org/images/logo.png' },
  { name: 'Open Source', url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2f4831e82472e9204de6edae9/topics/open-source/open-source.png' }
]

const tipTapEditor = ref(null)

onMounted(() => {
  // Wait for editor to initialize
  setTimeout(() => {
    if (editorRef.value) {
      console.log('Editor initialized successfully')
      tipTapEditor.value = editorRef.value.getEditor()
      
      // Fix passive event listeners warning
      // Add passive event listeners to scrollable containers
      const addPassiveListeners = () => {
        try {
          const scrollableElements = document.querySelectorAll('.umo-editor-container, .umo-editor-content, .umo-editor-page')
          
          scrollableElements.forEach(element => {
            const originalAddEventListener = element.addEventListener
            
            element.addEventListener = function(type, listener, options) {
              let passive = false
              
              // Make wheel and touch events passive
              if (type === 'wheel' || type === 'touchstart' || type === 'touchmove') {
                passive = true
              }
              
              // Override options to include passive flag
              const modifiedOptions = typeof options === 'object' 
                ? { ...options, passive } 
                : { passive, capture: !!options }
              
              return originalAddEventListener.call(this, type, listener, modifiedOptions)
            }
          })
          
          console.log('Passive event listeners applied to scrollable elements')
        } catch (err) {
          console.error('Error applying passive event listeners:', err)
        }
      }
      
      // Apply passive listeners after a short delay
      setTimeout(addPassiveListeners, 500)
    } else {
      console.error('Editor failed to initialize')
    }
  }, 500)
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #f8f9fa;
}

/* Document Header */
.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: white;
  border-bottom: 1px solid #ddd;
  z-index: 10;
}

.document-title-container {
  display: flex;
  align-items: center;
}

.document-title {
  font-size: 18px;
  margin: 0;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.document-title:hover {
  background-color: #e0e0e0;
}

.new-doc-button {
  margin-left: 15px;
  padding: 5px 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.back-button {
  padding: 8px 16px;
  background-color: #f1f3f4;
  color: #5f6368;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-button:hover {
  background-color: #e8eaed;
}

.document-actions {
  display: flex;
  gap: 10px;
}

/* Centered Header and Footer Styles */
.centered-header, .centered-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0 20px;
  box-sizing: border-box;
}

.header-logo {
  height: 24px;
  vertical-align: middle;
  margin-right: 8px;
}

/* Button Styles */
.print-button, .load-button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 9px;
  transition: background-color 0.3s ease;
  margin-right: 8px;
}

.load-button {
  background-color: #2196F3;
}

.print-button:hover {
  background-color: #45a049;
}

.load-button:hover {
  background-color: #0b7dda;
}

.print-button:active {
  background-color: #3d8b40;
}

.insert-header {
  padding: 8px 16px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 9px;
  transition: background-color 0.3s ease;
}

.insert-header:hover {
  background-color: #0b7dda;
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
  padding: 20px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  position: relative;
}

.title-modal {
  width: 400px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.header-input {
  width: 100%;
  padding: 10px;
  margin: 5px 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.logo-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.logo-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border: 2px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  width: 80px;
}

.logo-option.selected {
  border-color: #2196F3;
  background-color: rgba(33, 150, 243, 0.1);
}

.logo-preview {
  height: 30px;
  width: auto;
  margin-bottom: 5px;
  object-fit: contain;
}

.logo-preview-container {
  margin: 15px 0;
}

.header-preview {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
  margin-top: 5px;
}

.logo-preview-image {
  height: 24px;
  margin-right: 8px;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
}

.save-button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-button {
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Notification Toast */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  z-index: 2000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: slide-in 0.3s ease-out forwards;
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
  background-color: #4CAF50;
}

.notification-error {
  background-color: #f44336;
}

.notification-info {
  background-color: #2196F3;
}

/* Add Font Awesome icons */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
</style> 