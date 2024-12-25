import { createRouter, createWebHistory } from 'vue-router'
import TodoList from '../components/TodoList.vue'
import AIChatDialog from '../components/AIChatDialog.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			name: 'home',
			component: TodoList,
			meta: { title: t('appTitle') },
		},
		{
			path: '/ai-assistant',
			name: 'ai-assistant',
			component: AIChatDialog,
			meta: { title: t('aiAssistant') },
		},
	],
})

router.beforeEach((to, from, next) => {
	document.title = (to.meta.title as string) || t('appTitle')
	next()
})

export default router
