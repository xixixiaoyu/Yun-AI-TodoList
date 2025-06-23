/**
 * Todo 助手调试工具
 * 在浏览器控制台中使用，帮助调试 Todo 助手功能
 */

/**
 * 调试 Todo 助手状态
 */
export function debugTodoAssistant() {
  // 获取 localStorage 中的数据
  const systemPrompts = JSON.parse(localStorage.getItem('system_prompts') || '[]')
  const systemPromptConfig = JSON.parse(localStorage.getItem('system_prompt_config') || '{}')
  const todoAssistantData = JSON.parse(localStorage.getItem('todo_assistant_prompt') || '{}')

  console.group('🤖 Todo 助手调试信息')

  console.log('📋 用户系统提示词列表:', systemPrompts)
  console.log('⚙️ 系统提示词配置:', systemPromptConfig)
  console.log('🎯 Todo 助手独立数据:', todoAssistantData)

  // 检查用户系统提示词中是否还有 Todo 助手（应该没有）
  const todoPromptInUserList = systemPrompts.find((p: any) => p.name === 'Todo 任务助手')
  if (todoPromptInUserList) {
    console.warn('⚠️ 发现 Todo 助手在用户系统提示词列表中（这不应该发生）:', todoPromptInUserList)
  } else {
    console.log('✅ Todo 助手未出现在用户系统提示词列表中（正确）')
  }

  // 分析 Todo 助手状态
  if (todoAssistantData.prompt) {
    console.log('✅ Todo 助手状态分析:')
    console.log('  - Todo 助手存在:', !!todoAssistantData.prompt)
    console.log('  - Todo 助手 ID:', todoAssistantData.prompt.id)
    console.log('  - Todo 助手激活状态:', todoAssistantData.isActive)
    console.log('  - Todo 助手内容长度:', todoAssistantData.prompt.content?.length || 0)
    console.log('  - 应该显示为激活状态:', todoAssistantData.isActive)
  } else {
    console.log('❌ 未找到 Todo 助手数据')
  }

  console.groupEnd()
}

/**
 * 重置 Todo 助手状态
 */
export function resetTodoAssistant() {
  console.log('🔄 重置 Todo 助手状态...')

  // 删除 Todo 助手独立数据
  localStorage.removeItem('todo_assistant_prompt')

  // 清理用户系统提示词列表中的 Todo 助手（如果有）
  const systemPrompts = JSON.parse(localStorage.getItem('system_prompts') || '[]')
  const filteredPrompts = systemPrompts.filter((p: any) => p.name !== 'Todo 任务助手')
  localStorage.setItem('system_prompts', JSON.stringify(filteredPrompts))

  console.log('✅ Todo 助手状态已重置，请刷新页面')
}

/**
 * 手动激活 Todo 助手
 */
export function manualActivateTodoAssistant() {
  console.log('🚀 手动激活 Todo 助手...')

  const todoAssistantData = JSON.parse(localStorage.getItem('todo_assistant_prompt') || '{}')

  if (!todoAssistantData.prompt) {
    console.error('❌ 未找到 Todo 助手数据，请先点击按钮创建')
    return
  }

  // 激活 Todo 助手
  todoAssistantData.isActive = true
  localStorage.setItem('todo_assistant_prompt', JSON.stringify(todoAssistantData))

  console.log('✅ Todo 助手已手动激活，请刷新页面')
}

/**
 * 检查 todos 数据
 */
export function debugTodosData() {
  const todos = JSON.parse(localStorage.getItem('todos') || '[]')
  const todoHistory = JSON.parse(localStorage.getItem('todoHistory') || '[]')

  console.group('📝 Todos 数据调试')
  console.log('总任务数:', todos.length)
  console.log('待完成任务:', todos.filter((t: any) => !t.completed).length)
  console.log('已完成任务:', todos.filter((t: any) => t.completed).length)
  console.log('高优先级任务:', todos.filter((t: any) => !t.completed && t.priority >= 4).length)

  // 检查数据结构
  if (todos.length > 0) {
    console.log('\n📊 数据结构分析:')
    console.log('第一个 todo 的字段:', Object.keys(todos[0]))
    console.log('第一个 todo 的完整数据:', todos[0])
    console.log('text 字段值:', todos[0].text)
    console.log('title 字段值:', todos[0].title)
  }

  // 检查 todoHistory
  console.log('\n📚 TodoHistory 数据:')
  console.log('todoHistory 条目数:', todoHistory.length)
  if (todoHistory.length > 0) {
    console.log('第一个 todoHistory 的字段:', Object.keys(todoHistory[0]))
    console.log('第一个 todoHistory 的完整数据:', todoHistory[0])
    if (todoHistory[0].todos && todoHistory[0].todos.length > 0) {
      console.log('todoHistory 中第一个 todo 的字段:', Object.keys(todoHistory[0].todos[0]))
      console.log('todoHistory 中第一个 todo 的数据:', todoHistory[0].todos[0])
    }
  }

  console.log('\n📋 详细数据:')
  console.log('todos:', todos)
  console.log('todoHistory:', todoHistory)
  console.groupEnd()
}

/**
 * 强制创建 Todo 助手提示词
 */
export function forceCreateTodoAssistant() {
  console.log('🚀 强制创建 Todo 助手提示词...')

  const todos = JSON.parse(localStorage.getItem('todos') || '[]')

  // 生成简单的系统提示词内容
  const promptContent = `你是一个专业的个人任务管理助手。用户有以下待办事项信息：

## 用户任务概览
- 待完成任务：${todos.filter((t: any) => !t.completed).length} 个
- 已完成任务：${todos.filter((t: any) => t.completed).length} 个

## 待完成任务详情
${todos
  .filter((t: any) => !t.completed)
  .map(
    (todo: any, index: number) =>
      `${index + 1}. ${todo.text} (优先级: ${todo.priority || '未设置'})`
  )
  .join('\n')}

请基于这些信息回答用户的问题，提供个性化的任务管理建议和分析。`

  // 创建新的 Todo 助手数据
  const newPrompt = {
    id: `todo_assistant_${Date.now()}`,
    name: 'Todo 任务助手',
    content: promptContent,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['todo', '任务管理', '内置'],
  }

  // 保存到独立的存储位置
  const todoAssistantData = {
    prompt: newPrompt,
    isActive: true,
  }
  localStorage.setItem('todo_assistant_prompt', JSON.stringify(todoAssistantData))

  // 清理用户系统提示词列表中的 Todo 助手（如果有）
  const systemPrompts = JSON.parse(localStorage.getItem('system_prompts') || '[]')
  const filteredPrompts = systemPrompts.filter((p: any) => p.name !== 'Todo 任务助手')
  localStorage.setItem('system_prompts', JSON.stringify(filteredPrompts))

  console.log('✅ Todo 助手已强制创建并激活:', newPrompt.id)
  console.log('🔄 请刷新页面以查看效果')
}

/**
 * 测试 Todo 助手状态切换
 */
export function testTodoAssistantToggle() {
  console.log('🧪 测试 Todo 助手状态切换...')

  const todoAssistantData = JSON.parse(localStorage.getItem('todo_assistant_prompt') || '{}')

  if (!todoAssistantData.prompt) {
    console.log('❌ 未找到 Todo 助手，先创建一个')
    forceCreateTodoAssistant()
    return
  }

  // 切换状态
  todoAssistantData.isActive = !todoAssistantData.isActive
  localStorage.setItem('todo_assistant_prompt', JSON.stringify(todoAssistantData))

  console.log(`✅ Todo 助手状态已切换为: ${todoAssistantData.isActive ? '激活' : '停用'}`)
  console.log('🔄 请刷新页面查看按钮状态变化')
}

/**
 * 测试多条系统提示词消息
 */
export function testSystemPromptMessages() {
  console.log('🔍 测试多条系统提示词消息架构...')

  // 获取用户自定义系统提示词
  const systemPrompts = JSON.parse(localStorage.getItem('system_prompts') || '[]')
  const systemPromptConfig = JSON.parse(localStorage.getItem('system_prompt_config') || '{}')

  // 获取 Todo 助手数据
  const todoAssistantData = JSON.parse(localStorage.getItem('todo_assistant_prompt') || '{}')

  console.group('📋 多条系统消息分析')

  const systemMessages = []

  // 1. 检查用户自定义提示词
  if (systemPromptConfig.enabled && systemPromptConfig.activePromptId) {
    const activePrompt = systemPrompts.find(
      (p: any) => p.id === systemPromptConfig.activePromptId && p.isActive
    )
    if (activePrompt) {
      systemMessages.push({
        role: 'system',
        content: activePrompt.content,
        source: '用户自定义',
        name: activePrompt.name,
      })
      console.log('✅ 系统消息 1 - 用户自定义提示词:', activePrompt.name)
      console.log('   内容长度:', activePrompt.content.length)
    }
  } else {
    console.log('❌ 无激活的用户自定义提示词')
  }

  // 2. 检查 Todo 助手提示词
  if (todoAssistantData.isActive && todoAssistantData.prompt) {
    systemMessages.push({
      role: 'system',
      content: todoAssistantData.prompt.content,
      source: 'Todo助手',
      name: 'Todo 任务助手',
    })
    console.log('✅ 系统消息 2 - Todo 助手提示词')
    console.log('   内容长度:', todoAssistantData.prompt.content.length)
  } else {
    console.log('❌ Todo 助手未激活或无内容')
  }

  console.log('🎯 系统消息架构总结:')
  console.log('总系统消息数量:', systemMessages.length)

  systemMessages.forEach((msg, index) => {
    console.log(`消息 ${index + 1}:`, {
      role: msg.role,
      source: msg.source,
      name: msg.name,
      contentLength: msg.content.length,
      preview: msg.content.substring(0, 100) + '...',
    })
  })

  // 检查是否包含详细任务信息
  const todoMessage = systemMessages.find((msg) => msg.source === 'Todo助手')
  if (todoMessage) {
    console.log('📊 Todo 助手消息内容分析:')
    console.log('   包含任务概览:', todoMessage.content.includes('用户任务数据概览'))
    console.log('   包含待完成详情:', todoMessage.content.includes('待完成任务详情'))
    console.log('   包含已完成详情:', todoMessage.content.includes('最近完成的任务'))
    console.log('   包含优先级分布:', todoMessage.content.includes('优先级分布'))
  }

  console.groupEnd()

  return systemMessages
}

/**
 * 测试 Todo 助手详细信息生成
 */
export function testTodoDetailGeneration() {
  console.log('🔍 测试 Todo 助手详细信息生成...')

  const todos = JSON.parse(localStorage.getItem('todos') || '[]')

  console.group('📊 Todo 数据分析')
  console.log('总任务数:', todos.length)
  console.log('待完成:', todos.filter((t: any) => !t.completed).length)
  console.log('已完成:', todos.filter((t: any) => t.completed).length)
  console.log('高优先级:', todos.filter((t: any) => !t.completed && t.priority >= 4).length)
  console.log('有AI分析:', todos.filter((t: any) => t.aiAnalyzed).length)
  console.log('有时间估算:', todos.filter((t: any) => t.estimatedTime).length)

  // 模拟生成系统提示词
  try {
    // 动态导入生成函数
    import('../services/aiAnalysisService')
      .then(({ generateTodoSystemPrompt }) => {
        const prompt = generateTodoSystemPrompt(todos)

        console.log('✅ 系统提示词生成成功')
        console.log('内容长度:', prompt.length)
        console.log('包含概览:', prompt.includes('用户任务数据概览'))
        console.log('包含待完成详情:', prompt.includes('待完成任务详情'))
        console.log('包含已完成详情:', prompt.includes('最近完成的任务'))
        console.log('包含优先级分布:', prompt.includes('优先级分布'))
        console.log('包含标签统计:', prompt.includes('标签使用情况'))

        console.log('\n📋 生成的提示词预览:')
        console.log(prompt.substring(0, 500) + '...')
      })
      .catch((error) => {
        console.error('❌ 生成系统提示词失败:', error)
      })
  } catch (error) {
    console.error('❌ 导入生成函数失败:', error)
  }

  console.groupEnd()
}

/**
 * 模拟测试完整的消息发送流程
 */
export function testCompleteMessageFlow() {
  console.log('🚀 测试完整的消息发送流程...')

  console.group('📨 消息流程测试')

  // 1. 测试系统消息构建
  const systemMessages = testSystemPromptMessages()

  // 2. 模拟用户消息
  const userMessage = {
    role: 'user',
    content: '根据我的任务情况，给我一些建议',
  }

  // 3. 构建完整的消息列表（模拟 deepseekService 的逻辑）
  const completeMessages = [...systemMessages, userMessage]

  console.log('📋 完整消息列表:')
  console.log('总消息数:', completeMessages.length)
  console.log('系统消息数:', systemMessages.length)
  console.log('用户消息数:', 1)

  completeMessages.forEach((msg, index) => {
    console.log(`消息 ${index + 1}:`, {
      role: msg.role,
      source: (msg as any).source || '用户',
      contentLength: msg.content.length,
      preview: msg.content.substring(0, 80) + '...',
    })
  })

  // 4. 验证消息顺序
  console.log('✅ 消息顺序验证:')
  const systemCount = completeMessages.filter((msg) => msg.role === 'system').length
  const userCount = completeMessages.filter((msg) => msg.role === 'user').length

  console.log(`   系统消息在前: ${systemCount} 条`)
  console.log(`   用户消息在后: ${userCount} 条`)

  // 5. 检查是否有 Todo 信息
  const hasTodoInfo = completeMessages.some(
    (msg) => msg.content.includes('用户任务数据概览') || msg.content.includes('待完成任务详情')
  )

  console.log(`   包含 Todo 信息: ${hasTodoInfo ? '✅ 是' : '❌ 否'}`)

  console.groupEnd()

  return completeMessages
}

/**
 * 测试具体任务信息的详细程度
 */
export function testTaskDetailLevel() {
  console.log('🔍 测试任务信息详细程度...')

  const todos = JSON.parse(localStorage.getItem('todos') || '[]')

  console.group('📊 任务信息详细程度分析')

  // 分析待完成任务
  const activeTodos = todos.filter((t: any) => !t.completed)
  const completedTodos = todos.filter((t: any) => t.completed)

  console.log('📋 待完成任务详细信息:')
  activeTodos.slice(0, 3).forEach((todo: any, index: number) => {
    console.log(`任务 ${index + 1}:`, {
      id: todo.id,
      text: todo.text,
      priority: todo.priority || '未设置',
      estimatedTime: todo.estimatedTime || '未估算',
      tags: todo.tags || [],
      aiAnalyzed: todo.aiAnalyzed || false,
      createdAt: todo.createdAt,
      daysSinceCreated: Math.floor(
        (Date.now() - new Date(todo.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      ),
    })
  })

  console.log('✅ 已完成任务详细信息:')
  completedTodos.slice(0, 3).forEach((todo: any, index: number) => {
    const createdTime = new Date(todo.createdAt).getTime()
    const completedTime = new Date(todo.completedAt || todo.updatedAt).getTime()
    const daysToComplete = Math.floor((completedTime - createdTime) / (1000 * 60 * 60 * 24))

    console.log(`任务 ${index + 1}:`, {
      id: todo.id,
      text: todo.text,
      priority: todo.priority || '未设置',
      estimatedTime: todo.estimatedTime || '未估算',
      tags: todo.tags || [],
      createdAt: todo.createdAt,
      completedAt: todo.completedAt || todo.updatedAt,
      daysToComplete: daysToComplete,
    })
  })

  // 测试生成的系统提示词
  import('../services/aiAnalysisService')
    .then(({ generateTodoSystemPrompt }) => {
      const prompt = generateTodoSystemPrompt(todos)

      console.log('📝 生成的系统提示词分析:')
      console.log('总长度:', prompt.length)
      console.log('包含任务ID:', prompt.includes('任务ID:'))
      console.log('包含具体优先级:', prompt.includes('【') && prompt.includes('星】'))
      console.log('包含创建时间:', prompt.includes('创建时间:'))
      console.log('包含完成用时:', prompt.includes('完成用时:'))
      console.log('包含数据洞察:', prompt.includes('任务数据洞察'))
      console.log('包含工作效率分析:', prompt.includes('工作效率分析'))

      // 检查是否包含具体的任务内容
      const hasSpecificTasks = activeTodos.some((todo: any) => prompt.includes(todo.text))
      console.log('包含具体任务内容:', hasSpecificTasks)

      console.log('\n📋 系统提示词预览 (前500字符):')
      console.log(prompt.substring(0, 500) + '...')
    })
    .catch((error) => {
      console.error('❌ 生成系统提示词失败:', error)
    })

  console.groupEnd()
}

/**
 * 测试当前系统提示词是否包含具体任务内容
 */
export function testCurrentPromptContent() {
  console.log('🔍 测试当前系统提示词内容...')

  const todos = JSON.parse(localStorage.getItem('todos') || '[]')

  console.group('📝 当前提示词内容测试')

  // 显示实际的任务数据
  const activeTodos = todos.filter((t: any) => !t.completed)
  const completedTodos = todos.filter((t: any) => t.completed)

  console.log('📊 实际任务数据:')
  console.log(
    '待完成任务:',
    activeTodos.map((t: any) => ({ id: t.id, text: t.text, priority: t.priority }))
  )
  console.log(
    '已完成任务:',
    completedTodos.slice(0, 5).map((t: any) => ({ id: t.id, text: t.text, priority: t.priority }))
  )

  // 测试生成的系统提示词
  import('../services/aiAnalysisService')
    .then(({ generateTodoSystemPrompt }) => {
      const prompt = generateTodoSystemPrompt(todos)

      console.log('\n📋 生成的系统提示词:')
      console.log(prompt)

      console.log('\n🔍 内容检查:')
      console.log('总长度:', prompt.length)

      // 检查是否包含具体的任务文本
      activeTodos.forEach((todo: any, index: number) => {
        const included = prompt.includes(todo.text)
        console.log(`待完成任务 ${index + 1} "${todo.text}":`, included ? '✅ 包含' : '❌ 缺失')
      })

      completedTodos.slice(0, 5).forEach((todo: any, index: number) => {
        const included = prompt.includes(todo.text)
        console.log(`已完成任务 ${index + 1} "${todo.text}":`, included ? '✅ 包含' : '❌ 缺失')
      })
    })
    .catch((error) => {
      console.error('❌ 生成系统提示词失败:', error)
    })

  console.groupEnd()
}

/**
 * 测试精简版系统提示词
 */
export function testCompactPrompt() {
  console.log('🔍 测试精简版系统提示词...')

  const todos = JSON.parse(localStorage.getItem('todos') || '[]')

  console.group('📝 精简版提示词测试')

  // 测试生成的系统提示词
  import('../services/aiAnalysisService')
    .then(({ generateTodoSystemPrompt }) => {
      const prompt = generateTodoSystemPrompt(todos)

      console.log('📊 精简版提示词分析:')
      console.log('总长度:', prompt.length)
      console.log('字符数比较:', prompt.length < 2000 ? '✅ 精简' : '⚠️ 较长')

      // 检查核心信息是否包含
      console.log('包含待完成任务:', prompt.includes('待完成任务'))
      console.log('包含已完成任务:', prompt.includes('最近完成任务'))
      console.log('包含优先级信息:', prompt.includes('[优先级:'))
      console.log('包含时间信息:', prompt.includes('[时间:') || prompt.includes('[用时:'))
      console.log('包含标签信息:', prompt.includes('[标签:'))

      // 检查是否去除了冗余信息
      console.log('已去除详细统计:', !prompt.includes('基础统计'))
      console.log('已去除长篇职责:', !prompt.includes('专业职责'))
      console.log('已去除复杂分析:', !prompt.includes('数据洞察'))

      console.log('\n📋 精简版系统提示词完整内容:')
      console.log(prompt)

      // 统计任务数量
      const activeCount = (prompt.match(/\d+\. .+? \[优先级:/g) || []).length
      const completedCount = (prompt.match(/\d+\. .+? \[优先级:.+?\[用时:/g) || []).length

      console.log('\n📊 任务统计:')
      console.log('待完成任务数:', activeCount)
      console.log('已完成任务数:', completedCount)
    })
    .catch((error) => {
      console.error('❌ 生成精简版提示词失败:', error)
    })

  console.groupEnd()
}

/**
 * 测试动态生成功能
 */
export function testDynamicGeneration() {
  console.log('🔄 测试动态生成功能...')

  console.group('🚀 动态生成测试')

  // 检查 Todo 助手状态
  const todoAssistantData = JSON.parse(localStorage.getItem('todo_assistant_prompt') || '{}')
  console.log('Todo 助手激活状态:', todoAssistantData.isActive)

  if (!todoAssistantData.isActive) {
    console.log('❌ Todo 助手未激活，请先激活')
    console.groupEnd()
    return
  }

  // 获取当前 todos
  const todos = JSON.parse(localStorage.getItem('todos') || '[]')
  console.log('当前 todos 数量:', todos.length)
  console.log('待完成任务:', todos.filter((t: any) => !t.completed).length)
  console.log('已完成任务:', todos.filter((t: any) => t.completed).length)

  // 模拟动态生成系统提示词
  import('../services/aiAnalysisService')
    .then(({ generateTodoSystemPrompt }) => {
      const dynamicContent = generateTodoSystemPrompt(todos)

      console.log('✅ 动态生成的系统提示词:')
      console.log('内容长度:', dynamicContent.length)
      console.log('包含待完成任务:', dynamicContent.includes('待完成任务'))
      console.log('包含已完成任务:', dynamicContent.includes('最近完成任务'))

      // 检查是否包含具体任务内容
      const activeTodos = todos.filter((t: any) => !t.completed)
      const completedTodos = todos.filter((t: any) => t.completed)

      console.log('\n📋 任务内容检查:')
      activeTodos.slice(0, 3).forEach((todo: any) => {
        const included = dynamicContent.includes(todo.text)
        console.log(`待完成任务 "${todo.text}":`, included ? '✅ 包含' : '❌ 缺失')
      })

      completedTodos.slice(0, 3).forEach((todo: any) => {
        const included = dynamicContent.includes(todo.text)
        console.log(`已完成任务 "${todo.text}":`, included ? '✅ 包含' : '❌ 缺失')
      })

      console.log('\n📝 完整内容:')
      console.log(dynamicContent)
    })
    .catch((error) => {
      console.error('❌ 动态生成失败:', error)
    })

  console.groupEnd()
}

// 将调试函数挂载到全局对象
if (typeof window !== 'undefined') {
  // 确保 window 对象存在这些属性
  Object.assign(window, {
    debugTodoAssistant,
    resetTodoAssistant,
    manualActivateTodoAssistant,
    debugTodosData,
    forceCreateTodoAssistant,
    testTodoAssistantToggle,
    testSystemPromptMessages,
    testTodoDetailGeneration,
    testCompleteMessageFlow,
    testTaskDetailLevel,
    testCurrentPromptContent,
    testCompactPrompt,
    testDynamicGeneration,
  })

  console.log(`
🛠️ Todo 助手调试工具已加载！

可用命令：
- debugTodoAssistant() - 查看 Todo 助手状态
- resetTodoAssistant() - 重置 Todo 助手状态
- manualActivateTodoAssistant() - 手动激活 Todo 助手
- debugTodosData() - 查看 todos 数据
- forceCreateTodoAssistant() - 强制创建 Todo 助手提示词
- testTodoAssistantToggle() - 测试状态切换
- testSystemPromptMessages() - 测试多条系统消息架构
- testTodoDetailGeneration() - 测试详细信息生成
- testCompleteMessageFlow() - 测试完整消息发送流程
- testTaskDetailLevel() - 测试任务信息详细程度
- testCurrentPromptContent() - 测试当前提示词内容
- testCompactPrompt() - 测试精简版系统提示词
- testDynamicGeneration() - 测试动态生成功能

使用方法：在控制台输入命令并按回车执行
  `)
}
