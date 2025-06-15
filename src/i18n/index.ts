import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import zh from '../locales/zh.json'

type SupportedLocale = 'en' | 'zh'

function detectLanguage(): SupportedLocale {
  const browserLang = navigator.language.toLowerCase()
  return browserLang.startsWith('zh') ? 'zh' : 'en'
}

const storedLanguage = localStorage.getItem('language') as SupportedLocale | null
const defaultLanguage = storedLanguage || detectLanguage()

const i18n = createI18n({
  legacy: false,
  locale: defaultLanguage,
  fallbackLocale: 'en',
  messages: {
    en,
    zh
  }
})

export function setLanguage(lang: SupportedLocale) {
  i18n.global.locale.value = lang
  localStorage.setItem('language', lang)
}

export function setSystemLanguage() {
  const systemLang = detectLanguage()
  setLanguage(systemLang)
}

export default i18n
