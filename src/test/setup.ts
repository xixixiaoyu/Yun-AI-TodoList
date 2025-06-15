/**
 * 测试环境全局设置
 * 用于配置测试环境中的全局 mock 和设置
 */

import { vi } from 'vitest'

// 全局 Canvas mock - 解决 jsdom 环境中 Canvas API 不可用的问题
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createImageData: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    // Chart.js 需要的额外方法
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    getLineDash: vi.fn(() => []),
    setLineDash: vi.fn(),
    lineDashOffset: 0,
  })),
})

// Mock HTMLCanvasElement 的其他属性
Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
  value: 800,
  writable: true,
})

Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
  value: 600,
  writable: true,
})

// Mock ResizeObserver - 某些组件可能需要
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver - 某些组件可能需要
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia - 响应式设计测试可能需要
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock localStorage 和 sessionStorage
const createStorageMock = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  }
}

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
})

Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
})

// 抑制 console 警告（可选）
// 如果测试中有太多不重要的警告，可以取消注释以下代码
// const originalConsoleWarn = console.warn
// console.warn = (...args) => {
//   // 过滤掉特定的警告
//   const message = args[0]
//   if (typeof message === 'string' && message.includes('HTMLCanvasElement.prototype.getContext')) {
//     return
//   }
//   originalConsoleWarn(...args)
// }
