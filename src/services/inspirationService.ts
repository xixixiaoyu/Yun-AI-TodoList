import { getAIResponse } from './deepseekService'

const INSPIRATION_KEY = 'dailyInspiration'
const INSPIRATION_DATE_KEY = 'dailyInspirationDate'

export async function getDailyInspiration(language: string): Promise<string> {
	const storedDate = localStorage.getItem(INSPIRATION_DATE_KEY)
	const today = new Date().toDateString()

	if (storedDate === today) {
		const storedInspiration = localStorage.getItem(INSPIRATION_KEY)
		if (storedInspiration) {
			return storedInspiration
		}
	}

	return refreshInspiration(language)
}

export async function refreshInspiration(language: string): Promise<string> {
	try {
		const prompt = '请生成一句对人生最具指导意义或激励作用的短句'
		const inspiration = await getAIResponse(prompt, language, 1.5)
		localStorage.setItem(INSPIRATION_KEY, inspiration)
		localStorage.setItem(INSPIRATION_DATE_KEY, new Date().toDateString())
		return inspiration
	} catch (error) {
		console.error('Error fetching daily inspiration:', error)
		return '每一天都是新的开始，珍惜当下，创造美好的未来。'
	}
}
