<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div
      class="bg-settings-card-bg rounded-2xl border border-settings-card-border w-full max-w-md transform transition-all duration-300 ease-out scale-100 opacity-100"
      style="box-shadow: var(--settings-card-shadow)"
    >
      <!-- 头部 -->
      <div class="p-6 pb-4">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
              />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-text">{{ t('secureConfigureApiKey') }}</h3>
        </div>

        <!-- 安全提示 -->
        <div
          class="rounded-lg p-3 mb-6"
          style="
            background-color: var(--settings-primary-ultra-light);
            border: 1px solid var(--settings-primary-soft);
          "
        >
          <div class="flex items-start gap-2">
            <svg
              class="w-4 h-4 mt-0.5 flex-shrink-0"
              style="color: var(--settings-primary)"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <p class="text-sm" style="color: var(--settings-primary)">
              {{ t('apiKeyStoredLocally') }}
            </p>
          </div>
        </div>
      </div>

      <!-- 表单内容 -->
      <div class="px-6 pb-6 space-y-4">
        <!-- API 密钥 -->
        <div>
          <label class="block text-sm font-medium text-text mb-2">{{ t('enterApiKey') }}</label>
          <div class="relative">
            <input
              :type="showApiKey ? 'text' : 'password'"
              :value="localApiKey"
              class="w-full px-3 py-2 pr-10 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-opacity-50"
              :style="{
                backgroundColor: 'var(--settings-input-bg)',
                borderColor: 'var(--settings-input-border)',
                color: 'var(--text-color)',
                '--placeholder-color': 'var(--text-secondary-color)',
                'box-shadow': 'var(--settings-input-focus-shadow)',
                '--tw-ring-color': 'var(--settings-primary)',
                border: '1px solid var(--settings-input-border)',
              }"
              :placeholder="t('enterApiKey')"
              @input="$emit('update:localApiKey', ($event.target as HTMLInputElement).value)"
              @focus="
                ($event.target as HTMLInputElement).style.borderColor =
                  'var(--settings-input-focus-border)'
              "
              @blur="
                ($event.target as HTMLInputElement).style.borderColor =
                  'var(--settings-input-border)'
              "
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-text-secondary hover:text-text transition-colors"
              @click="$emit('update:showApiKey', !showApiKey)"
            >
              <svg v-if="showApiKey" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                  clip-rule="evenodd"
                />
                <path
                  d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"
                />
              </svg>
              <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fill-rule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- AI 提供商选择 -->
        <div>
          <label class="block text-sm font-medium text-text mb-2">AI 提供商</label>
          <select
            :value="localProvider"
            class="w-full px-3 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-opacity-50"
            :style="{
              backgroundColor: 'var(--settings-input-bg)',
              borderColor: 'var(--settings-input-border)',
              color: 'var(--text-color)',
              '--tw-ring-color': 'var(--settings-primary)',
              border: '1px solid var(--settings-input-border)',
            }"
            @change="handleProviderChange(($event.target as HTMLSelectElement).value)"
            @focus="
              ($event.target as HTMLSelectElement).style.borderColor =
                'var(--settings-input-focus-border)'
            "
            @blur="
              ($event.target as HTMLSelectElement).style.borderColor =
                'var(--settings-input-border)'
            "
          >
            <option value="deepseek">DeepSeek</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="google">Google (Gemini)</option>
            <option value="moonshot">Moonshot AI (Kimi)</option>
            <option value="custom">自定义</option>
          </select>
          <p class="text-xs text-text-secondary mt-1">选择 AI 服务提供商</p>
        </div>

        <!-- 基础 URL -->
        <div>
          <label class="block text-sm font-medium text-text mb-2">基础 URL</label>
          <input
            type="url"
            :value="localBaseUrl"
            class="w-full px-3 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-opacity-50"
            :style="{
              backgroundColor: 'var(--settings-input-bg)',
              borderColor: 'var(--settings-input-border)',
              color: 'var(--text-color)',
              '--tw-ring-color': 'var(--settings-primary)',
              border: '1px solid var(--settings-input-border)',
            }"
            :placeholder="getBaseUrlPlaceholder()"
            @input="$emit('update:localBaseUrl', ($event.target as HTMLInputElement).value)"
            @focus="
              ($event.target as HTMLInputElement).style.borderColor =
                'var(--settings-input-focus-border)'
            "
            @blur="
              ($event.target as HTMLInputElement).style.borderColor = 'var(--settings-input-border)'
            "
          />
          <p class="text-xs text-text-secondary mt-1">API 服务器地址，留空使用默认地址</p>
        </div>

        <!-- 模型选择 -->
        <div>
          <label class="block text-sm font-medium text-text mb-2">模型</label>
          <div class="relative">
            <input
              type="text"
              :value="localModel"
              :list="`models-${localProvider}`"
              class="w-full px-3 py-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-opacity-50"
              :style="{
                backgroundColor: 'var(--settings-input-bg)',
                borderColor: 'var(--settings-input-border)',
                color: 'var(--text-color)',
                '--tw-ring-color': 'var(--settings-primary)',
                border: '1px solid var(--settings-input-border)',
              }"
              :placeholder="getModelPlaceholder()"
              @input="$emit('update:localModel', ($event.target as HTMLInputElement).value)"
              @focus="
                ($event.target as HTMLInputElement).style.borderColor =
                  'var(--settings-input-focus-border)'
              "
              @blur="
                ($event.target as HTMLInputElement).style.borderColor =
                  'var(--settings-input-border)'
              "
            />
            <datalist :id="`models-${localProvider}`">
              <option v-for="model in getAvailableModels()" :key="model.value" :value="model.value">
                {{ model.label }}
              </option>
            </datalist>
          </div>
          <p class="text-xs text-text-secondary mt-1">输入模型名称，可从下拉列表选择常用模型</p>
        </div>

        <!-- 提示链接 -->
        <div v-if="getProviderDocUrl()" class="text-center">
          <a
            :href="getProviderDocUrl()"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-primary hover:text-primary-hover transition-colors inline-flex items-center gap-1"
          >
            获取 {{ getProviderName() }} API Key
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </a>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="p-6 pt-0 flex gap-3">
        <button
          class="flex-1 px-4 py-2 rounded-lg transition-all font-medium"
          style="
            color: var(--error-color);
            border: 1px solid var(--error-color);
            background-color: transparent;
          "
          @click="$emit('clear')"
          @mouseenter="
            ($event.target as HTMLButtonElement).style.backgroundColor =
              'var(--settings-primary-ultra-light)'
          "
          @mouseleave="($event.target as HTMLButtonElement).style.backgroundColor = 'transparent'"
        >
          清除配置
        </button>
        <button
          class="flex-1 px-4 py-2 rounded-lg transition-all font-medium"
          style="
            color: var(--text-secondary-color);
            border: 1px solid var(--settings-input-border);
            background-color: var(--settings-button-secondary-bg);
          "
          @click="$emit('close')"
          @mouseenter="
            ($event.target as HTMLButtonElement).style.backgroundColor =
              'var(--settings-button-secondary-hover)'
          "
          @mouseleave="
            ($event.target as HTMLButtonElement).style.backgroundColor =
              'var(--settings-button-secondary-bg)'
          "
        >
          {{ t('cancel') }}
        </button>
        <button
          :disabled="!localApiKey.trim()"
          class="flex-1 px-4 py-2 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          style="
            background-color: var(--settings-button-primary-bg);
            color: var(--text-color);
            border: none;
          "
          @click="$emit('save')"
          @mouseenter="
            !($event.target as HTMLButtonElement).disabled &&
            (($event.target as HTMLButtonElement).style.backgroundColor =
              'var(--settings-button-primary-hover)')
          "
          @mouseleave="
            !($event.target as HTMLButtonElement).disabled &&
            (($event.target as HTMLButtonElement).style.backgroundColor =
              'var(--settings-button-primary-bg)')
          "
        >
          {{ t('confirm') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  localApiKey: string
  localBaseUrl: string
  localModel: string
  localProvider: string
  showApiKey: boolean
}

interface Emits {
  (e: 'update:localApiKey', value: string): void
  (e: 'update:localBaseUrl', value: string): void
  (e: 'update:localModel', value: string): void
  (e: 'update:localProvider', value: string): void
  (e: 'update:showApiKey', value: boolean): void
  (e: 'close'): void
  (e: 'save'): void
  (e: 'clear'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

// 提供商配置
const providerConfigs = {
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    models: [
      { value: 'deepseek-chat', label: 'DeepSeek Chat' },
      { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
    ],
    defaultModel: 'deepseek-reasoner',
    docUrl: 'https://platform.deepseek.com/api_keys',
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
    defaultModel: 'gpt-4o',
    docUrl: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    models: [
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
      { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    ],
    defaultModel: 'claude-3-5-sonnet-20241022',
    docUrl: 'https://console.anthropic.com/settings/keys',
  },
  google: {
    name: 'Google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: [
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
      { value: 'gemini-pro', label: 'Gemini Pro' },
    ],
    defaultModel: 'gemini-1.5-pro',
    docUrl: 'https://aistudio.google.com/app/apikey',
  },
  moonshot: {
    name: 'Moonshot AI (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { value: 'kimi-k2-0711-preview', label: 'Kimi K2 Preview' },
      { value: 'moonshot-v1-8k', label: 'Moonshot V1 8K' },
      { value: 'moonshot-v1-32k', label: 'Moonshot V1 32K' },
      { value: 'moonshot-v1-128k', label: 'Moonshot V1 128K' },
      { value: 'moonshot-v1-auto', label: 'Moonshot V1 Auto' },
      { value: 'kimi-latest', label: 'Kimi Latest' },
      { value: 'moonshot-v1-8k-vision-preview', label: 'Moonshot V1 8K Vision' },
      { value: 'moonshot-v1-32k-vision-preview', label: 'Moonshot V1 32K Vision' },
      { value: 'moonshot-v1-128k-vision-preview', label: 'Moonshot V1 128K Vision' },
      { value: 'kimi-thinking-preview', label: 'Kimi Thinking Preview' },
    ],
    defaultModel: 'kimi-latest',
    docUrl: 'https://platform.moonshot.cn/console/api-keys',
  },
  custom: {
    name: '自定义',
    baseUrl: '',
    models: [],
    defaultModel: '',
    docUrl: '',
  },
}

// 处理提供商变更
const handleProviderChange = (provider: string) => {
  emit('update:localProvider', provider)

  // 自动设置默认 URL 和模型
  const config = providerConfigs[provider as keyof typeof providerConfigs]
  if (config && provider !== 'custom') {
    emit('update:localBaseUrl', config.baseUrl)
    emit('update:localModel', config.defaultModel)
  }
}

// 获取基础 URL 占位符
const getBaseUrlPlaceholder = () => {
  const config = providerConfigs[props.localProvider as keyof typeof providerConfigs]
  return config?.baseUrl || 'https://api.example.com'
}

// 获取模型占位符
const getModelPlaceholder = () => {
  const config = providerConfigs[props.localProvider as keyof typeof providerConfigs]
  return config?.defaultModel || '输入模型名称'
}

// 获取可用模型列表
const getAvailableModels = () => {
  const config = providerConfigs[props.localProvider as keyof typeof providerConfigs]
  return config?.models || []
}

// 获取提供商文档链接
const getProviderDocUrl = () => {
  const config = providerConfigs[props.localProvider as keyof typeof providerConfigs]
  return config?.docUrl || ''
}

// 获取提供商名称
const getProviderName = () => {
  const config = providerConfigs[props.localProvider as keyof typeof providerConfigs]
  return config?.name || ''
}

defineOptions({
  name: 'AIProviderPopover',
})
</script>

<style scoped>
/* 弹窗动画 */
.v-enter-active,
.v-leave-active {
  transition: all 0.3s ease;
}

.v-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.v-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* 输入框占位符样式 */
input::placeholder,
select::placeholder {
  color: var(--text-secondary-color) !important;
  opacity: 0.7;
}

/* 确保输入框在暗色模式下的文本颜色 */
input,
select {
  color: var(--text-color) !important;
}

/* 选择框选项样式 */
select option {
  background-color: var(--settings-input-bg);
  color: var(--text-color);
}

/* 聚焦状态样式 */
input:focus,
select:focus {
  border-color: var(--settings-input-focus-border) !important;
  box-shadow: var(--settings-input-focus-shadow) !important;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .max-w-md {
    max-width: calc(100vw - 2rem);
  }
}
</style>
