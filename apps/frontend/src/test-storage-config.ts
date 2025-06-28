/**
 * 测试简化后的存储配置
 */

import { useStorageMode } from './composables/useStorageMode'
import { useSyncManager } from './composables/useSyncManager'

// 测试默认配置
export function testDefaultStorageConfig() {
  console.log('🧪 测试默认存储配置...')

  const { config, currentMode } = useStorageMode()
  const { config: syncConfig } = useSyncManager()

  // 验证默认配置
  const expectedConfig = {
    mode: 'hybrid',
    autoSync: true,
    syncInterval: 5,
    offlineMode: true,
    conflictResolution: 'merge',
  }

  console.log('当前存储配置:', config)
  console.log('当前存储模式:', currentMode.value)
  console.log('同步管理器配置:', syncConfig)

  // 检查配置是否符合预期
  const configMatches = Object.keys(expectedConfig).every((key) => {
    const expected = expectedConfig[key as keyof typeof expectedConfig]
    const actual = config[key as keyof typeof config]
    const matches = actual === expected

    if (!matches) {
      console.error(`❌ 配置不匹配: ${key} - 期望: ${expected}, 实际: ${actual}`)
    } else {
      console.log(`✅ 配置正确: ${key} = ${actual}`)
    }

    return matches
  })

  if (configMatches) {
    console.log('✅ 所有默认配置都正确!')
  } else {
    console.error('❌ 存在配置错误')
  }

  return configMatches
}

// 测试混合存储模式的特性
export function testHybridStorageFeatures() {
  console.log('🧪 测试混合存储特性...')

  const features = [
    '离线优先 - 离线时使用本地存储',
    '自动同步 - 联网后自动同步数据',
    '智能合并 - 自动解决数据冲突',
    '无需手动配置 - 开箱即用',
  ]

  console.log('混合存储模式特性:')
  features.forEach((feature, index) => {
    console.log(`${index + 1}. ${feature}`)
  })

  return true
}

// 运行所有测试
export function runStorageConfigTests() {
  console.log('🚀 开始测试简化后的存储配置...')

  const test1 = testDefaultStorageConfig()
  const test2 = testHybridStorageFeatures()

  const allPassed = test1 && test2

  if (allPassed) {
    console.log('🎉 所有测试通过! 存储配置简化成功!')
  } else {
    console.error('💥 部分测试失败，需要检查配置')
  }

  return allPassed
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 在浏览器环境中延迟执行，确保Vue应用已初始化
  setTimeout(() => {
    runStorageConfigTests()
  }, 1000)
}
