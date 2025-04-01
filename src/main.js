import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { useUmoEditor } from '@umoteam/editor'
import { umoEditorConfig } from './utils/umoEditorConfig'


const app = createApp(App)
app.use(useUmoEditor, umoEditorConfig)
app.mount('#app')
