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

        <!-- 邮箱验证码输入 -->
        <div class="form-group">
          <div class="verification-code-wrapper">
            <div class="input-wrapper flex-1">
              <input
                id="verificationCode"
                v-model="formData.verificationCode"
                type="text"
                class="auth-input verification-code-input"
                :class="{ error: errors.verificationCode }"
                required
                autocomplete="off"
                maxlength="6"
                @blur="validateVerificationCode"
                @input="clearError('verificationCode')"
              />
              <label for="verificationCode" class="floating-label">
                {{ t('register.verificationCode') }}
              </label>
              <div class="input-icon">
                <i class="i-carbon-security text-lg text-text-secondary"></i>
              </div>
            </div>
            <button
              type="button"
              class="send-code-button"
              :disabled="!canSendCode || isSendingCode"
              @click="handleSendCode"
            >
              <span v-if="!isSendingCode && countdown === 0">
                {{ t('register.sendCode') }}
              </span>
              <span v-else-if="isSendingCode">
                <i class="i-carbon-circle-dash animate-spin mr-1"></i>
                {{ t('register.sending') }}
              </span>
              <span v-else> {{ countdown }}s </span>
            </button>
          </div>
          <div v-if="errors.verificationCode" class="error-message">
            <i class="i-carbon-warning text-sm"></i>
            {{ errors.verificationCode }}
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
              autocomplete="new-password"
              @blur="validatePassword"
              @input="clearError('password')"
            />
            <label for="password" class="floating-label">
              {{ t('register.password') }}
            </label>
            <div class="password-icon">
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
              class="auth-input password-input"
              :class="{ error: errors.confirmPassword }"
              required
              autocomplete="new-password"
              @blur="validateConfirmPassword"
              @input="clearError('confirmPassword')"
            />
            <label for="confirmPassword" class="floating-label">
              {{ t('register.confirmPassword') }}
            </label>
            <div class="password-icon">
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
const { register, isLoading, sendVerificationCode } = useAuth()
const { success, authError } = useNotifications()

// 响应式数据
const formData = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
})

const errors = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const submitError = ref('')

// 验证码相关状态
const isSendingCode = ref(false)
const countdown = ref(0)
const countdownTimer = ref<ReturnType<typeof setInterval> | null>(null)

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

// 验证码发送条件
const canSendCode = computed(() => {
  return (
    formData.value.email && !errors.value.email && countdown.value === 0 && !isSendingCode.value
  )
})

// 表单验证
const isFormValid = computed(() => {
  return (
    formData.value.username &&
    formData.value.email &&
    formData.value.password &&
    formData.value.confirmPassword &&
    formData.value.verificationCode &&
    !errors.value.username &&
    !errors.value.email &&
    !errors.value.password &&
    !errors.value.confirmPassword &&
    !errors.value.verificationCode
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

const validateVerificationCode = () => {
  const code = formData.value.verificationCode.trim()
  if (!code) {
    errors.value.verificationCode = t('validation.verificationCodeRequired')
  } else if (!/^\d{6}$/.test(code)) {
    errors.value.verificationCode = t('validation.verificationCodeInvalid')
  } else {
    errors.value.verificationCode = ''
  }
}

const clearError = (field: string) => {
  errors.value[field as keyof typeof errors.value] = ''
  submitError.value = ''
}

// 发送验证码
const handleSendCode = async () => {
  // 先验证邮箱
  validateEmail()
  if (errors.value.email) {
    return
  }

  isSendingCode.value = true

  try {
    await sendVerificationCode(formData.value.email)
    success('验证码已发送', '请查收邮箱中的验证码')

    // 开始倒计时
    startCountdown()
  } catch (error) {
    authError(error as { code?: string; message?: string })
  } finally {
    isSendingCode.value = false
  }
}

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60
  countdownTimer.value = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countdownTimer.value) {
        clearInterval(countdownTimer.value)
        countdownTimer.value = null
      }
    }
  }, 1000)
}

const handleSubmit = async () => {
  // 验证所有字段
  validateUsername()
  validateEmail()
  validatePassword()
  validateConfirmPassword()
  validateVerificationCode()

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
      verificationCode: formData.value.verificationCode.trim(),
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

// 组件卸载时清理定时器
onUnmounted(() => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
})

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

/* 验证码输入框样式 */
.verification-code-wrapper {
  @apply flex gap-3 items-end;
}

.verification-code-wrapper .input-wrapper {
  @apply flex-1;
}

.verification-code-input {
  @apply pr-12; /* 确保右侧图标有足够空间 */
}

.send-code-button {
  @apply px-4 py-0 bg-primary text-white rounded-xl font-medium transition-all-300 whitespace-nowrap;
  @apply hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/20;
  @apply disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed;
  @apply flex items-center justify-center;
  @apply flex-shrink-0; /* 防止按钮被压缩 */
  min-width: 100px;
  height: 56px; /* 与 auth-input 高度保持一致 */
}

.send-code-button:disabled {
  @apply bg-gray-300 text-gray-500 cursor-not-allowed;
}

/* 确保验证码区域的错误消息不影响布局 */
.verification-code-wrapper + .error-message {
  @apply mt-2;
}

/* 调整表单间距 */
.auth-form {
  @apply space-y-4;
}
</style>
