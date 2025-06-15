import { ref, nextTick } from 'vue'

export function useLayout() {
  const isMultiColumn = ref(false)

  const checkLayout = async () => {
    await nextTick()
    const todoList = document.querySelector('.todo-list') as HTMLElement
    const todoGrid = document.querySelector('.todo-grid') as HTMLElement
    if (todoList && todoGrid) {
      const listHeight = todoList.offsetHeight
      const windowHeight = window.innerHeight
      isMultiColumn.value = listHeight > windowHeight * 0.9
    }
  }

  return {
    isMultiColumn,
    checkLayout
  }
}
