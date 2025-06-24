<template>
  <div class="test-container">
    <h2>TodoInput 错误提示测试</h2>

    <div class="test-section">
      <h3>测试场景 1: 空输入错误</h3>
      <p>点击"添加"按钮而不输入任何内容，应该显示红色边框和错误图标，鼠标悬停显示错误提示。</p>
      <TodoInput :max-length="50" placeholder="测试空输入错误..." @add="handleAdd" />
    </div>

    <div class="test-section">
      <h3>测试场景 2: 长度超限错误</h3>
      <p>输入超过10个字符的内容，应该显示长度超限错误。</p>
      <TodoInput
        :max-length="10"
        placeholder="测试长度超限错误（最多10字符）..."
        @add="handleAdd"
      />
    </div>

    <div class="test-section">
      <h3>测试场景 3: 重复内容错误</h3>
      <p>模拟重复内容错误提示。点击按钮切换错误状态。</p>
      <button @click="toggleDuplicateError" class="test-btn">
        {{ duplicateError ? '清除重复错误' : '显示重复错误' }}
      </button>
      <TodoInput
        :max-length="50"
        :duplicate-error="duplicateError"
        placeholder="测试重复内容错误..."
        @add="handleAdd"
        @clear-duplicate-error="clearDuplicateError"
      />
    </div>

    <div class="test-section">
      <h3>测试场景 4: 正常输入</h3>
      <p>正常输入应该没有错误状态。</p>
      <TodoInput :max-length="50" placeholder="正常输入测试..." @add="handleAdd" />
    </div>

    <div class="test-results">
      <h3>测试结果</h3>
      <ul>
        <li v-for="result in testResults" :key="result.id">
          {{ result.message }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import TodoInput from './TodoInput.vue'

const testResults = ref<Array<{ id: number; message: string }>>([])
const duplicateError = ref('')
let resultId = 0

const handleAdd = (text: string, tags: string[]) => {
  testResults.value.push({
    id: ++resultId,
    message: `添加成功: "${text}" (标签: ${tags.join(', ') || '无'})`,
  })
}

const toggleDuplicateError = () => {
  duplicateError.value = duplicateError.value ? '' : '该待办事项已存在'
}

const clearDuplicateError = () => {
  duplicateError.value = ''
  testResults.value.push({
    id: ++resultId,
    message: '重复错误已清除',
  })
}
</script>

<style scoped>
.test-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.test-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.test-section h3 {
  margin-top: 0;
  color: #374151;
}

.test-section p {
  color: #6b7280;
  margin-bottom: 15px;
}

.test-results {
  margin-top: 40px;
  padding: 20px;
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
}

.test-results h3 {
  margin-top: 0;
  color: #0c4a6e;
}

.test-results ul {
  list-style-type: none;
  padding: 0;
}

.test-results li {
  padding: 8px 0;
  border-bottom: 1px solid #e0f2fe;
  color: #0c4a6e;
}

.test-results li:last-child {
  border-bottom: none;
}

.test-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 15px;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.test-btn:hover {
  background: #2563eb;
}
</style>
