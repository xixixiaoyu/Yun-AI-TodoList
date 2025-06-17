import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  // 预设配置
  presets: [
    presetUno(), // 默认预设，包含 Tailwind CSS 兼容的工具类
    presetAttributify(), // 属性化模式支持
    presetIcons({
      // 图标预设配置
      scale: 1.2,
      warn: true,
      collections: {
        carbon: () => import('@iconify-json/carbon/icons.json').then((i) => i.default),
      },
    }),
    presetTypography(), // 排版预设
    presetWebFonts({
      // Web 字体预设
      fonts: {
        sans: 'LXGW WenKai Lite Medium',
        mono: ['Fira Code', 'Consolas', 'monospace'],
      },
    }),
  ],

  // 转换器配置
  transformers: [
    transformerDirectives(), // 支持 @apply 等指令
    transformerVariantGroup(), // 支持变体组语法
  ],

  // 主题配置
  theme: {
    colors: {
      // 基于现有 CSS 变量定义的颜色系统
      primary: {
        DEFAULT: '#79b4a6',
        hover: '#68a295',
        rgb: '121, 180, 166',
      },
      bg: {
        DEFAULT: 'var(--bg-color)',
        card: 'var(--card-bg-color)',
      },
      text: {
        DEFAULT: 'var(--text-color)',
        secondary: 'var(--text-secondary-color)',
        todo: 'var(--todo-text-color)',
        completed: 'var(--completed-todo-text-color)',
      },
      input: {
        bg: 'var(--input-bg-color)',
        border: 'var(--input-border-color)',
        focus: 'var(--input-focus-color)',
      },
      button: {
        bg: 'var(--button-bg-color)',
        hover: 'var(--button-hover-bg-color)',
        text: 'var(--button-text-color)',
      },
      filter: {
        bg: 'var(--filter-btn-bg)',
        text: 'var(--filter-btn-text)',
        border: 'var(--filter-btn-border)',
        'active-bg': 'var(--filter-btn-active-bg)',
        'active-text': 'var(--filter-btn-active-text)',
        'active-border': 'var(--filter-btn-active-border)',
      },
      language: {
        bg: 'var(--language-toggle-bg)',
        color: 'var(--language-toggle-color)',
        hover: 'var(--language-toggle-hover-bg)',
      },
      project: {
        tag: 'var(--project-tag-bg-color)',
        'tag-text': 'var(--project-tag-text-color)',
      },
      link: {
        DEFAULT: 'var(--link-color)',
        hover: 'var(--link-hover-color)',
      },
      error: 'var(--error-color)',
      hover: 'var(--hover-bg-color)',
    },
    fontFamily: {
      sans: ['LXGW WenKai Lite Medium', 'sans-serif'],
      mono: ['Fira Code', 'Consolas', 'monospace'],
    },
    borderRadius: {
      DEFAULT: 'var(--border-radius)',
      half: 'calc(var(--border-radius) / 2)',
      '1.5x': 'calc(var(--border-radius) * 1.5)',
    },
    boxShadow: {
      DEFAULT: 'var(--box-shadow)',
      card: 'var(--card-shadow)',
      custom:
        '0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 8px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      pomodoro: '0 2px 8px rgba(255, 126, 103, 0.08)',
      'input-focus': '0 0 8px rgba(121, 180, 166, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1)',
      button: '0 2px 6px rgba(121, 180, 166, 0.3)',
      hover: '0 4px 8px rgba(0, 0, 0, 0.05)',
      nav: '0 -2px 10px rgba(0, 0, 0, 0.1)',
    },
    backdropBlur: {
      DEFAULT: '20px',
    },
  },

  // 自定义规则
  rules: [
    // 自定义字体平滑规则
    ['font-smooth-antialiased', { '-webkit-font-smoothing': 'antialiased' }],
    ['font-smooth-subpixel', { '-webkit-font-smoothing': 'subpixel-antialiased' }],

    // 自定义滚动条样式
    [
      'scrollbar-thin',
      {
        'scrollbar-width': 'thin',
        'scrollbar-color': 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05)',
      },
    ],

    // 自定义过渡效果
    ['transition-all-300', { transition: 'all 0.3s ease' }],
    ['transition-all-500', { transition: 'all 0.5s ease' }],
    ['transition-opacity-300', { transition: 'opacity 0.3s ease' }],
    ['transition-transform-300', { transition: 'transform 0.3s ease' }],

    // 自定义背景渐变
    [
      'bg-gradient-card',
      {
        background:
          'linear-gradient(135deg, var(--card-bg-color) 0%, rgba(255, 255, 255, 0.02) 100%)',
      },
    ],
    [
      'bg-gradient-pomodoro',
      {
        background:
          'linear-gradient(135deg, var(--card-bg-color) 0%, rgba(255, 126, 103, 0.02) 100%)',
      },
    ],

    // 自定义变换效果
    ['transform-hover-up', { transform: 'translateY(-2px)' }],
    ['transform-hover-up-1', { transform: 'translateY(-1px)' }],
    ['transform-hover-up-2', { transform: 'translateY(-2px)' }],
    ['transform-hover-up-4', { transform: 'translateY(-4px)' }],

    // 自定义边框
    [
      'border-gradient-bottom',
      {
        'border-bottom': '1px solid rgba(255, 126, 103, 0.08)',
      },
    ],

    // 自定义伪元素样式
    ['backdrop-blur-20', { 'backdrop-filter': 'blur(20px)' }],

    // 自定义高度
    ['min-h-70vh', { 'min-height': '70vh' }],
    ['min-h-75vh', { 'min-height': '75vh' }],
    ['min-h-50', { 'min-height': '200px' }],
    ['h-40vh', { height: '40vh' }],
    ['h-45vh', { height: '45vh' }],
    ['h-30vh', { height: '30vh' }],
    ['max-h-125', { 'max-height': '500px' }],
    ['max-h-150', { 'max-height': '600px' }],
    ['max-h-100', { 'max-height': '400px' }],
    ['max-h-25', { 'max-height': '100px' }],

    // 自定义宽度
    ['w-4.5', { width: '18px' }],
    ['h-4.5', { height: '18px' }],
    ['h-10.5', { height: '42px' }],
    ['w-75', { width: '300px' }],
    ['max-w-150', { 'max-width': '600px' }],
    ['min-w-15', { 'min-width': '60px' }],
    ['min-w-12.5', { 'min-width': '50px' }],
    ['min-w-20', { 'min-width': '80px' }],
    ['min-w-62.5', { 'min-width': '250px' }],

    // 自定义变换
    ['scale-95', { transform: 'scale(0.95)' }],
    ['scale-120', { transform: 'scale(1.2)' }],
    ['translate-x-1.25', { transform: 'translateX(5px)' }],

    // 自定义 z-index
    ['z-1000', { 'z-index': '1000' }],

    // 自定义 backface-visibility
    ['backface-visibility-hidden', { 'backface-visibility': 'hidden' }],

    // 自定义 will-change
    ['will-change-transform', { 'will-change': 'transform' }],

    // 聊天组件相关的自定义规则
    ['ltr', { direction: 'ltr', 'unicode-bidi': 'isolate', 'text-align': 'left' }],
    ['p-1.25', { padding: '5px' }],
    ['w-75', { width: '300px' }],
    ['max-w-75', { 'max-width': '300px' }],
    ['-left-75', { left: '-300px' }],
    ['translate-x-75', { transform: 'translateX(300px)' }],
    ['min-h-9', { 'min-height': '36px' }],
    ['h-30', { height: '120px' }],
    ['max-h-30', { 'max-height': '120px' }],

    // 自定义动画
    ['animate-overlayIn', { animation: 'overlayIn 0.3s ease' }],

    // 聊天相关的额外样式
    ['stroke-round', { 'stroke-linecap': 'round' }],
    ['max-h-32', { 'max-height': '128px' }],
    ['min-h-[44px]', { 'min-height': '44px' }],
    ['min-h-[40px]', { 'min-height': '40px' }],
    ['h-[44px]', { height: '44px' }],
    ['h-[40px]', { height: '40px' }],
    ['w-4.5', { width: '18px' }],
    ['h-4.5', { height: '18px' }],

    // 文本换行和排版相关样式
    ['word-break-break-word', { 'word-break': 'break-word', 'overflow-wrap': 'break-word' }],
    ['break-words', { 'overflow-wrap': 'break-word', 'word-break': 'break-word' }],
    ['whitespace-pre-wrap', { 'white-space': 'pre-wrap' }],
    ['leading-relaxed', { 'line-height': '1.7' }],

    // Prose 样式支持
    [
      'prose',
      {
        'max-width': 'none',
        color: 'inherit',
        'line-height': '1.6',
      },
    ],
    [
      'prose-sm',
      {
        'font-size': '0.875rem',
        'line-height': '1.6',
      },
    ],
    ['max-w-none', { 'max-width': 'none' }],
  ],

  // 快捷方式
  shortcuts: [
    // 按钮样式快捷方式
    [
      'btn-primary',
      'bg-gradient-to-br from-button-bg to-button-bg/90 text-button-text border-none rounded-half px-5 py-3.5 text-sm font-semibold tracking-wide cursor-pointer transition-all-300 shadow-button hover:bg-button-hover hover:transform-hover-up-1 focus:outline-2 focus:outline-button-bg focus:outline-offset-2',
    ],
    [
      'btn-filter',
      'bg-filter-bg text-filter-text border border-filter-border rounded-full px-4 py-2 text-sm cursor-pointer transition-all-300 hover:bg-filter-active-bg hover:text-filter-active-text hover:border-filter-active-border',
    ],
    [
      'btn-filter-active',
      'bg-filter-active-bg text-filter-active-text border border-filter-active-border',
    ],

    // 卡片样式快捷方式
    [
      'card-base',
      'bg-gradient-card rounded-1.5x shadow-custom backdrop-blur-20 border border-white/10 relative',
    ],
    [
      'card-todo',
      'bg-input-bg border border-input-border rounded-lg p-3 mb-2 w-full box-border gap-2 transition-all-300 hover:transform-hover-up hover:shadow-hover will-change-transform',
    ],

    // 输入框样式快捷方式
    [
      'input-base',
      'bg-input-bg border-2 border-input-border rounded-half px-4 py-3.5 text-base text-text shadow-sm transition-all-300 focus:border-input-focus focus:shadow-input-focus focus:transform-hover-up-1 focus:outline-none',
    ],

    // 文本样式快捷方式
    ['text-todo-style', 'text-todo font-sans'],
    ['text-completed-style', 'text-completed line-through opacity-60'],
    ['text-secondary', 'text-text-secondary'],

    // 布局快捷方式
    ['flex-center', 'flex items-center justify-center'],
    ['flex-between', 'flex items-center justify-between'],
    ['container-responsive', 'w-full max-w-screen-xl mx-auto px-4'],

    // 响应式容器
    [
      'todo-container',
      'flex flex-col items-center justify-center w-full max-w-screen-2xl mx-auto box-border min-h-70vh transition-all-300',
    ],
    [
      'todo-list',
      'w-full max-w-3xl mx-auto font-sans p-6 card-base relative min-h-50 box-border border border-white border-opacity-10',
    ],

    // 空状态样式
    [
      'empty-state',
      'flex flex-col items-center justify-center p-8 text-text-secondary text-center min-h-50',
    ],

    // 导航栏样式
    [
      'nav-button',
      'bg-language-bg text-language-color border border-language-color rounded px-2.5 py-1.5 cursor-pointer font-bold text-sm transition-all-300 hover:bg-language-hover hover:transform-hover-up hover:shadow-sm whitespace-nowrap',
    ],

    // 设置页面样式
    ['settings-card', 'min-h-64 flex flex-col'],
  ],

  // 内容检测配置
  content: {
    pipeline: {
      include: [
        // 包含的文件类型
        /\.(vue|html|jsx|tsx|ts|js|css)($|\?)/,
        'src/**/*.{vue,html,jsx,tsx,ts,js,css}',
      ],
      exclude: [
        // 排除的文件
        'node_modules/**/*',
        'dist/**/*',
        '.git/**/*',
      ],
    },
  },

  // 安全列表 - 确保这些类名始终被包含
  safelist: [
    'completed',
    'small-screen',
    'is-loading',
    'dark',
    'light',
    'status-loading',
    'status-success',
    'status-error',
    'status-info',
  ],
})
