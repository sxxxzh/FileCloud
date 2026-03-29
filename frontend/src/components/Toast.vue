<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div 
          v-for="toast in toasts" 
          :key="toast.id"
          :class="[
            'pointer-events-auto px-4 py-3 shadow-lg flex items-center gap-3 min-w-[280px] max-w-[400px]',
            'bg-surface-container-lowest border-l-4',
            toastTypeClass(toast.type)
          ]"
        >
          <span class="material-symbols-outlined text-xl shrink-0">{{ toastIcon(toast.type) }}</span>
          <div class="flex-1 min-w-0">
            <p v-if="toast.title" class="font-bold text-sm mb-0.5">{{ toast.title }}</p>
            <p class="text-sm opacity-90 break-words">{{ toast.message }}</p>
          </div>
          <button 
            @click="removeToast(toast.id)"
            class="shrink-0 p-1 hover:bg-surface-container transition-colors"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()
const toasts = computed(() => toastStore.toasts)

const toastTypeClass = (type) => {
  const classes = {
    success: 'border-primary text-primary',
    error: 'border-error text-error',
    warning: 'border-tertiary text-tertiary',
    info: 'border-secondary text-secondary'
  }
  return classes[type] || classes.info
}

const toastIcon = (type) => {
  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  }
  return icons[type] || icons.info
}

const removeToast = (id) => {
  toastStore.remove(id)
}
</script>

<style scoped>
.toast-enter-active {
  animation: slideIn 0.3s ease-out;
}

.toast-leave-active {
  animation: slideOut 0.3s ease-in;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
</style>
