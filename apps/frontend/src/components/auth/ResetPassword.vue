<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- 头部 -->
      <div class="auth-header">
        <div class="auth-logo">
          <div class="logo-icon">
            <i class="i-carbon-password text-3xl text-primary"></i>
          </div>
          <h1 class="auth-title">{{ t('resetPassword.title') }}</h1>
        </div>
        <p class="auth-subtitle">{{ t('resetPassword.subtitle') }}</p>
      </div>

      <!-- 重置密码表单 -->
      <form v-if="!isSuccess" class="auth-form" @submit.prevent="handleSubmit">
        <!-- 新密码输入 -->
        <div class="form-group">
          <div class="input-wrapper">
            <input
              id="password"
              v-model="formData.password"
              type="password"
              class="auth-input"
              :class="{ error: errors.password }"
              required
              autocomplete="new-password"
              @blur="validatePassword"
              @input="clearError('password')"
            />
            <label for="password" class="floating-label">
              {{ t('resetPassword.newPassword') }}
            </label>
            <div class="input-icon">
              <i class="i-carbon-password text-lg text-text-secondary"></i>
            </div>
          </div>
          <div v-if="errors.password" class="error-message">
            <i class="i-carbon-warning text-sm"></i>
            {{ errors.password }}
          </div>
        </div>

        <!-- 确认密码输入 -->
        <div class="form-group">
          <div class="input-wrapper">
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              type="password"
              class="auth-input"
              :class="{ error: errors.confirmPassword }"
              required
              autocomplete="new-password"
              @blur="validateConfirmPassword"
              @input="clearError('confirmPassword')"
            />
            <label for="confirmPassword" class="floating-label">
              {{ t('resetPassword.confirmPassword') }}
            </label>
            <div class="input-icon">
              <i class="i-carbon-password text-lg text-text-secondary"></i>
            </div>
          </div>
          <div v-if="errors.confirmPassword" class="error-message">
            <i class="i-carbon-warning text-sm"></i>
            {{ errors.confirmPassword }}
          </div>
        </div>

        <!-- 提交按钮 -->
        <button type="submit" class="auth-button auth-button-primary" :disabled="isLoading">
          <span v-if="!isLoading">{{ t('resetPassword.submit') }}</span>
          <span v-else class="flex items-center gap-2">
            <i class="i-carbon-circle-dash animate-spin"></i>
            {{ t('resetPassword.resetting') }}
          </span>
        </button>

        <!-- 错误消息 -->
        <div v-if="errors.general" class="error-message mt-4">
          <i class="i-carbon-warning text-sm"></i>
          {{ errors.general }}
        </div>
      </form>

      <!-- 成功消息 -->
      <div v-if="isSuccess" class="success-message">
        <i class="i-carbon-checkmark-filled text-lg"></i>
        <span>{{ t('resetPassword.success') }}</span>
        <p class="text-sm text-text-secondary mt-2">
          {{ t('resetPassword.successDescription') }}
        </p>
      </div>

      <!-- 返回登录 -->
      <div class="auth-footer">
        <p class="auth-footer-text">
          {{ t('resetPassword.backToLogin') }}
          <router-link to="/login" class="auth-link">
            {{ t('resetPassword.loginLink') }}
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { authApi } from '../../services/authApi'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

// 表单数据
const formData = reactive({
  password: '',
  confirmPassword: '',
})

// 状态管理
const isLoading = ref(false)
const isSuccess = ref(false)
const resetToken = ref('')
const errors = reactive({
  password: '',
  confirmPassword: '',
  general: '',
})

// 验证密码
const validatePassword = () => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/
  if (!formData.password) {
    errors.password = t('validation.passwordRequired')
  } else if (formData.password.length < 8) {
    errors.password = t('validation.passwordMinLength')
  } else if (!passwordRegex.test(formData.password)) {
    errors.password = t('validation.passwordFormat')
  } else {
    errors.password = ''
  }
}

// 验证确认密码
const validateConfirmPassword = () => {
  if (!formData.confirmPassword) {
    errors.confirmPassword = t('validation.confirmPasswordRequired')
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = t('validation.passwordMismatch')
  } else {
    errors.confirmPassword = ''
  }
}

// 清除错误
const clearError = (field: keyof typeof errors) => {
  errors[field] = ''
}

// 提交表单
const handleSubmit = async () => {
  // 验证表单
  validatePassword()
  validateConfirmPassword()

  if (errors.password || errors.confirmPassword) {
    return
  }

  if (!resetToken.value) {
    errors.general = t('resetPassword.invalidToken')
    return
  }

  isLoading.value = true
  errors.general = ''

  try {
    await authApi.resetPassword(resetToken.value, formData.password)
    isSuccess.value = true

    // 3秒后跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('token') || errorMessage.includes('expired')) {
      errors.general = t('resetPassword.tokenExpired')
    } else if (errorMessage.includes('password')) {
      errors.password = errorMessage
    } else {
      errors.general = errorMessage
    }
  } finally {
    isLoading.value = false
  }
}

// 初始化
onMounted(() => {
  // 从 URL 参数获取重置令牌
  const token = route.query.token as string
  if (!token) {
    errors.general = t('resetPassword.missingToken')
    return
  }
  resetToken.value = token
})
</script>

<style scoped>
@import './auth-styles.css';

.success-message {
  @apply flex flex-col items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 
         border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300;
}
</style>
