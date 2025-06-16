/**
 * 测试辅助工具函数
 * 提供通用的测试工具和 mock 函数
 */

import type { ChatMessage, Conversation } from '@/services/types'
import type { Todo } from '@/types/todo'
import { vi } from 'vitest'
import { createI18n } from 'vue-i18n'

export function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'zh',
    messages: {
      zh: {
        addTodo: '添加待办事项',
        searchTodos: '搜索待办事项...',
        clearSearch: '清除搜索',
        duplicateError: '待办事项已存在',
        emptyTodoError: '待办事项不能为空',

        all: '全部',
        active: '进行中',
        completed: '已完成',

        configureApiKey: '请先配置 API Key',
        httpError: 'HTTP 错误: {status}',
        invalidAiResponse: '无效的 AI 响应',
        aiEmptyResponseError: 'AI 响应为空',
        aiSortMismatchError: 'AI 排序结果不匹配',
        noActiveTodosError: '没有待排序的活跃待办事项',
        sortPrompt: '请按优先级排序以下待办事项',

        settings: '设置',
        apiKey: 'API Key',
        systemPrompt: '系统提示词',
        save: '保存',
        cancel: '取消',

        newConversation: '新对话',
        sendMessage: '发送消息',

        confirm: '确认',
        delete: '删除',
        edit: '编辑',
        sorting: '排序中...',
        loading: '加载中...',
      },
      en: {
        addTodo: 'Add Todo',
        searchTodos: 'Search todos...',
        clearSearch: 'Clear search',
        duplicateError: 'Todo already exists',
        emptyTodoError: 'Todo cannot be empty',
        all: 'All',
        active: 'Active',
        completed: 'Completed',
        configureApiKey: 'Please configure API Key first',
        httpError: 'HTTP Error: {status}',
        invalidAiResponse: 'Invalid AI response',
        settings: 'Settings',
        apiKey: 'API Key',
        systemPrompt: 'System Prompt',
        save: 'Save',
        cancel: 'Cancel',
        newConversation: 'New Conversation',
        sendMessage: 'Send Message',
        confirm: 'Confirm',
        delete: 'Delete',
        edit: 'Edit',
        sorting: 'Sorting...',
        loading: 'Loading...',
      },
    },
  })
}

/**
 * 创建测试用的 Todo 对象
 */
export function createTestTodo(overrides: Partial<Todo> = {}): Todo {
  const now = new Date().toISOString()
  return {
    id: Date.now() + Math.random(),
    text: 'Test Todo',
    completed: false,
    tags: [],
    createdAt: now,
    updatedAt: now,
    order: 0,
    ...overrides,
  }
}

export function createTestTodos(count: number, baseOverrides: Partial<Todo> = {}): Todo[] {
  return Array.from({ length: count }, (_, index) =>
    createTestTodo({
      id: Date.now() + index,
      text: `Test Todo ${index + 1}`,
      order: index,
      ...baseOverrides,
    })
  )
}

/**
 * 创建测试用的聊天消息
 */
export function createTestChatMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    role: 'user',
    content: 'Test message',
    ...overrides,
  }
}

export function createTestConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: Date.now().toString(),
    title: 'Test Conversation',
    messages: [],
    lastUpdated: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key])
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    store,
  }
}

export function mockFetch() {
  const mockFetch = vi.fn()
  global.fetch = mockFetch
  return mockFetch
}

/**
 * 创建成功的 fetch 响应
 */
export function createMockResponse(data: any, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  })
}

export function createMockErrorResponse(status = 500, message = 'Server Error') {
  return Promise.resolve({
    ok: false,
    status,
    statusText: message,
    json: () => Promise.reject(new Error('Failed to parse JSON')),
    text: () => Promise.resolve(message),
  })
}

/**
 * 等待下一个 tick
 */
export function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Mock console 方法
 */
export function mockConsole() {
  return {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  }
}

export function clearAllMocks() {
  vi.clearAllMocks()
  vi.clearAllTimers()
}

/**
 * 设置测试环境
 */
export function setupTestEnvironment() {
  clearAllMocks()

  const localStorage = mockLocalStorage()
  Object.defineProperty(window, 'localStorage', { value: localStorage })

  const console = mockConsole()

  return {
    localStorage,
    console,
    cleanup: () => {
      clearAllMocks()
      console.log.mockRestore()
      console.error.mockRestore()
      console.warn.mockRestore()
      console.info.mockRestore()
    },
  }
}

export function expectErrorToBeHandled(
  errorHandler: vi.MockedFunction<(message: string) => void>,
  expectedMessage?: string
) {
  if (typeof expect !== 'undefined') {
    expect(errorHandler).toHaveBeenCalled()
    if (expectedMessage) {
      expect(errorHandler).toHaveBeenCalledWith(expect.stringContaining(expectedMessage))
    }
  }
}

/**
 * 验证事件发射
 */
export function expectEventEmitted(
  wrapper: { emitted: (eventName: string) => unknown[][] | undefined },
  eventName: string,
  expectedPayload?: unknown
) {
  if (typeof expect !== 'undefined') {
    expect(wrapper.emitted(eventName)).toBeTruthy()
    if (expectedPayload !== undefined) {
      const emittedEvents = wrapper.emitted(eventName)
      if (emittedEvents) {
        const lastEvent = emittedEvents[emittedEvents.length - 1]
        expect(lastEvent).toEqual(expectedPayload)
      }
    }
  }
}
