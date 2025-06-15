import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import type { MarkedOptions } from 'marked'

export function useMarkdown() {
  // 配置 marked 使用 highlight.js
  marked.setOptions({
    highlight: function (code: string, lang: string) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {
        console.error('Error highlighting code:', err)
        return code
      }
    }
  } as MarkedOptions)

  // 处理 Markdown 内容
  const sanitizeContent = (content: string): string => {
    const rawHtml = marked.parse(content) as string
    return DOMPurify.sanitize(rawHtml)
  }

  return {
    sanitizeContent
  }
}
