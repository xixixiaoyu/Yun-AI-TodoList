import { Page, expect } from '@playwright/test'

/**
 * E2E 测试辅助函数
 */

/**
 * 等待页面加载完成
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  await page.waitForLoadState('domcontentloaded')
}

/**
 * 等待元素可见并可交互
 */
export async function waitForElement(page: Page, selector: string): Promise<void> {
  await page.waitForSelector(selector, { state: 'visible' })
  await expect(page.locator(selector)).toBeVisible()
}

/**
 * 安全点击元素（等待元素可见后点击）
 */
export async function safeClick(page: Page, selector: string): Promise<void> {
  await waitForElement(page, selector)
  await page.click(selector)
}

/**
 * 安全填写表单字段
 */
export async function safeFill(page: Page, selector: string, value: string): Promise<void> {
  await waitForElement(page, selector)
  await page.fill(selector, value)
}

/**
 * 检查页面标题
 */
export async function checkPageTitle(page: Page, expectedTitle: string): Promise<void> {
  await expect(page).toHaveTitle(expectedTitle)
}

/**
 * 检查 URL
 */
export async function checkURL(page: Page, expectedURL: string | RegExp): Promise<void> {
  await expect(page).toHaveURL(expectedURL)
}

/**
 * 截图
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `test-results/screenshots/${name}.png` })
}

/**
 * 等待 API 响应
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp
): Promise<import('@playwright/test').Response> {
  return await page.waitForResponse(urlPattern)
}

/**
 * 模拟网络条件
 */
export async function simulateNetworkConditions(
  page: Page,
  condition: 'slow' | 'fast' | 'offline'
): Promise<void> {
  const conditions = {
    slow: {
      offline: false,
      downloadThroughput: 50 * 1024,
      uploadThroughput: 20 * 1024,
      latency: 500,
    },
    fast: {
      offline: false,
      downloadThroughput: 10 * 1024 * 1024,
      uploadThroughput: 5 * 1024 * 1024,
      latency: 20,
    },
    offline: { offline: true, downloadThroughput: 0, uploadThroughput: 0, latency: 0 },
  }

  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.emulateNetworkConditions', conditions[condition])
}

/**
 * 检查控制台错误
 */
export function setupConsoleErrorTracking(page: Page): {
  getErrors: () => string[]
  expectNoErrors: () => void
} {
  const errors: string[] = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  return {
    getErrors: (): string[] => errors,
    expectNoErrors: (): void => expect(errors).toHaveLength(0),
  }
}

/**
 * 等待加载状态
 */
export async function waitForLoadingToFinish(
  page: Page,
  loadingSelector = '[data-testid="loading"]'
): Promise<void> {
  try {
    await page.waitForSelector(loadingSelector, { state: 'hidden', timeout: 10000 })
  } catch {
    // 如果没有找到加载指示器，继续执行
  }
}

/**
 * 检查元素文本内容
 */
export async function checkElementText(
  page: Page,
  selector: string,
  expectedText: string | RegExp
): Promise<void> {
  await waitForElement(page, selector)
  await expect(page.locator(selector)).toHaveText(expectedText)
}

/**
 * 检查元素是否包含特定类名
 */
export async function checkElementClass(
  page: Page,
  selector: string,
  className: string
): Promise<void> {
  await waitForElement(page, selector)
  await expect(page.locator(selector)).toHaveClass(new RegExp(className))
}

/**
 * 滚动到元素
 */
export async function scrollToElement(page: Page, selector: string): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded()
}

/**
 * 拖拽元素
 */
export async function dragAndDrop(
  page: Page,
  sourceSelector: string,
  targetSelector: string
): Promise<void> {
  await page.dragAndDrop(sourceSelector, targetSelector)
}
