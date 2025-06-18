/**
 * 测试配置文件
 * 定义测试环境的配置和常量
 */

export const TEST_CONFIG = {
  TIMEOUT: {
    UNIT: 5000,
    INTEGRATION: 10000,
    E2E: 30000,
  },

  TEST_DATA: {
    MAX_TODOS: 1000,
    SAMPLE_TODOS: [
      { text: '学习 Vue 3', tags: ['learning', 'frontend'] },
      { text: '写单元测试', tags: ['testing', 'development'] },
      { text: '部署应用', tags: ['deployment', 'devops'] },
      { text: '代码审查', tags: ['review', 'quality'] },
      { text: '文档更新', tags: ['documentation'] },
    ],
    SAMPLE_CONVERSATIONS: [
      {
        title: '项目规划讨论',
        messages: [
          { role: 'user', content: '帮我规划一个新项目' },
          { role: 'assistant', content: '我可以帮你制定项目计划。首先，请告诉我项目的基本信息。' },
        ],
      },
      {
        title: '技术问题咨询',
        messages: [
          { role: 'user', content: 'Vue 3 和 Vue 2 有什么区别？' },
          { role: 'assistant', content: 'Vue 3 相比 Vue 2 有很多改进...' },
        ],
      },
    ],
  },

  MOCKS: {
    API_KEY: 'test-api-key-12345',
    API_BASE_URL: 'https://api.deepseek.com',
    RESPONSE_DELAY: 100,
    ERROR_RATE: 0.1,
  },

  PERFORMANCE: {
    MAX_RENDER_TIME: 100,
    MAX_OPERATION_TIME: 50,
    LARGE_DATA_SIZE: 1000,
  },

  COVERAGE: {
    STATEMENTS: 80,
    BRANCHES: 75,
    FUNCTIONS: 80,
    LINES: 80,
  },
}

export const isTestEnvironment = () => {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST === 'true' ||
    typeof global.describe !== 'undefined'
  )
}

export const getTestType = () => {
  if (typeof expect === 'undefined') {
    return 'unit'
  }
  const testFile = expect.getState()?.testPath || ''

  if (testFile.includes('integration')) {
    return 'integration'
  } else if (testFile.includes('e2e')) {
    return 'e2e'
  } else {
    return 'unit'
  }
}

export const getTestTimeout = () => {
  const testType = getTestType()
  return (
    TEST_CONFIG.TIMEOUT[testType.toUpperCase() as keyof typeof TEST_CONFIG.TIMEOUT] ||
    TEST_CONFIG.TIMEOUT.UNIT
  )
}

/**
 * 测试标签
 */
export const TEST_TAGS = {
  UNIT: 'unit',
  INTEGRATION: 'integration',
  E2E: 'e2e',
  PERFORMANCE: 'performance',
  SMOKE: 'smoke',
  REGRESSION: 'regression',
} as const

export const TEST_GROUPS = {
  CORE: 'core',
  UI: 'ui',
  API: 'api',
  STORAGE: 'storage',
  AI: 'ai',
  MOBILE: 'mobile',
  PERFORMANCE: 'performance',
} as const

export const TEST_PRIORITY = {
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
} as const

export const createTestId = (component: string, element: string) => {
  return `test-${component}-${element}`
}

/**
 * 测试数据生成器
 */
export const TestDataGenerator = {
  randomString: (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  randomNumber: (min = 0, max = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  },

  randomBoolean: () => {
    return Math.random() < 0.5
  },

  /**
   * 生成随机日期
   */
  randomDate: (start = new Date(2020, 0, 1), end = new Date()) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  },

  randomTags: (count = 3) => {
    const availableTags = [
      'work',
      'personal',
      'urgent',
      'learning',
      'health',
      'shopping',
      'travel',
      'hobby',
    ]
    const shuffled = availableTags.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  },
}

export const TestAssertions = {
  expectArrayToContain: <T>(array: T[], item: T) => {
    if (typeof expect !== 'undefined') {
      expect(array).toContain(item)
    }
  },

  /**
   * 断言对象具有特定属性
   */
  expectObjectToHaveProperty: (obj: Record<string, any>, property: string, value?: any) => {
    if (typeof expect !== 'undefined') {
      expect(obj).toHaveProperty(property)
      if (value !== undefined) {
        expect(obj[property]).toBe(value)
      }
    }
  },

  expectFunctionToBeCalled: (fn: vi.MockedFunction<(...args: any[]) => any>, times?: number) => {
    if (typeof expect !== 'undefined') {
      expect(fn).toHaveBeenCalled()
      if (times !== undefined) {
        expect(fn).toHaveBeenCalledTimes(times)
      }
    }
  },

  expectAsyncToComplete: async (promise: Promise<unknown>, timeout = 5000) => {
    const result = await Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout)),
    ])
    return result
  },
}

export const TestUtils = {
  /**
   * 等待条件满足
   */
  waitFor: async (condition: () => boolean, timeout = 5000, interval = 100) => {
    const startTime = Date.now()
    while (!condition() && Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, interval))
    }
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`)
    }
  },

  simulateUserDelay: (min = 50, max = 200) => {
    const delay = Math.random() * (max - min) + min
    return new Promise((resolve) => setTimeout(resolve, delay))
  },

  createTestPromise: <T>(value: T, delay = 0, shouldReject = false) => {
    return new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        if (shouldReject) {
          reject(new Error('Test error'))
        } else {
          resolve(value)
        }
      }, delay)
    })
  },
}

export default {
  TEST_CONFIG,
  TEST_TAGS,
  TEST_GROUPS,
  TEST_PRIORITY,
  TestDataGenerator,
  TestAssertions,
  TestUtils,
  isTestEnvironment,
  getTestType,
  getTestTimeout,
  createTestId,
}
