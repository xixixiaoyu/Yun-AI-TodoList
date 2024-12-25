import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export function useErrorHandler() {
	const { t } = useI18n()
	const error = ref('')

	const showError = (message: string, duration = 3000) => {
		error.value = t(message)
		setTimeout(() => {
			error.value = ''
		}, duration)
	}

	return {
		error,
		showError,
	}
}
