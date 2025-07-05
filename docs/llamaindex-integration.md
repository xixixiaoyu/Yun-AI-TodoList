# LlamaIndex 集成重构文档

## 概述

本文档描述了 Yun-AI-TodoList 项目中 AI 助手文件上传功能的 LlamaIndex 框架重构。这次重构大大增强了文档处理能力，支持向量化存储、语义搜索和基于文档的智能分析。

## 重构内容

### 1. 后端架构改进

#### 新增模块

- **DocumentsModule**: 文档管理模块
- **LlamaIndexService**: LlamaIndex 核心服务
- **DocumentsService**: 文档业务逻辑服务
- **DocumentsController**: 文档 API 控制器

#### 数据库设计

```sql
-- 文档表
CREATE TABLE documents (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  filename VARCHAR NOT NULL,
  file_type VARCHAR NOT NULL,
  file_size INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- 文档分块表
CREATE TABLE document_chunks (
  id VARCHAR PRIMARY KEY,
  document_id VARCHAR NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding TEXT, -- JSON 格式的向量嵌入
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Todo 表增加文档关联
ALTER TABLE todos ADD COLUMN document_id VARCHAR;
```

### 2. 核心功能

#### LlamaIndex 服务功能

- **文档处理**: 自动分块和向量化
- **语义搜索**: 基于向量相似度的文档搜索
- **文档查询**: RAG（检索增强生成）问答
- **索引管理**: 向量索引的创建和维护

#### API 端点

```typescript
// 文档管理
POST   /api/v1/documents/upload        // 上传文档
GET    /api/v1/documents               // 获取文档列表
GET    /api/v1/documents/:id           // 获取文档详情
DELETE /api/v1/documents/:id           // 删除文档
GET    /api/v1/documents/stats         // 获取统计信息

// 文档搜索和查询
POST   /api/v1/documents/search        // 语义搜索
POST   /api/v1/documents/query         // 文档问答

// 增强的 AI 分析
POST   /api/v1/ai-analysis/document-based/:todoId     // 基于文档的 AI 分析
POST   /api/v1/ai-analysis/batch-document-based       // 批量文档分析
```

### 3. 前端集成

#### 文件上传策略

- **智能路由**: 根据文件大小和类型选择处理方式
- **大文件/复杂文档**: 使用 LlamaIndex 后端处理
- **小文件/简单文本**: 保持原有的直接解析方式

#### 新增组件

- **DocumentManager.vue**: 文档管理界面
- **文档搜索功能**: 语义搜索和结果展示
- **文档统计**: 处理状态和存储信息

## 配置说明

### 环境变量

```bash
# OpenAI API 密钥（用于嵌入模型）
OPENAI_API_KEY=your-openai-api-key

# LlamaIndex 配置
CHUNK_SIZE=1024              # 文档分块大小
CHUNK_OVERLAP=200            # 分块重叠大小
EMBEDDING_MODEL=text-embedding-ada-002  # 嵌入模型

# 文件上传配置
UPLOAD_DEST=./uploads        # 上传文件存储路径
UPLOAD_MAX_SIZE=10485760     # 最大文件大小（10MB）
```

### 数据库迁移

```bash
# 运行数据库迁移
cd apps/backend
pnpm migration:generate add_document_support
pnpm migration:run
```

## 使用方法

### 1. 文档上传

```typescript
import { uploadDocument } from '@/services/documentService'

// 上传文档
const result = await uploadDocument(file)
if (result.success) {
  console.log('文档上传成功:', result.data)
}
```

### 2. 文档搜索

```typescript
import { searchDocuments } from '@/services/documentService'

// 语义搜索
const result = await searchDocuments('项目管理', 5, 0.7)
if (result.success) {
  console.log('搜索结果:', result.data.results)
}
```

### 3. 文档问答

```typescript
import { queryDocuments } from '@/services/documentService'

// 基于文档的问答
const result = await queryDocuments('如何提高工作效率？')
if (result.success) {
  console.log('AI 回答:', result.data.answer)
}
```

### 4. 基于文档的 AI 分析

```typescript
import { createDocumentBasedAnalysis } from '@/services/documentService'

// 为 Todo 创建基于文档的 AI 分析
const result = await createDocumentBasedAnalysis(todoId, '相关查询')
if (result.success) {
  console.log('分析结果:', result.data)
}
```

## 技术优势

### 1. 增强的文档处理

- **多格式支持**: PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, MD, JSON
- **智能分块**: 自动将长文档分割为合适的块
- **向量化存储**: 支持语义搜索和相似度匹配

### 2. RAG 能力

- **上下文感知**: AI 分析基于相关文档内容
- **精准检索**: 向量相似度搜索比关键词搜索更准确
- **智能问答**: 基于文档内容生成准确回答

### 3. 可扩展性

- **模块化设计**: 清晰的架构分层
- **向量数据库**: 支持大规模文档索引
- **异步处理**: 文档处理不阻塞用户操作

## 性能优化

### 1. 异步处理

- 文档上传后立即返回，后台异步处理向量化
- 处理状态实时更新，用户体验良好

### 2. 缓存策略

- 向量嵌入结果缓存，避免重复计算
- 搜索结果缓存，提高响应速度

### 3. 分页和限制

- 文档列表分页加载
- 搜索结果数量限制
- 文件大小和类型限制

## 安全考虑

### 1. 文件验证

- 文件类型白名单
- 文件大小限制
- 恶意文件检测

### 2. 权限控制

- 用户只能访问自己的文档
- API 端点权限验证
- 文档软删除机制

### 3. 数据隐私

- 向量嵌入本地存储
- 敏感信息过滤
- 用户数据隔离

## 监控和维护

### 1. 日志记录

- 文档处理过程日志
- 错误和异常记录
- 性能指标监控

### 2. 健康检查

- LlamaIndex 服务状态
- 向量索引完整性
- 存储空间监控

### 3. 备份策略

- 文档内容备份
- 向量索引备份
- 配置文件备份

## 未来扩展

### 1. 多模态支持

- 图像文档处理
- 音频文件转录
- 视频内容提取

### 2. 高级功能

- 文档摘要生成
- 关键词提取
- 主题分类

### 3. 集成优化

- 更多向量数据库支持
- 分布式处理
- 实时协作功能

## 总结

通过 LlamaIndex 框架的集成，Yun-AI-TodoList 的文档处理能力得到了显著提升。新的架构不仅支持更强大的文档分析功能，还为未来的 AI 功能扩展奠定了坚实的基础。

主要改进包括：

- **智能文档处理**: 自动分块和向量化
- **语义搜索**: 基于内容相似度的精准搜索
- **RAG 增强**: 基于文档上下文的 AI 分析
- **可扩展架构**: 支持未来功能扩展

这次重构为用户提供了更智能、更强大的文档管理和 AI 分析体验。
