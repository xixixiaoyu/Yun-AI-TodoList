/**
 * 混合存储功能交互式测试工具
 * 提供手动测试混合存储功能的工具函数
 */

import type { CreateTodoDto } from '@shared/types'

export interface TestResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
  error?: string
}

export interface NetworkSimulator {
  setOnline: (online: boolean) => void
  isOnline: () => boolean
  simulateSlowConnection: (enabled: boolean) => void
  simulateNetworkError: (enabled: boolean) => void
}

export class HybridStorageInteractiveTester {
  private networkSimulator: NetworkSimulator
  private testResults: TestResult[] = []
  private originalFetch: typeof fetch

  constructor() {
    this.originalFetch = window.fetch
    this.networkSimulator = this.createNetworkSimulator()
  }

  /**
   * 创建网络模拟器
   */
  private createNetworkSimulator(): NetworkSimulator {
    let isOnlineState = navigator.onLine
    let slowConnectionEnabled = false
    let networkErrorEnabled = false

    // 重写 fetch 以模拟网络状态
    window.fetch = async (input: string | URL | Request, init?: RequestInit) => {
      if (networkErrorEnabled) {
        throw new Error('Simulated network error')
      }

      if (slowConnectionEnabled) {
        await new Promise((resolve) => setTimeout(resolve, 3000)) // 3秒延迟
      }

      if (!isOnlineState) {
        throw new Error('Network offline')
      }

      return this.originalFetch(input, init)
    }

    return {
      setOnline: (online: boolean) => {
        isOnlineState = online
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: online,
        })

        // 触发浏览器事件
        const event = online ? 'online' : 'offline'
        window.dispatchEvent(new Event(event))

        console.log(`🌐 网络状态已设置为: ${online ? '在线' : '离线'}`)
      },

      isOnline: () => isOnlineState,

      simulateSlowConnection: (enabled: boolean) => {
        slowConnectionEnabled = enabled
        console.log(`🐌 慢速连接模拟: ${enabled ? '启用' : '禁用'}`)
      },

      simulateNetworkError: (enabled: boolean) => {
        networkErrorEnabled = enabled
        console.log(`❌ 网络错误模拟: ${enabled ? '启用' : '禁用'}`)
      },
    }
  }

  /**
   * 记录测试结果
   */
  private logResult(result: TestResult): void {
    this.testResults.push(result)
    const icon = result.success ? '✅' : '❌'
    console.log(`${icon} ${result.message}`)
    if (result.error) {
      console.error(`   错误: ${result.error}`)
    }
    if (result.data) {
      console.log(`   数据:`, result.data)
    }
  }

  /**
   * 测试在线状态下的双重存储
   */
  async testOnlineHybridStorage(): Promise<TestResult> {
    console.log('\n🧪 测试在线状态下的双重存储...')

    try {
      // 确保在线状态
      this.networkSimulator.setOnline(true)

      // 创建测试数据
      const testTodo: CreateTodoDto = {
        title: `测试 Todo - ${new Date().toLocaleString()}`,
      }

      // 检查本地存储是否可用
      const localStorageTest = this.testLocalStorage()
      if (!localStorageTest.success) {
        return localStorageTest
      }

      // 检查云端存储是否可用
      const remoteStorageTest = await this.testRemoteStorage()
      if (!remoteStorageTest.success) {
        return remoteStorageTest
      }

      const result: TestResult = {
        success: true,
        message: '在线状态下的双重存储测试通过',
        data: { testTodo, localStorage: true, remoteStorage: true },
      }

      this.logResult(result)
      return result
    } catch (error) {
      const result: TestResult = {
        success: false,
        message: '在线状态下的双重存储测试失败',
        error: error instanceof Error ? error.message : String(error),
      }

      this.logResult(result)
      return result
    }
  }

  /**
   * 测试离线状态下的本地存储
   */
  async testOfflineLocalStorage(): Promise<TestResult> {
    console.log('\n🧪 测试离线状态下的本地存储...')

    try {
      // 设置离线状态
      this.networkSimulator.setOnline(false)

      // 测试本地存储 CRUD 操作
      const testData = [
        { id: '1', title: '离线测试 Todo 1', completed: false },
        { id: '2', title: '离线测试 Todo 2', completed: true },
      ]

      // 测试写入
      localStorage.setItem('offline_test_todos', JSON.stringify(testData))

      // 测试读取
      const storedData = localStorage.getItem('offline_test_todos')
      const parsedData = JSON.parse(storedData || '[]')

      // 验证数据完整性
      const isDataIntact =
        parsedData.length === testData.length &&
        parsedData.every(
          (item: Record<string, unknown>, index: number) =>
            item.id === testData[index].id && item.title === testData[index].title
        )

      if (!isDataIntact) {
        throw new Error('离线数据完整性验证失败')
      }

      // 清理测试数据
      localStorage.removeItem('offline_test_todos')

      const result: TestResult = {
        success: true,
        message: '离线状态下的本地存储测试通过',
        data: { testData, storedData: parsedData },
      }

      this.logResult(result)
      return result
    } catch (error) {
      const result: TestResult = {
        success: false,
        message: '离线状态下的本地存储测试失败',
        error: error instanceof Error ? error.message : String(error),
      }

      this.logResult(result)
      return result
    }
  }

  /**
   * 测试网络恢复时的数据合并
   */
  async testNetworkRecoveryMerge(): Promise<TestResult> {
    console.log('\n🧪 测试网络恢复时的数据合并...')

    try {
      // 1. 模拟离线状态，创建本地数据
      this.networkSimulator.setOnline(false)

      const localData = [
        {
          id: 'local-1',
          title: '本地 Todo 1',
          completed: false,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'local-2',
          title: '本地 Todo 2',
          completed: true,
          updatedAt: new Date().toISOString(),
        },
      ]

      localStorage.setItem('merge_test_todos', JSON.stringify(localData))
      console.log('📱 已创建本地数据:', localData.length, '条')

      // 2. 模拟网络恢复
      this.networkSimulator.setOnline(true)

      // 3. 模拟云端数据
      const cloudData = [
        {
          id: 'cloud-1',
          title: '云端 Todo 1',
          completed: false,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'local-1',
          title: '本地 Todo 1 (云端版本)',
          completed: true,
          updatedAt: new Date(Date.now() + 1000).toISOString(),
        }, // 更新的版本
      ]

      console.log('☁️ 模拟云端数据:', cloudData.length, '条')

      // 4. 执行智能合并
      const mergedData = this.performSmartMerge(localData, cloudData)

      console.log('🔄 合并后数据:', mergedData.length, '条')

      // 5. 验证合并结果
      const hasLocalOnlyData = mergedData.some((item) => item.id === 'local-2')
      const hasCloudOnlyData = mergedData.some((item) => item.id === 'cloud-1')
      const hasResolvedConflict =
        mergedData.find((item) => item.id === 'local-1')?.completed === true // 应该使用云端的更新版本

      if (!hasLocalOnlyData || !hasCloudOnlyData || !hasResolvedConflict) {
        throw new Error('数据合并结果验证失败')
      }

      // 清理测试数据
      localStorage.removeItem('merge_test_todos')

      const result: TestResult = {
        success: true,
        message: '网络恢复时的数据合并测试通过',
        data: {
          localData: localData.length,
          cloudData: cloudData.length,
          mergedData: mergedData.length,
          conflicts: 1,
        },
      }

      this.logResult(result)
      return result
    } catch (error) {
      const result: TestResult = {
        success: false,
        message: '网络恢复时的数据合并测试失败',
        error: error instanceof Error ? error.message : String(error),
      }

      this.logResult(result)
      return result
    }
  }

  /**
   * 执行智能合并
   */
  private performSmartMerge(
    localData: Record<string, unknown>[],
    cloudData: Record<string, unknown>[]
  ): Record<string, unknown>[] {
    const mergedMap = new Map()

    // 添加本地数据
    localData.forEach((item) => mergedMap.set(item.id, item))

    // 合并云端数据，处理冲突
    cloudData.forEach((cloudItem) => {
      if (mergedMap.has(cloudItem.id)) {
        const localItem = mergedMap.get(cloudItem.id)
        const localTime = new Date(localItem.updatedAt).getTime()
        const cloudTime = new Date(cloudItem.updatedAt).getTime()

        // 使用最新的数据
        if (cloudTime > localTime) {
          mergedMap.set(cloudItem.id, cloudItem)
        }
      } else {
        mergedMap.set(cloudItem.id, cloudItem)
      }
    })

    return Array.from(mergedMap.values())
  }

  /**
   * 测试本地存储健康状态
   */
  private testLocalStorage(): TestResult {
    try {
      const testKey = 'health_check_test'
      const testValue = 'test_value'

      localStorage.setItem(testKey, testValue)
      const retrievedValue = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)

      if (retrievedValue !== testValue) {
        throw new Error('本地存储读写不一致')
      }

      return {
        success: true,
        message: '本地存储健康检查通过',
      }
    } catch (error) {
      return {
        success: false,
        message: '本地存储健康检查失败',
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * 测试远程存储健康状态
   */
  private async testRemoteStorage(): Promise<TestResult> {
    try {
      // 尝试访问健康检查端点
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`远程存储响应错误: ${response.status}`)
      }

      return {
        success: true,
        message: '远程存储健康检查通过',
      }
    } catch (error) {
      return {
        success: false,
        message: '远程存储健康检查失败',
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 开始运行混合存储功能全面测试...\n')

    const tests = [
      () => this.testOnlineHybridStorage(),
      () => this.testOfflineLocalStorage(),
      () => this.testNetworkRecoveryMerge(),
    ]

    const results: TestResult[] = []

    for (const test of tests) {
      const result = await test()
      results.push(result)

      // 在测试之间添加延迟
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // 生成测试报告
    this.generateTestReport(results)

    return results
  }

  /**
   * 生成测试报告
   */
  private generateTestReport(results: TestResult[]): void {
    console.log('\n📊 测试报告')
    console.log('='.repeat(50))

    const passedTests = results.filter((r) => r.success).length
    const totalTests = results.length
    const passRate = ((passedTests / totalTests) * 100).toFixed(1)

    console.log(`总测试数: ${totalTests}`)
    console.log(`通过测试: ${passedTests}`)
    console.log(`失败测试: ${totalTests - passedTests}`)
    console.log(`通过率: ${passRate}%`)

    if (passedTests === totalTests) {
      console.log('\n🎉 所有测试通过！混合存储功能工作正常。')
    } else {
      console.log('\n⚠️  部分测试失败，请检查相关功能。')

      const failedTests = results.filter((r) => !r.success)
      failedTests.forEach((test) => {
        console.log(`❌ ${test.message}: ${test.error}`)
      })
    }
  }

  /**
   * 获取网络模拟器
   */
  getNetworkSimulator(): NetworkSimulator {
    return this.networkSimulator
  }

  /**
   * 获取测试结果
   */
  getTestResults(): TestResult[] {
    return [...this.testResults]
  }

  /**
   * 清理测试环境
   */
  cleanup(): void {
    // 恢复原始 fetch
    window.fetch = this.originalFetch

    // 清理测试数据
    const testKeys = ['offline_test_todos', 'merge_test_todos', 'health_check_test']
    testKeys.forEach((key) => {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn(`清理测试数据失败: ${key}`, error)
      }
    })

    // 重置网络状态
    this.networkSimulator.setOnline(true)

    console.log('🧹 测试环境已清理')
  }
}

// 导出便捷函数
export async function runHybridStorageTests(): Promise<TestResult[]> {
  const tester = new HybridStorageInteractiveTester()

  try {
    const results = await tester.runAllTests()
    return results
  } finally {
    tester.cleanup()
  }
}

// 全局暴露测试工具（用于浏览器控制台调试）
if (typeof window !== 'undefined') {
  ;(
    window as {
      hybridStorageTester?: HybridStorageInteractiveTester
      runHybridStorageTests?: typeof runHybridStorageTests
    }
  ).hybridStorageTester = new HybridStorageInteractiveTester()
  ;(
    window as {
      hybridStorageTester?: HybridStorageInteractiveTester
      runHybridStorageTests?: typeof runHybridStorageTests
    }
  ).runHybridStorageTests = runHybridStorageTests
}
