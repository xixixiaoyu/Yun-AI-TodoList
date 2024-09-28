import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import TodoList from '../TodoList.vue'
import { createRouter, createWebHistory } from 'vue-router'

// 模拟 router
const router = createRouter({
	history: createWebHistory(),
	routes: [
		{ path: '/', component: { template: '<div></div>' } },
		{ path: '/ai-assistant', component: { template: '<div></div>' } },
	],
})

describe('TodoList', () => {
	beforeEach(() => {
		localStorage.clear()
		router.push('/')
	})

	it('renders correctly', () => {
		const wrapper = mount(TodoList, {
			global: {
				plugins: [router],
			},
		})
		expect(wrapper.find('h1').text()).toBe('todo')
		expect(wrapper.find('.add-todo').exists()).toBe(true)
		expect(wrapper.find('.todo-grid').exists()).toBe(true)
	})

	it('adds a new todo', async () => {
		const wrapper = mount(TodoList, {
			global: {
				plugins: [router],
			},
		})
		const input = wrapper.find('input')
		await input.setValue('New Todo')
		await wrapper.find('form').trigger('submit')

		expect(wrapper.findAll('.todo-item')).toHaveLength(1)
		expect(wrapper.find('.todo-item').text()).toContain('New Todo')
	})

	it('removes a todo', async () => {
		const wrapper = mount(TodoList, {
			global: {
				plugins: [router],
			},
		})
		await wrapper.find('input').setValue('Test Todo')
		await wrapper.find('form').trigger('submit')

		expect(wrapper.findAll('.todo-item')).toHaveLength(1)

		await wrapper.find('.delete-btn').trigger('click')

		expect(wrapper.findAll('.todo-item')).toHaveLength(0)
	})

	it('filters todos', async () => {
		const wrapper = mount(TodoList, {
			global: {
				plugins: [router],
			},
		})
		await wrapper.find('input').setValue('Active Todo')
		await wrapper.find('form').trigger('submit')
		await wrapper.find('input').setValue('Completed Todo')
		await wrapper.find('form').trigger('submit')

		await wrapper.findAll('.todo-item')[1].find('.checkbox').trigger('click')

		// 检查过滤按钮是否存在
		const filterButtons = wrapper.findAll('.filter-buttons button')
		expect(filterButtons.length).toBeGreaterThan(0)

		await filterButtons[0].trigger('click')
		await wrapper.vm.$nextTick()
		expect(wrapper.findAll('.todo-item')).toHaveLength(1)
		expect(wrapper.find('.todo-item').text()).toContain('Active Todo')

		await filterButtons[1].trigger('click')
		await wrapper.vm.$nextTick()
		expect(wrapper.findAll('.todo-item')).toHaveLength(1)
		expect(wrapper.find('.todo-item').text()).toContain('Completed Todo')
	})

	it('clears completed todos', async () => {
		const wrapper = mount(TodoList, {
			global: {
				plugins: [router],
			},
		})
		await wrapper.find('input').setValue('Active Todo')
		await wrapper.find('form').trigger('submit')
		await wrapper.find('input').setValue('Completed Todo')
		await wrapper.find('form').trigger('submit')

		await wrapper.findAll('.todo-item')[1].find('.checkbox').trigger('click')

		await wrapper.find('.clear-btn').trigger('click')
		await wrapper.vm.$nextTick()

		expect(wrapper.findAll('.todo-item')).toHaveLength(1)
		expect(wrapper.find('.todo-item').text()).toContain('Active Todo')
	})

	it('generates suggested todos', async () => {
		vi.mock('../../services/deepseekService', () => ({
			getAIResponse: vi.fn().mockResolvedValue('Suggested Todo 1,Suggested Todo 2'),
		}))

		const wrapper = mount(TodoList, {
			global: {
				plugins: [router],
			},
		})

		await wrapper.find('.generate-btn').trigger('click')
		await wrapper.vm.$nextTick()

		expect(wrapper.find('.suggested-todos-dialog').exists()).toBe(true)
		expect(wrapper.findAll('.suggested-todo-input')).toHaveLength(2)
	})

	it('sorts todos with AI', async () => {
		vi.mock('../../services/deepseekService', () => ({
			getAIResponse: vi.fn().mockResolvedValue('2,1'),
		}))

		const wrapper = mount(TodoList, {
			global: {
				plugins: [router],
			},
		})

		await wrapper.find('input').setValue('Todo 1')
		await wrapper.find('form').trigger('submit')
		await wrapper.find('input').setValue('Todo 2')
		await wrapper.find('form').trigger('submit')

		await wrapper.find('.sort-btn').trigger('click')
		await wrapper.vm.$nextTick()

		const todoItems = wrapper.findAll('.todo-item')
		expect(todoItems[0].text()).toContain('Todo 2')
		expect(todoItems[1].text()).toContain('Todo 1')
	})

	it('opens history sidebar', async () => {
		const wrapper = mount(TodoList, {
			global: {
				plugins: [router],
			},
		})

		await wrapper.find('.icon-button').trigger('click')
		expect(wrapper.find('.history-sidebar').exists()).toBe(true)
	})

	it('navigates to AI assistant', async () => {
		const wrapper = mount(TodoList, {
			global: {
				plugins: [router],
				stubs: {
					RouterLink: {
						template: '<a><slot></slot></a>',
						props: ['to'],
					},
				},
			},
		})
	})
})
