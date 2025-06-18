import { setupTestEnvironment } from '@/test/helpers'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createI18n } from 'vue-i18n'
import TodoList from '../TodoList.vue'

// Mock Sortable.js
vi.mock('sortablejs', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    option: vi.fn(),
    toArray: vi.fn(() => []),
  })),
}))

// Mock useSortable from VueUse
vi.mock('@vueuse/integrations/useSortable', () => ({
  useSortable: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  })),
}))

vi.mock('@/composables/useTodoListState', () => ({
  useTodoListState: () => ({
    todoListRef: ref(null),
    showConfirmDialog: ref(false),
    confirmDialogConfig: ref({}),
    handleConfirm: vi.fn(),
    handleCancel: vi.fn(),
    filter: ref('all'),
    searchQuery: ref(''),
    filteredTodos: ref([]),
    hasActiveTodos: ref(false),
    isGenerating: ref(false),
    isSorting: ref(false),
    suggestedTodos: ref([]),
    showSuggestedTodos: ref(false),
    MAX_TODO_LENGTH: 200,
    generateSuggestedTodos: vi.fn(),
    confirmSuggestedTodos: vi.fn(),
    cancelSuggestedTodos: vi.fn(),
    updateSuggestedTodo: vi.fn(),
    sortActiveTodosWithAI: vi.fn(),
    handleAddTodo: vi.fn(),
    toggleTodo: vi.fn(),
    removeTodo: vi.fn(),
    duplicateError: ref(''),
    isLoading: ref(false),
    showCharts: ref(false),
    showSearch: ref(false),
    isSmallScreen: ref(false),
    themeIcon: ref('sun'),
    themeTooltip: ref('切换主题'),
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

    expect(wrapper.find('.todo-container').exists()).toBe(true)
  })

  it('应该显示正确的标题', () => {
    const wrapper = mount(TodoList, {
      global: {
        plugins: [i18n],
      },
    })

    // 检查组件是否包含一些关键元素
    expect(wrapper.find('input').exists()).toBe(true) // TodoInput
    expect(wrapper.text()).toContain('进行中') // TodoFilters
  })

  it('应该包含必要的组件', () => {
    const wrapper = mount(TodoList, {
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('.todo-container').exists()).toBe(true)
    expect(wrapper.find('.todo-list').exists()).toBe(true)
  })
})
