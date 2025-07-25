async function globalTeardown(): Promise<void> {
  // 清理测试数据
  await cleanupTestData()
}

async function cleanupTestData(): Promise<void> {
  // 这里可以添加测试数据的清理逻辑
  // 例如：删除测试用户、清理测试数据等

  try {
    // 可以调用 API 清理测试数据
    // await fetch('http://localhost:3000/api/v1/test/cleanup', { method: 'POST' })
  } catch {
    // 清理失败时静默处理
  }
}

export default globalTeardown
