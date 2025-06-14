import { ref, watch } from 'vue'

interface Todo {
  id: number
  text: string
  completed: boolean
  completedAt?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  order: number
}

interface HistoryItem {
  date: string
  todos: Todo[]
}

export function useTodos() {
  const todos = ref<Todo[]>([])
  const history = ref<HistoryItem[]>([])

  const loadTodos = () => {
    try {
      const storedTodos = localStorage.getItem('todos')
      const storedHistory = localStorage.getItem('todoHistory')

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
            .map((todo, index) => ({
              ...todo,
              order: todo.order ?? index,
            }))
            .sort((a, b) => a.order - b.order)
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

      // 数据一致性检查
      validateDataConsistency()
    } catch (error) {
      console.error('Error loading todos:', error)
      // 如果加载失败，初始化为空数组
      todos.value = []
      history.value = []
    }
  }

  const validateDataConsistency = () => {
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
      id: Date.now() + Math.random(),
      text: text.trim(),
      completed: false,
      tags: tags,
      createdAt: now,
      updatedAt: now,
      order: todos.value.length,
    }

    todos.value.push(newTodo)
    saveTodos()
    return true
  }

  // 新增：批量添加待办事项的函数
  const addMultipleTodos = (newTodos: { text: string }[]) => {
    const duplicates: string[] = []
    const now = new Date().toISOString()
    newTodos.forEach(({ text }) => {
      if (todos.value.some((todo) => todo.text === text)) {
        duplicates.push(text)
      } else {
        todos.value.push({
          id: Date.now() + Math.random(),
          text,
          completed: false,
          tags: [],
          createdAt: now,
          updatedAt: now,
          order: todos.value.length,
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
    // 创建一个映射来存储每个 todo 的新顺序
    const orderMap = new Map(newOrder.map((id, index) => [id, index]))

    // 更新所有 todo 的顺序
    todos.value = todos.value
      .map((todo) => ({
        ...todo,
        order: orderMap.get(todo.id) ?? todo.order,
        updatedAt: new Date().toISOString(),
      }))
      .sort((a, b) => a.order - b.order)

    // 保存更新后的顺序
    saveTodos()
  }

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

  // 返回所有需要的状态和方法
  return {
    todos,
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
    saveTodos,
    loadTodos,
  }
}
