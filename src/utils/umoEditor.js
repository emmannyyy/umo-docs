import { defineComponent, h } from 'vue'
import { useUmoEditor } from '@umoteam/editor'
import { umoEditorConfig } from './umoEditorConfig'

// Create a wrapper component for the UmoEditor
export const umoEditor = defineComponent({
  name: 'UmoEditor',
  props: {
    // Forward all props to the editor
    ...umoEditorConfig
  },
  setup(props, { slots, attrs, emit }) {
    // Create a basic div element that the editor will be mounted to
    return () => h('div', {
      class: 'umo-editor-wrapper',
      // Pass all attributes to the wrapper div
      ...attrs
    }, slots.default ? slots.default() : [])
  }
}) 