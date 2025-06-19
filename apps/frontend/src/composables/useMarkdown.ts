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
