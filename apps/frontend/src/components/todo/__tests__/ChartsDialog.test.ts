import { createTestI18n } from '@/test/helpers'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ChartsDialog from '../ChartsDialog.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
  })),
}))

vi.mock('../../../composables/useTodos', () => ({
  useTodos: () => ({
    todos: { value: [] },
    getCompletedTodosByDate: () => ({}),
  }),
}))

// Mock TodoCompletionChart 组件
vi.mock('../TodoCompletionChart.vue', () => ({
  default: {
    name: 'TodoCompletionChart',
    template: '<div class="mock-todo-completion-chart">Chart</div>',
  },
}))

const i18n = createTestI18n()

describe('ChartsDialog', () => {
  const defaultProps = {
    show: true,
  }

  it('应该在 show 为 true 时渲染对话框', () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('.charts-dialog-overlay').exists()).toBe(true)
    expect(wrapper.find('.charts-dialog-content').exists()).toBe(true)
  })

  it('应该在 show 为 false 时不渲染对话框', () => {
    const wrapper = mount(ChartsDialog, {
      props: { show: false },
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('div[class*="fixed"]').exists()).toBe(false)
  })

  it('应该显示正确的标题', () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('h2').text()).toBe('生产力洞察')
  })

  it('应该包含关闭按钮', () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n],
      },
    })

    const closeBtn = wrapper.find('button[aria-label="关闭"]')
    expect(closeBtn.exists()).toBe(true)
    expect(closeBtn.find('svg').exists()).toBe(true)
  })

  it('应该包含 TodoCompletionChart 组件', () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.findComponent({ name: 'TodoCompletionChart' }).exists()).toBe(true)
  })

  it('点击关闭按钮应该触发 close 事件', async () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n],
      },
    })

    await wrapper.find('button[aria-label="关闭"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('点击对话框背景应该触发 close 事件', async () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n],
      },
    })

    await wrapper.find('.charts-dialog-overlay').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('点击对话框内容区域不应该触发 close 事件', async () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n],
      },
    })

    await wrapper.find('.charts-dialog-content').trigger('click')
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('应该具有正确的 aria-label 属性', () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n],
      },
    })

    const closeBtn = wrapper.find('button[aria-label="关闭"]')
    expect(closeBtn.attributes('aria-label')).toBe('关闭')
  })

  it('应该具有正确的CSS类和样式', () => {
    const wrapper = mount(ChartsDialog, {
      props: defaultProps,
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('.charts-dialog-overlay').exists()).toBe(true)
    expect(wrapper.find('.charts-dialog-content').exists()).toBe(true)
    expect(wrapper.find('.charts-dialog-close').exists()).toBe(true)
  })
})
