import TaskGenerationDialog from '@/components/TaskGenerationDialog.vue'
import en from '@/locales/en.json'
import zh from '@/locales/zh.json'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'

// Mock AI service
vi.mock('@/services/aiTaskGenerationService', () => ({
  analyzeAdvancedUserContext: vi.fn(() => ({
    preferences: {},
    insights: {
      completionRate: 0.5,
      averageTaskDuration: '1小时',
      mostProductiveTimeframe: '上午',
      commonTaskPatterns: ['测试'],
      recommendedTaskSize: 'medium',
      workloadTrend: 'stable',
    },
    suggestions: {
      taskBreakdown: '建议保持现有方式',
      priorityStrategy: '当前策略良好',
      timeManagement: '保持稳定',
    },
  })),
  generateTasksWithRetry: vi.fn(
    () =>
      new Promise((resolve) => {
        // 模拟长时间的 AI 生成过程
        setTimeout(() => {
          resolve({
            success: true,
            tasks: [
              {
                title: '测试任务1',
                description: '这是一个测试任务',
                priority: 2,
                estimatedTime: '30分钟',
              },
            ],
            originalDescription: '准备下周的发布会',
            totalTasks: 1,
          })
        }, 2000) // 2秒延迟
      })
  ),
  optimizeGeneratedTasks: vi.fn((tasks) => tasks),
  validateGeneratedTasks: vi.fn(() => ({
    isValid: true,
    issues: [],
    suggestions: [],
  })),
}))

// Mock notifications
vi.mock('@/composables/useNotifications', () => ({
  useNotifications: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}))

describe('TaskGenerationDialog - Cancel Functionality', () => {
  let wrapper: any
  let i18n: any

  beforeEach(() => {
    vi.clearAllMocks()

    // 创建 i18n 实例
    i18n = createI18n({
      locale: 'zh',
      messages: { zh, en },
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('should allow canceling during generation', async () => {
    wrapper = mount(TaskGenerationDialog, {
      props: {
        show: true,
        existingTodos: [],
      },
      global: {
        plugins: [i18n],
      },
    })

    // 等待组件挂载
    await nextTick()

    // 输入任务描述
    const textarea = wrapper.find('textarea')
    await textarea.setValue('准备下周的发布会')

    // 点击生成按钮
    const generateButton = wrapper.find('.btn-primary')
    await generateButton.trigger('click')

    // 等待生成开始
    await nextTick()

    // 验证生成状态
    expect(wrapper.vm.isGenerating).toBe(true)

    // 验证取消按钮文本变化
    const cancelButton = wrapper.find('.btn-secondary')
    expect(cancelButton.text()).toBe('stopGeneration')

    // 验证关闭按钮没有被禁用
    const closeButton = wrapper.find('.close-button')
    expect(closeButton.attributes('disabled')).toBeUndefined()

    // 点击取消按钮（直接停止，无需确认）
    await cancelButton.trigger('click')

    // 验证生成已停止，但对话框仍然打开
    expect(wrapper.vm.isGenerating).toBe(false)
    expect(wrapper.props('show')).toBe(true)
  })

  it('should stop generation immediately without confirmation', async () => {
    wrapper = mount(TaskGenerationDialog, {
      props: {
        show: true,
        existingTodos: [],
      },
      global: {
        plugins: [i18n],
      },
    })

    await nextTick()

    // 输入任务描述并开始生成
    const textarea = wrapper.find('textarea')
    await textarea.setValue('准备下周的发布会')

    const generateButton = wrapper.find('.btn-primary')
    await generateButton.trigger('click')
    await nextTick()

    // 验证生成状态
    expect(wrapper.vm.isGenerating).toBe(true)

    const cancelButton = wrapper.find('.btn-secondary')
    await cancelButton.trigger('click')

    // 验证生成立即停止，无需确认
    expect(wrapper.vm.isGenerating).toBe(false)

    // 验证对话框仍然打开
    expect(wrapper.props('show')).toBe(true)
  })

  it('should allow direct cancel when not generating', async () => {
    wrapper = mount(TaskGenerationDialog, {
      props: {
        show: true,
        existingTodos: [],
      },
      global: {
        plugins: [i18n],
      },
    })

    await nextTick()

    // 验证初始状态
    expect(wrapper.vm.isGenerating).toBe(false)

    const cancelButton = wrapper.find('.btn-secondary')
    expect(cancelButton.text()).toBe('取消')

    // 点击取消按钮应该直接关闭对话框
    await cancelButton.trigger('click')

    // 验证 close 事件被触发
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('should stop generation when clicking close button (X) during generation', async () => {
    wrapper = mount(TaskGenerationDialog, {
      props: {
        show: true,
        existingTodos: [],
      },
      global: {
        plugins: [i18n],
      },
    })

    await nextTick()

    // 输入任务描述并开始生成
    const textarea = wrapper.find('textarea')
    await textarea.setValue('准备下周的发布会')

    const generateButton = wrapper.find('.btn-primary')
    await generateButton.trigger('click')
    await nextTick()

    // 验证生成状态
    expect(wrapper.vm.isGenerating).toBe(true)

    // 点击关闭按钮（X）
    const closeButton = wrapper.find('.close-button')
    await closeButton.trigger('click')

    // 验证生成已停止，但对话框仍然打开
    expect(wrapper.vm.isGenerating).toBe(false)
    expect(wrapper.props('show')).toBe(true)
  })
})
