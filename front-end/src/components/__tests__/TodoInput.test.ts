import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TodoInput from '../TodoInput.vue'

describe('TodoInput', () => {
  it('emits add event when form is submitted', async () => {
    const wrapper = mount(TodoInput, {
      props: {
        maxLength: 50,
        duplicateError: ''
      }
    })

    const input = wrapper.find('input')
    await input.setValue('New Todo')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('add')).toBeTruthy()
    expect(wrapper.emitted('add')![0]).toEqual(['New Todo'])
  })

  it('does not emit add event when input is empty', async () => {
    const wrapper = mount(TodoInput, {
      props: {
        maxLength: 50,
        duplicateError: ''
      }
    })

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('add')).toBeFalsy()
  })

  it('displays error message when duplicateError prop is set', () => {
    const wrapper = mount(TodoInput, {
      props: {
        maxLength: 50,
        duplicateError: 'This todo already exists'
      }
    })

    expect(wrapper.text()).toContain('This todo already exists')
  })
})
