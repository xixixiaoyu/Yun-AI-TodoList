# Todo 任务助手功能

## 功能概述

Todo 任务助手是一个基于系统提示词的智能助手功能，能够将用户的待办事项信息作为系统提示词传递给 AI，让用户可以直接询问关于自己任务的任何问题，获得个性化的任务管理建议和分析。

## 功能特点

### 1. 系统提示词集成

- 将待办事项信息自动生成为系统提示词
- AI 能够了解用户的所有任务详情
- 支持实时更新任务信息到系统提示词
- 一键激活/停用 Todo 任务助手

### 2. 个性化任务咨询

用户可以直接询问关于自己任务的任何问题：

- **任务优先级分析** - "哪些任务最重要？如何安排优先级？"
- **时间规划建议** - "如何合理安排今天的任务时间？"
- **效率提升建议** - "根据我的任务完成情况，有什么效率提升建议？"
- **任务分解指导** - "这个复杂任务应该如何分解？"
- **工作总结分析** - "我最近的工作表现如何？有什么改进空间？"

### 3. 智能数据分析

系统提示词包含详细的任务信息：

- 待完成任务详情（优先级、时间估算、标签、创建时间）
- 已完成任务历史（最近10个任务的完成情况）
- 任务统计概览（总数、高优先级、未分析等）
- AI 分析状态和时间估算信息

## 技术实现

### 核心文件结构

```
src/
├── services/
│   └── aiAnalysisService.ts          # Todo 系统提示词生成服务
├── composables/
│   ├── useSmartQuestion.ts           # Todo 系统提示词管理组合式函数
│   └── useSystemPrompts.ts           # 系统提示词基础管理
├── components/
│   └── chat/
│       ├── ChatToolbar.vue           # 工具栏（包含 Todo 助手按钮）
│       └── AIChatContent.vue         # AI 聊天内容组件
└── locales/
    ├── zh.json                       # 中文国际化
    └── en.json                       # 英文国际化
```

### 主要功能模块

#### 1. Todo 系统提示词生成服务 (`aiAnalysisService.ts`)

```typescript
// 生成包含待办事项信息的系统提示词
export function generateTodoSystemPrompt(todos: Todo[]): string
```

#### 2. Todo 系统提示词管理组合式函数 (`useSmartQuestion.ts`)

```typescript
export function useTodoSystemPrompt() {
  return {
    isGenerating, // 生成状态
    todoPromptId, // Todo 提示词 ID
    generateAndActivateTodoPrompt, // 生成并激活 Todo 系统提示词
    deactivateTodoPrompt, // 停用 Todo 系统提示词
    isTodoPromptActive, // 检查是否已激活
  }
}
```

#### 3. UI 组件集成

**ChatToolbar.vue** - 添加智能提问按钮：

- 💡 图标按钮，支持加载状态
- 响应式设计，适配桌面端和移动端
- 无黑色边框，符合设计风格

**AIChatContent.vue** - 处理智能提问事件：

- 接收智能提问结果
- 自动填入 AI 助手输入框

## 使用方式

### 1. 用户操作流程

1. 用户点击 AI 助手工具栏中的 🤖 Todo 助手按钮
2. 系统自动分析当前待办事项数据
3. 生成包含任务信息的系统提示词
4. 激活系统提示词功能，AI 获得任务上下文
5. 用户可以直接询问关于任务的任何问题

### 2. 系统提示词内容

系统提示词包含以下信息：

#### 任务概览统计

- 待完成任务数量
- 已完成任务数量
- 高优先级任务数量
- 未进行 AI 分析的任务数量
- 有时间估算的任务数量
- 近一周完成的任务数量

#### 详细任务信息

- **待完成任务**：任务内容、优先级、预估时间、标签、AI 分析状态、创建时间
- **已完成任务**：最近 10 个已完成任务的详细信息和完成时间

#### AI 助手角色定义

- 专业的个人任务管理助手
- 基于用户实际任务数据进行分析
- 提供个性化建议和可操作的指导

## 国际化支持

### 中文 (zh.json)

```json
{
  "todoAssistant": "Todo 助手",
  "todoAssistantActive": "Todo 助手已激活",
  "todoAssistantTitle": "点击激活 Todo 任务助手，AI 将了解您的所有任务信息",
  "todoAssistantActiveTitle": "点击停用 Todo 任务助手",
  "todoPromptActivated": "Todo 任务助手已激活，现在可以询问关于您任务的任何问题",
  "todoPromptDeactivated": "Todo 任务助手已停用",
  "todoPromptError": "激活 Todo 任务助手失败，请重试",
  "todoPromptDeactivateError": "停用 Todo 任务助手失败，请重试"
}
```

### 英文 (en.json)

```json
{
  "todoAssistant": "Todo Assistant",
  "todoAssistantActive": "Todo Assistant Active",
  "todoAssistantTitle": "Click to activate Todo Assistant, AI will understand all your task information",
  "todoAssistantActiveTitle": "Click to deactivate Todo Assistant",
  "todoPromptActivated": "Todo Assistant activated, you can now ask any questions about your tasks",
  "todoPromptDeactivated": "Todo Assistant deactivated",
  "todoPromptError": "Failed to activate Todo Assistant, please try again",
  "todoPromptDeactivateError": "Failed to deactivate Todo Assistant, please try again"
}
```

## 使用示例

激活 Todo 任务助手后，用户可以询问各种关于任务的问题：

### 优先级和规划类问题

- _"我今天应该优先完成哪些任务？"_
- _"根据我的任务情况，如何安排这周的工作计划？"_
- _"哪些高优先级任务需要立即处理？"_

### 效率分析类问题

- _"我的任务完成效率如何？有什么改进建议？"_
- _"从我已完成的任务中，能总结出什么工作模式？"_
- _"我在哪些类型的任务上花费时间最多？"_

### 任务管理类问题

- _"我有哪些任务还没有进行 AI 分析？"_
- _"如何更好地估算任务时间？"_
- _"我的任务标签使用是否合理？"_

### 具体任务指导

- _"'完成项目报告'这个任务应该如何分解？"_
- _"我应该如何平衡工作任务和生活任务？"_
- _"基于我的任务历史，什么时候完成任务效率最高？"_

## 🚀 技术特色

- **Vue 3 + TypeScript** 现代化技术栈
- **系统提示词集成** 与现有系统提示词管理无缝集成
- **实时数据同步** 任务信息实时更新到系统提示词
- **响应式设计** 适配多种设备
- **国际化支持** 中英文双语
- **模块化架构** 易于维护和扩展

## 设计原则

### 1. 用户体验优先

- 一键激活，操作简单
- 按钮状态清晰反馈（激活/未激活）
- 加载状态和错误处理友好

### 2. 智能化程度高

- 基于真实任务数据生成系统提示词
- AI 能够理解用户的具体任务情况
- 支持自然语言询问任何任务相关问题

### 3. 技术架构清晰

- 与现有系统提示词管理集成
- 模块化设计，职责分离
- 可测试性强，易于扩展维护

### 4. 视觉设计协调

- 🤖 机器人图标，直观表达 AI 助手概念
- 激活状态有明显的视觉反馈
- 符合整体设计风格，无黑色边框设计

## 未来扩展

1. **智能更新机制**：任务变更时自动更新系统提示词
2. **多维度分析**：添加时间维度、项目维度的任务分析
3. **个性化建议**：基于用户行为模式提供个性化建议
4. **团队协作支持**：支持团队任务的协作分析
5. **数据可视化**：结合图表展示任务分析结果
6. **语音交互**：支持语音询问任务相关问题
