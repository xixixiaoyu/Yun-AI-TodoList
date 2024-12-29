import { ref, computed } from 'vue'
import { useTodos } from './useTodos'
import { useI18n } from 'vue-i18n'
import { useConfirmDialog } from './useConfirmDialog'

export function useProjectManagement() {
  const { t } = useI18n()
  const { projects, currentProjectId, addProject, removeProject, setCurrentProject } =
    useTodos()
  const { showConfirmDialog, confirmDialogConfig } = useConfirmDialog()

  const showAddProjectModal = ref(false)

  // 计算属性：获取最多3个项目
  const displayedProjects = computed(() => {
    return [{ id: null, name: t('allProjects') }, ...projects.value]
  })

  // 添加新项目
  const addNewProject = (name: string) => {
    addProject(name)
    showAddProjectModal.value = false
  }

  // 删除项目
  const deleteProject = (projectId: number) => {
    const project = projects.value.find((p) => p.id === projectId)
    if (!project) return

    showConfirmDialog.value = true
    confirmDialogConfig.value = {
      title: t('deleteProject'),
      message: t('confirmDeleteProject', { name: project.name }),
      confirmText: t('confirm'),
      cancelText: t('cancel'),
      action: () => {
        removeProject(projectId)
        if (currentProjectId.value === projectId) {
          setCurrentProject(null)
        }
      },
    }
  }

  // 处理项目切换
  const handleProjectChange = (projectId: number | null) => {
    setCurrentProject(projectId)
  }

  return {
    showAddProjectModal,
    displayedProjects,
    addNewProject,
    deleteProject,
    handleProjectChange,
    currentProjectId,
  }
}
