# Vue 3 + Composition API 现代化前端架构

## 技术概述

本项目采用 Vue 3 + Composition
API 构建现代化前端应用，结合 TypeScript、Vite、UnoCSS 等前沿技术，实现高性能、可维护的用户界面。

## 🏗️ 核心技术栈

### Vue 3 + Composition API

```typescript
// 使用 Composition API 的组件示例
import { ref, computed, onMounted } from 'vue'
import { useTodos } from '@/composables/useTodos'

export default defineComponent({
  setup() {
    const { todos, addTodo, toggleTodo } = useTodos()
    const newTodo = ref('')

    const completedCount = computed(
      () => todos.value.filter((todo) => todo.completed).length
    )

    const handleAddTodo = () => {
      if (newTodo.value.trim()) {
        addTodo(newTodo.value)
        newTodo.value = ''
      }
    }

    return {
      todos,
      newTodo,
      completedCount,
      handleAddTodo,
      toggleTodo,
    }
  },
})
```

### TypeScript 类型安全

```typescript
// 类型定义
interface Todo {
  id: string
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

// Composable 函数类型
interface UseTodosReturn {
  todos: Ref<Todo[]>
  addTodo: (text: string) => boolean
  toggleTodo: (id: string) => void
  removeTodo: (id: string) => void
  updateTodo: (id: string, updates: Partial<Todo>) => void
}
```

### Vite 构建配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    AutoImport({
      imports: ['vue', 'vue-router', 'vue-i18n', '@vueuse/core'],
      dts: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          ui: ['@vueuse/core'],
        },
      },
    },
  },
})
```

## 🎨 UnoCSS 原子化 CSS

### 配置示例

```typescript
// uno.config.ts
import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      collections: {
        carbon: () => import('@iconify-json/carbon/icons.json'),
      },
    }),
  ],
  theme: {
    colors: {
      primary: {
        50: '#f0f9ff',
        500: '#3b82f6',
        900: '#1e3a8a',
      },
    },
  },
  shortcuts: {
    'btn-primary':
      'bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600',
    card: 'bg-white dark:bg-gray-800 rounded-lg shadow-md p-4',
  },
})
```

### 使用示例

```vue
<template>
  <div class="card">
    <h2 class="text-xl font-bold mb-4">待办事项</h2>
    <button class="btn-primary" @click="addTodo">
      <i class="i-carbon-add mr-2"></i>
      添加任务
    </button>
  </div>
</template>
```

## 🔧 Composables 设计模式

### 状态管理 Composable

```typescript
// composables/useTodos.ts
import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'

export function useTodos() {
  const todos = useLocalStorage<Todo[]>('todos', [])

  const activeTodos = computed(() =>
    todos.value.filter((todo) => !todo.completed)
  )

  const completedTodos = computed(() =>
    todos.value.filter((todo) => todo.completed)
  )

  const addTodo = (text: string): boolean => {
    const isDuplicate = todos.value.some((todo) => todo.text === text)
    if (isDuplicate) return false

    const newTodo: Todo = {
      id: generateId(),
      text,
      completed: false,
      priority: 'medium',
      tags: extractTags(text),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    todos.value.push(newTodo)
    return true
  }

  const toggleTodo = (id: string) => {
    const todo = todos.value.find((t) => t.id === id)
    if (todo) {
      todo.completed = !todo.completed
      todo.updatedAt = new Date()
    }
  }

  return {
    todos: readonly(todos),
    activeTodos,
    completedTodos,
    addTodo,
    toggleTodo,
  }
}
```

### AI 功能 Composable

```typescript
// composables/useAI.ts
import { ref } from 'vue'
import { getAIResponse } from '@/services/deepseekService'

export function useAI() {
  const isLoading = ref(false)
  const error = ref('')

  const generateSuggestions = async (domain: string) => {
    isLoading.value = true
    error.value = ''

    try {
      const prompt = `请为${domain}领域生成5个实用的待办事项建议`
      const response = await getAIResponse(prompt)

      return response
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => line.replace(/^\d+\.\s*/, ''))
        .slice(0, 5)
    } catch (err) {
      error.value = err.message
      return []
    } finally {
      isLoading.value = false
    }
  }

  const analyzeTodo = async (todoText: string) => {
    const prompt = `分析这个任务的优先级和预估时间：${todoText}`
    const response = await getAIResponse(prompt)

    // 解析 AI 响应，提取优先级和时间估算
    return parseAIAnalysis(response)
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    generateSuggestions,
    analyzeTodo,
  }
}
```

## 🌐 国际化实现

### i18n 配置

```typescript
// i18n/index.ts
import { createI18n } from 'vue-i18n'
import zh from './locales/zh.json'
import en from './locales/en.json'

const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  fallbackLocale: 'en',
  messages: { zh, en },
})

export default i18n
```

### 语言切换 Composable

```typescript
// composables/useI18n.ts
import { useI18n as useVueI18n } from 'vue-i18n'
import { useLocalStorage } from '@vueuse/core'

export function useI18n() {
  const { locale, t, te } = useVueI18n()
  const savedLocale = useLocalStorage('locale', 'zh')

  const setLocale = (newLocale: string) => {
    locale.value = newLocale
    savedLocale.value = newLocale
  }

  const toggleLocale = () => {
    const newLocale = locale.value === 'zh' ? 'en' : 'zh'
    setLocale(newLocale)
  }

  return {
    locale: readonly(locale),
    t,
    te,
    setLocale,
    toggleLocale,
  }
}
```

## 🎭 主题系统

### 主题切换实现

```typescript
// composables/useTheme.ts
import { ref, watch } from 'vue'
import { useLocalStorage, usePreferredDark } from '@vueuse/core'

type Theme = 'light' | 'dark' | 'auto'

export function useTheme() {
  const theme = useLocalStorage<Theme>('theme', 'auto')
  const prefersDark = usePreferredDark()

  const isDark = computed(() => {
    if (theme.value === 'auto') {
      return prefersDark.value
    }
    return theme.value === 'dark'
  })

  const toggleTheme = () => {
    const themes: Theme[] = ['auto', 'light', 'dark']
    const currentIndex = themes.indexOf(theme.value)
    theme.value = themes[(currentIndex + 1) % themes.length]
  }

  // 应用主题到 DOM
  watch(
    isDark,
    (dark) => {
      document.documentElement.setAttribute(
        'data-theme',
        dark ? 'dark' : 'light'
      )
    },
    { immediate: true }
  )

  return {
    theme: readonly(theme),
    isDark: readonly(isDark),
    toggleTheme,
  }
}
```

## 📱 PWA 配置

### Service Worker 配置

```typescript
// PWA 配置
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
  manifest: {
    name: 'Yun AI TodoList',
    short_name: 'TodoList',
    description: 'AI-powered todo application',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\./,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
        },
      },
    ],
  },
})
```

## 🧪 测试策略

### 组件测试

```typescript
// tests/components/TodoItem.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TodoItem from '@/components/TodoItem.vue'

describe('TodoItem', () => {
  it('renders todo text correctly', () => {
    const todo = {
      id: '1',
      text: 'Test todo',
      completed: false,
    }

    const wrapper = mount(TodoItem, {
      props: { todo },
    })

    expect(wrapper.text()).toContain('Test todo')
  })

  it('emits toggle event when clicked', async () => {
    const wrapper = mount(TodoItem, {
      props: { todo: { id: '1', text: 'Test', completed: false } },
    })

    await wrapper.find('.todo-checkbox').trigger('click')

    expect(wrapper.emitted('toggle')).toBeTruthy()
    expect(wrapper.emitted('toggle')[0]).toEqual(['1'])
  })
})
```

### Composable 测试

```typescript
// tests/composables/useTodos.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useTodos } from '@/composables/useTodos'

describe('useTodos', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should add a todo', () => {
    const { todos, addTodo } = useTodos()

    expect(todos.value.length).toBe(0)

    const result = addTodo('Test todo')

    expect(result).toBe(true)
    expect(todos.value.length).toBe(1)
    expect(todos.value[0].text).toBe('Test todo')
  })

  it('should not add duplicate todos', () => {
    const { todos, addTodo } = useTodos()

    addTodo('Test todo')
    const result = addTodo('Test todo')

    expect(result).toBe(false)
    expect(todos.value.length).toBe(1)
  })
})
```

## 🚀 性能优化

### 代码分割

```typescript
// 路由级代码分割
const routes = [
  {
    path: '/',
    component: () => import('@/views/Home.vue'),
  },
  {
    path: '/settings',
    component: () => import('@/views/Settings.vue'),
  },
]
```

### 组件懒加载

```vue
<template>
  <div>
    <Suspense>
      <template #default>
        <AsyncComponent />
      </template>
      <template #fallback>
        <div>Loading...</div>
      </template>
    </Suspense>
  </div>
</template>

<script setup>
const AsyncComponent = defineAsyncComponent(
  () => import('@/components/HeavyComponent.vue')
)
</script>
```

## 📈 学习要点

### 1. Vue 3 新特性掌握

- Composition API 的使用和优势
- `<script setup>` 语法糖
- Teleport 和 Suspense 组件
- 响应式系统的深入理解

### 2. TypeScript 集成

- Vue 组件的类型定义
- Composable 函数的类型安全
- 泛型的使用和约束

### 3. 现代化工具链

- Vite 的配置和优化
- UnoCSS 的使用和定制
- 自动导入的配置

### 4. 状态管理模式

- Composable 模式 vs Vuex/Pinia
- 响应式状态的设计
- 状态持久化策略

### 5. 性能优化技巧

- 组件懒加载和代码分割
- 虚拟滚动和大列表优化
- 缓存策略和内存管理

## 🎯 简历亮点总结

- **Vue 3 + Composition API**：深度使用 Vue 3 最新特性，掌握组合式 API 设计模式
- **TypeScript 全栈开发**：端到端类型安全，提升代码质量和开发效率
- **现代化构建工具**：Vite + UnoCSS，极速开发体验和优化的生产构建
- **PWA 应用开发**：Service Worker、离线缓存、应用安装等 PWA 特性
- **组件化架构**：可复用的组件设计和 Composable 函数抽象
- **国际化和主题**：完整的多语言支持和主题切换系统
- **测试驱动开发**：单元测试、组件测试和 E2E 测试的完整覆盖
- **性能优化实践**：代码分割、懒加载、缓存策略等性能优化技术
