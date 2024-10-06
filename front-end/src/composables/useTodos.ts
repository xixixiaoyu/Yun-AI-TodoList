import { ref, watch } from 'vue'

interface Todo {
	id: number
	text: string
	completed: boolean
	completedAt?: string
	tags: string[]
	projectId: number // 新增字段
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
		const storedTodos = localStorage.getItem('todos')
		if (storedTodos) {
			todos.value = JSON.parse(storedTodos)
		}
		const storedHistory = localStorage.getItem('todoHistory')
		if (storedHistory) {
			history.value = JSON.parse(storedHistory)
		}
		const storedProjects = localStorage.getItem('projects')
		if (storedProjects) {
			projects.value = JSON.parse(storedProjects)
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

	const addTodo = (text: string, tags: string[] = []): boolean => {
		if (!text || text.trim() === '') {
			return false
		}

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
			tags: tags,
			projectId: currentProjectId.value || 0,
		}

		todos.value.push(newTodo)
		saveTodos()
		return true
	}

	// 新增：批量添加待办事项的函数
	const addMultipleTodos = (texts: string[], tags: string[] = []): string[] => {
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
				tags: tags, // 添加标签
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
		saveTodos()
	}

	const clearActiveTodos = () => {
		todos.value = todos.value.filter(todo => todo && todo.completed)
		saveTodos()
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

	// 修改 getCompletedTodosByDate 函数
	const getCompletedTodosByDate = () => {
		const completedByDate: { [key: string]: number } = {}
		todos.value.forEach(todo => {
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
		const todo = todos.value.find(todo => todo && todo.id === id)
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
		projects.value = projects.value.filter(project => project.id !== id)
		todos.value = todos.value.filter(todo => todo.projectId !== id)
		saveProjects()
		saveTodos()
	}

	const setCurrentProject = (id: number | null) => {
		currentProjectId.value = id
	}

	const loadProjects = () => {
		const storedProjects = localStorage.getItem('projects')
		if (storedProjects) {
			projects.value = JSON.parse(storedProjects)
		}
	}

	const saveProjects = () => {
		localStorage.setItem('projects', JSON.stringify(projects.value))
	}

	// 返回新增的方法和状态
	return {
		todos,
		history,
		projects,
		currentProjectId,
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
		updateTodoTags,
		addProject,
		removeProject,
		setCurrentProject,
		saveTodos,
	}
}
