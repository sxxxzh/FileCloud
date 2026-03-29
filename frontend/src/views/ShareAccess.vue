<template>
  <div class="min-h-screen flex flex-col">
    <div class="fixed inset-0 z-0 flex pointer-events-none">
      <div class="w-1/2 h-full bg-surface"></div>
      <div class="w-1/2 h-full bg-surface-container-low"></div>
    </div>

    <div class="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
      <header class="mb-16 text-center">
        <div class="inline-flex items-center justify-center p-4 bg-primary text-white mb-6">
          <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'wght' 700;">link</span>
        </div>
        <h1 class="text-2xl font-black tracking-[-0.04em] text-primary uppercase">szhAo 云存储</h1>
        <p class="text-on-surface-variant text-sm mt-2">安全文件分享</p>
      </header>

      <main v-if="loading" class="w-full max-w-md text-center">
        <div class="bg-surface-container-lowest p-10 shadow-[0_20px_40px_rgba(28,27,27,0.06)]">
          <span class="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
          <p class="mt-4 text-secondary">加载中...</p>
        </div>
      </main>

      <main v-else-if="error" class="w-full max-w-md">
        <div class="bg-surface-container-lowest p-10 shadow-[0_20px_40px_rgba(28,27,27,0.06)]">
          <div class="text-center">
            <span class="material-symbols-outlined text-6xl text-error mb-4">error</span>
            <h2 class="text-xl font-bold text-primary mb-2">访问失败</h2>
            <p class="text-secondary text-sm mb-6">{{ error }}</p>
            <button 
              @click="goHome"
              class="bg-primary text-white px-8 py-3 font-bold text-xs uppercase tracking-widest hover:bg-primary-fixed transition-all"
            >
              返回首页
            </button>
          </div>
        </div>
      </main>

      <main v-else-if="requiresPassword" class="w-full max-w-md">
        <div class="bg-surface-container-lowest p-10 shadow-[0_20px_40px_rgba(28,27,27,0.06)]">
          <div class="mb-8">
            <h2 class="text-2xl font-bold tracking-tight text-primary mb-2">需要访问密码</h2>
            <p class="text-on-surface-variant text-sm">此分享链接需要密码才能访问</p>
          </div>

          <div class="mb-6 p-4 bg-surface-container">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 flex items-center justify-center bg-surface-container-low shrink-0 overflow-hidden">
                <img 
                  v-if="shareInfo?.thumbnail" 
                  :src="shareInfo.thumbnail" 
                  class="w-full h-full object-cover"
                  alt=""
                />
                <span v-else class="material-symbols-outlined text-primary text-2xl">description</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-bold text-sm truncate">{{ shareInfo?.filename }}</p>
                <p class="text-xs text-on-surface-variant">{{ formatSize(shareInfo?.file_size) }}</p>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleVerify" class="space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] uppercase font-bold tracking-[0.1em] text-secondary">访问密码</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                  <span class="material-symbols-outlined">lock</span>
                </div>
                <input 
                  v-model="password"
                  type="password"
                  required
                  class="block w-full pl-12 pr-4 py-4 bg-surface-container border-none focus:ring-0 focus:bg-surface-container-high transition-all text-sm"
                  placeholder="请输入访问密码"
                />
              </div>
            </div>

            <div v-if="passwordError" class="p-4 bg-error-container text-on-error-container text-sm">
              {{ passwordError }}
            </div>

            <button 
              type="submit"
              :disabled="verifying"
              class="w-full mono-gradient text-white py-5 px-8 flex items-center justify-between group active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
            >
              <span class="font-bold text-base tracking-tight">{{ verifying ? '验证中...' : '验证密码' }}</span>
              <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
            </button>
          </form>
        </div>
      </main>

      <main v-else class="w-full max-w-md">
        <div class="bg-surface-container-lowest p-10 shadow-[0_20px_40px_rgba(28,27,27,0.06)]">
          <div class="mb-8">
            <div class="w-16 h-16 bg-surface-container flex items-center justify-center mb-6 overflow-hidden">
              <img 
                v-if="shareInfo?.thumbnail" 
                :src="shareInfo.thumbnail" 
                class="w-full h-full object-cover"
                alt=""
              />
              <span v-else class="material-symbols-outlined text-3xl text-primary">{{ getFileIcon(shareInfo?.mime_type) }}</span>
            </div>
            <h2 class="text-xl font-bold tracking-tight text-primary mb-2 truncate" :title="shareInfo?.filename">{{ shareInfo?.filename }}</h2>
            <p class="text-on-surface-variant text-sm">{{ formatSize(shareInfo?.file_size) }}</p>
          </div>

          <div class="space-y-4 mb-8">
            <div class="flex justify-between py-3 border-b border-surface-variant">
              <span class="text-xs text-secondary uppercase tracking-wider">分享状态</span>
              <span class="text-xs font-medium text-primary">有效</span>
            </div>
            <div class="flex justify-between py-3 border-b border-surface-variant">
              <span class="text-xs text-secondary uppercase tracking-wider">过期时间</span>
              <span class="text-xs font-medium">{{ shareInfo?.expire_at ? formatDate(shareInfo.expire_at) : '永久有效' }}</span>
            </div>
            <div class="flex justify-between py-3 border-b border-surface-variant">
              <span class="text-xs text-secondary uppercase tracking-wider">剩余下载</span>
              <span class="text-xs font-medium">
                {{ shareInfo?.remaining_downloads === -1 ? '无限制' : shareInfo?.remaining_downloads + ' 次' }}
              </span>
            </div>
            <div class="flex justify-between py-3 border-b border-surface-variant">
              <span class="text-xs text-secondary uppercase tracking-wider">已下载次数</span>
              <span class="text-xs font-medium">{{ shareInfo?.download_count || 0 }} 次</span>
            </div>
          </div>

          <button 
            @click="handleDownload"
            :disabled="downloading"
            class="w-full mono-gradient text-white py-5 px-8 flex items-center justify-between group active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
          >
            <span class="font-bold text-base tracking-tight">{{ downloading ? '下载中...' : '下载文件' }}</span>
            <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">download</span>
          </button>

          <div class="mt-6 text-center">
            <p class="text-[10px] text-on-surface-variant">
              由 <span class="font-bold text-primary">szhAo Cloud Storage</span> 提供服务
            </p>
          </div>
        </div>
      </main>

      <footer class="mt-16 w-full max-w-4xl px-6 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-surface-variant pt-8">
        <div class="flex items-center gap-12">
          <div class="flex flex-col">
            <span class="text-[10px] uppercase font-black text-outline tracking-tighter">System Status</span>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-primary rounded-full"></span>
              <span class="text-xs font-bold text-primary">SECURE CONNECTION</span>
            </div>
          </div>
        </div>
        <p class="text-[10px] font-medium text-on-surface-variant text-center md:text-right leading-relaxed opacity-60">
          © 2024 szhAo VAULT CLOUD INFRASTRUCTURE.<br/>
          HIGHLY CONFIDENTIAL. UNAUTHORIZED ACCESS IS LOGGED.
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/utils/api'
import { useToastStore } from '@/stores/toast'

const route = useRoute()
const router = useRouter()
const toastStore = useToastStore()

const loading = ref(true)
const error = ref('')
const shareInfo = ref(null)
const requiresPassword = ref(false)
const password = ref('')
const passwordError = ref('')
const verifying = ref(false)
const downloading = ref(false)

const fetchShareInfo = async (pwd = null) => {
  try {
    const code = route.params.code
    const params = pwd ? { password: pwd } : {}
    
    const response = await api.get(`/shares/${code}`, { params })
    
    if (response.data.requires_password) {
      requiresPassword.value = true
      shareInfo.value = response.data
      loading.value = false
      return
    }
    
    shareInfo.value = response.data
    requiresPassword.value = false
    loading.value = false
  } catch (err) {
    loading.value = false
    if (err.code === 30004) {
      passwordError.value = '访问密码错误'
    } else if (err.code === 30002) {
      error.value = '分享链接已过期'
    } else if (err.code === 30003) {
      error.value = '下载次数已用尽'
    } else if (err.code === 30001) {
      error.value = '分享链接不存在'
    } else {
      error.value = err.message || '获取分享信息失败'
    }
  }
}

const handleVerify = async () => {
  verifying.value = true
  passwordError.value = ''
  
  try {
    const code = route.params.code
    const response = await api.get(`/shares/${code}`, { 
      params: { password: password.value } 
    })
    
    if (response.data.requires_password) {
      passwordError.value = '访问密码错误'
    } else {
      shareInfo.value = response.data
      requiresPassword.value = false
    }
  } catch (err) {
    if (err.code === 30004) {
      passwordError.value = '访问密码错误'
    } else {
      passwordError.value = err.message || '验证失败'
    }
  } finally {
    verifying.value = false
  }
}

const handleDownload = async () => {
  downloading.value = true
  
  try {
    const code = route.params.code
    const params = new URLSearchParams()
    if (password.value) {
      params.append('password', password.value)
    }
    
    const link = document.createElement('a')
    link.href = `http://39.102.48.146:3000/api/v1/shares/${code}/download?${params.toString()}`
    link.download = shareInfo.value?.filename || 'file'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => {
      fetchShareInfo(password.value || null)
    }, 1000)
  } catch (err) {
  } finally {
    downloading.value = false
  }
}

const goHome = () => {
  router.push('/login')
}

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\//g, '-')
}

const getFileIcon = (mimeType) => {
  if (!mimeType) return 'description'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'videocam'
  if (mimeType.startsWith('audio/')) return 'audiotrack'
  if (mimeType.includes('pdf')) return 'picture_as_pdf'
  return 'description'
}

onMounted(() => {
  fetchShareInfo()
})
</script>

<style scoped>
.mono-gradient {
  background: linear-gradient(45deg, #000000 0%, #3b3b3b 100%);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
