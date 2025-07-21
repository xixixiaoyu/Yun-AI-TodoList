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
              class="auth-input password-input"
              :class="{ error: errors.password }"
              required
              autocomplete="current-password"
              @blur="validatePassword"
              @input="clearError('password')"
            />
            <label for="password" class="floating-label">
              {{ t('login.password') }}
            </label>
            <div class="password-icon">
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

        <!-- 忘记密码链接 -->
        <div class="form-options">
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

        <!-- 分隔线 -->
        <div class="auth-divider">
          <span class="divider-text">{{ t('login.or') }}</span>
        </div>

        <!-- Google 登录按钮 -->
        <button type="button" class="google-login-button" @click="handleGoogleLogin">
          <div class="google-icon">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </div>
          <span>{{ t('login.googleLogin') }}</span>
        </button>
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

// 存储键名
const LAST_EMAIL_KEY = 'last_login_email'

// 响应式数据
const formData = ref({
  email: '',
  password: '',
})

const errors = ref({
  email: '',
  password: '',
})

const showPassword = ref(false)
const submitError = ref('')

// 加载上次登录的邮箱地址
const loadLastEmail = () => {
  try {
    const lastEmail = localStorage.getItem(LAST_EMAIL_KEY)
    if (lastEmail) {
      formData.value.email = lastEmail
    }
  } catch (error) {
    console.warn('Failed to load last email:', error)
  }
}

// 保存邮箱地址到本地存储
const saveLastEmail = (email: string) => {
  try {
    localStorage.setItem(LAST_EMAIL_KEY, email.trim())
  } catch (error) {
    console.warn('Failed to save last email:', error)
  }
}

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
  if (event) {
    event.preventDefault()
  }

  // 简化验证逻辑
  if (!formData.value.email || !formData.value.password) {
    submitError.value = '请填写邮箱和密码'
    return
  }

  submitError.value = ''

  try {
    const email = formData.value.email.trim()

    // 使用认证 composable 进行登录
    await login({
      email,
      password: formData.value.password,
    })

    // 保存邮箱地址到本地存储
    saveLastEmail(email)

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
  }
}

// Google 登录处理
const handleGoogleLogin = () => {
  // 重定向到后端的 Google OAuth 端点
  window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/auth/google`
}

// 组件挂载时加载上次登录的邮箱
onMounted(() => {
  loadLastEmail()
})

defineOptions({
  name: 'LoginPage',
})
</script>

<style scoped>
@import './auth-styles.css';
</style>
