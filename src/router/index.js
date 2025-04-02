import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import EditorView from '../views/EditorView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: {
      title: 'UmoEditor - Document Management'
    }
  },
  {
    path: '/editor/:id?',
    name: 'Editor',
    component: EditorView,
    props: true,
    meta: {
      title: 'UmoEditor - Document Editor'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Update page title based on route
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'UmoEditor'
  next()
})

export default router 