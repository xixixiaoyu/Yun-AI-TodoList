<template>
  <div
    class="bg-bg-card rounded-xl border border-input-border/30 cursor-pointer transition-all-300 hover:border-primary/50 hover:bg-primary/5 hover:transform-hover-up-1"
    @click="$emit('showPopover')"
  >
    <div class="p-4">
      <div class="flex items-center gap-3 mb-3">
        <div
          class="w-3 h-3 rounded-full relative flex-shrink-0"
          :class="{
            'bg-green-500 shadow-[0_0_8px_rgba(76,175,80,0.4)]': isConfigured,
            'bg-red-300 shadow-[0_0_8px_rgba(252,165,165,0.3)]': !isConfigured,
          }"
        />
        <div class="flex-1">
          <div class="text-sm font-medium text-text">
            {{ isConfigured ? t('apiKeyConfigured') : t('apiKeyNotConfigured') }}
          </div>
          <div class="text-xs text-text-secondary mt-0.5">
            {{ isConfigured ? configSummary : t('clickToConfigureApiKey') }}
          </div>
        </div>
      </div>

      <button
        class="w-full bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium transition-all-300 hover:bg-primary-hover hover:transform-hover-up-1 flex items-center justify-center gap-2"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"
          />
        </svg>
        {{ isConfigured ? t('reconfigure') : t('configure') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  localApiKey: string
  localBaseUrl: string
  localModel: string
  localProvider: string
}

interface Emits {
  (e: 'showPopover'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const { t } = useI18n()

// 检查是否已配置
const isConfigured = computed(() => {
  return props.localApiKey.trim() !== ''
})

// 提供商配置映射
const providerConfigs = {
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    models: {
      'deepseek-chat': 'DeepSeek Chat',
      'deepseek-reasoner': 'DeepSeek Reasoner',
    },
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: {
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    },
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    models: {
      'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
      'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
      'claude-3-opus-20240229': 'Claude 3 Opus',
    },
  },
  google: {
    name: 'Google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: {
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'gemini-1.5-flash': 'Gemini 1.5 Flash',
      'gemini-pro': 'Gemini Pro',
    },
  },
  moonshot: {
    name: 'Moonshot AI (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: {
      'kimi-k2-0711-preview': 'Kimi K2 Preview',
      'moonshot-v1-8k': 'Moonshot V1 8K',
      'moonshot-v1-32k': 'Moonshot V1 32K',
      'moonshot-v1-128k': 'Moonshot V1 128K',
      'moonshot-v1-auto': 'Moonshot V1 Auto',
      'kimi-latest': 'Kimi Latest',
      'moonshot-v1-8k-vision-preview': 'Moonshot V1 8K Vision Preview',
      'moonshot-v1-32k-vision-preview': 'Moonshot V1 32K Vision Preview',
      'moonshot-v1-128k-vision-preview': 'Moonshot V1 128K Vision Preview',
      'kimi-thinking-preview': 'Kimi Thinking Preview',
    },
  },
  custom: {
    name: '自定义',
    baseUrl: '',
    models: {},
  },
}

// 配置摘要
const configSummary = computed(() => {
  if (!isConfigured.value) return ''

  const parts = []
  const config = providerConfigs[props.localProvider as keyof typeof providerConfigs]

  // 显示提供商名称
  if (config) {
    parts.push(config.name)
  }

  // 显示模型
  if (props.localModel) {
    const modelName =
      config?.models[props.localModel as keyof typeof config.models] || props.localModel
    parts.push(modelName)
  }

  // 显示基础 URL（如果不是默认的）
  if (props.localBaseUrl && config && props.localBaseUrl !== config.baseUrl) {
    try {
      const url = new URL(props.localBaseUrl)
      parts.push(url.hostname)
    } catch {
      parts.push('自定义 URL')
    }
  }

  return parts.length > 0 ? parts.join(' • ') : t('apiKeySaved')
})

defineOptions({
  name: 'AIProviderCard',
})
</script>
