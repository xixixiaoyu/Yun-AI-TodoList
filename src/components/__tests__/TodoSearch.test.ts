import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import TodoSearch from '../TodoSearch.vue'

const i18n = createI18n({
  legacy: false,
  locale: 'zh',
  messages: {
    zh: {
      searchTodos: '搜索待办事项...',
      clearSearch: '清除搜索',
    },
    en: {
      searchTodos: 'Search todos...',
      clearSearch: 'Clear search',
    },
  },
})

describe('TodoSearch', () => {
  it('renders search input with correct placeholder when expanded', () => {
    const wrapper = mount(TodoSearch, {
      props: {
        modelValue: '',
        isExpanded: true,
      },
      global: {
        plugins: [i18n],
      },
    })

    const input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('搜索待办事项')
  })

  it('emits update:modelValue when input changes', async () => {
    const wrapper = mount(TodoSearch, {
      props: {
        modelValue: '',
        isExpanded: true,
      },
      global: {
        plugins: [i18n],
      },
    })

    const input = wrapper.find('input[type="text"]')
    await input.setValue('test search')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['test search'])
  })

  it('shows clear button when there is search text', async () => {
    const wrapper = mount(TodoSearch, {
      props: {
        modelValue: 'test',
        isExpanded: true,
      },
      global: {
        plugins: [i18n],
      },
    })

    await wrapper.vm.$nextTick()
    const clearButton = wrapper.find('button')
    expect(clearButton.exists()).toBe(true)
  })

  it('hides clear button when search is empty', () => {
    const wrapper = mount(TodoSearch, {
      props: {
        modelValue: '',
        isExpanded: true,
      },
      global: {
        plugins: [i18n],
      },
    })

    const clearButton = wrapper.find('button')
    expect(clearButton.exists()).toBe(false)
  })

  it('clears search when clear button is clicked', async () => {
    const wrapper = mount(TodoSearch, {
      props: {
        modelValue: 'test',
        isExpanded: true,
      },
      global: {
        plugins: [i18n],
      },
    })

    await wrapper.vm.$nextTick()
    const clearButton = wrapper.find('button')
    await clearButton.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
  })

  it('emits collapse when escape key is pressed with empty search', async () => {
    const wrapper = mount(TodoSearch, {
      props: {
        modelValue: '',
        isExpanded: true,
      },
      global: {
        plugins: [i18n],
      },
    })

    const input = wrapper.find('input[type="text"]')
    await input.trigger('keydown.escape')

    expect(wrapper.emitted('collapse')).toBeTruthy()
  })

  it('clears search when escape key is pressed with search text', async () => {
    const wrapper = mount(TodoSearch, {
      props: {
        modelValue: 'test',
        isExpanded: true,
      },
      global: {
        plugins: [i18n],
      },
    })

    const input = wrapper.find('input[type="text"]')
    await input.trigger('keydown.escape')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
  })

  it('exposes focus and clear methods', () => {
    const wrapper = mount(TodoSearch, {
      props: {
        modelValue: '',
        isExpanded: true,
      },
      global: {
        plugins: [i18n],
      },
    })

    expect(wrapper.vm.focus).toBeDefined()
    expect(wrapper.vm.clear).toBeDefined()
  })

  it('does not render when collapsed', () => {
    const wrapper = mount(TodoSearch, {
      props: {
        modelValue: '',
        isExpanded: false,
      },
      global: {
        plugins: [i18n],
      },
    })

    const input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(false)
  })
})
