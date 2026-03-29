<template>
  <div class="min-h-screen bg-background">
    <header class="fixed top-0 w-full z-50 bg-surface-container-low/90 backdrop-blur-3xl shadow-[0_20px_40px_rgba(28,27,27,0.06)] flex justify-between items-center px-4 md:px-8 h-16 md:h-20">
      <div class="flex items-center gap-3 md:gap-6">
        <div 
          @click="router.push('/files')"
          class="hover:bg-surface-container transition-all duration-200 active:scale-95 cursor-pointer p-1.5 md:p-2 hover-lift"
        >
          <img src="/logo.svg" alt="szhAo Vault" class="w-8 h-8 md:w-10 md:h-10">
        </div>
        <h1 class="text-base md:text-xl font-black tracking-[-0.02em] text-primary">szhAo Vault</h1>
      </div>
      
      <nav class="hidden md:flex gap-10 items-center">
        <a 
          @click="router.push('/files')"
          :class="[
            'font-inter tracking-tighter font-bold uppercase text-xs px-3 py-1 transition-all duration-200 cursor-pointer hover-lift',
            currentRoute === 'Files' ? 'text-primary opacity-100 border-b-2 border-primary' : 'text-secondary hover:bg-surface-container'
          ]"
        >
          文件
        </a>
        <a 
          @click="router.push('/shares')"
          :class="[
            'font-inter tracking-tighter font-bold uppercase text-xs px-3 py-1 transition-all duration-200 cursor-pointer hover-lift',
            currentRoute === 'Shares' ? 'text-primary opacity-100 border-b-2 border-primary' : 'text-secondary hover:bg-surface-container'
          ]"
        >
          分享
        </a>
        <a 
          v-if="authStore.isAdmin"
          @click="router.push('/users')"
          :class="[
            'font-inter tracking-tighter font-bold uppercase text-xs px-3 py-1 transition-all duration-200 cursor-pointer hover-lift',
            currentRoute === 'Users' ? 'text-primary opacity-100 border-b-2 border-primary' : 'text-secondary hover:bg-surface-container'
          ]"
        >
          用户
        </a>
      </nav>
      
      <div class="flex items-center gap-2 md:gap-4">
        <div class="hidden md:block text-right mr-4">
          <p class="text-sm font-bold text-primary">{{ authStore.user?.username }}</p>
          <p class="text-[10px] text-secondary uppercase tracking-wider">{{ authStore.isAdmin ? '管理员' : '用户' }}</p>
        </div>
        <div 
          @click="showPasswordModal = true"
          class="w-9 h-9 md:w-10 md:h-10 bg-surface-container-highest flex items-center justify-center overflow-hidden active:scale-95 cursor-pointer hover:bg-surface-container transition-all duration-200 hover-lift"
          title="修改密码"
        >
          <span class="material-symbols-outlined text-xl md:text-2xl">lock</span>
        </div>
        <div 
          @click="handleLogout"
          class="w-9 h-9 md:w-10 md:h-10 bg-surface-container-highest flex items-center justify-center overflow-hidden active:scale-95 cursor-pointer hover:bg-surface-container transition-all duration-200 hover-lift"
          title="退出登录"
        >
          <span class="material-symbols-outlined text-xl md:text-2xl">logout</span>
        </div>
      </div>
    </header>

    <main class="pt-24 md:pt-32 pb-28 md:pb-32 px-4 md:px-8 max-w-7xl mx-auto">
      <slot></slot>
    </main>

    <ChangePasswordModal 
      v-if="showPasswordModal"
      @close="showPasswordModal = false"
    />

    <button 
      v-if="showUploadButton"
      @click="$emit('upload')"
      class="fixed bottom-24 md:bottom-12 right-4 md:right-8 bg-primary text-white flex items-center justify-center w-14 h-14 md:w-auto md:h-16 md:gap-3 md:pl-6 md:pr-8 shadow-[0_20px_40px_rgba(28,27,27,0.2)] active:scale-95 transition-all duration-200 z-40 hover-lift"
    >
      <span class="material-symbols-outlined text-2xl">add</span>
      <span class="hidden md:inline text-xs font-bold uppercase tracking-[0.2em]">上传文件</span>
    </button>

    <nav class="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-20 px-4 bg-surface-container-low border-t border-surface-variant z-50">
      <div 
        @click="router.push('/files')"
        :class="[
          'flex flex-col items-center justify-center active:scale-90 cursor-pointer transition-all duration-200 px-4 py-2',
          currentRoute === 'Files' ? 'text-primary font-bold' : 'text-secondary opacity-50 hover:opacity-100'
        ]"
      >
        <span class="material-symbols-outlined text-2xl" :style="currentRoute === 'Files' ? 'font-variation-settings: FILL 1' : ''">folder_open</span>
        <span class="text-[10px] tracking-widest uppercase mt-1">文件</span>
      </div>
      <div 
        @click="router.push('/shares')"
        :class="[
          'flex flex-col items-center justify-center active:scale-90 cursor-pointer transition-all duration-200 px-4 py-2',
          currentRoute === 'Shares' ? 'text-primary font-bold' : 'text-secondary opacity-50 hover:opacity-100'
        ]"
      >
        <span class="material-symbols-outlined text-2xl" :style="currentRoute === 'Shares' ? 'font-variation-settings: FILL 1' : ''">share</span>
        <span class="text-[10px] tracking-widest uppercase mt-1">分享</span>
      </div>
      <div 
        v-if="authStore.isAdmin"
        @click="router.push('/users')"
        :class="[
          'flex flex-col items-center justify-center active:scale-90 cursor-pointer transition-all duration-200 px-4 py-2',
          currentRoute === 'Users' ? 'text-primary font-bold' : 'text-secondary opacity-50 hover:opacity-100'
        ]"
      >
        <span class="material-symbols-outlined text-2xl" :style="currentRoute === 'Users' ? 'font-variation-settings: FILL 1' : ''">group</span>
        <span class="text-[10px] tracking-widest uppercase mt-1">用户</span>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ChangePasswordModal from '@/components/ChangePasswordModal.vue'

const props = defineProps({
  showUploadButton: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['upload'])

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const showPasswordModal = ref(false)

const currentRoute = computed(() => route.name)

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
