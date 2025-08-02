import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import katex from 'katex'
import type { MarkedOptions } from 'marked'
import { marked } from 'marked'
import mermaid from 'mermaid'

// 全局缩放函数 - 确保在全局作用域中可访问
declare global {
  interface Window {
    zoomMermaid: (button: HTMLElement, action: 'in' | 'out' | 'reset') => void
  }
}

// 事件委托处理 Mermaid 缩放和拖拽功能
;(() => {
  if (typeof window !== 'undefined') {
    let isDragging = false
    let dragStartX = 0
    let dragStartY = 0
    let currentTranslateX = 0
    let currentTranslateY = 0
    let dragTarget: HTMLElement | null = null
    let animationFrameId: number | null = null
    const pendingTransform = { x: 0, y: 0 }

    // 优化的拖拽更新函数，使用 requestAnimationFrame 节流
    const updateDragTransform = () => {
      if (dragTarget && isDragging) {
        dragTarget.style.setProperty('--mermaid-translate-x', `${pendingTransform.x}px`)
        dragTarget.style.setProperty('--mermaid-translate-y', `${pendingTransform.y}px`)
      }
      animationFrameId = null
    }

    // 缩放按钮点击事件
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (target.classList.contains('mermaid-zoom-btn')) {
        const action = target.getAttribute('data-action') as 'in' | 'out' | 'reset'
        const container = target.closest('.mermaid-container') as HTMLElement

        if (!container || !action) {
          console.warn('Mermaid container or action not found')
          return
        }

        const currentScale = parseFloat(
          container.style.getPropertyValue('--mermaid-scale') || '1.8'
        )
        let newScale = currentScale

        switch (action) {
          case 'in':
            newScale = Math.min(currentScale * 1.2, 3.0) // 最大3倍
            break
          case 'out':
            newScale = Math.max(currentScale / 1.2, 0.5) // 最小0.5倍
            break
          case 'reset':
            newScale = 1.8 // 默认缩放提升到1.8倍
            // 重置时也重置位移
            container.style.setProperty('--mermaid-translate-x', '0px')
            container.style.setProperty('--mermaid-translate-y', '0px')
            break
        }

        container.style.setProperty('--mermaid-scale', newScale.toString())
      }
    })

    // 拖拽开始事件
    document.addEventListener('mousedown', (event) => {
      const target = event.target as HTMLElement
      const svgElement = target.closest('svg')
      const container = target.closest('.mermaid-container') as HTMLElement

      if (svgElement && container && !target.classList.contains('mermaid-zoom-btn')) {
        isDragging = true
        dragTarget = container
        dragStartX = event.clientX
        dragStartY = event.clientY

        // 获取当前的位移值
        currentTranslateX = parseFloat(
          container.style.getPropertyValue('--mermaid-translate-x') || '0'
        )
        currentTranslateY = parseFloat(
          container.style.getPropertyValue('--mermaid-translate-y') || '0'
        )

        // 添加拖拽状态类，优化CSS过渡效果
        container.classList.add('dragging')

        // 改变鼠标样式
        document.body.style.cursor = 'grabbing'
        svgElement.style.cursor = 'grabbing'
        event.preventDefault()
      }
    })

    // 优化的拖拽移动事件，使用节流和更平滑的计算
    document.addEventListener('mousemove', (event) => {
      if (isDragging && dragTarget) {
        // 计算移动距离，添加轻微的阻尼效果提升手感
        const deltaX = (event.clientX - dragStartX) * 1.0 // 可调整阻尼系数
        const deltaY = (event.clientY - dragStartY) * 1.0

        pendingTransform.x = currentTranslateX + deltaX
        pendingTransform.y = currentTranslateY + deltaY

        // 使用 requestAnimationFrame 节流更新，提升性能和流畅度
        if (!animationFrameId) {
          animationFrameId = requestAnimationFrame(updateDragTransform)
        }

        event.preventDefault()
      }
    })

    // 拖拽结束事件
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false

        // 移除拖拽状态类
        if (dragTarget) {
          dragTarget.classList.remove('dragging')
        }

        dragTarget = null
        document.body.style.cursor = ''

        // 清理动画帧
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
        }

        // 恢复 SVG 鼠标样式
        const svgElements = document.querySelectorAll('.mermaid-diagram svg')
        svgElements.forEach((svg) => {
          ;(svg as HTMLElement).style.cursor = 'grab'
        })
      }
    })

    // 防止拖拽时选中文本
    document.addEventListener('selectstart', (event) => {
      if (isDragging) {
        event.preventDefault()
      }
    })

    // 处理鼠标离开窗口的情况
    document.addEventListener('mouseleave', () => {
      if (isDragging) {
        isDragging = false

        // 移除拖拽状态类
        if (dragTarget) {
          dragTarget.classList.remove('dragging')
        }

        dragTarget = null
        document.body.style.cursor = ''

        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
        }
      }
    })
  }
})()

// 语言显示名称映射 - 优化版本，支持动态降级
const getLanguageDisplayName = (lang: string): string => {
  // 核心语言映射，保持用户友好的显示
  const coreLanguageMap: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    csharp: 'C#',
    php: 'PHP',
    ruby: 'Ruby',
    go: 'Go',
    rust: 'Rust',
    swift: 'Swift',
    kotlin: 'Kotlin',
    scala: 'Scala',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    sass: 'Sass',
    less: 'Less',
    json: 'JSON',
    xml: 'XML',
    yaml: 'YAML',
    yml: 'YAML',
    toml: 'TOML',
    ini: 'INI',
    sql: 'SQL',
    bash: 'Bash',
    shell: 'Shell',
    powershell: 'PowerShell',
    dockerfile: 'Dockerfile',
    markdown: 'Markdown',
    md: 'Markdown',
    vue: 'Vue',
    react: 'React',
    jsx: 'JSX',
    tsx: 'TSX',
    text: '纯文本',
    plaintext: '纯文本',
  }

  const normalizedLang = lang.toLowerCase()

  // 优先使用核心映射
  if (coreLanguageMap[normalizedLang]) {
    return coreLanguageMap[normalizedLang]
  }

  // 尝试从 highlight.js 获取语言信息
  try {
    const langInfo = hljs.getLanguage(normalizedLang)
    if (langInfo?.name) {
      return langInfo.name
    }
  } catch (error) {
    // 静默处理错误，使用降级方案
    console.warn(`无法获取语言 ${normalizedLang} 的详细信息`, error)
  }

  // 降级方案：首字母大写
  return lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase()
}

export function useMarkdown() {
  // 获取当前主题
  const getCurrentTheme = (): 'default' | 'dark' => {
    if (typeof document !== 'undefined') {
      const theme = document.documentElement.getAttribute('data-theme')
      return theme === 'dark' ? 'dark' : 'default'
    }
    return 'default'
  }

  // 初始化 Mermaid 配置
  const initializeMermaid = (theme: 'default' | 'dark' = 'default') => {
    const isDark = theme === 'dark'
    const textColor = isDark ? '#ffffff' : '#000000'
    const backgroundColor = isDark ? '#1a1a1a' : '#ffffff'
    const fontStack =
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif'

    mermaid.initialize({
      startOnLoad: false,
      theme: theme,
      securityLevel: 'loose',
      // 支持中文字体
      fontFamily: fontStack,
      // 图表尺寸配置
      flowchart: {
        nodeSpacing: 50,
        rankSpacing: 60,
        padding: 20,
      },
      sequence: {
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
      },
      gantt: {
        numberSectionStyles: 4,
      },
      journey: {
        diagramMarginX: 50,
        diagramMarginY: 10,
      },
      timeline: {
        diagramMarginX: 50,
        diagramMarginY: 10,
      },
      mindmap: {
        padding: 10,
      },
      gitGraph: {
        mainBranchName: 'main',
      },
      themeVariables: {
        // 基础颜色
        primaryColor: '#79b4a6',
        primaryBorderColor: '#79b4a6',
        primaryTextColor: textColor,

        // 文字颜色设置 - 更全面的配置
        textColor: textColor,
        nodeTextColor: textColor,
        edgeLabelBackground: backgroundColor,

        // 线条和边框
        lineColor: textColor,
        edgeColor: textColor,

        // 背景色
        background: backgroundColor,
        mainBkg: backgroundColor,
        secondBkg: isDark ? '#2a2a2a' : '#f9f9f9',
        tertiaryColor: backgroundColor,

        // 节点样式
        nodeBkg: isDark ? '#2a2a2a' : '#ffffff',
        nodeBorder: '#79b4a6',

        // 确保标签文字可见
        labelColor: textColor,
        labelBoxBkgColor: backgroundColor,
        labelBoxBorderColor: '#79b4a6',

        // 流程图特定设置
        clusterBkg: isDark ? '#2a2a2a' : '#f9f9f9',
        clusterBorder: '#79b4a6',

        // 修复可能的黄色背景问题
        c0: backgroundColor,
        c1: backgroundColor,
        c2: backgroundColor,
        c3: backgroundColor,
        c4: backgroundColor,
        c5: backgroundColor,
        c6: backgroundColor,
        c7: backgroundColor,

        // 字体设置 - 支持中文
        fontFamily: fontStack,
        fontSize: '14px',
        fontWeight: 'normal',

        // 确保所有文字元素都使用正确的字体和颜色
        nodeFontFamily: fontStack,
        edgeLabelFontFamily: fontStack,
        labelFontFamily: fontStack,

        // 添加更多文字颜色配置确保兼容性
        cScale0: textColor,
        cScale1: textColor,
        cScale2: textColor,
        cScale3: textColor,
        cScale4: textColor,
        cScale5: textColor,
        cScale6: textColor,
        cScale7: textColor,
        cScale8: textColor,
        cScale9: textColor,
        cScale10: textColor,
        cScale11: textColor,

        // 序列图文字颜色
        actorTextColor: textColor,
        noteTextColor: textColor,
        loopTextColor: textColor,

        // 甘特图文字颜色
        taskTextColor: textColor,
        taskTextOutsideColor: textColor,
        activeTaskTextColor: textColor,

        // 类图文字颜色
        classText: textColor,

        // 状态图文字颜色
        labelTextColor: textColor,
      },
      // 确保 SVG 渲染正确
      htmlLabels: false, // 使用 SVG 文本而不是 HTML
      wrap: true,
      maxTextSize: 90000,
    })
  }

  // 预处理 LaTeX 数学公式
  const preprocessMathFormulas = (markdown: string): string => {
    // 先保护代码块内容，避免处理其中的 LaTeX 公式
    const codeBlocks: string[] = []
    const codeBlockPlaceholders: string[] = []

    // 匹配所有代码块（包括行内代码和代码块）
    let processedMarkdown = markdown

    // 保护三个反引号的代码块
    processedMarkdown = processedMarkdown.replace(/```[\s\S]*?```/g, (match) => {
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`
      codeBlocks.push(match)
      codeBlockPlaceholders.push(placeholder)
      return placeholder
    })

    // 保护行内代码
    processedMarkdown = processedMarkdown.replace(/`[^`\n]+?`/g, (match) => {
      const placeholder = `__INLINE_CODE_${codeBlocks.length}__`
      codeBlocks.push(match)
      codeBlockPlaceholders.push(placeholder)
      return placeholder
    })

    // 处理块级公式 $$...$$
    processedMarkdown = processedMarkdown.replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
      try {
        const html = katex.renderToString(formula.trim(), {
          displayMode: true,
          throwOnError: false,
          strict: false,
        })
        return `<div class="math-block">${html}</div>`
      } catch (error) {
        console.warn('LaTeX block formula render error:', error)
        return `<div class="math-error">数学公式渲染错误: ${formula}</div>`
      }
    })

    // 处理行内公式 $...$（但不处理已经被 $$ 处理过的）
    processedMarkdown = processedMarkdown.replace(
      /(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g,
      (match, formula) => {
        try {
          const html = katex.renderToString(formula.trim(), {
            displayMode: false,
            throwOnError: false,
            strict: false,
          })
          return `<span class="math-inline">${html}</span>`
        } catch (error) {
          console.warn('LaTeX inline formula render error:', error)
          return `<span class="math-error">数学公式渲染错误: ${formula}</span>`
        }
      }
    )

    // 恢复代码块内容
    codeBlockPlaceholders.forEach((placeholder, index) => {
      processedMarkdown = processedMarkdown.replace(placeholder, codeBlocks[index])
    })

    return processedMarkdown
  }

  // 预处理 Mermaid 图表
  const preprocessMermaidDiagrams = async (markdown: string): Promise<string> => {
    const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g
    const matches = [...markdown.matchAll(mermaidRegex)]

    if (matches.length === 0) {
      return markdown
    }

    // 根据当前主题重新初始化 Mermaid
    const currentTheme = getCurrentTheme()
    initializeMermaid(currentTheme)

    let processedMarkdown = markdown

    for (const match of matches) {
      try {
        const diagramCode = match[1]
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`

        // 同步等待 Mermaid 渲染完成
        const { svg } = await mermaid.render(id, diagramCode)

        // 优化 SVG 质量：添加高分辨率渲染属性和透明背景
        const optimizedSvg = svg
          .replace(
            '<svg',
            '<svg preserveAspectRatio="xMidYMid meet" style="background: transparent; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;"'
          )
          .replace(/width="[^"]*"/, 'width="100%"')
          .replace(/height="[^"]*"/, 'height="auto"')
          .replace(/<rect[^>]*width="100%"[^>]*height="100%"[^>]*fill="[^"]*"[^>]*>/g, (match) => {
            // 只移除全尺寸的画布背景矩形
            return match.replace(/fill="[^"]*"/, 'fill="transparent"')
          })
          // 确保所有文本元素可见
          .replace(/<text([^>]*)>/g, '<text$1 fill="#2d3748" stroke="none">')
          .replace(/fill="none"/g, 'fill="#2d3748"')
          .replace(/fill="transparent"/g, 'fill="#2d3748"')

        // 将渲染好的 SVG 包装在容器中，添加缩放控制
        const wrappedSvg = `<div class="mermaid-container">
          <div class="mermaid-zoom-controls">
            <button class="mermaid-zoom-btn" data-action="in" title="放大">+</button>
            <button class="mermaid-zoom-btn" data-action="out" title="缩小">−</button>
            <button class="mermaid-zoom-btn" data-action="reset" title="重置">⌂</button>
          </div>
          <div class="mermaid-diagram">${optimizedSvg}</div>
        </div>`

        // 替换原始的 mermaid 代码块
        processedMarkdown = processedMarkdown.replace(match[0], wrappedSvg)
      } catch (error) {
        console.error('Mermaid rendering error:', error)
        const errorHtml = `<div class="mermaid-container"><pre class="mermaid-error">图表渲染失败: ${error instanceof Error ? error.message : String(error)}</pre></div>`
        processedMarkdown = processedMarkdown.replace(match[0], errorHtml)
      }
    }

    return processedMarkdown
  }

  // 自定义渲染器
  const renderer = new marked.Renderer()

  renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
    // Mermaid 图表已在预处理阶段处理，这里不再特殊处理

    // 处理普通代码块
    const language = lang || 'text'
    const displayLanguage = getLanguageDisplayName(language)
    const highlightedCode =
      lang && hljs.getLanguage(lang)
        ? hljs.highlight(text, { language: lang }).value
        : hljs.highlightAuto(text).value

    // 生成唯一ID用于代码块标识
    const codeBlockId = `code-${Math.random().toString(36).substr(2, 9)}`

    return `
      <div class="code-block-container" data-code-block-id="${codeBlockId}">
        <div class="code-block-header">
          <span class="code-language">${displayLanguage}</span>
          <button class="copy-button" data-code="${encodeURIComponent(text)}" data-code-block="${codeBlockId}">
            <svg class="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span class="copy-text">复制</span>
          </button>
        </div>
        <pre class="code-content"><code class="hljs language-${language}">${highlightedCode}</code></pre>
      </div>
    `
  }

  marked.setOptions({
    renderer,
    highlight: function (code: string, lang: string) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {
        console.error('Error highlighting code:', err)
        return code
      }
    },
  } as MarkedOptions)

  const sanitizeContent = async (content: string): Promise<string> => {
    // 首先预处理 LaTeX 数学公式
    let processedContent = preprocessMathFormulas(content)
    // 然后预处理 Mermaid 图表
    processedContent = await preprocessMermaidDiagrams(processedContent)
    const rawHtml = await marked.parse(processedContent)
    return DOMPurify.sanitize(rawHtml as string)
  }

  // 提取思考内容并返回处理后的内容
  const extractThinkingContent = (content: string): { thinking: string; response: string } => {
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g
    let thinking = ''
    let response = content

    // 提取所有思考内容
    let match
    while ((match = thinkRegex.exec(content)) !== null) {
      thinking += match[1].trim() + '\n\n'
    }

    // 移除思考标签，保留响应内容
    response = content.replace(thinkRegex, '').trim()

    return {
      thinking: thinking.trim(),
      response: response,
    }
  }

  // 设置代码复制功能 - 使用事件委托，更安全可靠
  const setupCodeCopyFunction = () => {
    // 移除之前可能存在的事件监听器
    document.removeEventListener('click', handleCopyButtonClick)

    // 添加事件委托监听器
    document.addEventListener('click', handleCopyButtonClick)
  }

  // 处理复制按钮点击事件
  const handleCopyButtonClick = async (event: Event) => {
    const target = event.target as HTMLElement

    // 检查是否点击了复制按钮或其子元素
    const copyButton = target.closest('.copy-button') as HTMLButtonElement | null
    if (!copyButton || !copyButton.dataset.code) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    try {
      // 解码存储的代码内容
      const code = decodeURIComponent(copyButton.dataset.code)

      // 尝试使用现代 Clipboard API
      await navigator.clipboard.writeText(code)

      updateButtonState(copyButton, 'success')
    } catch (error) {
      console.warn('Clipboard API 失败，尝试降级方案:', error)

      // 降级方案：使用 document.execCommand
      try {
        const code = decodeURIComponent(copyButton.dataset.code || '')
        const textArea = document.createElement('textarea')
        textArea.value = code
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)

        if (successful) {
          updateButtonState(copyButton, 'success')
        } else {
          throw new Error('execCommand 复制失败')
        }
      } catch (fallbackError) {
        console.error('所有复制方案都失败:', fallbackError)
        updateButtonState(copyButton, 'error')
      }
    }
  }

  // 更新按钮状态的辅助函数
  const updateButtonState = (button: HTMLButtonElement | null, state: 'success' | 'error') => {
    if (!button) return
    const copyText = button.querySelector('.copy-text')
    if (!copyText) return

    const originalText = copyText.textContent || '复制'

    if (state === 'success') {
      copyText.textContent = '已复制'
      button.classList.add('copied')
    } else {
      copyText.textContent = '复制失败'
      button.classList.add('error')
    }

    // 2秒后恢复原始状态
    setTimeout(() => {
      copyText.textContent = originalText
      button.classList.remove('copied', 'error')
    }, 2000)
  }

  // 渲染 Markdown（现在是异步函数）
  const renderMarkdown = async (markdown: string): Promise<string> => {
    if (!markdown) return ''

    try {
      // 首先预处理 LaTeX 数学公式
      let processedMarkdown = preprocessMathFormulas(markdown)

      // 然后预处理 Mermaid 图表
      processedMarkdown = await preprocessMermaidDiagrams(processedMarkdown)

      // 使用 marked 解析 markdown
      const html = await marked.parse(processedMarkdown, {
        renderer,
        gfm: true,
        breaks: true,
        sanitize: false,
      } as MarkedOptions)

      // 使用 DOMPurify 清理 HTML
      const cleanHtml = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'p',
          'br',
          'strong',
          'em',
          'u',
          'del',
          'code',
          'pre',
          'blockquote',
          'ul',
          'ol',
          'li',
          'a',
          'img',
          'table',
          'thead',
          'tbody',
          'tr',
          'th',
          'td',
          'div',
          'span',
          'svg',
          'g',
          'path',
          'rect',
          'circle',
          'ellipse',
          'line',
          'polyline',
          'polygon',
          'text',
          'tspan',
          'defs',
          'marker',
          'button',
          // KaTeX 数学公式相关标签
          'math',
          'semantics',
          'mrow',
          'msup',
          'msub',
          'msubsup',
          'mfrac',
          'msqrt',
          'mroot',
          'mi',
          'mn',
          'mo',
          'mtext',
          'mspace',
          'menclose',
          'mpadded',
          'mphantom',
          'munder',
          'mover',
          'munderover',
          'mtable',
          'mtr',
          'mtd',
          'mlabeledtr',
          'maligngroup',
          'malignmark',
          'mstyle',
          'merror',
          'mfenced',
          'mmultiscripts',
          'mprescripts',
          'none',
          'annotation',
        ],
        ALLOWED_ATTR: [
          'href',
          'src',
          'alt',
          'title',
          'class',
          'id',
          'style',
          'data-*',
          'viewBox',
          'width',
          'height',
          'fill',
          'stroke',
          'stroke-width',
          'd',
          'x',
          'y',
          'x1',
          'y1',
          'x2',
          'y2',
          'cx',
          'cy',
          'r',
          'rx',
          'ry',
          'points',
          'transform',
          'text-anchor',
          'font-size',
          'font-family',
          'font-weight',
          'dx',
          'dy',
          'markerWidth',
          'markerHeight',
          'orient',
          'refX',
          'refY',
          // KaTeX 数学公式相关属性
          'xmlns',
          'display',
          'mathvariant',
          'mathsize',
          'mathcolor',
          'mathbackground',
          'dir',
          'fontfamily',
          'fontsize',
          'fontweight',
          'fontstyle',
          'color',
          'background',
          'scriptlevel',
          'displaystyle',
          'scriptsizemultiplier',
          'scriptminsize',
          'infixlinebreakstyle',
          'decimalpoint',
          'fence',
          'separator',
          'stretchy',
          'symmetric',
          'maxsize',
          'minsize',
          'largeop',
          'movablelimits',
          'accent',
          'lspace',
          'rspace',
          'linebreak',
          'lineleading',
          'linebreakstyle',
          'linebreakmultchar',
          'indentalign',
          'indentshift',
          'indenttarget',
          'indentalignfirst',
          'indentshiftfirst',
          'indentalignlast',
          'indentshiftlast',
          'depth',
          'lquote',
          'rquote',
          'linethickness',
          'munalign',
          'denomalign',
          'bevelled',
          'voffset',
          'open',
          'close',
          'separators',
          'notation',
          'subscriptshift',
          'superscriptshift',
          'accentunder',
          'align',
          'rowalign',
          'columnalign',
          'groupalign',
          'alignmentscope',
          'columnwidth',
          'rowspacing',
          'columnspacing',
          'rowlines',
          'columnlines',
          'frame',
          'framespacing',
          'equalrows',
          'equalcolumns',
          'side',
          'minlabelspacing',
          'rowspan',
          'columnspan',
          'edge',
          'stackalign',
          'charalign',
          'charspacing',
          'longdivstyle',
          'position',
          'shift',
          'location',
          'crossout',
          'length',
          'leftoverhang',
          'rightoverhang',
          'mslinethickness',
          'selection',
        ],
        ALLOW_DATA_ATTR: true,
      })

      return cleanHtml
    } catch (error) {
      console.error('Markdown rendering error:', error)
      return `<p>渲染失败: ${error}</p>`
    }
  }

  return {
    sanitizeContent,
    extractThinkingContent,
    setupCodeCopyFunction,
    renderMarkdown,
  }
}
