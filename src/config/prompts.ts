import type { BuiltinPromptTemplate } from '../types/settings'
import { PromptCategory } from '../types/settings'

/**
 * 内置提示词模板配置
 */
export const builtinPromptTemplates: Record<string, BuiltinPromptTemplate> = {
  none: {
    id: 'none',
    name: '无系统提示词',
    content: '',
    description: '不使用任何系统提示词，让 AI 以默认方式回复',
    category: PromptCategory.GENERAL,
    temperature: 0.7,
    isReadonly: true
  }
}

export function getBuiltinPromptTemplate(id: string): BuiltinPromptTemplate | undefined {
  return builtinPromptTemplates[id]
}

export function getAllBuiltinPromptTemplates(): BuiltinPromptTemplate[] {
  return Object.values(builtinPromptTemplates)
}

export function getBuiltinPromptTemplatesByCategory(
  category: PromptCategory
): BuiltinPromptTemplate[] {
  return Object.values(builtinPromptTemplates).filter(template => template.category === category)
}

/**
 * 向后兼容的配置对象
 * @deprecated 请使用 builtinPromptTemplates
 */
export const promptsConfig = {
  none: {
    temperature: builtinPromptTemplates.none.temperature,
    content: builtinPromptTemplates.none.content
  }
}
