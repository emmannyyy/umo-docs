import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { useUmoEditor } from '@umoteam/editor'
import { umoEditorConfig } from './utils/umoEditorConfig'

const app = createApp(App)

// Register UmoEditor as a plugin with your configuration
app.use(useUmoEditor, umoEditorConfig)

// Use Vue Router
app.use(router)

app.mount('#app')
