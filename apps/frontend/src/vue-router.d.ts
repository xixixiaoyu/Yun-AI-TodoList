import 'vue-router'

declare module 'vue-router' {
  import { Router, RouteRecordRaw, RouterHistory } from 'vue-router'
  export * from 'vue-router'
  export function createRouter(options: {
    history: RouterHistory
    routes: RouteRecordRaw[]
  }): Router
  export function createWebHistory(): RouterHistory
  interface _RouteMeta {
    requiresAuth?: boolean
    layout?: string
    transition?: string
  }
}
