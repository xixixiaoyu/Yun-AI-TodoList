# AI 模型切换功能

## 概述

本项目现在支持在 DeepSeek Chat 和 DeepSeek
Reasoner 两个 AI 模型之间进行切换，为用户提供更灵活的 AI 助手体验。

## 支持的模型

### DeepSeek Chat

- **模型标识**: `deepseek-chat`
- **适用场景**: 日常对话和通用任务
- **特点**: 响应速度快，适合一般性问答和聊天
- **默认模型**: ✅

### DeepSeek Reasoner

- **模型标识**: `deepseek-reasoner`
- **适用场景**: 复杂问题和需要推理的任务
- **特点**: 具有更强的推理能力，适合解决复杂问题

## 如何使用

### 1. 访问设置页面

1. 打开应用
2. 点击导航栏中的"设置"按钮
3. 或直接访问 `/#/settings`

### 2. 选择模型

1. 在设置页面中找到"模型选择"部分
2. 点击想要使用的模型选项
3. 选择会自动保存，无需额外操作

### 3. 验证模型切换

- 当前选择的模型会在"当前模型"部分显示
- 所有后续的 AI 对话都会使用新选择的模型

## 技术实现

### 配置管理

```typescript
// 获取当前模型
import { getAIModel } from '@/services/configService'
const currentModel = getAIModel() // 'deepseek-chat' | 'deepseek-reasoner'

// 保存模型选择
import { saveAIModel } from '@/services/configService'
saveAIModel('deepseek-reasoner')
```

### API 调用

所有 AI 服务调用都会自动使用当前选择的模型：

```typescript
// 流式响应
await getAIStreamResponse(messages, onChunk)

// 普通响应
await getAIResponse(userMessage)

// 文本优化
await optimizeText(text)
```

### 数据持久化

- 模型选择会自动保存到 `localStorage`
- 存储键: `deepseek_ai_model`
- 默认值: `deepseek-chat`

## 组件结构

### ModelSelectionSection.vue

模型选择的主要 UI 组件，包含：

- 模型选项列表
- 单选按钮界面
- 当前模型显示
- 响应式状态管理

### 国际化支持

支持中英文界面：

**中文**:

- 模型选择
- DeepSeek Chat: 适合日常对话和通用任务的模型
- DeepSeek Reasoner: 具有推理能力的高级模型，适合复杂问题

**English**:

- Model Selection
- DeepSeek Chat: General-purpose model for daily conversations and common tasks
- DeepSeek Reasoner: Advanced model with reasoning capabilities for complex
  problems

## 测试

### 单元测试

```bash
npm run test:unit src/test/unit/modelSelection.test.ts
```

### 集成测试

```bash
npm run test:integration src/test/integration/modelIntegration.test.ts
```

## 注意事项

1. **API 密钥**: 确保已配置有效的 DeepSeek API 密钥
2. **网络连接**: 模型切换需要网络连接来验证 API 调用
3. **兼容性**: 两个模型都使用相同的 API 接口，切换无缝
4. **性能**: DeepSeek Reasoner 可能比 Chat 模型响应稍慢，但推理能力更强

## 故障排除

### 模型切换不生效

1. 检查浏览器控制台是否有错误
2. 确认 localStorage 中的 `deepseek_ai_model` 值
3. 刷新页面重新加载配置

### API 调用失败

1. 验证 API 密钥是否正确
2. 检查网络连接
3. 确认 DeepSeek API 服务状态

## 未来扩展

该架构支持轻松添加更多模型：

1. 在 `types.ts` 中扩展 `AIModel` 类型
2. 在 `ModelSelectionSection.vue` 中添加新的模型选项
3. 更新国际化文件添加新模型的描述
