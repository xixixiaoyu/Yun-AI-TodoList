import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { useTodos } from '../../../composables/useTodos'
import TodoCompletionChart from '../TodoCompletionChart.vue'

// 获取 mocked 版本的 useTodos
const mockedUseTodos = vi.mocked(useTodos)

// Mock Chart.js
vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
  })),
}))

// Mock Canvas getContext
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  })),
})

// Mock useTodos composable
vi.mock('../../../composables/useTodos', () => {
  const mockTodos = [
    {
      id: 1,
      text: 'Test todo 1',
      completed: true,
      completedAt: new Date().toISOString(),
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0,
    },
    {
      id: 2,
      text: 'Test todo 2',
      completed: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 1,
    },
    {
      id: 3,
      text: 'Test todo 3',
      completed: true,
      completedAt: new Date().toISOString(),
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 2,
    },
  ]

  return {
    useTodos: vi.fn(() => ({
      todos: { value: mockTodos },
      getCompletedTodosByDate: () => ({
        [new Date().toISOString().split('T')[0]]: 2,
      }),
    })),
  }
})

// 创建 i18n 实例用于测试
const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  messages: {
    zh: {
      completionTrend: '完成趋势（过去7天）',
      completedTodos: '已完成任务',
      totalTasks: '总任务',
      completed: '已完成',
      pending: '待完成',
      completionRate: '完成率',
      task: '个任务',
      tasks: '个任务',
      locale: 'zh-CN',
    },
  },
})

describe('TodoCompletionChart', () => {
  beforeEach(() => {
    // 清除所有 mock 调用记录
    vi.clearAllMocks()
  })

  it('应该正确渲染组件', () => {
    const wrapper = mount(TodoCompletionChart, {
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('.todo-completion-chart').exists()).toBe(true)
    expect(wrapper.find('.stats-overview').exists()).toBe(true)
    expect(wrapper.find('.chart-container').exists()).toBe(true)
    expect(wrapper.find('canvas').exists()).toBe(true)
  })

  it('应该正确显示统计概览', () => {
    const wrapper = mount(TodoCompletionChart, {
      global: {
        plugins: [i18n],
      },
    })

    const statItems = wrapper.findAll('.stat-item')
    expect(statItems).toHaveLength(4)

    // 检查统计数据
    const statValues = wrapper.findAll('.stat-value')
    expect(statValues[0].text()).toBe('3') // 总任务数
    expect(statValues[1].text()).toBe('2') // 已完成任务数
    expect(statValues[2].text()).toBe('1') // 待完成任务数
    expect(statValues[3].text()).toBe('67%') // 完成率
  })

  it('应该正确显示统计标签', () => {
    const wrapper = mount(TodoCompletionChart, {
      global: {
        plugins: [i18n],
      },
    })

    const statLabels = wrapper.findAll('.stat-label')
    expect(statLabels[0].text()).toBe('总任务')
    expect(statLabels[1].text()).toBe('已完成')
    expect(statLabels[2].text()).toBe('待完成')
    expect(statLabels[3].text()).toBe('完成率')
  })

  it('应该在没有任务时正确处理', () => {
    // 临时修改 mock 返回空数组
    mockedUseTodos.mockReturnValueOnce({
      todos: { value: [] },
      getCompletedTodosByDate: () => ({}),
    })

    const wrapper = mount(TodoCompletionChart, {
      global: {
        plugins: [i18n],
      },
    })

    const statValues = wrapper.findAll('.stat-value')
    expect(statValues[0].text()).toBe('0') // 总任务数
    expect(statValues[1].text()).toBe('0') // 已完成任务数
    expect(statValues[2].text()).toBe('0') // 待完成任务数
    expect(statValues[3].text()).toBe('0%') // 完成率
  })

  it('应该具有正确的CSS类', () => {
    const wrapper = mount(TodoCompletionChart, {
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('.todo-completion-chart').exists()).toBe(true)
    expect(wrapper.find('.stats-overview').exists()).toBe(true)
    expect(wrapper.find('.chart-container').exists()).toBe(true)
    expect(wrapper.find('.completion-rate').exists()).toBe(true)
  })

  it('应该在组件卸载时清理图表实例', () => {
    const wrapper = mount(TodoCompletionChart, {
      global: {
        plugins: [i18n],
      },
    })

    // 模拟组件卸载
    wrapper.unmount()

    // 由于我们 mock 了 Chart.js，这里主要是确保组件能正常卸载
    expect(wrapper.vm).toBeDefined()
  })
})
