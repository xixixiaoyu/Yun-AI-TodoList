import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import TodoListHeader from '../TodoListHeader.vue'

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
      openSearch: '打开搜索',
      closeSearch: '关闭搜索',
      switchToLightMode: '切换到浅色模式',
      switchToDarkMode: '切换到深色模式',
      switchToAutoMode: '切换到自动模式'
    }
  }
})

describe('TodoListHeader', () => {
  const defaultProps = {
    themeIcon: 'sun',
    themeTooltip: '切换到深色模式',
    showCharts: false,
    showSearch: false
  }

  it('应该正确渲染所有按钮', () => {
    const wrapper = mount(TodoListHeader, {
      props: defaultProps,
      global: {
        plugins: [i18n]
      }
    })

    const buttons = wrapper.findAll('.icon-button')
    expect(buttons).toHaveLength(3)

    expect(wrapper.find('.search-button').exists()).toBe(true)
    expect(wrapper.find('.theme-toggle').exists()).toBe(true)
    expect(wrapper.find('.charts-button').exists()).toBe(true)

    expect(wrapper.find('.search-button .button-icon').exists()).toBe(true)
    expect(wrapper.find('.theme-toggle .button-icon').exists()).toBe(true)
    expect(wrapper.find('.charts-button .button-icon').exists()).toBe(true)

    expect(wrapper.find('.button-text').exists()).toBe(false)
  })

  it('应该在激活状态时添加 active 类', () => {
    const wrapper = mount(TodoListHeader, {
      props: {
        ...defaultProps,
        showCharts: true
      },
      global: {
        plugins: [i18n]
      }
    })

    expect(wrapper.find('.charts-button').classes()).toContain('active')
  })

  it('应该正确触发事件', async () => {
    const wrapper = mount(TodoListHeader, {
      props: defaultProps,
      global: {
        plugins: [i18n]
      }
    })

    await wrapper.find('.theme-toggle').trigger('click')
    expect(wrapper.emitted('toggleTheme')).toHaveLength(1)

    await wrapper.find('.charts-button').trigger('click')
    expect(wrapper.emitted('toggleCharts')).toHaveLength(1)
  })

  it('应该显示正确的工具提示', () => {
    const wrapper = mount(TodoListHeader, {
      props: defaultProps,
      global: {
        plugins: [i18n]
      }
    })

    const themeButton = wrapper.find('.theme-toggle')
    const chartsButton = wrapper.find('.charts-button')

    expect(themeButton.attributes('title')).toContain('切换到深色模式')
    expect(themeButton.attributes('title')).toContain('Ctrl+T')

    expect(chartsButton.attributes('title')).toContain('打开统计图表')
    expect(chartsButton.attributes('title')).toContain('Ctrl+S')
  })

  it('应该根据不同主题图标显示不同的 SVG', () => {
    const sunWrapper = mount(TodoListHeader, {
      props: { ...defaultProps, themeIcon: 'sun' },
      global: { plugins: [i18n] }
    })
    const sunSvg = sunWrapper.find('.theme-toggle svg')
    expect(sunSvg.exists()).toBe(true)
    expect(sunSvg.attributes('width')).toBe('22')
    expect(sunSvg.attributes('height')).toBe('22')

    const moonWrapper = mount(TodoListHeader, {
      props: { ...defaultProps, themeIcon: 'moon' },
      global: { plugins: [i18n] }
    })
    const moonSvg = moonWrapper.find('.theme-toggle svg')
    expect(moonSvg.exists()).toBe(true)
    expect(moonSvg.attributes('width')).toBe('22')
    expect(moonSvg.attributes('height')).toBe('22')

    const autoWrapper = mount(TodoListHeader, {
      props: { ...defaultProps, themeIcon: 'auto' },
      global: { plugins: [i18n] }
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
        plugins: [i18n]
      }
    })

    const buttons = wrapper.findAll('.icon-button')
    buttons.forEach(button => {
      expect(button.classes()).toContain('icon-button')

      const icon = button.find('.button-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('width')).toBe('22')
      expect(icon.attributes('height')).toBe('22')
    })
  })
})
