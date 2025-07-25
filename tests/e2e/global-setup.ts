async function globalSetup(): Promise<void> {
  // 等待服务启动并进行健康检查
  await setupTestData()
}

async function setupTestData(): Promise<void> {
  // 这里可以添加测试数据的初始化逻辑
  // 例如：创建测试用户、初始化测试数据等

  try {
    // 检查后端健康状态
    await fetch('http://localhost:3000/api/v1')
  } catch {
    // 服务可能还在启动中
  }

  try {
    // 检查前端服务
    await fetch('http://localhost:3001')
  } catch {
    // 服务可能还在启动中
  }
}

export default globalSetup
