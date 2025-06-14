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

    // 检查每个按钮都包含图标
    expect(wrapper.find('.theme-toggle .button-icon').exists()).toBe(true)
    expect(wrapper.find('.charts-button .button-icon').exists()).toBe(true)

    // 检查按钮不包含文本（纯图标显示）
    expect(wrapper.find('.button-text').exists()).toBe(false)
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
    const sunSvg = sunWrapper.find('.theme-toggle svg')
    expect(sunSvg.exists()).toBe(true)
    expect(sunSvg.attributes('width')).toBe('22')
    expect(sunSvg.attributes('height')).toBe('22')

    // 测试月亮图标
    const moonWrapper = mount(TodoListHeader, {
      props: { ...defaultProps, themeIcon: 'moon' },
      global: { plugins: [i18n] },
    })
    const moonSvg = moonWrapper.find('.theme-toggle svg')
    expect(moonSvg.exists()).toBe(true)
    expect(moonSvg.attributes('width')).toBe('22')
    expect(moonSvg.attributes('height')).toBe('22')

    // 测试自动图标
    const autoWrapper = mount(TodoListHeader, {
      props: { ...defaultProps, themeIcon: 'auto' },
      global: { plugins: [i18n] },
    })
    const autoSvg = autoWrapper.find('.theme-toggle svg')
    expect(autoSvg.exists()).toBe(true)
    expect(autoSvg.attributes('width')).toBe('22')
    expect(autoSvg.attributes('height')).toBe('22')
  })

  it('应该为按钮设置正确的尺寸和样式', () => {
    const wrapper = mount(TodoListHeader, {
      props: defaultProps,
      global: {
        plugins: [i18n],
      },
    })

    const buttons = wrapper.findAll('.icon-button')
    buttons.forEach((button) => {
      // 检查按钮具有正确的CSS类
      expect(button.classes()).toContain('icon-button')

      // 检查图标尺寸
      const icon = button.find('.button-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('width')).toBe('22')
      expect(icon.attributes('height')).toBe('22')
    })
  })
})
