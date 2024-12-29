# Todo App - 现代化的待办事项管理应用

<p align="center">
  <strong>一个基于 Vue 3 + Electron 的跨平台待办事项管理应用</strong>
</p>

## ✨ 特性

- 🎯 任务管理：创建、编辑、删除和组织待办事项
- 🌙 深色模式：支持浅色/深色主题自动切换
- 🌍 国际化：支持中文和英文界面
- ⏰ 番茄钟：内置番茄工作法计时器
- 📊 数据统计：可视化展示您的工作效率
- 🤖 AI 助手：智能对话助手帮助提升效率
- 💡 每日灵感：获取激励人心的每日格言
- 🖥️ 跨平台：支持 macOS、Windows 和 Linux

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装

```bash
# 克隆项目
git clone [项目地址]

# 安装依赖
pnpm install
```

### 开发

```bash
# 启动开发服务器
pnpm dev

# 启动 Electron 开发环境
pnpm electron:serve
```

### 构建

```bash
# macOS
pnpm electron:build:mac

# Windows
pnpm electron:build:win

# Linux
pnpm electron:build:linux
```

## 🛠️ 技术栈

- Vue 3 - 渐进式 JavaScript 框架
- TypeScript - 类型安全的 JavaScript 超集
- Electron - 跨平台桌面应用开发框架
- Vue Router - 官方路由管理器
- Vue I18n - 国际化解决方案
- Chart.js - 数据可视化
- Vite - 下一代前端构建工具

## 📝 开发指南

### 项目结构

```
src/
├── components/     # 组件目录
├── composables/    # 组合式函数
├── locales/       # 国际化文件
├── router/        # 路由配置
├── services/      # 服务层
├── types/         # TypeScript 类型定义
└── App.vue        # 根组件
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解更多详情
