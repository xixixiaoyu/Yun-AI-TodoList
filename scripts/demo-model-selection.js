#!/usr/bin/env node

/**
 * AI 模型切换功能演示脚本
 *
 * 这个脚本演示了如何在代码中使用模型切换功能
 */

console.log('🤖 AI 模型切换功能演示\n')

const mockLocalStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null
  },
  setItem(key, value) {
    this.data[key] = value
    console.log(`💾 保存到 localStorage: ${key} = ${value}`)
  },
}

class ConfigService {
  constructor() {
    this.storage = mockLocalStorage
    this.aiModel = this.storage.getItem('deepseek_ai_model') || 'deepseek-chat'
  }

  getAIModel() {
    return this.aiModel
  }

  saveAIModel(model) {
    this.aiModel = model
    this.storage.setItem('deepseek_ai_model', model)
  }
}

class AIService {
  constructor(configService) {
    this.config = configService
  }

  async makeRequest(endpoint, data) {
    const model = this.config.getAIModel()
    console.log(`🌐 发送 API 请求到 ${endpoint}`)
    console.log(`📋 使用模型: ${model}`)
    console.log(`📝 请求数据:`, JSON.stringify(data, null, 2))

    const responses = {
      'deepseek-chat': '这是来自 DeepSeek Chat 的快速响应！',
      'deepseek-reasoner': '这是来自 DeepSeek Reasoner 的深度推理响应，经过仔细分析...',
    }

    return {
      model: model,
      response: responses[model] || '未知模型响应',
    }
  }

  async getAIResponse(message) {
    return await this.makeRequest('/chat/completions', {
      model: this.config.getAIModel(),
      messages: [{ role: 'user', content: message }],
    })
  }
}

async function demonstrateModelSwitching() {
  const config = new ConfigService()
  const aiService = new AIService(config)

  console.log('📍 步骤 1: 检查默认模型')
  console.log(`当前模型: ${config.getAIModel()}\n`)

  console.log('📍 步骤 2: 使用默认模型发送请求')
  let result = await aiService.getAIResponse('你好，请介绍一下自己')
  console.log(`✅ 响应: ${result.response}\n`)

  console.log('📍 步骤 3: 切换到 DeepSeek Reasoner 模型')
  config.saveAIModel('deepseek-reasoner')
  console.log(`新模型: ${config.getAIModel()}\n`)

  console.log('📍 步骤 4: 使用新模型发送相同请求')
  result = await aiService.getAIResponse('你好，请介绍一下自己')
  console.log(`✅ 响应: ${result.response}\n`)

  console.log('📍 步骤 5: 切换回 DeepSeek Chat 模型')
  config.saveAIModel('deepseek-chat')
  console.log(`切换回模型: ${config.getAIModel()}\n`)

  console.log('📍 步骤 6: 验证模型切换生效')
  result = await aiService.getAIResponse('简单问题测试')
  console.log(`✅ 响应: ${result.response}\n`)

  console.log('🎉 演示完成！模型切换功能正常工作。')
}

function showModelInfo() {
  console.log('📚 支持的模型信息:')
  console.log('┌─────────────────────┬──────────────────────────────────────┐')
  console.log('│ 模型名称            │ 描述                                 │')
  console.log('├─────────────────────┼──────────────────────────────────────┤')
  console.log('│ deepseek-chat       │ 适合日常对话和通用任务的模型         │')
  console.log('│ deepseek-reasoner   │ 具有推理能力的高级模型，适合复杂问题 │')
  console.log('└─────────────────────┴──────────────────────────────────────┘\n')
}

function showUsageInstructions() {
  console.log('📖 在实际应用中的使用方法:')
  console.log('')
  console.log('1. 在设置页面选择模型:')
  console.log('   - 访问 /#/settings')
  console.log('   - 在"模型选择"部分点击想要的模型')
  console.log('')
  console.log('2. 在代码中使用:')
  console.log('   ```typescript')
  console.log('   import { getAIModel, saveAIModel } from "@/services/configService"')
  console.log('   ')
  console.log('   // 获取当前模型')
  console.log('   const currentModel = getAIModel()')
  console.log('   ')
  console.log('   // 切换模型')
  console.log('   saveAIModel("deepseek-reasoner")')
  console.log('   ```')
  console.log('')
  console.log('3. API 调用会自动使用选择的模型:')
  console.log('   - getAIStreamResponse() - 流式响应')
  console.log('   - getAIResponse() - 普通响应')
  console.log('   - optimizeText() - 文本优化')
  console.log('')
}

async function main() {
  try {
    showModelInfo()
    await demonstrateModelSwitching()
    console.log('')
    showUsageInstructions()
  } catch (error) {
    console.error('❌ 演示过程中出现错误:', error.message)
  }
}

main()
