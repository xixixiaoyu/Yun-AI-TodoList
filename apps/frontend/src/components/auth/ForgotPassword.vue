<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- 头部 -->
      <div class="auth-header">
        <div class="auth-logo">
          <div class="logo-icon">
            <i class="i-carbon-password text-3xl text-primary"></i>
          </div>
          <h1 class="auth-title">{{ t('forgotPassword.title') }}</h1>
        </div>
        <p class="auth-subtitle">{{ t('forgotPassword.subtitle') }}</p>
      </div>

      <!-- 重置密码表单 -->
      <form class="auth-form" @submit.prevent="handleSubmit">
        <!-- 邮箱输入 -->
        <div class="form-group">
          <div class="input-wrapper">
            <input
              id="email"
              v-model="formData.email"
              type="email"
              class="auth-input"
              :class="{ error: errors.email }"
              required
              autocomplete="email"
              @blur="validateEmail"
              @input="clearError('email')"
            />
            <label for="email" class="floating-label">
              {{ t('forgotPassword.email') }}
            </label>
            <div class="input-icon">
              <i class="i-carbon-email text-lg text-text-secondary"></i>
            </div>
          </div>
          <div v-if="errors.email" class="error-message">
            <i class="i-carbon-warning text-sm"></i>
            {{ errors.email }}
          </div>
        </div>

        <!-- 提交按钮 -->
        <button type="submit" class="auth-button auth-button-primary" :disabled="isLoading">
          <span v-if="!isLoading">{{ t('forgotPassword.submit') }}</span>
          <span v-else class="flex items-center gap-2">
            <i class="i-carbon-circle-dash animate-spin"></i>
            {{ t('forgotPassword.sending') }}
          </span>
        </button>
      </form>

      <!-- 成功消息 -->
      <div v-if="isSuccess" class="success-message">
        <i class="i-carbon-checkmark-filled text-lg"></i>
        <span>{{ t('forgotPassword.success') }}</span>
      </div>

      <!-- 返回登录 -->
      <div class="auth-footer">
        <p class="auth-footer-text">
          {{ t('forgotPassword.backToLogin') }}
          <router-link to="/login" class="auth-link">
            {{ t('forgotPassword.loginLink') }}
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const { t } = useI18n()
const router = useRouter()
const { forgotPassword } = useAuth()

// 表单数据
const formData = reactive({
  email: '',
})

// 状态管理
const isLoading = ref(false)
const isSuccess = ref(false)
const errors = reactive({
  email: '',
})

// 验证邮箱
const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!formData.email) {
    errors.email = t('validation.emailRequired')
  } else if (!emailRegex.test(formData.email)) {
    errors.email = t('validation.emailInvalid')
  } else {
    errors.email = ''
  }
}

// 清除错误
const clearError = (field: keyof typeof errors) => {
  errors[field] = ''
}

// 提交表单
const handleSubmit = async () => {
  // 验证表单
  validateEmail()

  if (errors.email) {
    return
  }

  isLoading.value = true

  try {
    await forgotPassword(formData.email)
    isSuccess.value = true

    // 5秒后跳转到登录页（给用户更多时间查看成功消息）
    setTimeout(() => {
      router.push('/login')
    }, 5000)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('email')) {
      errors.email = errorMessage
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
@import './auth-styles.css';

.success-message {
  @apply flex items-center justify-center gap-2 p-4 bg-success/10 text-success rounded-xl mt-4;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.auth-footer {
  @apply mt-8 text-center;
}

.auth-footer-text {
  @apply text-text-secondary text-sm;
}

.auth-link {
  @apply text-primary hover:text-primary-hover transition-colors font-medium;
}
</style>
