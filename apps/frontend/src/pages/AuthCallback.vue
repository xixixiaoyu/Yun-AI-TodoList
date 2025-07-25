<template>
  <div class="auth-callback-container">
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>正在处理登录...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(async () => {
  try {
    // 从 URL 参数中获取令牌
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get('token')
    const refreshToken = urlParams.get('refresh')

    if (accessToken && refreshToken) {
      // 使用 tokenManager 保存令牌
      const { tokenManager } = await import('@/utils/tokenManager')
      tokenManager.saveTokens(accessToken, refreshToken, true)

      // 获取用户信息
      const { authApi } = await import('@/services/authApi')
      const userInfo = await authApi.getCurrentUser()

      // 保存用户信息
      localStorage.setItem('auth_user', JSON.stringify(userInfo))

      // 重定向到主页
      router.push('/')
    } else {
      // 如果没有令牌，重定向到登录页
      router.push('/login?error=oauth_failed')
    }
  } catch (error) {
    console.error('OAuth 回调处理失败:', error)
    router.push('/login?error=oauth_failed')
  }
})
</script>

<style scoped>
.auth-callback-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading-spinner {
  text-align: center;
  color: white;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}
</style>
