import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TodoListHeader from '../TodoListHeader.vue'
import { createI18n } from 'vue-i18n'

// 创建 i18n 实例用于测试
const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  messages: {
    zh: {
      appTitle: '待办事项',
      theme: '主题',
      showCharts: '统计图表',
      openCharts: '打开统计图表',
      closeCharts: '关闭统计图表',
      switchToLightMode: '切换到浅色模式',
      switchToDarkMode: '切换到深色模式',
      switchToAutoMode: '切换到自动模式',
    },
  },
})

describe('TodoListHeader', () => {
  const defaultProps = {
    themeIcon: 'sun',
    themeTooltip: '切换到深色模式',
    showCharts: false,
  }

  it('应该正确渲染所有按钮', () => {
    const wrapper = mount(TodoListHeader, {
      props: defaultProps,
      global: {
        plugins: [i18n],
      },
    })

    // 检查是否有两个按钮
    const buttons = wrapper.findAll('.icon-button')
    expect(buttons).toHaveLength(2)

    // 检查按钮类名
    expect(wrapper.find('.theme-toggle').exists()).toBe(true)
    expect(wrapper.find('.charts-button').exists()).toBe(true)
  })

  it('应该在激活状态时添加 active 类', () => {
    const wrapper = mount(TodoListHeader, {
      props: {
        ...defaultProps,
        showCharts: true,
      },
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.find('.charts-button').classes()).toContain('active')
  })

  it('应该正确触发事件', async () => {
    const wrapper = mount(TodoListHeader, {
      props: defaultProps,
      global: {
        plugins: [i18n],
      },
    })

    // 测试主题切换
    await wrapper.find('.theme-toggle').trigger('click')
    expect(wrapper.emitted('toggleTheme')).toHaveLength(1)

    // 测试图表切换
    await wrapper.find('.charts-button').trigger('click')
    expect(wrapper.emitted('toggleCharts')).toHaveLength(1)
  })

  it('应该显示正确的工具提示', () => {
    const wrapper = mount(TodoListHeader, {
      props: defaultProps,
      global: {
        plugins: [i18n],
      },
    })

    const themeButton = wrapper.find('.theme-toggle')
    const chartsButton = wrapper.find('.charts-button')

    expect(themeButton.attributes('title')).toContain('切换到深色模式')
    expect(themeButton.attributes('title')).toContain('Ctrl+T')

    expect(chartsButton.attributes('title')).toContain('打开统计图表')
    expect(chartsButton.attributes('title')).toContain('Ctrl+S')
  })

  it('应该根据不同主题图标显示不同的 SVG', () => {
    // 测试太阳图标
    const sunWrapper = mount(TodoListHeader, {
      props: { ...defaultProps, themeIcon: 'sun' },
      global: { plugins: [i18n] },
    })
    expect(sunWrapper.find('.theme-toggle svg').exists()).toBe(true)

    // 测试月亮图标
    const moonWrapper = mount(TodoListHeader, {
      props: { ...defaultProps, themeIcon: 'moon' },
      global: { plugins: [i18n] },
    })
    expect(moonWrapper.find('.theme-toggle svg').exists()).toBe(true)

    // 测试自动图标
    const autoWrapper = mount(TodoListHeader, {
      props: { ...defaultProps, themeIcon: 'auto' },
      global: { plugins: [i18n] },
    })
    expect(autoWrapper.find('.theme-toggle svg').exists()).toBe(true)
  })
})
