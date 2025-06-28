<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- 头部 -->
      <div class="auth-header">
        <div class="auth-logo">
          <div class="logo-icon">
            <i class="i-carbon-user-plus text-3xl text-primary"></i>
          </div>
          <h1 class="auth-title">{{ t('register.title') }}</h1>
        </div>
        <p class="auth-subtitle">{{ t('register.subtitle') }}</p>
      </div>

      <!-- 注册表单 -->
      <form class="auth-form" @submit.prevent="handleSubmit">
        <!-- 用户名输入 -->
        <div class="form-group">
          <div class="input-wrapper">
            <input
              id="username"
              v-model="formData.username"
              type="text"
              class="auth-input"
              :class="{ error: errors.username }"
              required
              autocomplete="username"
              @blur="validateUsername"
              @input="clearError('username')"
            />
            <label for="username" class="floating-label">
              {{ t('register.username') }}
            </label>
            <div class="input-icon">
              <i class="i-carbon-user text-lg text-text-secondary"></i>
            </div>
          </div>
          <div v-if="errors.username" class="error-message">
            <i class="i-carbon-warning text-sm"></i>
            {{ errors.username }}
          </div>
        </div>

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
              {{ t('register.email') }}
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
              autocomplete="new-password"
              @blur="validatePassword"
              @input="clearError('password')"
            />
            <label for="password" class="floating-label">
              {{ t('register.password') }}
            </label>
            <div class="input-icon">
              <i class="i-carbon-password text-lg text-text-secondary"></i>
            </div>
            <button type="button" class="password-toggle" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'i-carbon-view-off' : 'i-carbon-view'" class="text-lg"></i>
            </button>
          </div>
          <div v-if="errors.password" class="error-message">
            <i class="i-carbon-warning text-sm"></i>
            {{ errors.password }}
          </div>
          <!-- 密码强度指示器 -->
          <div v-if="formData.password" class="password-strength">
            <div class="strength-bar">
              <div
                class="strength-fill"
                :class="passwordStrengthClass"
                :style="{ width: passwordStrengthWidth }"
              ></div>
            </div>
            <span class="strength-text" :class="passwordStrengthClass">
              {{ passwordStrengthText }}
            </span>
          </div>
        </div>

        <!-- 确认密码输入 -->
        <div class="form-group">
          <div class="input-wrapper">
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="auth-input"
              :class="{ error: errors.confirmPassword }"
              required
              autocomplete="new-password"
              @blur="validateConfirmPassword"
              @input="clearError('confirmPassword')"
            />
            <label for="confirmPassword" class="floating-label">
              {{ t('register.confirmPassword') }}
            </label>
            <div class="input-icon">
              <i class="i-carbon-password text-lg text-text-secondary"></i>
            </div>
            <button
              type="button"
              class="password-toggle"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <i
                :class="showConfirmPassword ? 'i-carbon-view-off' : 'i-carbon-view'"
                class="text-lg"
              ></i>
            </button>
          </div>
          <div v-if="errors.confirmPassword" class="error-message">
            <i class="i-carbon-warning text-sm"></i>
            {{ errors.confirmPassword }}
          </div>
        </div>

        <!-- 提交按钮 -->
        <button
          type="submit"
          class="auth-button"
          :disabled="isLoading || !isFormValid"
          :class="{ loading: isLoading }"
        >
          <span v-if="!isLoading" class="button-text">
            {{ t('register.submit') }}
          </span>
          <div v-else class="loading-spinner">
            <i class="i-carbon-circle-dash animate-spin"></i>
            <span>{{ t('register.submitting') }}</span>
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
          {{ t('register.hasAccount') }}
          <router-link to="/login" class="auth-link">
            {{ t('register.signIn') }}
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
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useNotifications } from '../../composables/useNotifications'

const { t } = useI18n()
const router = useRouter()
const { register, isLoading } = useAuth()
const { success, authError } = useNotifications()

// 响应式数据
const formData = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errors = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const submitError = ref('')

// 密码强度计算
const passwordStrength = computed(() => {
  const password = formData.value.password
  if (!password) return 0

  let strength = 0
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++

  return strength
})

const passwordStrengthClass = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return 'strength-weak'
  if (strength <= 3) return 'strength-medium'
  return 'strength-strong'
})

const passwordStrengthWidth = computed(() => {
  return `${(passwordStrength.value / 5) * 100}%`
})

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value
  if (strength <= 2) return t('register.passwordWeak')
  if (strength <= 3) return t('register.passwordMedium')
  return t('register.passwordStrong')
})

// 表单验证
const isFormValid = computed(() => {
  return (
    formData.value.username &&
    formData.value.email &&
    formData.value.password &&
    formData.value.confirmPassword &&
    !errors.value.username &&
    !errors.value.email &&
    !errors.value.password &&
    !errors.value.confirmPassword
  )
})

// 验证方法
const validateUsername = () => {
  const username = formData.value.username.trim()
  if (!username) {
    errors.value.username = t('validation.usernameRequired')
  } else if (username.length < 3) {
    errors.value.username = t('validation.usernameTooShort')
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.value.username = t('validation.usernameInvalid')
  } else {
    errors.value.username = ''
  }
}

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
  } else if (password.length < 8) {
    errors.value.password = t('validation.passwordTooShort')
  } else if (passwordStrength.value < 3) {
    errors.value.password = t('validation.passwordTooWeak')
  } else {
    errors.value.password = ''
  }
}

const validateConfirmPassword = () => {
  if (!formData.value.confirmPassword) {
    errors.value.confirmPassword = t('validation.confirmPasswordRequired')
  } else if (formData.value.password !== formData.value.confirmPassword) {
    errors.value.confirmPassword = t('validation.passwordMismatch')
  } else {
    errors.value.confirmPassword = ''
  }
}

const clearError = (field: string) => {
  errors.value[field as keyof typeof errors.value] = ''
  submitError.value = ''
}

const handleSubmit = async () => {
  // 验证所有字段
  validateUsername()
  validateEmail()
  validatePassword()
  validateConfirmPassword()

  if (!isFormValid.value) {
    return
  }

  submitError.value = ''

  try {
    // 使用认证 composable 进行注册
    await register({
      username: formData.value.username.trim(),
      email: formData.value.email.trim(),
      password: formData.value.password,
    })

    // 显示成功通知
    success('注册成功', '欢迎加入！您已自动登录，即将跳转到首页。')

    // 延迟一下让用户看到成功提示
    setTimeout(async () => {
      // 注册成功，重定向到首页（注册后自动登录）
      await router.push('/')
    }, 1500)
  } catch (error) {
    // 使用通知系统显示错误
    authError(error as { code?: string; message?: string })
    submitError.value = error instanceof Error ? error.message : t('register.error')
  }
}

defineOptions({
  name: 'RegisterPage',
})
</script>

<style scoped>
/* 导入共享的认证样式 */
@import './auth-styles.css';

/* 密码强度指示器 */
.password-strength {
  @apply mt-2 space-y-1;
}

.strength-bar {
  @apply w-full h-1 bg-input-border rounded-full overflow-hidden;
}

.strength-fill {
  @apply h-full transition-all-300 rounded-full;
}

.strength-weak .strength-fill {
  @apply bg-red-500;
}

.strength-medium .strength-fill {
  @apply bg-yellow-500;
}

.strength-strong .strength-fill {
  @apply bg-green-500;
}

.strength-text {
  @apply text-xs font-medium;
}

.strength-weak {
  @apply text-red-500;
}

.strength-medium {
  @apply text-yellow-500;
}

.strength-strong {
  @apply text-green-500;
}

/* 服务条款链接 */
.terms-link {
  @apply text-primary hover:text-primary-hover underline transition-colors;
}

/* 调整表单间距 */
.auth-form {
  @apply space-y-4;
}
</style>
