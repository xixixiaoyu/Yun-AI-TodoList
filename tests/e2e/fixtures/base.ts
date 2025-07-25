import { test as base, expect } from '@playwright/test'

// 扩展基础测试，添加自定义 fixtures
export const test = base.extend<{
  // 可以在这里添加自定义的 fixtures
  // 例如：已登录的用户、测试数据等
}>({
  // 示例 fixture：可以添加自动登录等功能
  // authenticatedPage: async ({ page }, use) => {
  //   // 执行登录逻辑
  //   await page.goto('/login')
  //   await page.fill('[data-testid="email"]', 'test@example.com')
  //   await page.fill('[data-testid="password"]', 'password')
  //   await page.click('[data-testid="login-button"]')
  //   await page.waitForURL('/dashboard')
  //
  //   await use(page)
  // }
})

export { expect }
