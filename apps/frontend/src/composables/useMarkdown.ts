import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import mermaid from 'mermaid'
import type { MarkedOptions } from 'marked'

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
    return originalCode.call(this, { text, lang, escaped })
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

  return {
    sanitizeContent,
    extractThinkingContent,
  }
}
