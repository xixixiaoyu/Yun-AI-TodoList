import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import TodoList from '../TodoList.vue'
import { setupTestEnvironment } from '@/test/helpers'

vi.mock('@/composables/useTodoListState', () => ({
  useTodoListState: () => ({
    todoListRef: { value: null },
    showConfirmDialog: { value: false },
    confirmDialogConfig: { value: {} },
    handleConfirm: vi.fn(),
    handleCancel: vi.fn(),
    filter: { value: 'all' },
    searchQuery: { value: '' },
    filteredTodos: { value: [] },
    hasActiveTodos: { value: false },
    isGenerating: { value: false },
    isSorting: { value: false },
    suggestedTodos: { value: [] },
    showSuggestedTodos: { value: false },
    MAX_TODO_LENGTH: 200,
    generateSuggestedTodos: vi.fn(),
    confirmSuggestedTodos: vi.fn(),
    cancelSuggestedTodos: vi.fn(),
    updateSuggestedTodo: vi.fn(),
    sortActiveTodosWithAI: vi.fn(),
    handleAddTodo: vi.fn(),
    toggleTodo: vi.fn(),
    removeTodo: vi.fn(),
    duplicateError: { value: '' },
    isLoading: { value: false },
    showCharts: { value: false },
    showSearch: { value: false },
    isSmallScreen: { value: false },
    themeIcon: { value: 'sun' },
    themeTooltip: { value: '切换主题' },
    toggleTheme: vi.fn(),
    toggleCharts: vi.fn(),
    toggleSearch: vi.fn(),
    closeCharts: vi.fn(),
    collapseSearch: vi.fn(),
    handlePomodoroComplete: vi.fn(),
  }),
}))

const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  messages: {
    zh: {
      appTitle: '待办事项',
      addTodo: '添加待办事项',
      filter: '筛选',
      search: '搜索',
      all: '全部',
      active: '未完成',
      completed: '已完成',
    },
  },
})

describe('TodoList', () => {
  let testEnv: ReturnType<typeof setupTestEnvironment>

  beforeEach(() => {
    testEnv = setupTestEnvironment()
    vi.clearAllMocks()
  })

  afterEach(() => {
    testEnv.cleanup()
  })

  it('应该正确渲染组件', () => {
    const wrapper = mount(TodoList, {
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('.todo-app').exists()).toBe(true)
  })

  it('应该显示正确的标题', () => {
    const wrapper = mount(TodoList, {
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.text()).toContain('待办事项')
  })

  it('应该包含必要的组件', () => {
    const wrapper = mount(TodoList, {
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('.todo-app').exists()).toBe(true)
  })
})
