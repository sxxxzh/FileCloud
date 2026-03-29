<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div class="bg-surface-container-lowest w-full max-w-lg p-10 shadow-[0_20px_40px_rgba(28,27,27,0.2)]">
      <div class="flex items-center justify-between mb-8">
        <h3 class="text-2xl font-bold tracking-tight text-primary">创建分享</h3>
        <button @click="$emit('close')" class="p-2 hover:bg-surface-container transition-all">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="mb-8 p-4 bg-surface-container">
        <div class="flex items-center gap-4">
          <span class="material-symbols-outlined text-primary text-2xl">description</span>
          <div>
            <p class="font-bold text-sm">{{ file?.original_name }}</p>
            <p class="text-xs text-on-surface-variant">{{ formatSize(file?.file_size) }}</p>
          </div>
        </div>
      </div>

      <form @submit.prevent="handleCreate" class="space-y-6">
        <div class="space-y-2">
          <label class="text-[10px] uppercase font-bold tracking-[0.1em] text-secondary">有效期 (小时)</label>
          <input 
            v-model="form.expire_hours"
            type="number"
            min="0"
            class="block w-full px-4 py-4 bg-surface-container border-none focus:ring-0 focus:bg-surface-container-high transition-all text-sm"
            placeholder="留空表示永久有效"
          />
        </div>

        <div class="space-y-2">
          <label class="text-[10px] uppercase font-bold tracking-[0.1em] text-secondary">最大下载次数</label>
          <input 
            v-model="form.max_downloads"
            type="number"
            min="-1"
            class="block w-full px-4 py-4 bg-surface-container border-none focus:ring-0 focus:bg-surface-container-high transition-all text-sm"
            placeholder="-1 表示无限制"
          />
        </div>

        <div class="space-y-2">
          <label class="text-[10px] uppercase font-bold tracking-[0.1em] text-secondary">访问密码 (可选)</label>
          <input 
            v-model="form.password"
            type="text"
            class="block w-full px-4 py-4 bg-surface-container border-none focus:ring-0 focus:bg-surface-container-high transition-all text-sm"
            placeholder="留空表示无需密码"
          />
        </div>

        <div class="flex justify-end gap-4 mt-8">
          <button 
            type="button"
            @click="$emit('close')"
            class="px-8 py-4 bg-surface-container hover:bg-surface-container-high transition-all font-bold text-xs uppercase tracking-widest"
          >
            取消
          </button>
          <button 
            type="submit"
            :disabled="loading"
            class="px-8 py-4 bg-primary text-white hover:bg-primary-fixed transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
          >
            {{ loading ? '创建中...' : '创建分享' }}
          </button>
        </div>
      </form>

      <div v-if="shareLink" class="mt-8 p-4 bg-surface-container">
        <p class="text-[10px] uppercase font-bold tracking-[0.1em] text-secondary mb-2">分享链接</p>
        <div class="flex items-center gap-2">
          <input 
            :value="shareLink"
            readonly
            class="flex-1 px-4 py-2 bg-surface-container-lowest text-sm font-mono"
          />
          <button 
            @click="copyLink"
            class="px-4 py-2 bg-primary text-white font-bold text-xs uppercase tracking-wider"
          >
            复制
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import api from '@/utils/api'

const props = defineProps({
  file: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'created'])

const loading = ref(false)
const shareLink = ref('')

const form = reactive({
  expire_hours: null,
  max_downloads: -1,
  password: ''
})

const formatSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleCreate = async () => {
  if (!props.file) return
  
  loading.value = true
  
  try {
    const response = await api.post('/shares', {
      file_id: props.file.file_id,
      expire_hours: form.expire_hours || null,
      max_downloads: form.max_downloads,
      password: form.password || null
    })
    
    shareLink.value = `${window.location.origin}/s/${response.data.share_code}`
    emit('created')
  } catch (err) {
    alert(err.message || '创建分享失败')
  } finally {
    loading.value = false
  }
}

const copyLink = () => {
  navigator.clipboard.writeText(shareLink.value)
  alert('分享链接已复制到剪贴板')
}
</script>
