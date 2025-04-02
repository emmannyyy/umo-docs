<script setup>
import { ref, onMounted } from 'vue'

// Create a ref for the editor content
const editorContent = ref('')
// Header text ref
const headerText = ref('I Love open source bro wtf FINALLY')
// Logo URL ref
const logoUrl = ref('/vite.svg')
// Modal visibility state
const showModal = ref(false)
// Temporary input for the modal
const tempHeaderText = ref('')
const tempLogoUrl = ref('')

import { umoEditorConfig } from './utils/umoEditorConfig'

const editorRef = ref(null)

const printEditorContent = () => {
  const editorContent = editorRef.value.getContent()
  console.log(editorRef.value.getOptions())
  console.log(editorRef.value.getEditor())
  console.log(editorContent)
}

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

// Predefined logo options for easy selection
const logoOptions = [
  { name: 'Vite', url: '/vite.svg' },
  { name: 'GitHub', url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png' },
  { name: 'Vue', url: 'https://vuejs.org/images/logo.png' },
  { name: 'Open Source', url: 'https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2f4831e82472e9204de6edae9/topics/open-source/open-source.png' }
]

</script>

<template>
  <umo-editor ref="editorRef" v-bind="umoEditorConfig">
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
.print-button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 9px;
  transition: background-color 0.3s ease;
}

.print-button:hover {
  background-color: #45a049;
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
</style>
