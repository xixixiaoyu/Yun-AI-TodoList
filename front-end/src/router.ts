import { createRouter, createWebHashHistory } from 'vue-router'
import TodoList from './components/TodoList.vue'
import AIChatDialog from './components/AIChatDialog.vue'

const routes = [
	{ path: '/', component: TodoList },
	{ path: '/todo', component: TodoList },
	{ path: '/ai-assistant', component: AIChatDialog },
]

const router = createRouter({
	history: createWebHashHistory(),
	routes,
})

export default router
