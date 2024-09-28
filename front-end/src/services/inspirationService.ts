import { getAIResponse } from './deepseekService'

const INSPIRATION_KEY = 'dailyInspiration'
const INSPIRATION_DATE_KEY = 'dailyInspirationDate'

export async function getDailyInspiration(): Promise<string> {
	const storedDate = localStorage.getItem(INSPIRATION_DATE_KEY)
	const today = new Date().toDateString()

	if (storedDate === today) {
		const storedInspiration = localStorage.getItem(INSPIRATION_KEY)
		if (storedInspiration) {
			return storedInspiration
		}
	}

	return refreshInspiration()
}

export async function refreshInspiration(): Promise<string> {
	try {
		const prompt =
			'Generate a short, meaningful, and inspiring quote about life (in Chinese). The quote should provide guidance and motivation. Keep it concise, preferably under 20 words.'
		const inspiration = await getAIResponse(prompt)
		localStorage.setItem(INSPIRATION_KEY, inspiration)
		localStorage.setItem(INSPIRATION_DATE_KEY, new Date().toDateString())
		return inspiration
	} catch (error) {
		console.error('Error fetching daily inspiration:', error)
		return '每一天都是新的开始，珍惜当下，创造美好的未来。'
	}
}
