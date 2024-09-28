import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface ConfirmDialogConfig {
	title: string
	message: string
	confirmText: string
	cancelText: string
	action: (() => void) | null
}

export function useConfirmDialog() {
	const { t } = useI18n()
	const showConfirmDialog = ref(false)
	const confirmDialogConfig = ref<ConfirmDialogConfig>({
		title: '',
		message: '',
		confirmText: t('confirm'),
		cancelText: t('cancel'),
		action: null,
	})

	const handleConfirm = () => {
		if (confirmDialogConfig.value.action) {
			confirmDialogConfig.value.action()
		}
		showConfirmDialog.value = false
	}

	const handleCancel = () => {
		showConfirmDialog.value = false
	}

	return {
		showConfirmDialog,
		confirmDialogConfig,
		handleConfirm,
		handleCancel,
	}
}
