<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div class="bg-surface-container-lowest w-full max-w-lg p-10 shadow-[0_20px_40px_rgba(28,27,27,0.2)]">
      <div class="flex items-center justify-between mb-8">
        <h3 class="text-2xl font-bold tracking-tight text-primary">{{ user ? '编辑用户' : '新增用户' }}</h3>
        <button @click="$emit('close')" class="p-2 hover:bg-surface-container transition-all">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="space-y-2">
          <label class="text-[10px] uppercase font-bold tracking-[0.1em] text-secondary">用户名</label>
          <input 
            v-model="form.username"
            type="text"
            required
            :disabled="!!user"
            class="block w-full px-4 py-4 bg-surface-container border-none focus:ring-0 focus:bg-surface-container-high transition-all text-sm disabled:opacity-50"
            placeholder="请输入用户名"
          />
        </div>

        <div class="space-y-2">
          <label class="text-[10px] uppercase font-bold tracking-[0.1em] text-secondary">邮箱</label>
          <input 
            v-model="form.email"
            type="email"
            class="block w-full px-4 py-4 bg-surface-container border-none focus:ring-0 focus:bg-surface-container-high transition-all text-sm"
            placeholder="请输入邮箱 (可选)"
          />
        </div>

        <div class="space-y-2">
          <label class="text-[10px] uppercase font-bold tracking-[0.1em] text-secondary">{{ user ? '新密码 (留空不修改)' : '密码' }}</label>
          <input 
            v-model="form.password"
            type="text"
            :required="!user"
            class="block w-full px-4 py-4 bg-surface-container border-none focus:ring-0 focus:bg-surface-container-high transition-all text-sm"
            placeholder="请输入密码"
          />
        </div>

        <div class="space-y-2">
          <label class="text-[10px] uppercase font-bold tracking-[0.1em] text-secondary">存储配额 (GB)</label>
          <input 
            v-model.number="form.storage_quota_gb"
            type="number"
            min="1"
            class="block w-full px-4 py-4 bg-surface-container border-none focus:ring-0 focus:bg-surface-container-high transition-all text-sm"
            placeholder="请输入存储配额"
          />
        </div>

        <div v-if="error" class="p-4 bg-error-container text-on-error-container text-sm">
          {{ error }}
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
            {{ loading ? '保存中...' : '保存' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import api from '@/utils/api'

const props = defineProps({
  user: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const loading = ref(false)
const error = ref('')

const form = reactive({
  username: '',
  email: '',
  password: '',
  storage_quota_gb: 10
})

watch(() => props.user, (newUser) => {
  if (newUser) {
    form.username = newUser.username
    form.email = newUser.email || ''
    form.password = ''
    form.storage_quota_gb = Math.round(newUser.storage_quota / (1024 * 1024 * 1024))
  } else {
    form.username = ''
    form.email = ''
    form.password = ''
    form.storage_quota_gb = 10
  }
}, { immediate: true })

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const data = {
      email: form.email || null,
      storage_quota: form.storage_quota_gb * 1024 * 1024 * 1024
    }
    
    if (form.password) {
      data.password = form.password
    }
    
    if (props.user) {
      await api.patch(`/users/${props.user.user_id}`, data)
    } else {
      data.username = form.username
      if (!form.password) {
        throw new Error('密码不能为空')
      }
      await api.post('/users', data)
    }
    
    emit('saved')
  } catch (err) {
    error.value = err.message || '操作失败'
  } finally {
    loading.value = false
  }
}
</script>
