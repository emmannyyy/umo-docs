<template>
  <div class="app-container">
    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Loading Document...</p>
    </div>
    
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
    <umo-editor 
      ref="editorRef" 
      v-bind="umoEditorConfig" 
      @save="onSave"
      @created="onEditorCreated" 
    >
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
import { ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { saveDocument, getDocumentById } from '../services/documentService'
import { umoEditorConfig } from '../utils/umoEditorConfig'
// NOTE: UmoEditor is now globally registered via app.use() in main.js

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

// Notification state
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref('success')

// Editor related refs and state
const editorRef = ref(null) // Template ref for the <umo-editor> component
const isEditorReady = ref(false) // Flag to track editor readiness via @created
const isLoading = ref(false) // Loading indicator state

// Temporary state for data loaded *before* editor re-renders
const pendingContent = ref(null)
const pendingPage = ref(null)
const pendingDocInfo = ref(null)

// Header/Footer/Title state
const headerText = ref('Default Header Text')
const logoUrl = ref('/vite.svg')
const showModal = ref(false)
const showTitleModal = ref(false)
const tempHeaderText = ref('')
const tempLogoUrl = ref('')
const documentTitle = ref('Untitled Document')
const tempDocumentTitle = ref('')

// Document tracking
const currentDocumentId = ref(null)

const notify = (message, type = 'success', duration = 3000) => {
  notificationMessage.value = message
  notificationType.value = type
  showNotification.value = true
  setTimeout(() => { showNotification.value = false }, duration)
}

// --- Editor Event Handler (runs for the NEW instance) ---
const onEditorCreated = () => { 
  console.log(`UmoEditor @created event fired.`);
  nextTick(() => {
    console.log('Setting isEditorReady = true inside nextTick.');
    isEditorReady.value = true;
    // Trigger initial load *if* an ID is present when editor becomes ready
    if (props.documentId) {
      console.log('Editor ready, initial documentId present. Calling loadDocument.');
      loadDocument(props.documentId);
    } else {
      // New document, just focus
      console.log('Editor ready, no initial documentId. Focusing for new document.');
      editorRef.value?.focus('start', { scrollIntoView: false });
      document.title = 'New Document - UmoEditor';
    }
  });
};

// --- Apply Pending Data (called after new editor instance is ready) ---
const applyPendingData = () => {
   if (!isEditorReady.value || !editorRef.value) {
      console.error('Attempted to apply pending data, but editor not ready or ref missing.');
      // Clear pending data to prevent stale application later?
      pendingContent.value = null;
      pendingPage.value = null;
      pendingDocInfo.value = null;
      return;
   }
   console.log('Applying pending content, page, and docInfo...');

   let jsonContent = null;
   let htmlContent = null;
   let contentSetSuccessfully = false;

   // Extract content from pending data
   if (pendingContent.value) {
      if (typeof pendingContent.value.json === 'object' && pendingContent.value.json !== null) jsonContent = pendingContent.value.json;
      if (typeof pendingContent.value.html === 'string') htmlContent = pendingContent.value.html;
   }

   // Try setting content (JSON > HTML > Fallback)
   if (jsonContent) {
      try {
         editorRef.value.setContent(jsonContent, { emitUpdate: true });
         contentSetSuccessfully = true;
         console.log('Applied pending JSON content.');
      } catch (jsonError) { console.error('Failed applying pending JSON:', jsonError); }
   }
   if (!contentSetSuccessfully && htmlContent) {
      try {
         editorRef.value.setContent(htmlContent, { emitUpdate: true });
         contentSetSuccessfully = true;
         console.log('Applied pending HTML content.');
      } catch (htmlError) { console.error('Failed applying pending HTML:', htmlError); }
   }
   if (!contentSetSuccessfully) {
      console.error('Failed applying pending content. Setting placeholder.');
      const fallbackContent = `<h1>${documentTitle.value}</h1><p>Error applying content.</p>`;
      try { editorRef.value.setContent(fallbackContent, { emitUpdate: true }); }
      catch (fbError) { console.error('CRITICAL: Failed fallback setContent!', fbError); }
   }

   // Apply pending page/doc settings
   try {
      if (pendingPage.value) editorRef.value.setPage(pendingPage.value);
      if (pendingDocInfo.value) editorRef.value.setDocument(pendingDocInfo.value);
      console.log('Applied pending page/document settings.');
   } catch (settingsError) { console.warn('Failed applying pending page/doc settings:', settingsError); }

   // Focus
   try {
      editorRef.value.focus('end', { scrollIntoView: false });
      console.log('Focused editor after applying pending data.');
   } catch (focusError) { console.warn('Focus failed after applying pending data:', focusError); }

   // Clear pending data now that it's applied
   pendingContent.value = null;
   pendingPage.value = null;
   pendingDocInfo.value = null;

   // Emit loaded event
   notify(`Document "${documentTitle.value}" loaded successfully`);
   document.title = `${documentTitle.value} - UmoEditor`;
   emit('document-loaded', { id: currentDocumentId.value, title: documentTitle.value });
}

// --- Document Loading (initiates fetch and key change) ---
const loadDocument = async (id) => {
  // Prevent loading if editor isn't ready (shouldn't happen with new flow, but safe)
  if (!isEditorReady.value) {
    console.warn('loadDocument called, but editor not marked as ready. Aborting.');
    return;
  }
  if (!editorRef.value) {
     console.error('loadDocument: editorRef is not available. Aborting.');
     return;
  }
  if (!id) {
     console.warn('loadDocument called with null/undefined ID. Aborting.');
     return;
  }

  console.log(`Loading document: ${id}`);
  isLoading.value = true; // Show loading indicator

  try {
    const documentData = await getDocumentById(id);
    if (!documentData) throw new Error('Document not found');

    console.log('Document data fetched. Updating state...');
    
    // Update state BEFORE waiting for nextTick
    currentDocumentId.value = documentData.id;
    documentTitle.value = documentData.title || 'Untitled Document';
    headerText.value = documentData.header_text || 'Default Header Text'; 
    logoUrl.value = documentData.logo_url || '/vite.svg';
    document.title = `${documentTitle.value} - UmoEditor`; // Update browser title early

    // Wait for Vue to process state updates that might affect slots
    await nextTick(); 
    console.log('nextTick finished after state updates. Applying to editor...');

    // Now interact with the editor
    let jsonContent = null;
    let htmlContent = null;
    if (documentData.content) {
        if (typeof documentData.content.json === 'object' && documentData.content.json !== null) jsonContent = documentData.content.json;
        if (typeof documentData.content.html === 'string') htmlContent = documentData.content.html;
    }

    let contentSetSuccessfully = false;
    // Try JSON
    if (jsonContent) {
      try {
        editorRef.value.setContent(jsonContent, { emitUpdate: true });
        contentSetSuccessfully = true; console.log('Set content via JSON.');
      } catch (e) { console.error('Failed JSON setContent:', e); }
    }
    // Try HTML
    if (!contentSetSuccessfully && htmlContent) {
      try {
        editorRef.value.setContent(htmlContent, { emitUpdate: true });
        contentSetSuccessfully = true; console.log('Set content via HTML.');
      } catch (e) { console.error('Failed HTML setContent:', e); }
    }
    // Fallback
    if (!contentSetSuccessfully) {
      console.warn('Failed JSON/HTML setContent, using placeholder.');
      try { editorRef.value.setContent(`<h1>${documentTitle.value}</h1>`, { emitUpdate: true }); }
      catch (e) { console.error('CRITICAL: Failed fallback setContent!', e); }
    }

    // Apply settings
    try {
        if (documentData.page) editorRef.value.setPage(documentData.page);
        if (documentData.document_info) editorRef.value.setDocument(documentData.document_info);
        console.log('Applied page/document settings.');
    } catch (e) { console.warn('Failed applying page/doc settings:', e); }

    // Focus
    try {
        editorRef.value.focus('end', { scrollIntoView: false });
        console.log('Focused editor.');
    } catch (e) { console.warn('Failed to focus:', e); }

    emit('document-loaded', { id: documentData.id, title: documentTitle.value });
    notify(`Document "${documentTitle.value}" loaded`);

  } catch (error) {
    console.error('Error during loadDocument process:', error);
    notify(`Failed to load document: ${error.message}`, 'error');
    // Reset to a known state? 
    // createNewDocument(); 
  } finally {
    isLoading.value = false; // Hide loading indicator
    console.log('loadDocument finished.');
  }
};

// --- Document Saving ---
const onSave = async () => { 
   if (!isEditorReady.value || !editorRef.value) {
     console.error('Editor not ready or ref missing for saving.');
     return false;
   }
   console.log('Save requested.');
   try {
      let htmlContent = editorRef.value.getHTML();
      let jsonContent = editorRef.value.getJSON(); 
      const currentOptions = editorRef.value.getOptions();
      const currentPageSettings = currentOptions.page;
      const currentDocumentSettings = currentOptions.document;

    const documentData = {
         content: { html: htmlContent, json: jsonContent },
         page: currentPageSettings, 
         document_info: currentDocumentSettings, 
      header_text: headerText.value,
      logo_url: logoUrl.value,
      title: documentTitle.value,
         id: currentDocumentId.value || undefined 
      };
      
      console.log('Saving document data:', documentData);
      const { data, error } = await saveDocument(documentData);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
         const savedId = data[0].id;
         currentDocumentId.value = savedId; 
         console.log("Document saved successfully with ID:", savedId);
         if (!props.documentId || props.documentId !== savedId) {
            router.replace(`/editor/${savedId}`); 
         }
      }
      notify(`Document "${documentTitle.value}" saved successfully`);
      return true;
   } catch (err) {
      console.error("Failed to save document:", err);
      notify(`Failed to save document: ${err.message || 'Unknown error'}`, 'error');
      return false;
   }
};

// --- Other Editor Interactions ---
const printEditorContent = () => {
  if (!isEditorReady.value || !editorRef.value) {
    notify('Editor not ready.', 'info'); return;
  }
  console.log('Options:', editorRef.value.getOptions());
  console.log('Content (HTML):', editorRef.value.getHTML());
};

const saveCurrentDocument = async () => {
  if (!isEditorReady.value || !editorRef.value) {
    console.warn('Attempted to saveCurrentDocument, but editor not ready.'); return; 
  }
  await onSave(); 
};

// --- Watch for Document ID Changes ---
watch(() => props.documentId, (newId, oldId) => {
  if (newId !== oldId) { 
     console.log(`Document ID prop changed from ${oldId} to ${newId}.`);
     // Only trigger if editor is ready, otherwise onEditorCreated handles initial load
     if (isEditorReady.value) {
        console.log('Editor is ready, proceeding with load/create.');
         if (newId) {
           loadDocument(newId);
         } else {
           createNewDocument();
         }
     } else {
         console.log('Editor not ready yet. Initial load will be handled by onEditorCreated if needed.');
     }
  }
});

// --- UI Actions ---
const createNewDocument = () => {
  console.log('Creating new document state...');
  currentDocumentId.value = null;
  documentTitle.value = 'Untitled Document';
  headerText.value = 'Default Header Text'; 
  logoUrl.value = '/vite.svg';
  document.title = 'New Document - UmoEditor';

  if (isEditorReady.value && editorRef.value) {
    console.log('Editor ready, clearing content and focusing for new document.');
    try {
        editorRef.value.setContent(''); 
        editorRef.value.focus('start', { scrollIntoView: false }); 
        // Optionally reset page/doc settings to defaults here if needed
        // editorRef.value.setPage(umoEditorConfig.page || {}); 
        // editorRef.value.setDocument(umoEditorConfig.document || {});
    } catch (error) {
        console.error('Error resetting editor for new document:', error);
    }
  } else {
     console.warn("createNewDocument: Editor not ready yet.");
     // Editor will be focused by onEditorCreated when it's ready
  }
  
  if (props.documentId){
      router.replace('/editor'); 
  }
  emit('document-loaded', { id: null, title: documentTitle.value });
};

const insertHeader = () => {
  tempHeaderText.value = headerText.value;
  tempLogoUrl.value = logoUrl.value;
  showModal.value = true;
};

const saveHeaderText = () => {
  headerText.value = tempHeaderText.value;
  logoUrl.value = tempLogoUrl.value;
  showModal.value = false;
  // NOTE: Changes here won't reflect in the editor header/footer slots 
  // until the *next* time the component re-renders via key change.
  // If immediate update is needed, consider triggering saveCurrentDocument 
  // and then forcing a key increment, though that might be jarring.
};

const cancelHeaderEdit = () => { showModal.value = false; };

const editDocumentTitle = () => {
  tempDocumentTitle.value = documentTitle.value;
  showTitleModal.value = true;
};

const saveDocumentTitle = async () => { 
  documentTitle.value = tempDocumentTitle.value || 'Untitled Document';
  showTitleModal.value = false;
  document.title = `${documentTitle.value} - UmoEditor`;

  // REMOVED: await saveCurrentDocument(); 
  // The title will be saved during the next regular onSave call.
  console.log('Document title updated locally. It will be persisted on next full save.');
};

const cancelTitleEdit = () => { showTitleModal.value = false; };

const goToHome = () => { router.push('/'); };

// Predefined logo options
const logoOptions = [
  { name: 'Vite', url: '/vite.svg' },
  { name: 'GitHub', url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' },
  { name: 'Vue', url: 'https://vuejs.org/images/logo.png' },
  { name: 'Open Source', url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2f4831e82472e9204de6edae9/topics/open-source/open-source.png' }
];
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

/* Add styles for loading overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1001; /* Ensure it's above editor but below modals? */
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 