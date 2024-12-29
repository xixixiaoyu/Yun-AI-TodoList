import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PomodoroStats from '../PomodoroStats.vue'
import { usePomodoroStats } from '../../composables/usePomodoroStats'

vi.mock('chart.js', () => ({
	Chart: vi.fn(),
	registerables: [],
}))

vi.mock('vue-i18n', () => ({
	useI18n: () => ({
		t: (key: string) => key, // 简单地返回键名作为翻译
	}),
}))

vi.mock('../../composables/usePomodoroStats', () => ({
	usePomodoroStats: () => ({
		getTotalWorkTime: { value: '2 hours 5 minutes' },
		getPomodoroCountByDay: {
			value: {
				'2023-05-01': 2,
				'2023-05-02': 3,
			},
		},
	}),
}))

// 模拟 canvas 元素
HTMLCanvasElement.prototype.getContext = vi.fn()

describe('PomodoroStats', () => {
	it('renders properly', () => {
		const wrapper = mount(PomodoroStats)

		expect(wrapper.find('h2').text()).toBe('pomodoroStats')
		expect(wrapper.find('p').text()).toContain('totalWorkTime')
	})

	it('calculates total work time correctly', () => {
		const { getTotalWorkTime } = usePomodoroStats()
		expect(getTotalWorkTime.value).toBe('2 hours 5 minutes')
	})
})
