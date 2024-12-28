import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zh from './locales/zh.json'

// 定义支持的语言类型
type SupportedLocale = 'en' | 'zh'

// 检测系统语言
function detectLanguage(): SupportedLocale {
	// 优先使用系统语言
	const osLocale =
		process.env.LANG || navigator.language || (navigator as any).userLanguage
	const languageCode = osLocale.split(/[-_]/)[0].toLowerCase()
	return languageCode === 'zh' ? 'zh' : 'en'
}

// 获取存储的语言设置或使用检测到的语言
const storedLanguage = localStorage.getItem('language') as SupportedLocale | null
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
export function setLanguage(lang: SupportedLocale) {
	i18n.global.locale.value = lang
	localStorage.setItem('language', lang)
}

// 导出一个函数来自动设置系统语言
export function setSystemLanguage() {
	const systemLang = detectLanguage()
	setLanguage(systemLang)
}

export default i18n
