import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const api = axios.create({
  baseURL: 'http://39.102.48.146:3000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const toastStore = useToastStore()
    
    if (error.response) {
      const { status, data } = error.response
      const message = data?.message || data?.error || '请求失败'
      
      if (status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
        toastStore.error('登录已过期，请重新登录')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      } else if (status === 403) {
        toastStore.error(message || '没有权限执行此操作')
      } else if (status === 404) {
        toastStore.error(message || '请求的资源不存在')
      } else if (status === 429) {
        toastStore.error('请求过于频繁，请稍后再试')
      } else if (status >= 500) {
        toastStore.error('服务器错误，请稍后再试')
      } else {
        toastStore.error(message)
      }
      
      return Promise.reject(data || error)
    }
    
    if (error.code === 'ECONNABORTED') {
      toastStore.error('请求超时，请检查网络连接')
    } else if (error.message === 'Network Error') {
      toastStore.error('网络连接失败，请检查网络')
    } else {
      toastStore.error(error.message || '未知错误')
    }
    
    return Promise.reject(error)
  }
)

export default api
