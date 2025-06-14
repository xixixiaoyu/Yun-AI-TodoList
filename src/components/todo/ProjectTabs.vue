<template>
  <div class="project-header" :class="{ 'small-screen': isSmallScreen }">
    <div class="project-tabs" @wheel="handleProjectTabsWheel" ref="projectTabsRef">
      <button
        v-for="(project, index) in displayedProjects"
        :key="project.id || index"
        :title="project.name"
        :class="{ active: currentProjectId === project.id }"
        class="project-tab"
        @click="$emit('projectChange', project.id)"
      >
        {{ project.name }}
        <button
          v-if="project.id !== null"
          class="delete-project"
          :title="t('deleteProject')"
          @click.stop.prevent="$emit('deleteProject', project.id)"
          type="button"
        >
          &times;
        </button>
      </button>
    </div>
    <button class="add-project-btn" @click="$emit('showAddProject')">
      <i class="fas fa-plus" /> {{ t('addProject') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Project {
  id: string | null
  name: string
}

interface Props {
  displayedProjects: Project[]
  currentProjectId: string | null
  isSmallScreen: boolean
}

interface Emits {
  (e: 'projectChange', projectId: string | null): void
  (e: 'deleteProject', projectId: string): void
  (e: 'showAddProject'): void
}

defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

// 创建项目标签容器的 ref，用于滚轮滚动功能
const projectTabsRef = ref<HTMLElement | null>(null)

// 处理项目标签的滚轮事件，实现水平滚动
const handleProjectTabsWheel = (event: WheelEvent) => {
  if (projectTabsRef.value) {
    // 阻止默认的垂直滚动
    event.preventDefault()
    // 将垂直滚动转换为水平滚动
    projectTabsRef.value.scrollLeft += event.deltaY
  }
}

defineOptions({
  name: 'ProjectTabs',
})
</script>

<style scoped>
.project-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
}

.project-tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  flex: 1;
  padding: 0.25rem 0;
}

.project-tabs::-webkit-scrollbar {
  display: none;
}

.project-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-size: 0.9rem;
  color: var(--text-color);
  position: relative;
}

.project-tab:hover {
  background-color: var(--hover-bg-color);
  border-color: var(--button-bg-color);
}

.project-tab.active {
  background-color: var(--button-bg-color);
  color: white;
  border-color: var(--button-bg-color);
}

.delete-project {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0;
  margin-left: 0.25rem;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.delete-project:hover {
  opacity: 1;
}

.add-project-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--button-bg-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  white-space: nowrap;
}

.add-project-btn:hover {
  background-color: var(--button-hover-bg-color);
  transform: translateY(-1px);
}

.project-header.small-screen {
  flex-direction: column;
  align-items: stretch;
  gap: 0.75rem;
}

.project-header.small-screen .project-tabs {
  justify-content: center;
}

.project-header.small-screen .add-project-btn {
  align-self: center;
}

@media (max-width: 768px) {
  .project-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .project-tabs {
    justify-content: flex-start;
    padding-bottom: 0.5rem;
  }

  .project-tab {
    font-size: 0.85rem;
    padding: 0.4rem 0.8rem;
  }

  .add-project-btn {
    font-size: 0.85rem;
    padding: 0.4rem 0.8rem;
    align-self: center;
  }
}

@media (max-width: 480px) {
  .project-tab {
    font-size: 0.8rem;
    padding: 0.35rem 0.7rem;
  }

  .add-project-btn {
    font-size: 0.8rem;
    padding: 0.35rem 0.7rem;
  }
}
</style>
