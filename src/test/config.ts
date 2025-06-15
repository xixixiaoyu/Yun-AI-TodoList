/**
 * 测试配置文件
 * 定义测试环境的配置和常量
 */

export const TEST_CONFIG = {
  // 测试超时设置
  TIMEOUT: {
    UNIT: 5000, // 单元测试超时 5 秒
    INTEGRATION: 10000, // 集成测试超时 10 秒
    E2E: 30000 // 端到端测试超时 30 秒
  },

  // 测试数据配置
  TEST_DATA: {
    MAX_TODOS: 1000,
    SAMPLE_TODOS: [
      { text: '学习 Vue 3', tags: ['learning', 'frontend'] },
      { text: '写单元测试', tags: ['testing', 'development'] },
      { text: '部署应用', tags: ['deployment', 'devops'] },
      { text: '代码审查', tags: ['review', 'quality'] },
      { text: '文档更新', tags: ['documentation'] }
    ],
    SAMPLE_CONVERSATIONS: [
      {
        title: '项目规划讨论',
        messages: [
          { role: 'user', content: '帮我规划一个新项目' },
          { role: 'assistant', content: '我可以帮你制定项目计划。首先，请告诉我项目的基本信息。' }
        ]
      },
      {
        title: '技术问题咨询',
        messages: [
          { role: 'user', content: 'Vue 3 和 Vue 2 有什么区别？' },
          { role: 'assistant', content: 'Vue 3 相比 Vue 2 有很多改进...' }
        ]
      }
    ]
  },

  // Mock 配置
  MOCKS: {
    API_KEY: 'test-api-key-12345',
    API_BASE_URL: 'https://api.deepseek.com',
    RESPONSE_DELAY: 100, // 模拟网络延迟
    ERROR_RATE: 0.1 // 模拟错误率 10%
  },

  // 性能测试配置
  PERFORMANCE: {
    MAX_RENDER_TIME: 100, // 最大渲染时间 100ms
    MAX_OPERATION_TIME: 50, // 最大操作时间 50ms
    LARGE_DATA_SIZE: 1000 // 大数据集大小
  },

  // 覆盖率配置
  COVERAGE: {
    STATEMENTS: 80,
    BRANCHES: 75,
    FUNCTIONS: 80,
    LINES: 80
  }
}

/**
 * 测试环境检测
 */
export const isTestEnvironment = () => {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST === 'true' ||
    typeof global.describe !== 'undefined'
  )
}

/**
 * 测试类型检测
 */
export const getTestType = () => {
  if (typeof expect === 'undefined') {
    return 'unit'
  }
  const testFile = expect.getState().testPath || ''

  if (testFile.includes('integration')) {
    return 'integration'
  } else if (testFile.includes('e2e')) {
    return 'e2e'
  } else {
    return 'unit'
  }
}

/**
 * 获取当前测试类型的超时时间
 */
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
  REGRESSION: 'regression'
} as const

/**
 * 测试分组
 */
export const TEST_GROUPS = {
  CORE: 'core', // 核心功能
  UI: 'ui', // 用户界面
  API: 'api', // API 接口
  STORAGE: 'storage', // 数据存储
  AI: 'ai', // AI 功能
  MOBILE: 'mobile', // 移动端
  PERFORMANCE: 'performance' // 性能测试
} as const

/**
 * 测试优先级
 */
export const TEST_PRIORITY = {
  CRITICAL: 1, // 关键功能
  HIGH: 2, // 高优先级
  MEDIUM: 3, // 中优先级
  LOW: 4 // 低优先级
} as const

/**
 * 创建测试标识符
 */
export const createTestId = (component: string, element: string) => {
  return `test-${component}-${element}`
}

/**
 * 测试数据生成器
 */
export const TestDataGenerator = {
  /**
   * 生成随机字符串
   */
  randomString: (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  /**
   * 生成随机数字
   */
  randomNumber: (min = 0, max = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  },

  /**
   * 生成随机布尔值
   */
  randomBoolean: () => {
    return Math.random() < 0.5
  },

  /**
   * 生成随机日期
   */
  randomDate: (start = new Date(2020, 0, 1), end = new Date()) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  },

  /**
   * 生成随机标签
   */
  randomTags: (count = 3) => {
    const availableTags = [
      'work',
      'personal',
      'urgent',
      'learning',
      'health',
      'shopping',
      'travel',
      'hobby'
    ]
    const shuffled = availableTags.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }
}

/**
 * 测试断言辅助函数
 */
export const TestAssertions = {
  /**
   * 断言数组包含特定元素
   */
  expectArrayToContain: <T>(array: T[], item: T) => {
    if (typeof expect !== 'undefined') {
      expect(array).toContain(item)
    }
  },

  /**
   * 断言对象具有特定属性
   */
  expectObjectToHaveProperty: (obj: Record<string, unknown>, property: string, value?: unknown) => {
    if (typeof expect !== 'undefined') {
      expect(obj).toHaveProperty(property)
      if (value !== undefined) {
        expect(obj[property]).toBe(value)
      }
    }
  },

  /**
   * 断言函数被调用
   */
  expectFunctionToBeCalled: (
    fn: vi.MockedFunction<(...args: unknown[]) => unknown>,
    times?: number
  ) => {
    if (typeof expect !== 'undefined') {
      expect(fn).toHaveBeenCalled()
      if (times !== undefined) {
        expect(fn).toHaveBeenCalledTimes(times)
      }
    }
  },

  /**
   * 断言异步操作完成
   */
  expectAsyncToComplete: async (promise: Promise<unknown>, timeout = 5000) => {
    const result = await Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
    ])
    return result
  }
}

/**
 * 测试工具函数
 */
export const TestUtils = {
  /**
   * 等待条件满足
   */
  waitFor: async (condition: () => boolean, timeout = 5000, interval = 100) => {
    const startTime = Date.now()
    while (!condition() && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, interval))
    }
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`)
    }
  },

  /**
   * 模拟用户输入延迟
   */
  simulateUserDelay: (min = 50, max = 200) => {
    const delay = Math.random() * (max - min) + min
    return new Promise(resolve => setTimeout(resolve, delay))
  },

  /**
   * 创建测试用的 Promise
   */
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
  }
}

/**
 * 导出所有配置
 */
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
  createTestId
}
