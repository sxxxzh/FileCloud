import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  let idCounter = 0

  const add = (options) => {
    const id = ++idCounter
    const toast = {
      id,
      type: options.type || 'info',
      title: options.title || '',
      message: options.message || '',
      duration: options.duration ?? 4000
    }
    
    toasts.value.push(toast)
    
    if (toast.duration > 0) {
      setTimeout(() => {
        remove(id)
      }, toast.duration)
    }
    
    return id
  }

  const remove = (id) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message, title = '') => {
    return add({ type: 'success', message, title })
  }

  const error = (message, title = '') => {
    return add({ type: 'error', message, title, duration: 6000 })
  }

  const warning = (message, title = '') => {
    return add({ type: 'warning', message, title })
  }

  const info = (message, title = '') => {
    return add({ type: 'info', message, title })
  }

  const clear = () => {
    toasts.value = []
  }

  return {
    toasts,
    add,
    remove,
    success,
    error,
    warning,
    info,
    clear
  }
})
