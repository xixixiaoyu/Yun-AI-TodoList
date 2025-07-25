import { expect, test } from './fixtures/base'
import { setupConsoleErrorTracking, waitForPageLoad } from './utils/test-helpers'

test.describe('基础功能测试', () => {
  test('应用首页加载正常', async ({ page }) => {
    // 设置控制台错误跟踪
    const consoleTracker = setupConsoleErrorTracking(page)

    // 访问首页
    await page.goto('/')

    // 等待页面加载完成
    await waitForPageLoad(page)

    // 检查页面标题
    const title = await page.title()
    expect(title).toBeTruthy()

    // 检查 URL
    const currentUrl = page.url()
    expect(currentUrl).toContain('localhost:3001')

    // 检查主要元素是否存在
    await expect(page.locator('body')).toBeVisible()

    // 检查是否有控制台错误
    consoleTracker.expectNoErrors()
  })

  test('导航功能正常', async ({ page }) => {
    await page.goto('/')
    await waitForPageLoad(page)

    // 检查导航元素是否存在
    // 注意：这里的选择器需要根据实际的应用结构调整
    const navigation = page.locator('nav, [role="navigation"], .navigation')

    // 如果存在导航，检查其可见性
    const navCount = await navigation.count()
    if (navCount > 0) {
      await expect(navigation.first()).toBeVisible()
    }
  })

  test('响应式设计在移动设备上正常', async ({ page }) => {
    // 设置移动设备视口
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')
    await waitForPageLoad(page)

    // 检查页面在移动设备上是否正常显示
    await expect(page.locator('body')).toBeVisible()

    // 检查是否有横向滚动条（通常不应该有）
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1) // +1 for rounding
  })

  test('页面性能指标正常', async ({ page }) => {
    // 开始性能监控
    await page.goto('/', { waitUntil: 'networkidle' })

    // 获取性能指标
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming
      return {
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint:
          performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      }
    })

    // 检查性能指标是否在合理范围内
    expect(performanceMetrics.domContentLoaded).toBeLessThan(3000) // 3秒内
    expect(performanceMetrics.loadComplete).toBeLessThan(5000) // 5秒内
  })

  test('错误处理正常', async ({ page }) => {
    // 测试访问不存在的页面
    await page.goto('/non-existent-page')
    await waitForPageLoad(page)

    // 对于 SPA 应用，检查是否正确处理未知路由
    const currentUrl = page.url()
    const has404Content = (await page.locator('text=/404|not found|page not found/i').count()) > 0
    const isRedirectedToHome = currentUrl.endsWith('/') || currentUrl.includes('/#/')

    // 只要有合理的错误处理（404页面或重定向到首页）就算通过
    expect(has404Content || isRedirectedToHome).toBeTruthy()
  })

  test('无障碍性基础检查', async ({ page }) => {
    await page.goto('/')
    await waitForPageLoad(page)

    // 检查页面是否有 lang 属性
    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()

    // 检查是否有 main 标签或 role="main"
    const mainContent = page.locator('main, [role="main"]')
    const mainCount = await mainContent.count()

    if (mainCount > 0) {
      await expect(mainContent.first()).toBeVisible()
    }

    // 检查图片是否有 alt 属性
    const images = page.locator('img')
    const imageCount = await images.count()

    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      // 检查前5张图片
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      const ariaLabel = await img.getAttribute('aria-label')
      const role = await img.getAttribute('role')

      // 图片应该有 alt 属性，或者是装饰性图片（role="presentation"）
      expect(alt !== null || ariaLabel !== null || role === 'presentation').toBeTruthy()
    }
  })
})
