import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestI18n } from '@/test/helpers'
import { useTodos } from '../../../composables/useTodos'
import TodoCompletionChart from '../TodoCompletionChart.vue'

const mockedUseTodos = vi.mocked(useTodos)

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
  })),
}))

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

vi.mock('../../../composables/useTodos', () => {
  const mockTodos = [
    {
      id: 1,
      text: 'Test todo 1',
      completed: true,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0,
    },
    {
      id: 2,
      text: 'Test todo 2',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 1,
    },
    {
      id: 3,
      text: 'Test todo 3',
      completed: true,
      completedAt: new Date().toISOString(),
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

const i18n = createTestI18n()

describe('TodoCompletionChart', () => {
  beforeEach(() => {
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

    const statValues = wrapper.findAll('.stat-value')
    expect(statValues[0].text()).toBe('3')
    expect(statValues[1].text()).toBe('2')
    expect(statValues[2].text()).toBe('1')
    expect(statValues[3].text()).toBe('67%')
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
    expect(statValues[0].text()).toBe('0')
    expect(statValues[1].text()).toBe('0')
    expect(statValues[2].text()).toBe('0')
    expect(statValues[3].text()).toBe('0%')
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

    wrapper.unmount()

    expect(wrapper.vm).toBeDefined()
  })
})
