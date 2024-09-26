import { ref } from 'vue'

interface ConfirmDialogConfig {
  title: string
  message: string
  confirmText: string
  cancelText: string
  action: (() => void) | null
}

export function useConfirmDialog() {
  const showConfirmDialog = ref(false)
  const confirmDialogConfig = ref<ConfirmDialogConfig>({
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    action: null
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
    handleCancel
  }
}
