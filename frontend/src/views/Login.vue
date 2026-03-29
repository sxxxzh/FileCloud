<template>
  <div class="min-h-screen flex flex-col">
    <div class="fixed inset-0 z-0 flex pointer-events-none">
      <div class="hidden md:block md:w-1/2 h-full bg-surface"></div>
      <div class="w-full md:w-1/2 h-full bg-surface-container-low"></div>
    </div>

    <div class="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 md:px-6 py-8">
      <header class="mb-8 md:mb-16 text-center">
        <div class="inline-flex items-center justify-center p-3 md:p-4 bg-primary text-white mb-4 md:mb-6">
          <span class="material-symbols-outlined text-2xl md:text-3xl" style="font-variation-settings: 'wght' 700;">grid_view</span>
        </div>
        <h1 class="text-xl md:text-2xl font-black tracking-[-0.04em] text-primary uppercase">szhAo 云存储</h1>
      </header>

      <main class="w-full max-w-md bg-surface-container-lowest p-6 md:p-10 lg:p-12 shadow-[0_20px_40px_rgba(28,27,27,0.06)]">
        <div class="mb-8 md:mb-10">
          <h2 class="text-2xl md:text-3xl font-bold tracking-tight text-primary mb-1 md:mb-2 font-headline">管理员登录</h2>
          <p class="text-on-surface-variant text-xs md:text-sm font-label uppercase tracking-widest">Management Portal Access</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5 md:space-y-6">
          <div class="space-y-2">
            <label class="text-[10px] uppercase font-bold tracking-[0.1em] text-secondary">用户名 / USERNAME</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none text-outline">
                <span class="material-symbols-outlined text-lg md:text-xl">person</span>
              </div>
              <input 
                v-model="form.username"
                class="block w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-surface-container border-none focus:ring-0 focus:bg-surface-container-high transition-all duration-150 text-sm font-medium placeholder:text-outline-variant" 
                placeholder="Admin identifier" 
                type="text"
                required
              />
              <div class="absolute bottom-0 left-0 w-0 h-[2px] bg-primary transition-all duration-300 group-focus-within:w-full"></div>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] uppercase font-bold tracking-[0.1em] text-secondary">密码 / PASSWORD</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none text-outline">
                <span class="material-symbols-outlined text-lg md:text-xl">lock</span>
              </div>
              <input 
                v-model="form.password"
                class="block w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-surface-container border-none focus:ring-0 focus:bg-surface-container-high transition-all duration-150 text-sm font-medium placeholder:text-outline-variant" 
                placeholder="••••••••" 
                type="password"
                required
              />
              <div class="absolute bottom-0 left-0 w-0 h-[2px] bg-primary transition-all duration-300 group-focus-within:w-full"></div>
            </div>
          </div>

          <div v-if="error" class="bg-error-container text-on-error-container p-3 md:p-4 text-xs md:text-sm">
            {{ error }}
          </div>

          <button 
            type="submit"
            :disabled="loading"
            class="w-full mt-6 md:mt-8 mono-gradient text-white py-4 md:py-5 px-6 md:px-8 flex items-center justify-between group active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
          >
            <span class="font-bold text-sm md:text-base tracking-tight">{{ loading ? '登录中...' : '登录到云盘' }}</span>
            <span class="material-symbols-outlined text-lg md:text-xl group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
          </button>
        </form>

        <div class="mt-8 md:mt-12 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          <a class="text-[10px] font-bold uppercase tracking-widest text-secondary hover:text-primary transition-colors cursor-pointer">忘记密码?</a>
          <div class="hidden md:block h-px w-8 bg-surface-variant"></div>
          <div class="flex gap-4 md:gap-6">
            <a class="text-[10px] font-bold uppercase tracking-widest text-secondary hover:text-primary transition-colors cursor-pointer">技术支持</a>
            <a class="text-[10px] font-bold uppercase tracking-widest text-secondary hover:text-primary transition-colors cursor-pointer">日志监控</a>
          </div>
        </div>
      </main>

      <footer class="mt-8 md:mt-16 w-full max-w-4xl px-4 md:px-6 flex flex-col items-center gap-6 md:gap-8 border-t border-surface-variant pt-6 md:pt-8">
        <div class="flex flex-col md:flex-row items-center gap-6 md:gap-12 w-full md:w-auto">
          <div class="flex flex-col items-center md:items-start">
            <span class="text-[10px] uppercase font-black text-outline tracking-tighter">System Status</span>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-primary rounded-full"></span>
              <span class="text-xs font-bold text-primary">ENCRYPTED CONNECTION</span>
            </div>
          </div>
          <div class="flex flex-col items-center md:items-start">
            <span class="text-[10px] uppercase font-black text-outline tracking-tighter">Node ID</span>
            <span class="text-xs font-bold text-primary">VAULT-NODE-01-SH</span>
          </div>
        </div>
        <p class="text-[10px] font-medium text-on-surface-variant text-center leading-relaxed opacity-60">
          © 2024 szhAo VAULT CLOUD INFRASTRUCTURE.<br class="md:hidden"/>
          HIGHLY CONFIDENTIAL. UNAUTHORIZED ACCESS IS LOGGED.
        </p>
      </footer>
    </div>

    <div class="fixed top-0 right-0 w-64 h-64 opacity-[0.03] pointer-events-none hidden md:block">
      <svg class="text-primary stroke-current" fill="none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0H100V100H0V0Z" stroke-width="0.5"></path>
        <path d="M0 20H100M0 40H100M0 60H100M0 80H100M20 0V100M40 0V100M60 0V100M80 0V100" stroke-width="0.2"></path>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await authStore.login(form.username, form.password)
    router.push('/files')
  } catch (err) {
    error.value = err.message || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}
</script>
