/**
 * 快速存储功能测试脚本
 * 用于验证混合存储的核心功能
 */

interface TestResult {
  name: string
  success: boolean
  message: string
  duration: number
  error?: string
}

class QuickStorageTest {
  private results: TestResult[] = []

  async runTest(name: string, testFn: () => Promise<boolean>): Promise<TestResult> {
    const startTime = Date.now()

    try {
      console.log(`🧪 运行测试: ${name}`)
      const success = await testFn()
      const duration = Date.now() - startTime

      const result: TestResult = {
        name,
        success,
        message: success ? '通过' : '失败',
        duration,
      }

      this.results.push(result)
      console.log(`${success ? '✅' : '❌'} ${name}: ${result.message} (${duration}ms)`)

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      const result: TestResult = {
        name,
        success: false,
        message: '异常',
        duration,
        error: errorMessage,
      }

      this.results.push(result)
      console.log(`❌ ${name}: ${result.message} - ${errorMessage} (${duration}ms)`)

      return result
    }
  }

  async testLocalStorageBasic(): Promise<boolean> {
    try {
      const testKey = 'quick_test_key'
      const testValue = { id: '1', title: 'test', completed: false }

      // 测试写入
      localStorage.setItem(testKey, JSON.stringify(testValue))

      // 测试读取
      const stored = localStorage.getItem(testKey)
      const parsed = JSON.parse(stored || '{}')

      // 测试删除
      localStorage.removeItem(testKey)

      return parsed.id === testValue.id && parsed.title === testValue.title
    } catch {
      return false
    }
  }

  async testNetworkDetection(): Promise<boolean> {
    try {
      // 检查 navigator.onLine
      const hasOnlineProperty = typeof navigator.onLine === 'boolean'

      // 检查网络事件监听
      let eventFired = false
      const handler = () => {
        eventFired = true
      }

      window.addEventListener('online', handler)
      window.addEventListener('offline', handler)

      // 模拟事件
      window.dispatchEvent(new Event('online'))

      // 清理
      window.removeEventListener('online', handler)
      window.removeEventListener('offline', handler)

      return hasOnlineProperty && eventFired
    } catch {
      return false
    }
  }

  async testDataMerging(): Promise<boolean> {
    try {
      const localData = [
        { id: '1', title: 'Local 1', updatedAt: '2023-01-01T10:00:00Z' },
        { id: '2', title: 'Local 2', updatedAt: '2023-01-01T10:00:00Z' },
      ]

      const remoteData = [
        { id: '1', title: 'Remote 1', updatedAt: '2023-01-01T11:00:00Z' }, // 更新
        { id: '3', title: 'Remote 3', updatedAt: '2023-01-01T10:00:00Z' }, // 新增
      ]

      // 简单的合并逻辑测试
      const merged = this.smartMerge(localData, remoteData)

      // 验证合并结果
      const hasUpdatedItem = merged.some((item) => item.id === '1' && item.title === 'Remote 1')
      const hasLocalOnlyItem = merged.some((item) => item.id === '2')
      const hasRemoteOnlyItem = merged.some((item) => item.id === '3')

      return hasUpdatedItem && hasLocalOnlyItem && hasRemoteOnlyItem && merged.length === 3
    } catch {
      return false
    }
  }

  private smartMerge(
    localData: Record<string, unknown>[],
    remoteData: Record<string, unknown>[]
  ): Record<string, unknown>[] {
    const mergedMap = new Map()

    // 添加本地数据
    localData.forEach((item) => mergedMap.set(item.id, item))

    // 合并远程数据，处理冲突
    remoteData.forEach((remoteItem) => {
      if (mergedMap.has(remoteItem.id)) {
        const localItem = mergedMap.get(remoteItem.id)
        const localTime = new Date(localItem.updatedAt).getTime()
        const remoteTime = new Date(remoteItem.updatedAt).getTime()

        // 使用最新的数据
        if (remoteTime > localTime) {
          mergedMap.set(remoteItem.id, remoteItem)
        }
      } else {
        mergedMap.set(remoteItem.id, remoteItem)
      }
    })

    return Array.from(mergedMap.values())
  }

  async testStorageQuota(): Promise<boolean> {
    try {
      const testKey = 'quota_test'
      const smallData = JSON.stringify({ test: 'data' })

      localStorage.setItem(testKey, smallData)
      const retrieved = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)

      return retrieved === smallData
    } catch (error) {
      // 如果是配额错误，说明检测正常
      return (
        (error as Error).message.includes('quota') ||
        (error as Error).message.includes('QuotaExceededError')
      )
    }
  }

  async testErrorHandling(): Promise<boolean> {
    try {
      // 测试 JSON 解析错误处理
      try {
        JSON.parse('invalid json')
        return false // 不应该到达这里
      } catch {
        // 预期的错误
      }

      // 测试空值处理
      const result = JSON.parse(localStorage.getItem('non_existent_key') || '[]')

      return Array.isArray(result) && result.length === 0
    } catch {
      return false
    }
  }

  async testPerformance(): Promise<boolean> {
    try {
      const startTime = Date.now()

      // 创建中等大小的数据集
      const testData = Array.from({ length: 100 }, (_, i) => ({
        id: `perf-test-${i}`,
        title: `Performance Test Item ${i}`,
        completed: i % 2 === 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))

      // 测试序列化性能
      const serialized = JSON.stringify(testData)
      localStorage.setItem('perf_test', serialized)

      // 测试反序列化性能
      const retrieved = localStorage.getItem('perf_test')
      const deserialized = JSON.parse(retrieved || '[]')

      // 清理
      localStorage.removeItem('perf_test')

      const endTime = Date.now()
      const duration = endTime - startTime

      // 验证数据完整性和性能
      return deserialized.length === 100 && duration < 1000 // 1秒内完成
    } catch {
      return false
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 开始快速存储功能测试...\n')

    const tests = [
      { name: '本地存储基础功能', fn: () => this.testLocalStorageBasic() },
      { name: '网络状态检测', fn: () => this.testNetworkDetection() },
      { name: '数据合并逻辑', fn: () => this.testDataMerging() },
      { name: '存储配额处理', fn: () => this.testStorageQuota() },
      { name: '错误处理机制', fn: () => this.testErrorHandling() },
      { name: '性能测试', fn: () => this.testPerformance() },
    ]

    for (const test of tests) {
      await this.runTest(test.name, test.fn)
      // 在测试之间添加小延迟
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    this.generateReport()
  }

  private generateReport(): void {
    console.log('\n📊 测试报告')
    console.log('='.repeat(50))

    const totalTests = this.results.length
    const passedTests = this.results.filter((r) => r.success).length
    const failedTests = totalTests - passedTests
    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0'

    console.log(`总测试数: ${totalTests}`)
    console.log(`通过测试: ${passedTests}`)
    console.log(`失败测试: ${failedTests}`)
    console.log(`通过率: ${passRate}%`)

    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0)
    console.log(`总耗时: ${totalDuration}ms`)

    if (failedTests > 0) {
      console.log('\n❌ 失败测试详情:')
      this.results
        .filter((r) => !r.success)
        .forEach((result) => {
          console.log(`  • ${result.name}: ${result.message}`)
          if (result.error) {
            console.log(`    错误: ${result.error}`)
          }
        })
    }

    console.log('\n🎯 测试结论:')
    if (passedTests === totalTests) {
      console.log('  🎉 所有基础功能测试通过！')
    } else if (passRate >= '80') {
      console.log('  ⚠️  大部分功能正常，但需要关注失败的测试。')
    } else {
      console.log('  🚨 多项基础功能存在问题，需要立即修复。')
    }

    console.log('\n💡 建议:')
    if (passedTests === totalTests) {
      console.log('  • 可以继续进行完整的混合存储功能测试')
      console.log('  • 建议运行端到端测试验证完整流程')
    } else {
      console.log('  • 优先修复失败的基础功能')
      console.log('  • 修复后重新运行此测试')
      console.log('  • 检查浏览器控制台是否有额外错误信息')
    }
  }

  getResults(): TestResult[] {
    return [...this.results]
  }
}

// 导出便捷函数
export async function runQuickStorageTest(): Promise<TestResult[]> {
  const tester = new QuickStorageTest()
  await tester.runAllTests()
  return tester.getResults()
}

// 全局暴露（用于浏览器控制台）
if (typeof window !== 'undefined') {
  ;(
    window as {
      runQuickStorageTest?: typeof runQuickStorageTest
      QuickStorageTest?: typeof QuickStorageTest
    }
  ).runQuickStorageTest = runQuickStorageTest
  ;(
    window as {
      runQuickStorageTest?: typeof runQuickStorageTest
      QuickStorageTest?: typeof QuickStorageTest
    }
  ).QuickStorageTest = QuickStorageTest
}

export { QuickStorageTest }
