import { ref } from 'vue'

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

export function useTodos() {
  const todos = ref<Todo[]>([])

  const loadTodos = () => {
    try {
      const storedTodos = localStorage.getItem('todos')

      if (storedTodos) {
        const parsedTodos = JSON.parse(storedTodos)
        if (Array.isArray(parsedTodos)) {
          todos.value = parsedTodos
            .filter(
              todo =>
                todo &&
                typeof todo.id === 'number' &&
                typeof todo.text === 'string' &&
                typeof todo.completed === 'boolean'
            )
            .map((todo, index) => ({
              ...todo,
              order: todo.order ?? index
            }))
            .sort((a, b) => a.order - b.order)
        }
      }

      validateDataConsistency()
    } catch (error) {
      console.error('Error loading todos:', error)

      todos.value = []
    }
  }

  const validateDataConsistency = () => {
    const seenIds = new Set<number>()
    todos.value = todos.value.filter(todo => {
      if (seenIds.has(todo.id)) {
        return false
      }
      seenIds.add(todo.id)
      return true
    })

    saveTodos()
  }

  const saveTodos = () => {
    try {
      localStorage.setItem('todos', JSON.stringify(todos.value))
    } catch (error) {
      console.error('Error saving todos:', error)
    }
  }

  const addTodo = (text: string, tags: string[] = []): boolean => {
    if (!text || text.trim() === '') {
      return false
    }

    const isDuplicate = todos.value.some(
      todo => todo && todo.text && todo.text.toLowerCase() === text.toLowerCase() && !todo.completed
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
      order: todos.value.length
    }

    todos.value.push(newTodo)
    saveTodos()
    return true
  }

  const addMultipleTodos = (newTodos: { text: string }[]) => {
    const duplicates: string[] = []
    const now = new Date().toISOString()
    newTodos.forEach(({ text }) => {
      if (todos.value.some(todo => todo.text === text)) {
        duplicates.push(text)
      } else {
        todos.value.push({
          id: Date.now() + Math.random(),
          text,
          completed: false,
          tags: [],
          createdAt: now,
          updatedAt: now,
          order: todos.value.length
        })
      }
    })
    saveTodos()
    return duplicates
  }

  const toggleTodo = (id: number) => {
    const todo = todos.value.find(todo => todo && todo.id === id)
    if (todo) {
      todo.completed = !todo.completed
      if (todo.completed) {
        todo.completedAt = new Date().toISOString()
      } else {
        delete todo.completedAt
      }
      saveTodos()
    }
  }

  const removeTodo = (id: number) => {
    todos.value = todos.value.filter(todo => todo && todo.id !== id)
    saveTodos()
  }

  const updateTodosOrder = (newOrder: number[]) => {
    const orderMap = new Map(newOrder.map((id, index) => [id, index]))

    todos.value = todos.value
      .map(todo => ({
        ...todo,
        order: orderMap.get(todo.id) ?? todo.order,
        updatedAt: new Date().toISOString()
      }))
      .sort((a, b) => a.order - b.order)

    saveTodos()
  }

  loadTodos()

  const getCompletedTodosByDate = () => {
    const completedByDate: { [key: string]: number } = {}
    todos.value.forEach(todo => {
      if (todo && todo.completed && todo.completedAt) {
        const date = new Date(todo.completedAt).toISOString().split('T')[0]
        completedByDate[date] = (completedByDate[date] || 0) + 1
      }
    })
    return completedByDate
  }

  const updateTodoTags = (id: number, tags: string[]) => {
    const todo = todos.value.find(todo => todo && todo.id === id)
    if (todo) {
      todo.tags = tags
      saveTodos()
    }
  }

  return {
    todos,
    addTodo,
    addMultipleTodos,
    toggleTodo,
    removeTodo,
    updateTodosOrder,
    getCompletedTodosByDate,
    updateTodoTags,
    saveTodos,
    loadTodos
  }
}
