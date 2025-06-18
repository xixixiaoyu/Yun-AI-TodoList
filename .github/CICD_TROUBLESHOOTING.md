# CI/CD 故障排除指南

## 🔧 常见问题与解决方案

### Artifact 下载失败

#### 问题描述
```
Error: Unable to download artifact(s): Artifact not found for name: build-files
```

#### 可能原因
1. **版本不兼容**: `upload-artifact` 和 `download-artifact` 版本不匹配
2. **构建失败**: 上游 job 构建失败，artifact 未成功上传
3. **Job 依赖问题**: 下游 job 在上游 job 失败后仍然执行
4. **Artifact 过期**: 默认保留期为 90 天
5. **路径错误**: 构建输出路径不正确

#### 解决方案

##### 1. 确保版本兼容性
```yaml
# 使用匹配的版本
- uses: actions/upload-artifact@v4
- uses: actions/download-artifact@v4
```

##### 2. 添加构建验证
```yaml
- name: 🔍 Verify build output
  run: |
    if [ ! -d "dist" ]; then
      echo "❌ Build failed: dist directory not found"
      exit 1
    fi
    echo "✅ Build successful: dist directory exists"
    ls -la dist/
```

##### 3. 配置 Job 依赖条件
```yaml
performance:
  needs: build
  if: success()  # 只有在 build 成功时才运行
```

##### 4. 改进 Artifact 配置
```yaml
- name: 📦 Upload build artifacts
  uses: actions/upload-artifact@v4
  with:
    name: build-files
    path: dist/
    if-no-files-found: error  # 如果没有文件则失败
    retention-days: 1         # 短期保留
```

##### 5. 添加下载验证
```yaml
- name: 📥 Download build artifacts
  uses: actions/download-artifact@v4
  with:
    name: build-files
    path: dist/
  continue-on-error: false

- name: 🔍 Verify downloaded artifacts
  run: |
    if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
      echo "❌ Build artifacts not found or empty"
      exit 1
    fi
    echo "✅ Build artifacts verified"
```

### 其他常见问题

#### 依赖安装失败
```yaml
- name: 📥 Install dependencies
  run: |
    pnpm install --frozen-lockfile || {
      echo "⚠️ Frozen lockfile failed, trying regular install..."
      pnpm install
    }
```

#### 测试超时
```yaml
- name: 🧪 Run tests
  run: pnpm run test
  timeout-minutes: 10
```

#### 缓存问题
```yaml
- name: 🗑️ Clear cache on failure
  if: failure()
  run: |
    pnpm store prune
    rm -rf node_modules
```

## 📋 最佳实践

### 1. 版本管理
- 使用固定版本的 Actions
- 定期更新到最新稳定版本
- 在 dependabot 中配置 Actions 更新

### 2. 错误处理
- 为关键步骤添加验证
- 使用 `continue-on-error` 适当处理非关键失败
- 添加详细的错误日志

### 3. 性能优化
- 合理设置 artifact 保留期
- 使用缓存减少重复安装
- 并行执行独立的 jobs

### 4. 监控和通知
- 设置失败通知
- 定期检查工作流状态
- 使用 GitHub Status Checks

## 🔍 调试技巧

### 1. 启用调试日志
```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

### 2. 添加诊断步骤
```yaml
- name: 🔍 Debug environment
  run: |
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "PNPM version: $(pnpm --version)"
    echo "Working directory: $(pwd)"
    echo "Directory contents:"
    ls -la
```

### 3. 检查 Artifact 状态
```yaml
- name: 📋 List artifacts
  run: |
    echo "Available artifacts:"
    ls -la . || echo "No artifacts found"
```

## 📞 获取帮助

如果问题仍然存在：
1. 检查 [GitHub Actions 文档](https://docs.github.com/en/actions)
2. 查看 [Actions Toolkit FAQ](https://github.com/actions/toolkit/blob/main/packages/artifact/docs/faq.md)
3. 在项目 Issues 中报告问题
4. 联系团队技术负责人