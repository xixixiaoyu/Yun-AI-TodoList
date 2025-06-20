import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import mermaid from 'mermaid'
import type { MarkedOptions } from 'marked'

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
  }

  // 降级方案：首字母大写
  return lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase()
}

export function useMarkdown() {
  // 初始化 Mermaid
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'inherit',
  })

  // 自定义渲染器
  const renderer = new marked.Renderer()
  const originalCode = renderer.code

  renderer.code = function ({
    text,
    lang,
    escaped,
  }: {
    text: string
    lang?: string
    escaped?: boolean
  }) {
    if (lang === 'mermaid') {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        // 使用 mermaid.render 生成 SVG
        mermaid
          .render(id, text)
          .then(({ svg }) => {
            const element = document.getElementById(`temp-${id}`)
            if (element) {
              element.innerHTML = svg
              element.classList.add('mermaid-diagram')
            }
          })
          .catch((error) => {
            console.error('Mermaid rendering error:', error)
            const element = document.getElementById(`temp-${id}`)
            if (element) {
              element.innerHTML = `<pre class="mermaid-error">图表渲染失败: ${error.message}</pre>`
            }
          })
        return `<div id="temp-${id}" class="mermaid-container">正在渲染图表...</div>`
      } catch (error) {
        console.error('Mermaid setup error:', error)
        return `<pre class="mermaid-error">图表渲染失败: ${error}</pre>`
      }
    }

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

  const sanitizeContent = (content: string): string => {
    const rawHtml = marked.parse(content) as string
    return DOMPurify.sanitize(rawHtml)
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
    const copyButton = target.closest('.copy-button') as HTMLButtonElement
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
  const updateButtonState = (button: HTMLButtonElement, state: 'success' | 'error') => {
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

  return {
    sanitizeContent,
    extractThinkingContent,
    setupCodeCopyFunction,
  }
}
