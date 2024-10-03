import { ref, watch } from 'vue'

interface Todo {
	id: number
	text: string
	completed: boolean
	completedAt?: string
}

interface HistoryItem {
	date: string
	todos: Todo[]
}

export function useTodos() {
	const todos = ref<Todo[]>([])
	const history = ref<HistoryItem[]>([])

	const loadTodos = () => {
		const storedTodos = localStorage.getItem('todos')
		if (storedTodos) {
			todos.value = JSON.parse(storedTodos)
		}
		const storedHistory = localStorage.getItem('todoHistory')
		if (storedHistory) {
			history.value = JSON.parse(storedHistory)
		}
	}

	const saveTodos = () => {
		localStorage.setItem('todos', JSON.stringify(todos.value))
		saveToHistory()
	}

	const saveHistory = () => {
		localStorage.setItem('todoHistory', JSON.stringify(history.value))
	}

	const saveToHistory = () => {
		const today = new Date().toISOString().split('T')[0]
		const todosClone = JSON.parse(JSON.stringify(todos.value))
		const existingIndex = history.value.findIndex(item => item.date === today)

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

	const addTodo = (text: string): boolean => {
		// 检查文本是否为空或只包含空白字符
		if (!text || text.trim() === '') {
			return false
		}

		// 检查是否存在重复的待办事项
		const isDuplicate = todos.value.some(
			todo =>
				todo &&
				todo.text &&
				todo.text.toLowerCase() === text.toLowerCase() &&
				!todo.completed
		)

		if (isDuplicate) {
			return false
		}

		const newTodo = {
			id: Date.now(),
			text: text.trim(),
			completed: false,
		}

		todos.value.push(newTodo)
		saveTodos()
		return true
	}

	// 新增：批量添加待办事项的函数
	const addMultipleTodos = (texts: string[]): string[] => {
		let maxId = Math.max(0, ...todos.value.map(todo => todo.id))
		const duplicates: string[] = []
		const newTodos = texts
			.filter(text => {
				if (todos.value.some(todo => todo.text === text)) {
					duplicates.push(text)
					return false
				}
				return true
			})
			.map(text => ({
				id: ++maxId,
				text,
				completed: false,
			}))
		todos.value.push(...newTodos)
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
			saveTodos() // 确保保存更改
		}
	}

	const removeTodo = (id: number) => {
		todos.value = todos.value.filter(todo => todo && todo.id !== id)
	}

	const clearActiveTodos = () => {
		todos.value = todos.value.filter(todo => todo && todo.completed)
	}

	const restoreHistory = (date: string) => {
		const historyItem = history.value.find(item => item.date === date)
		if (historyItem) {
			todos.value = JSON.parse(JSON.stringify(historyItem.todos))
			saveTodos() // 确保保存恢复后的状态
		}
	}

	const deleteHistoryItem = (date: string) => {
		history.value = history.value.filter(item => item.date !== date)
	}

	const deleteAllHistory = () => {
		history.value = []
	}

	const updateTodosOrder = (newOrder: number[]) => {
		const newTodos = newOrder.map(index => todos.value[index])
		todos.value = newTodos
	}

	watch(todos, saveTodos, { deep: true })
	watch(history, saveHistory, { deep: true })

	loadTodos() // 在初始化时加载数据

	const getCompletedTodosByDate = () => {
		const completedByDate: { [key: string]: number } = {}
		todos.value.forEach(todo => {
			if (todo.completed && todo.completedAt) {
				const date = new Date(todo.completedAt).toISOString().split('T')[0]
				completedByDate[date] = (completedByDate[date] || 0) + 1
			}
		})
		return completedByDate
	}

	return {
		todos,
		history,
		addTodo,
		addMultipleTodos, // 记得在返回对象中添加这个新函数
		toggleTodo,
		removeTodo,
		clearActiveTodos,
		restoreHistory,
		deleteHistoryItem,
		deleteAllHistory,
		updateTodosOrder,
		getCompletedTodosByDate,
	}
}
