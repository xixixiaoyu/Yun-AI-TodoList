import 'vue-router'

declare module 'vue-router' {
	import { RouteRecordRaw, Router, RouterHistory } from 'vue-router'
	export * from 'vue-router'
	export function createRouter(options: {
		history: RouterHistory
		routes: RouteRecordRaw[]
	}): Router
	export function createWebHistory(): RouterHistory
	interface RouteMeta {
		requiresAuth?: boolean
		layout?: string
		transition?: string
	}
}
