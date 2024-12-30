import { ref, watch } from 'vue'

interface Todo {
  id: number
  text: string
  completed: boolean
  completedAt?: string
  tags: string[]
  projectId: number | null
  createdAt: string
  updatedAt: string
}

// 新增 Project 接口
interface Project {
  id: number
  name: string
}

interface HistoryItem {
  date: string
  todos: Todo[]
}

export function useTodos() {
  const todos = ref<Todo[]>([])
  const projects = ref<Project[]>([])
  const currentProjectId = ref<number | null>(null)
  const history = ref<HistoryItem[]>([])

  const loadTodos = () => {
    try {
      const storedTodos = localStorage.getItem('todos')
      const storedHistory = localStorage.getItem('todoHistory')
      const storedProjects = localStorage.getItem('projects')

      // 数据完整性检查
      if (storedTodos) {
        const parsedTodos = JSON.parse(storedTodos)
        if (Array.isArray(parsedTodos)) {
          todos.value = parsedTodos
            .filter(
              (todo) =>
                todo &&
                typeof todo.id === 'number' &&
                typeof todo.text === 'string' &&
                typeof todo.completed === 'boolean'
            )
            .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
        }
      }

      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory)
        if (Array.isArray(parsedHistory)) {
          history.value = parsedHistory.filter(
            (item) => item && typeof item.date === 'string' && Array.isArray(item.todos)
          )
        }
      }

      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects)
        if (Array.isArray(parsedProjects)) {
          projects.value = parsedProjects.filter(
            (project) =>
              project &&
              typeof project.id === 'number' &&
              typeof project.name === 'string'
          )
        }
      }

      // 数据一致性检查
      validateDataConsistency()
    } catch (error) {
      console.error('Error loading todos:', error)
      // 如果加载失败，初始化为空数组
      todos.value = []
      history.value = []
      projects.value = []
    }
  }

  const validateDataConsistency = () => {
    // 检查并清理无效的项目引用
    todos.value = todos.value.map((todo) => {
      if (
        todo.projectId !== null &&
        !projects.value.some((p) => p.id === todo.projectId)
      ) {
        return { ...todo, projectId: null }
      }
      return todo
    })

    // 确保 ID 的唯一性
    const seenIds = new Set<number>()
    todos.value = todos.value.filter((todo) => {
      if (seenIds.has(todo.id)) {
        return false
      }
      seenIds.add(todo.id)
      return true
    })

    // 保存清理后的数据
    saveTodos()
  }

  const saveTodos = () => {
    try {
      localStorage.setItem('todos', JSON.stringify(todos.value))
      saveToHistory()
    } catch (error) {
      console.error('Error saving todos:', error)
      // 可以在这里添加用户通知机制
    }
  }

  const saveHistory = () => {
    localStorage.setItem('todoHistory', JSON.stringify(history.value))
  }

  const saveToHistory = () => {
    const today = new Date().toISOString().split('T')[0]
    const todosClone = JSON.parse(JSON.stringify(todos.value))
    const existingIndex = history.value.findIndex((item) => item.date === today)

    if (existingIndex !== -1) {
      history.value[existingIndex].todos = todosClone
    } else {
      history.value.push({
        date: today,
        todos: todosClone,
      })
    }
    saveHistory() // 确保每次更新历史记录时都保存到 localStorage
  }

  const addTodo = (text: string, tags: string[] = []): boolean => {
    if (!text || text.trim() === '') {
      return false
    }

    const isDuplicate = todos.value.some(
      (todo) =>
        todo &&
        todo.text &&
        todo.text.toLowerCase() === text.toLowerCase() &&
        !todo.completed
    )

    if (isDuplicate) {
      return false
    }

    const now = new Date().toISOString()
    const newTodo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      tags: tags,
      projectId: currentProjectId.value || 0,
      createdAt: now,
      updatedAt: now,
    }

    todos.value.push(newTodo)
    saveTodos()
    return true
  }

  // 新增：批量添加待办事项的函数
  const addMultipleTodos = (newTodos: { text: string; projectId: number | null }[]) => {
    const duplicates: string[] = []
    const now = new Date().toISOString()
    newTodos.forEach(({ text, projectId }) => {
      if (todos.value.some((todo) => todo.text === text)) {
        duplicates.push(text)
      } else {
        todos.value.push({
          id: Date.now() + Math.random(),
          text,
          completed: false,
          tags: [],
          projectId: projectId || null,
          createdAt: now,
          updatedAt: now,
        })
      }
    })
    saveTodos()
    return duplicates
  }

  const toggleTodo = (id: number) => {
    const todo = todos.value.find((todo) => todo && todo.id === id)
    if (todo) {
      todo.completed = !todo.completed
      if (todo.completed) {
        todo.completedAt = new Date().toISOString()
      } else {
        delete todo.completedAt
      }
      saveTodos() // 确保保存更改
    }
  }

  const removeTodo = (id: number) => {
    todos.value = todos.value.filter((todo) => todo && todo.id !== id)
    saveTodos()
  }

  const clearActiveTodos = () => {
    todos.value = todos.value.filter((todo) => todo && todo.completed)
    saveTodos()
  }

  const restoreHistory = (date: string) => {
    const historyItem = history.value.find((item) => item.date === date)
    if (historyItem) {
      todos.value = JSON.parse(JSON.stringify(historyItem.todos))
      saveTodos() // 确保保存恢复后的状态
    }
  }

  const deleteHistoryItem = (date: string) => {
    history.value = history.value.filter((item) => item.date !== date)
  }

  const deleteAllHistory = () => {
    history.value = []
  }

  const updateTodosOrder = (newOrder: number[]) => {
    const newTodos = newOrder.map((index) => todos.value[index])
    todos.value = newTodos
  }

  watch(todos, saveTodos, { deep: true })
  watch(history, saveHistory, { deep: true })

  loadTodos() // 在初始化时加载数据

  // 修改 getCompletedTodosByDate 函数
  const getCompletedTodosByDate = () => {
    const completedByDate: { [key: string]: number } = {}
    todos.value.forEach((todo) => {
      // 添加空值检查
      if (todo && todo.completed && todo.completedAt) {
        const date = new Date(todo.completedAt).toISOString().split('T')[0]
        completedByDate[date] = (completedByDate[date] || 0) + 1
      }
    })
    return completedByDate
  }

  // 添加一个新函数来更新 todo 的标签
  const updateTodoTags = (id: number, tags: string[]) => {
    const todo = todos.value.find((todo) => todo && todo.id === id)
    if (todo) {
      todo.tags = tags
      saveTodos()
    }
  }

  const addProject = (name: string) => {
    const newProject = {
      id: Date.now(),
      name,
    }
    projects.value.push(newProject)
    saveProjects()
  }

  const removeProject = (id: number) => {
    projects.value = projects.value.filter((project) => project.id !== id)
    todos.value = todos.value.filter((todo) => todo.projectId !== id)
    saveProjects()
    saveTodos()
  }

  const setCurrentProject = (id: number | null) => {
    currentProjectId.value = id
  }

  const saveProjects = () => {
    localStorage.setItem('projects', JSON.stringify(projects.value))
  }

  // 返回所有需要的状态和方法
  return {
    todos,
    projects,
    currentProjectId,
    history,
    addTodo,
    addMultipleTodos,
    toggleTodo,
    removeTodo,
    clearActiveTodos,
    restoreHistory,
    deleteHistoryItem,
    deleteAllHistory,
    updateTodosOrder,
    getCompletedTodosByDate,
    updateTodoTags,
    addProject,
    removeProject,
    setCurrentProject,
    saveTodos,
    loadTodos,
  }
}
