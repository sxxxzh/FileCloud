<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div class="bg-surface-container-lowest w-full max-w-md p-10 shadow-[0_20px_40px_rgba(28,27,27,0.2)]">
      <div class="flex items-center justify-between mb-8">
        <h3 class="text-2xl font-bold tracking-tight text-primary">修改密码</h3>
        <button @click="$emit('close')" class="p-2 hover:bg-surface-container transition-all">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">原密码</label>
          <input 
            v-model="form.old_password"
            type="password"
            required
            class="w-full bg-surface-container border-none py-4 px-4 text-base focus:ring-0 focus:bg-surface-container-high transition-colors"
            placeholder="请输入原密码"
          />
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">新密码</label>
          <input 
            v-model="form.new_password"
            type="password"
            required
            minlength="6"
            class="w-full bg-surface-container border-none py-4 px-4 text-base focus:ring-0 focus:bg-surface-container-high transition-colors"
            placeholder="请输入新密码（至少6位）"
          />
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">确认新密码</label>
          <input 
            v-model="form.confirm_password"
            type="password"
            required
            class="w-full bg-surface-container border-none py-4 px-4 text-base focus:ring-0 focus:bg-surface-container-high transition-colors"
            placeholder="请再次输入新密码"
          />
        </div>

        <div v-if="error" class="text-error text-sm">{{ error }}</div>
        <div v-if="success" class="text-primary text-sm">{{ success }}</div>

        <div class="flex justify-end gap-4 pt-4">
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
            {{ loading ? '修改中...' : '确认修改' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import api from '@/utils/api'

const emit = defineEmits(['close'])

const form = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const handleSubmit = async () => {
  error.value = ''
  success.value = ''

  if (form.new_password !== form.confirm_password) {
    error.value = '两次输入的新密码不一致'
    return
  }

  if (form.new_password.length < 6) {
    error.value = '新密码长度至少6位'
    return
  }

  loading.value = true

  try {
    await api.post('/users/me/password', {
      old_password: form.old_password,
      new_password: form.new_password
    })
    
    success.value = '密码修改成功'
    
    setTimeout(() => {
      emit('close')
    }, 1500)
  } catch (err) {
    error.value = err.response?.data?.message || '修改失败'
  } finally {
    loading.value = false
  }
}
</script>
