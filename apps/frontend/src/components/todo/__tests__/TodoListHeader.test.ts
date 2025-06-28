import { createTestI18n } from '@/test/helpers'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TodoListHeader from '../TodoListHeader.vue'

const i18n = createTestI18n()

// 创建全局配置对象
const globalConfig = {
  plugins: [i18n],
  config: {
    globalProperties: {
      $t: (key: string) => i18n.global.t(key),
    },
  },
}

describe('TodoListHeader', () => {
  const defaultProps = {
    showCharts: false,
    showSearch: false,
  }

  it('应该正确渲染所有按钮', () => {
    const wrapper = mount(TodoListHeader, {
      props: defaultProps,
      global: globalConfig,
    })

    const buttons = wrapper.findAll('.icon-button')
    expect(buttons).toHaveLength(3)

    expect(wrapper.find('.ai-assistant-button').exists()).toBe(true)
    expect(wrapper.find('.search-button').exists()).toBe(true)
    expect(wrapper.find('.charts-button').exists()).toBe(true)

    expect(wrapper.find('.ai-assistant-button .button-icon').exists()).toBe(true)
    expect(wrapper.find('.search-button .button-icon').exists()).toBe(true)
    expect(wrapper.find('.charts-button .button-icon').exists()).toBe(true)

    expect(wrapper.find('.button-text').exists()).toBe(false)
  })

  it('应该在激活状态时添加 active 类', () => {
    const wrapper = mount(TodoListHeader, {
      props: {
        ...defaultProps,
        showCharts: true,
      },
      global: globalConfig,
    })

    expect(wrapper.find('.charts-button').classes()).toContain('active')
  })

  it('应该正确触发事件', async () => {
    const wrapper = mount(TodoListHeader, {
      props: defaultProps,
      global: globalConfig,
    })

    await wrapper.find('.charts-button').trigger('click')
    expect(wrapper.emitted('toggleCharts')).toHaveLength(1)

    await wrapper.find('.search-button').trigger('click')
    expect(wrapper.emitted('toggleSearch')).toHaveLength(1)
  })

  it('应该显示正确的工具提示', () => {
    const wrapper = mount(TodoListHeader, {
      props: defaultProps,
      global: globalConfig,
    })

    const chartsButton = wrapper.find('.charts-button')

    expect(chartsButton.attributes('title')).toContain('打开统计图表')
    expect(chartsButton.attributes('title')).toContain('Ctrl+S')
  })

  it('应该为按钮显示正确的图标', () => {
    const wrapper = mount(TodoListHeader, {
      props: defaultProps,
      global: globalConfig,
    })

    const aiButton = wrapper.find('.ai-assistant-button svg')
    expect(aiButton.exists()).toBe(true)
    expect(aiButton.attributes('width')).toBe('22')
    expect(aiButton.attributes('height')).toBe('22')

    const searchButton = wrapper.find('.search-button svg')
    expect(searchButton.exists()).toBe(true)
    expect(searchButton.attributes('width')).toBe('22')
    expect(searchButton.attributes('height')).toBe('22')

    const chartsButton = wrapper.find('.charts-button svg')
    expect(chartsButton.exists()).toBe(true)
    expect(chartsButton.attributes('width')).toBe('22')
    expect(chartsButton.attributes('height')).toBe('22')
  })

  it('应该为按钮设置正确的尺寸和样式', () => {
    const wrapper = mount(TodoListHeader, {
      props: defaultProps,
      global: globalConfig,
    })

    const buttons = wrapper.findAll('.icon-button')
    buttons.forEach((button) => {
      expect(button.classes()).toContain('icon-button')

      const icon = button.find('.button-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('width')).toBe('22')
      expect(icon.attributes('height')).toBe('22')
    })
  })
})
