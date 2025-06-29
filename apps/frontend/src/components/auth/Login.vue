<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- 头部 -->
      <div class="auth-header">
        <div class="auth-logo">
          <div class="logo-icon">
            <i class="i-carbon-task-star text-3xl text-primary"></i>
          </div>
          <h1 class="auth-title">{{ t('login.title') }}</h1>
        </div>
        <p class="auth-subtitle">{{ t('login.subtitle') }}</p>
      </div>

      <!-- 登录表单 -->
      <form class="auth-form" @submit.prevent="handleSubmit" @submit="handleSubmit">
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
              {{ t('login.email') }}
            </label>
            <div class="input-icon">
              <i class="i-carbon-email text-lg text-text-secondary"></i>
            </div>
          </div>
          <div v-if="errors.email" class="error-message">
            {{ errors.email }}
          </div>
        </div>

        <!-- 密码输入 -->
        <div class="form-group">
          <div class="input-wrapper">
            <input
              id="password"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              class="auth-input"
              :class="{ error: errors.password }"
              required
              autocomplete="current-password"
              @blur="validatePassword"
              @input="clearError('password')"
            />
            <label for="password" class="floating-label">
              {{ t('login.password') }}
            </label>
            <div class="input-icon">
              <i class="i-carbon-password text-lg text-text-secondary"></i>
            </div>
            <button type="button" class="password-toggle" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'i-carbon-view-off' : 'i-carbon-view'" class="text-lg"></i>
            </button>
          </div>
          <div v-if="errors.password" class="error-message">
            {{ errors.password }}
          </div>
        </div>

        <!-- 记住我 -->
        <div class="form-options">
          <label class="checkbox-wrapper">
            <input v-model="formData.rememberMe" type="checkbox" class="checkbox-input" />
            <span class="checkbox-custom"></span>
            <span class="checkbox-label">{{ t('login.rememberMe') }}</span>
          </label>
          <router-link to="/forgot-password" class="forgot-link">
            {{ t('login.forgotPassword') }}
          </router-link>
        </div>

        <!-- 提交按钮 -->
        <button
          type="button"
          class="auth-button"
          :disabled="isLoading || !isFormValid"
          :class="{ loading: isLoading }"
          @click="handleSubmit"
        >
          <span v-if="!isLoading" class="button-text">
            {{ t('login.submit') }}
          </span>
          <div v-else class="loading-spinner">
            <i class="i-carbon-circle-dash animate-spin"></i>
            <span>{{ t('login.submitting') }}</span>
          </div>
        </button>

        <!-- 错误提示 -->
        <div v-if="submitError" class="submit-error">
          <i class="i-carbon-warning text-lg"></i>
          <span>{{ submitError }}</span>
        </div>
      </form>

      <!-- 底部链接 -->
      <div class="auth-footer">
        <p class="footer-text">
          {{ t('login.noAccount') }}
          <router-link to="/register" class="auth-link">
            {{ t('login.signUp') }}
          </router-link>
        </p>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="auth-background">
      <div class="bg-decoration bg-decoration-1"></div>
      <div class="bg-decoration bg-decoration-2"></div>
      <div class="bg-decoration bg-decoration-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useNotifications } from '../../composables/useNotifications'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { login, isLoading } = useAuth()
const { success, authError } = useNotifications()

// 响应式数据
const formData = ref({
  email: '',
  password: '',
  rememberMe: false,
})

const errors = ref({
  email: '',
  password: '',
})

const showPassword = ref(false)
const submitError = ref('')

// 计算属性 - 简化验证逻辑
const isFormValid = computed(() => {
  const hasEmail = formData.value.email && formData.value.email.trim().length > 0
  const hasPassword = formData.value.password && formData.value.password.length > 0
  return hasEmail && hasPassword
})

// 方法
const validateEmail = () => {
  const email = formData.value.email.trim()
  if (!email) {
    errors.value.email = t('validation.emailRequired')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.value.email = t('validation.emailInvalid')
  } else {
    errors.value.email = ''
  }
}

const validatePassword = () => {
  const password = formData.value.password
  if (!password) {
    errors.value.password = t('validation.passwordRequired')
  } else if (password.length < 6) {
    errors.value.password = t('validation.passwordTooShort')
  } else {
    errors.value.password = ''
  }
}

const clearError = (field: string) => {
  errors.value[field as keyof typeof errors.value] = ''
  submitError.value = ''
}

const handleSubmit = async (event?: Event) => {
  console.log('Login form submitted', event)

  if (event) {
    event.preventDefault()
  }

  console.log('Form data:', formData.value)
  console.log('Form valid:', isFormValid.value)
  console.log('Errors:', errors.value)

  // 简化验证逻辑
  if (!formData.value.email || !formData.value.password) {
    console.log('Email or password missing')
    submitError.value = '请填写邮箱和密码'
    return
  }

  submitError.value = ''

  try {
    console.log('Attempting login with:', {
      email: formData.value.email.trim(),
      password: '***',
      rememberMe: formData.value.rememberMe,
    })

    // 使用认证 composable 进行登录
    await login({
      email: formData.value.email.trim(),
      password: formData.value.password,
      rememberMe: formData.value.rememberMe,
    })

    console.log('Login successful')

    // 显示成功通知
    success('登录成功', '欢迎回来！即将跳转到主页面。')

    // 延迟一下让用户看到成功提示
    setTimeout(async () => {
      // 登录成功，重定向到目标页面或首页
      const redirectPath = (route.query.redirect as string) || '/'
      await router.push(redirectPath)
    }, 1500)
  } catch (error) {
    console.error('Login failed:', error)
    // 使用通知系统显示错误
    authError(error as { code?: string; message?: string })
    submitError.value = error instanceof Error ? error.message : t('login.error')
  }
}

defineOptions({
  name: 'LoginPage',
})
</script>

<style scoped>
@import './auth-styles.css';
</style>
