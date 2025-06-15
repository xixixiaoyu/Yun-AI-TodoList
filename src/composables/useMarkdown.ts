import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import type { MarkedOptions } from 'marked'

export function useMarkdown() {
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

  const sanitizeContent = (content: string): string => {
    const rawHtml = marked.parse(content) as string
    return DOMPurify.sanitize(rawHtml)
  }

  return {
    sanitizeContent
  }
}
