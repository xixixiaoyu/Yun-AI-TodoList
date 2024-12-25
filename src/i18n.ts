import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zh from './locales/zh.json'

// 检测用户的浏览器语言
function detectLanguage(): string {
	const userLanguage = navigator.language || (navigator as any).userLanguage
	const languageCode = userLanguage.split('-')[0]
	return languageCode === 'zh' ? 'zh' : 'en'
}

// 获取存储的语言设置或使用检测到的语言
const storedLanguage = localStorage.getItem('language')
const defaultLanguage = storedLanguage || detectLanguage()

const i18n = createI18n({
	legacy: false,
	locale: defaultLanguage,
	fallbackLocale: 'en',
	messages: {
		en,
		zh,
	},
})

// 导出一个函数来更新语言设置
export function setLanguage(lang: string) {
	i18n.global.locale.value = lang
	localStorage.setItem('language', lang)
}

export default i18n
