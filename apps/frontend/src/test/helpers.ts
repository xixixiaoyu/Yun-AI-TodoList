import type { ChatMessage, Conversation } from '../services/types'
import type { Todo } from '../types/todo'
import { vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import zh from '../locales/zh.json'

export function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'zh',
    fallbackLocale: 'en',
    messages: {
      zh,
      en,
    },
  })
}

/**
 * 创建测试用的 Todo 对象
 */
export function createTestTodo(overrides: Partial<Todo> = {}): Todo {
  const now = new Date().toISOString()
  return {
    id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    title: 'Test Todo',
    completed: false,
    createdAt: now,
    updatedAt: now,
    order: 0,
    ...overrides,
  }
}

export function createTestTodos(count: number, baseOverrides: Partial<Todo> = {}): Todo[] {
  return Array.from({ length: count }, (_, index) =>
    createTestTodo({
      id: `test-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 11)}`,
      title: `Test Todo ${index + 1}`,
      order: index,
      ...baseOverrides,
    })
  )
}

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

export function createMockResponse(data: unknown, status = 200) {
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

export function mockConsole() {
  return {
    log: vi.spyOn(console, 'log').mockImplementation(() => {
      // Mock implementation - intentionally empty
    }),
    error: vi.spyOn(console, 'error').mockImplementation(() => {
      // Mock implementation - intentionally empty
    }),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {
      // Mock implementation - intentionally empty
    }),
    info: vi.spyOn(console, 'info').mockImplementation(() => {
      // Mock implementation - intentionally empty
    }),
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

  // 存储需要清理的Vue实例
  const vueInstances: Array<{ unmount?: () => void }> = []

  return {
    localStorage,
    console,
    vueInstances,
    cleanup: () => {
      // 清理所有Vue实例
      vueInstances.forEach((instance) => {
        if (instance && typeof instance.unmount === 'function') {
          try {
            instance.unmount()
          } catch {
            // 忽略unmount错误
          }
        }
      })
      vueInstances.length = 0

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
