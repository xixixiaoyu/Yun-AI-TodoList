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
      // Web 字体预设 - 使用 Google Fonts 提供的字体
      fonts: {
        sans: ['Noto Sans SC:400,500,600', 'Inter:400,500,600'],
        mono: ['Fira Code:400,500', 'JetBrains Mono:400,500'],
      },
      // 字体提供商配置
      provider: 'google',
      // 添加错误处理
      inlineImports: false,
    }),
  ],

  // 转换器配置
  transformers: [
    transformerDirectives(), // 支持 @apply 等指令
    transformerVariantGroup(), // 支持变体组语法
  ],

  // 主题配置
  theme: {
    // 响应式断点
    breakpoints: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
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
      sans: [
        'Noto Sans SC',
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'PingFang SC',
        'Hiragino Sans GB',
        'Microsoft YaHei',
        'Helvetica Neue',
        'sans-serif',
      ],
      mono: ['Fira Code', 'JetBrains Mono', 'Consolas', 'monospace'],
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

    // AI 回答样式快捷方式 - 现在主要通过 CSS 文件控制
    ['ai-message-container', 'relative overflow-hidden transition-all duration-400 ease-out'],
    [
      'ai-message-prose',
      'max-w-none text-text leading-7 sm:leading-8 font-sans [&>*]:mb-3 sm:[&>*]:mb-4 [&>*:last-child]:mb-0',
    ],
    [
      'ai-message-headings',
      '[&>h1]:text-lg sm:[&>h1]:text-xl [&>h1]:font-bold [&>h1]:text-text [&>h1]:mb-4 sm:[&>h1]:mb-6 [&>h1]:mt-6 sm:[&>h1]:mt-8 [&>h1]:pb-2 [&>h1]:border-b [&>h1]:border-input-border/50 [&>h2]:text-base sm:[&>h2]:text-lg [&>h2]:font-semibold [&>h2]:text-text [&>h2]:mb-3 sm:[&>h2]:mb-4 [&>h2]:mt-4 sm:[&>h2]:mt-6 [&>h3]:text-sm sm:[&>h3]:text-base [&>h3]:font-medium [&>h3]:text-text [&>h3]:mb-2 sm:[&>h3]:mb-3 [&>h3]:mt-3 sm:[&>h3]:mt-5',
    ],
    [
      'ai-message-paragraphs',
      '[&>p]:leading-7 sm:[&>p]:leading-8 [&>p]:text-text [&>p]:mb-3 sm:[&>p]:mb-4 [&>p]:text-sm sm:[&>p]:text-base',
    ],
    [
      'ai-message-lists',
      '[&>ul]:my-3 sm:[&>ul]:my-4 [&>ul]:pl-4 sm:[&>ul]:pl-6 [&>ol]:my-3 sm:[&>ol]:my-4 [&>ol]:pl-4 sm:[&>ol]:pl-6 [&>li]:my-1 sm:[&>li]:my-2 [&>li]:text-text [&>li]:leading-6 sm:[&>li]:leading-7 [&>ul>li]:list-disc [&>ol>li]:list-decimal [&>li]:marker:text-primary [&>li]:text-sm sm:[&>li]:text-base',
    ],
    [
      'ai-message-code-inline',
      '[&>*>code]:bg-primary/8 [&>*>code]:text-primary [&>*>code]:px-2 sm:[&>*>code]:px-2.5 [&>*>code]:py-1 [&>*>code]:rounded-lg [&>*>code]:text-xs sm:[&>*>code]:text-sm [&>*>code]:font-mono [&>*>code]:font-medium [&>*>code]:border [&>*>code]:border-primary/12 [&>*>code]:shadow-sm',
    ],
    [
      'ai-message-code-block',
      '[&>pre]:bg-gradient-to-br [&>pre]:from-slate-50/90 [&>pre]:to-slate-100/80 [&>pre]:dark:from-slate-800/90 [&>pre]:dark:to-slate-900/80 [&>pre]:p-4 sm:[&>pre]:p-5 [&>pre]:rounded-2xl [&>pre]:overflow-x-auto [&>pre]:my-4 sm:[&>pre]:my-6 [&>pre]:border [&>pre]:border-slate-200/50 [&>pre]:dark:border-slate-700/50 [&>pre]:shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] [&>pre]:backdrop-blur-sm [&>pre>code]:bg-transparent [&>pre>code]:text-xs sm:[&>pre>code]:text-sm [&>pre>code]:font-mono [&>pre>code]:leading-6 sm:[&>pre>code]:leading-7',
    ],
    [
      'ai-message-blockquote',
      '[&>blockquote]:border-l-4 [&>blockquote]:border-primary/60 [&>blockquote]:bg-gradient-to-r [&>blockquote]:from-primary/6 [&>blockquote]:to-primary/3 [&>blockquote]:pl-5 sm:[&>blockquote]:pl-6 [&>blockquote]:pr-4 sm:[&>blockquote]:pr-5 [&>blockquote]:py-4 sm:[&>blockquote]:py-5 [&>blockquote]:my-5 sm:[&>blockquote]:my-6 [&>blockquote]:italic [&>blockquote]:text-text [&>blockquote]:rounded-r-2xl [&>blockquote]:shadow-sm [&>blockquote]:text-sm sm:[&>blockquote]:text-base [&>blockquote]:backdrop-blur-sm',
    ],
    [
      'ai-message-table',
      '[&>table]:w-full [&>table]:border-collapse [&>table]:my-4 sm:[&>table]:my-5 [&>table]:rounded-lg [&>table]:overflow-hidden [&>table]:shadow-sm [&>table]:text-sm sm:[&>table]:text-base [&>th]:border [&>th]:border-input-border [&>th]:p-2 sm:[&>th]:p-3 [&>th]:bg-primary/10 [&>th]:font-semibold [&>th]:text-text [&>td]:border [&>td]:border-input-border [&>td]:p-2 sm:[&>td]:p-3 [&>td]:text-text',
    ],
    [
      'ai-message-links',
      '[&>*>a]:text-primary [&>*>a]:underline [&>*>a]:decoration-primary/50 [&>*>a]:underline-offset-2 [&>*>a]:transition-colors [&>*>a]:duration-200 [&>*>a:hover]:text-primary-hover [&>*>a:hover]:decoration-primary',
    ],

    // 导航栏样式
    [
      'nav-button',
      'bg-language-bg text-language-color border border-language-color rounded px-2.5 py-1.5 cursor-pointer font-bold text-sm transition-all-300 hover:bg-language-hover hover:transform-hover-up hover:shadow-sm whitespace-nowrap',
    ],

    // 设置页面样式
    ['settings-card', 'min-h-64 flex flex-col'],

    // 响应式容器样式
    ['responsive-container', 'w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8'],
    [
      'responsive-grid',
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6',
    ],
    ['responsive-flex', 'flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4'],

    // AI 消息响应式样式
    [
      'ai-message-responsive',
      'max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[80%] xl:max-w-[75%]',
    ],
    [
      'user-message-responsive',
      'max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%] xl:max-w-[70%] self-end',
    ],

    // 对话抽屉响应式样式
    ['drawer-responsive', 'w-80 sm:w-96 md:w-[400px] lg:w-[450px] max-w-[90vw]'],

    // 搜索组件响应式样式
    ['search-responsive', 'w-full max-w-md mx-auto sm:max-w-lg md:max-w-xl'],

    // 按钮响应式样式
    ['button-responsive', 'px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base'],
    ['button-small-responsive', 'px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm'],

    // 文本响应式样式
    ['text-responsive-sm', 'text-xs sm:text-sm'],
    ['text-responsive-base', 'text-sm sm:text-base'],
    ['text-responsive-lg', 'text-base sm:text-lg md:text-xl'],

    // 间距响应式样式
    ['spacing-responsive-sm', 'p-2 sm:p-3 md:p-4'],
    ['spacing-responsive-md', 'p-3 sm:p-4 md:p-6'],
    ['spacing-responsive-lg', 'p-4 sm:p-6 md:p-8'],
  ],

  // 内容检测配置 - 优化性能
  content: {
    pipeline: {
      include: [
        // 包含的文件类型 - 更精确的匹配
        /\.(vue|html|jsx|tsx|ts|js)($|\?)/,
        'src/**/*.{vue,html,jsx,tsx,ts,js}',
        // 排除 CSS 文件以避免重复扫描
      ],
      exclude: [
        // 排除的文件 - 更全面的排除列表
        'node_modules/**/*',
        'dist/**/*',
        'dev-dist/**/*',
        '.git/**/*',
        '**/*.d.ts',
        '**/test/**/*',
        '**/tests/**/*',
        '**/*.test.*',
        '**/*.spec.*',
        'coverage/**/*',
        '.vscode/**/*',
        '.idea/**/*',
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
