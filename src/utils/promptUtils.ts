import type {
  CustomPrompt,
  PromptActionResult,
  PromptExportData,
  PromptFilter,
  PromptSortOptions,
  PromptValidationResult
} from '../types/settings'
import { PromptCategory, PromptPriority } from '../types/settings'

/**
 * 提示词工具函数集合
 */

export function validatePrompt(prompt: Partial<CustomPrompt>): PromptValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!prompt.name?.trim()) {
    errors.push('提示词名称不能为空')
  }

  if (!prompt.content?.trim()) {
    errors.push('提示词内容不能为空')
  }

  if (prompt.name && prompt.name.length > 50) {
    warnings.push('提示词名称过长，建议控制在 50 字符以内')
  }

  if (prompt.content && prompt.content.length > 10000) {
    warnings.push('提示词内容过长，建议控制在 10000 字符以内')
  }

  if (prompt.content) {
    if (prompt.content.length < 10) {
      warnings.push('提示词内容过短，建议提供更详细的指导')
    }

    const harmfulKeywords = ['hack', 'crack', 'illegal', 'violence']
    const hasHarmfulContent = harmfulKeywords.some(keyword =>
      prompt.content?.toLowerCase().includes(keyword)
    )

    if (hasHarmfulContent) {
      errors.push('提示词内容包含不当内容，请修改后重试')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function filterPrompts(prompts: CustomPrompt[], filter: PromptFilter): CustomPrompt[] {
  return prompts.filter(prompt => {
    if (filter.category && prompt.category !== filter.category) {
      return false
    }

    if (filter.priority && prompt.priority !== filter.priority) {
      return false
    }

    if (filter.isFavorite !== undefined && prompt.isFavorite !== filter.isFavorite) {
      return false
    }

    if (filter.isActive !== undefined && prompt.isActive !== filter.isActive) {
      return false
    }

    if (filter.tags && filter.tags.length > 0) {
      const hasMatchingTag = filter.tags.some(tag =>
        prompt.tags.some(promptTag => promptTag.toLowerCase().includes(tag.toLowerCase()))
      )
      if (!hasMatchingTag) {
        return false
      }
    }

    if (filter.searchText) {
      const searchText = filter.searchText.toLowerCase()
      const matchesName = prompt.name.toLowerCase().includes(searchText)
      const matchesDescription = prompt.description?.toLowerCase().includes(searchText)
      const matchesContent = prompt.content.toLowerCase().includes(searchText)
      const matchesTags = prompt.tags.some(tag => tag.toLowerCase().includes(searchText))

      if (!matchesName && !matchesDescription && !matchesContent && !matchesTags) {
        return false
      }
    }

    return true
  })
}

export function sortPrompts(
  prompts: CustomPrompt[],
  sortOptions: PromptSortOptions
): CustomPrompt[] {
  return [...prompts].sort((a, b) => {
    let comparison = 0

    switch (sortOptions.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'createdAt':
        comparison = a.createdAt - b.createdAt
        break
      case 'updatedAt':
        comparison = a.updatedAt - b.updatedAt
        break
      case 'usageCount':
        comparison = a.usageCount - b.usageCount
        break
      case 'priority': {
        const priorityOrder = {
          [PromptPriority.HIGH]: 3,
          [PromptPriority.MEDIUM]: 2,
          [PromptPriority.LOW]: 1
        }
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
        break
      }
      default:
        comparison = 0
    }

    return sortOptions.order === 'desc' ? -comparison : comparison
  })
}

/**
 * 创建新的提示词对象
 */
export function createPrompt(data: Partial<CustomPrompt>): CustomPrompt {
  const now = Date.now()

  return {
    id: `custom_${now}`,
    name: data.name || '',
    content: data.content || '',
    description: data.description || '',
    category: data.category || PromptCategory.CUSTOM,
    priority: data.priority || PromptPriority.MEDIUM,
    tags: data.tags || [],
    createdAt: now,
    updatedAt: now,
    isActive: data.isActive !== undefined ? data.isActive : true,
    usageCount: 0,
    isFavorite: data.isFavorite || false
  }
}

export function updatePrompt(prompt: CustomPrompt, updates: Partial<CustomPrompt>): CustomPrompt {
  return {
    ...prompt,
    ...updates,
    updatedAt: Date.now()
  }
}

export function duplicatePrompt(prompt: CustomPrompt): CustomPrompt {
  const now = Date.now()

  return {
    ...prompt,
    id: `custom_${now}`,
    name: `${prompt.name} (副本)`,
    createdAt: now,
    updatedAt: now,
    usageCount: 0
  }
}

export function exportPrompts(prompts: CustomPrompt[]): PromptExportData {
  return {
    version: '1.0.0',
    exportedAt: Date.now(),
    prompts: prompts.map(prompt => ({
      ...prompt,

      usageCount: 0
    }))
  }
}

/**
 * 验证导入的提示词数据
 */
export function validateImportData(data: unknown): PromptActionResult {
  try {
    if (!data || typeof data !== 'object') {
      return { success: false, message: '无效的数据格式' }
    }

    if (!data.version || !data.prompts || !Array.isArray(data.prompts)) {
      return { success: false, message: '缺少必要的数据字段' }
    }

    for (const prompt of data.prompts) {
      const validation = validatePrompt(prompt)
      if (!validation.isValid) {
        return {
          success: false,
          message: `提示词 "${prompt.name || '未命名'}" 验证失败: ${validation.errors.join(', ')}`
        }
      }
    }

    return { success: true, message: '数据验证通过', data }
  } catch (error) {
    return {
      success: false,
      message: `数据解析失败: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

export function processImportData(data: PromptExportData): CustomPrompt[] {
  const now = Date.now()

  return data.prompts.map(prompt => ({
    ...prompt,
    id: `custom_${now}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
    usageCount: 0
  }))
}

export function getPromptStats(prompts: CustomPrompt[]) {
  const total = prompts.length
  const active = prompts.filter(p => p.isActive).length
  const favorites = prompts.filter(p => p.isFavorite).length

  const categoryStats = Object.values(PromptCategory).reduce(
    (acc, category) => {
      acc[category] = prompts.filter(p => p.category === category).length
      return acc
    },
    {} as Record<PromptCategory, number>
  )

  const priorityStats = Object.values(PromptPriority).reduce(
    (acc, priority) => {
      acc[priority] = prompts.filter(p => p.priority === priority).length
      return acc
    },
    {} as Record<PromptPriority, number>
  )

  return {
    total,
    active,
    favorites,
    categoryStats,
    priorityStats
  }
}
