# AI 助手消息重新编辑功能

## 功能概述

为 AI 助手对话界面添加了消息重新编辑功能，允许用户编辑已发送的消息并触发 AI 重新生成回答。

## 功能特性

### 1. 用户消息编辑

- ✅ 在用户发送的每条消息旁边添加"编辑"按钮
- ✅ 点击编辑后，消息内容转换为可编辑的文本域
- ✅ 支持键盘快捷键：
  - `Escape` - 取消编辑
  - `Ctrl/Cmd + Enter` - 保存并重新生成
- ✅ 自动调整文本域高度

### 2. 重新生成机制

- ✅ 编辑消息后自动触发 AI 重新生成回答
- ✅ 基于编辑后的消息内容和之前的对话上下文
- ✅ 删除编辑消息之后的所有消息，保持对话连续性
- ✅ 保留文件上传信息（如果原消息包含文件）

### 3. 用户体验优化

- ✅ 编辑操作直观易用，悬浮显示编辑按钮
- ✅ 重新生成过程中显示加载指示器
- ✅ 支持取消编辑操作
- ✅ 响应式设计，支持桌面端和移动端
- ✅ 遵循现有设计风格，无黑色边框

## 技术实现

### 1. 组件结构

```
ChatMessage.vue (主要修改)
├── 编辑模式界面
├── 显示模式界面
└── 编辑功能逻辑

ChatMessageList.vue (事件传递)
├── 传递编辑事件
└── 传递重新生成状态

AIChatContent.vue (事件中转)
└── 连接消息列表和侧边栏

AISidebar.vue (事件处理)
└── 调用编辑消息方法
```

### 2. 核心功能

- **editMessage()** - 编辑消息并重新生成的核心方法
- **isRegenerating** - 重新生成状态管理
- **消息状态管理** - 更新消息内容并删除后续消息

### 3. 新增文件

- `EditIcon.vue` - 编辑图标组件
- 国际化文本：`editMessage`, `saveAndRegenerate`, `regenerating`

## 使用方法

1. **编辑消息**：

   - 将鼠标悬停在用户消息上
   - 点击右下角的编辑图标
   - 在文本域中修改消息内容

2. **保存并重新生成**：

   - 点击"保存并重新生成"按钮
   - 或使用快捷键 `Ctrl/Cmd + Enter`
   - AI 将基于新内容重新生成回答

3. **取消编辑**：
   - 点击"取消"按钮
   - 或按 `Escape` 键

## 代码变更

### 主要修改的文件

1. `apps/frontend/src/components/chat/ChatMessage.vue` - 添加编辑界面和逻辑
2. `apps/frontend/src/components/chat/ChatMessageList.vue` - 传递编辑事件
3. `apps/frontend/src/components/chat/AIChatContent.vue` - 事件中转
4. `apps/frontend/src/components/AISidebar.vue` - 处理编辑事件
5. `apps/frontend/src/composables/useChat.ts` - 核心编辑逻辑

### 新增文件

1. `apps/frontend/src/components/common/icons/EditIcon.vue` - 编辑图标

### 国际化更新

1. `apps/frontend/src/locales/zh.json` - 中文文本
2. `apps/frontend/src/locales/en.json` - 英文文本

## 技术细节

### 状态管理

- `isEditing` - 控制编辑模式
- `editContent` - 编辑内容
- `isRegenerating` - 重新生成状态

### 事件流

```
用户点击编辑 → ChatMessage.startEdit()
用户保存编辑 → ChatMessage.saveEdit()
发送编辑事件 → ChatMessageList.handleEditMessage()
传递到父组件 → AIChatContent → AISidebar
调用编辑方法 → useChat.editMessage()
更新消息内容 → 删除后续消息 → 重新发送
```

### 样式特点

- 使用 UnoCSS 实现响应式设计
- 遵循现有视觉风格
- 毛玻璃效果和柔和阴影
- 平滑的过渡动画

## 兼容性

- ✅ 与现有重试功能兼容
- ✅ 与文件上传功能兼容
- ✅ 与对话历史管理兼容
- ✅ 支持桌面端和移动端
- ✅ 支持深色/浅色主题

## 测试建议

1. **基本功能测试**：

   - 编辑消息并重新生成
   - 取消编辑操作
   - 键盘快捷键

2. **边界情况测试**：

   - 空消息编辑
   - 包含文件的消息编辑
   - 对话历史中间消息的编辑

3. **用户体验测试**：
   - 响应式设计
   - 加载状态显示
   - 错误处理

## 未来改进

1. **批量编辑** - 支持同时编辑多条消息
2. **编辑历史** - 保存消息的编辑历史
3. **智能建议** - AI 辅助优化消息内容
4. **协作编辑** - 多用户协作编辑功能
