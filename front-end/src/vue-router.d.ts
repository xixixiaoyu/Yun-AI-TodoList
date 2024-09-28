declare module 'vue-router' {
	import { RouteRecordRaw } from 'vue-router'
	export * from 'vue-router'
	export function createRouter(options: { history: any; routes: RouteRecordRaw[] }): any
	export function createWebHistory(): any
}
