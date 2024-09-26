import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TodoItem from '../TodoItem.vue'

describe('TodoItem', () => {
  it('renders todo text', () => {
    const wrapper = mount(TodoItem, {
      props: {
        todo: { id: 1, text: 'Test Todo', completed: false }
      }
    })

    expect(wrapper.text()).toContain('Test Todo')
  })

  it('emits toggle event when checkbox is clicked', async () => {
    const wrapper = mount(TodoItem, {
      props: {
        todo: { id: 1, text: 'Test Todo', completed: false }
      }
    })

    await wrapper.find('.checkbox').trigger('click')

    expect(wrapper.emitted('toggle')).toBeTruthy()
    expect(wrapper.emitted('toggle')![0]).toEqual([1])
  })

  it('emits remove event when delete button is clicked', async () => {
    const wrapper = mount(TodoItem, {
      props: {
        todo: { id: 1, text: 'Test Todo', completed: false }
      }
    })

    await wrapper.find('.delete-btn').trigger('click')

    expect(wrapper.emitted('remove')).toBeTruthy()
    expect(wrapper.emitted('remove')![0]).toEqual([1])
  })
})
