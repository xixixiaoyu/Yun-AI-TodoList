import { generateFallbackQuestion } from '@/services/aiAnalysisService'
import type { Todo } from '@/types/todo'

/**
 * 智能提问功能演示脚本
 * 展示不同数据场景下的智能提问生成效果
 */

// 演示数据集
const demoDataSets = {
  // 场景1：任务数量较多
  manyTasks: Array.from({ length: 15 }, (_, i) => ({
    id: `demo-many-${i + 1}-${Math.random().toString(36).substring(2, 11)}`,
    title: `任务 ${i + 1}：${['完成项目报告', '学习新技术', '整理文档', '开会讨论', '代码审查'][i % 5]}`,
    completed: false,
    tags: ['工作', '学习', '生活'][i % 3] ? [['工作', '学习', '生活'][i % 3]] : [],
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    order: i + 1,
    priority: Math.floor(Math.random() * 5) + 1,
    estimatedTime: ['30分钟', '1小时', '2小时', '半天', '1天'][Math.floor(Math.random() * 5)],
    aiAnalyzed: Math.random() > 0.3,
  })) as Todo[],

  // 场景2：高优先级任务较多
  highPriorityTasks: Array.from({ length: 6 }, (_, i) => ({
    id: `demo-priority-${i + 1}-${Math.random().toString(36).substring(2, 11)}`,
    title: `紧急任务 ${i + 1}：${['客户需求响应', '系统故障修复', '重要会议准备', '项目截止交付', '安全漏洞修复', '领导汇报'][i]}`,
    completed: false,
    tags: ['紧急', '重要'],
    createdAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 2 * 60 * 60 * 1000).toISOString(),
    order: i + 1,
    priority: 5,
    estimatedTime: ['1小时', '2小时', '4小时'][Math.floor(Math.random() * 3)],
    aiAnalyzed: true,
  })) as Todo[],

  // 场景3：已完成任务较多
  manyCompletedTasks: [
    // 已完成任务
    ...Array.from({ length: 12 }, (_, i) => ({
      id: `demo-completed-${i + 1}-${Math.random().toString(36).substring(2, 11)}`,
      title: `已完成任务 ${i + 1}：${['代码开发', '文档编写', '测试用例', '需求分析', '设计评审'][i % 5]}`,
      completed: true,
      completedAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
      tags: ['工作', '完成'],
      createdAt: new Date(Date.now() - (i + 7) * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
      order: i + 1,
      priority: Math.floor(Math.random() * 5) + 1,
      estimatedTime: ['30分钟', '1小时', '2小时'][Math.floor(Math.random() * 3)],
      aiAnalyzed: true,
    })),
    // 少量待完成任务
    ...Array.from({ length: 3 }, (_, i) => ({
      id: `demo-pending-${i + 1}-${Math.random().toString(36).substring(2, 11)}`,
      title: `待完成任务 ${i + 1}`,
      completed: false,
      tags: ['工作'],
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      order: i + 13,
      priority: 3,
      estimatedTime: '1小时',
      aiAnalyzed: true,
    })),
  ] as Todo[],

  // 场景4：未分析任务较多
  manyUnanalyzedTasks: Array.from({ length: 8 }, (_, i) => ({
    id: `demo-unanalyzed-${i + 1}-${Math.random().toString(36).substring(2, 11)}`,
    title: `未分析任务 ${i + 1}：${['新功能开发', '性能优化', '用户反馈处理', '技术调研', '代码重构'][i % 5]}`,
    completed: false,
    tags: ['开发', '优化'],
    createdAt: new Date(Date.now() - i * 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 6 * 60 * 60 * 1000).toISOString(),
    order: i + 1,
    aiAnalyzed: false, // 关键：未进行AI分析
  })) as Todo[],

  // 场景5：简单场景
  simpleTasks: [
    {
      id: `demo-simple-1-${Math.random().toString(36).substring(2, 11)}`,
      title: '简单日常任务',
      completed: false,
      tags: ['日常'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 1,
      priority: 3,
      estimatedTime: '30分钟',
      aiAnalyzed: true,
    },
  ] as Todo[],
}

/**
 * 运行智能提问演示
 */
export function runSmartQuestionDemo() {
  console.log('🤖 智能提问功能演示开始\n')
  console.log('=' * 50)

  Object.entries(demoDataSets).forEach(([scenarioName, todos], index) => {
    console.log(`\n📋 场景 ${index + 1}: ${getScenarioDescription(scenarioName)}`)
    console.log(`📊 数据概况: ${getDataSummary(todos)}`)

    try {
      const result = generateFallbackQuestion(todos)

      console.log(`💡 生成问题: ${result.question}`)
      console.log(`🏷️  问题类型: ${result.category} (${getCategoryEmoji(result.category)})`)
      console.log(`💭 生成理由: ${result.reasoning}`)
    } catch (error) {
      console.error(`❌ 生成失败: ${error}`)
    }

    console.log('-' * 50)
  })

  console.log('\n✅ 智能提问功能演示完成')
}

/**
 * 获取场景描述
 */
function getScenarioDescription(scenarioName: string): string {
  const descriptions = {
    manyTasks: '任务数量较多场景',
    highPriorityTasks: '高优先级任务较多场景',
    manyCompletedTasks: '已完成任务较多场景',
    manyUnanalyzedTasks: '未分析任务较多场景',
    simpleTasks: '简单任务场景',
  }
  return descriptions[scenarioName as keyof typeof descriptions] || scenarioName
}

/**
 * 获取数据摘要
 */
function getDataSummary(todos: Todo[]): string {
  const active = todos.filter((t) => !t.completed).length
  const completed = todos.filter((t) => t.completed).length
  const highPriority = todos.filter((t) => !t.completed && t.priority && t.priority >= 4).length
  const unanalyzed = todos.filter((t) => !t.completed && !t.aiAnalyzed).length

  return `总计${todos.length}个任务 (待完成${active}个, 已完成${completed}个, 高优先级${highPriority}个, 未分析${unanalyzed}个)`
}

/**
 * 获取问题类型对应的表情符号
 */
function getCategoryEmoji(category: string): string {
  const emojis = {
    priority: '⭐',
    planning: '📅',
    analysis: '📊',
    improvement: '🚀',
    summary: '📝',
  }
  return emojis[category as keyof typeof emojis] || '💡'
}

/**
 * 在浏览器控制台中运行演示
 */
if (typeof window !== 'undefined') {
  // 将演示函数挂载到全局对象，方便在浏览器控制台调用
  ;(window as any).runSmartQuestionDemo = runSmartQuestionDemo
  console.log('💡 智能提问演示已加载，在控制台运行 runSmartQuestionDemo() 查看效果')
}

// 导出演示数据和函数
export { demoDataSets, getCategoryEmoji, getDataSummary, getScenarioDescription }
