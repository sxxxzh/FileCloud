<template>
  <MainLayout>
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-16 gap-4 md:gap-6">
      <div>
        <p class="text-[10px] tracking-[0.2em] text-secondary font-bold mb-1 md:mb-2 uppercase">Administrative Control</p>
        <h2 class="text-3xl md:text-5xl font-black tracking-tighter text-primary">用户管理</h2>
      </div>
      <div class="flex gap-3 md:gap-4 w-full md:w-auto">
        <button 
          @click="exportUsers"
          class="flex-1 md:flex-none bg-surface-container-low px-4 md:px-8 py-3 md:py-4 font-bold text-xs uppercase tracking-widest hover:bg-surface-container transition-all duration-200 active:scale-95 hover-lift"
        >
          <span class="material-symbols-outlined text-sm align-middle mr-1 md:mr-2">ios_share</span>
          <span class="hidden md:inline">导出数据</span>
          <span class="md:hidden">导出</span>
        </button>
        <button 
          @click="showCreateModal = true"
          class="flex-1 md:flex-none bg-primary text-white px-4 md:px-8 py-3 md:py-4 font-bold text-xs uppercase tracking-widest hover:bg-primary-fixed transition-all duration-200 active:scale-95 hover-lift"
        >
          + <span class="hidden md:inline">新增用户</span>
          <span class="md:hidden">新增</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-px bg-transparent md:bg-outline-variant mb-8 md:mb-16 shadow-none md:shadow-[0_20px_40px_rgba(28,27,27,0.04)]">
      <div class="bg-surface-container-lowest p-4 md:p-8 group hover:bg-surface-container transition-all duration-200 hover-lift">
        <p class="text-[9px] md:text-[10px] tracking-widest text-secondary uppercase mb-2 md:mb-4">活跃用户</p>
        <div class="flex items-baseline gap-1 md:gap-2">
          <span class="text-2xl md:text-4xl font-black tracking-tighter">{{ stats.totalUsers }}</span>
          <span class="text-xs font-bold text-primary">位</span>
        </div>
      </div>
      <div class="bg-surface-container-lowest p-4 md:p-8 group hover:bg-surface-container transition-all duration-200 hover-lift">
        <p class="text-[9px] md:text-[10px] tracking-widest text-secondary uppercase mb-2 md:mb-4">存储使用</p>
        <div class="flex items-baseline gap-1 md:gap-2">
          <span class="text-2xl md:text-4xl font-black tracking-tighter">{{ formatSize(stats.totalStorage) }}</span>
        </div>
      </div>
      <div class="bg-surface-container-lowest p-4 md:p-8 group hover:bg-surface-container transition-all duration-200 hover-lift">
        <p class="text-[9px] md:text-[10px] tracking-widest text-secondary uppercase mb-2 md:mb-4">管理员</p>
        <div class="flex items-baseline gap-1 md:gap-2">
          <span class="text-2xl md:text-4xl font-black tracking-tighter">{{ stats.adminCount }}</span>
          <span class="text-xs font-bold text-primary">位</span>
        </div>
      </div>
      <div class="bg-surface-container-lowest p-4 md:p-8 group hover:bg-surface-container transition-all duration-200 hover-lift">
        <p class="text-[9px] md:text-[10px] tracking-widest text-secondary uppercase mb-2 md:mb-4">文件总数</p>
        <div class="flex items-baseline gap-1 md:gap-2">
          <span class="text-2xl md:text-4xl font-black tracking-tighter">{{ stats.totalFiles }}</span>
          <span class="text-xs font-bold text-primary">个</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
      <div class="relative flex-grow">
        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">search</span>
        <input 
          v-model="searchKeyword"
          @input="handleSearch"
          class="w-full bg-surface-container-low border-none pl-12 pr-4 py-3 md:py-4 text-sm focus:bg-surface-container-high focus:ring-0 transition-all border-l-2 border-transparent focus:border-primary" 
          placeholder="搜索用户名、邮箱..." 
          type="text"
        />
      </div>
      <div class="flex gap-3 md:gap-4">
        <select 
          v-model="roleFilter" 
          @change="fetchUsers"
          class="bg-surface-container-low px-4 md:px-6 py-3 md:py-4 text-xs font-bold uppercase tracking-wider flex-1 md:flex-none"
        >
          <option value="">全部角色</option>
          <option value="1">管理员</option>
          <option value="0">普通用户</option>
        </select>
        <button 
          @click="showFilterPanel = !showFilterPanel"
          :class="[
            'bg-surface-container-low px-4 md:px-6 py-3 md:py-4 flex items-center gap-2 md:gap-3 hover:bg-surface-container-high transition-all active:scale-95',
            showFilterPanel ? 'bg-surface-container-high' : ''
          ]"
        >
          <span class="material-symbols-outlined text-lg md:text-xl">filter_list</span>
          <span class="text-xs font-bold uppercase tracking-wider hidden md:inline">筛选</span>
        </button>
      </div>
    </div>

    <div v-if="showFilterPanel" class="bg-surface-container-low p-4 md:p-6 mb-6 md:mb-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div>
          <label class="text-[10px] uppercase font-bold tracking-[0.1em] text-secondary mb-2 block">存储使用量</label>
          <select v-model="storageFilter" @change="fetchUsers" class="w-full bg-surface-container-lowest px-4 py-3 text-sm">
            <option value="">不限</option>
            <option value="low">小于 1GB</option>
            <option value="medium">1GB - 10GB</option>
            <option value="high">大于 10GB</option>
          </select>
        </div>
        <div>
          <label class="text-[10px] uppercase font-bold tracking-[0.1em] text-secondary mb-2 block">账号状态</label>
          <select v-model="statusFilter" @change="fetchUsers" class="w-full bg-surface-container-lowest px-4 py-3 text-sm">
            <option value="">全部</option>
            <option value="1">正常</option>
            <option value="0">禁用</option>
          </select>
        </div>
        <div class="flex items-end">
          <button 
            @click="resetFilters"
            class="w-full bg-surface-container-lowest px-4 py-3 text-sm font-bold hover:bg-surface-container transition-all"
          >
            重置筛选
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="text-secondary">加载中...</div>
    </div>

    <div v-else class="space-y-2 md:space-y-0">
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full border-collapse table-fixed">
          <thead>
            <tr class="bg-surface-dim">
              <th class="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary w-[30%]">用户信息</th>
              <th class="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary w-[15%]">权限等级</th>
              <th class="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary w-[25%]">存储配额</th>
              <th class="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary w-[15%]">创建时间</th>
              <th class="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary w-[15%]">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-variant">
            <TransitionGroup name="slide-up">
              <tr v-for="user in filteredUsers" :key="user.user_id" class="bg-surface-container-lowest hover:bg-surface-container transition-all duration-200 group hover-lift">
                <td class="px-6 py-6">
                  <div class="flex items-center gap-4">
                    <div :class="[
                      'w-10 h-10 flex items-center justify-center font-bold text-xs transition-all duration-200',
                      user.role === 1 ? 'bg-primary text-white' : 'bg-secondary-container text-primary'
                    ]">
                      {{ getInitials(user.username) }}
                    </div>
                    <div>
                      <p class="font-bold text-sm text-primary truncate">{{ user.username }}</p>
                      <p class="text-xs text-on-surface-variant truncate">{{ user.email || '未设置邮箱' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-6">
                  <span 
                    :class="[
                      'inline-block px-2 py-1 text-[9px] font-bold uppercase tracking-tighter transition-all duration-200 hover-lift',
                      user.role === 1 ? 'bg-primary text-white' : 'bg-surface-dim text-primary'
                    ]"
                  >{{ user.role === 1 ? '系统管理员' : '标准用户' }}</span>
                </td>
                <td class="px-6 py-6">
                  <div class="w-full h-1 bg-secondary-container">
                    <div class="h-full bg-primary transition-all duration-500" :style="{ width: `${getStoragePercent(user)}%` }"></div>
                  </div>
                  <p class="text-[10px] font-bold mt-2">{{ formatSize(user.storage_used) }} / {{ formatSize(user.storage_quota) }}</p>
                </td>
                <td class="px-6 py-6">
                  <p class="text-xs font-medium">{{ formatDate(user.created_at) }}</p>
                </td>
                <td class="px-6 py-6 text-right">
                  <div class="flex justify-end gap-1">
                    <button 
                      @click="handleEdit(user)" 
                      class="p-2 hover:bg-surface-dim transition-all duration-200 active:scale-90"
                      title="编辑"
                    >
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button 
                      v-if="user.role !== 1"
                      @click="handleDelete(user)" 
                      class="p-2 hover:bg-surface-dim transition-all duration-200 active:scale-90"
                      title="删除"
                    >
                      <span class="material-symbols-outlined text-error">delete</span>
                    </button>
                    <button 
                      v-if="user.role !== 1"
                      @click="toggleUserStatus(user)"
                      class="p-2 hover:bg-surface-dim transition-all duration-200 active:scale-90"
                      :title="user.status === 1 ? '禁用' : '启用'"
                    >
                      <span :class="['material-symbols-outlined transition-colors duration-200', user.status === 1 ? 'text-primary' : 'text-error']">
                        {{ user.status === 1 ? 'toggle_on' : 'toggle_off' }}
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            </TransitionGroup>
          </tbody>
        </table>
      </div>

      <div class="md:hidden space-y-2">
        <TransitionGroup name="slide-up">
          <div 
            v-for="user in filteredUsers" 
            :key="user.user_id"
            class="bg-surface-container-lowest p-4 hover:bg-surface-container transition-all duration-200"
          >
            <div class="flex items-center gap-3 mb-3">
              <div :class="[
                'w-10 h-10 flex items-center justify-center font-bold text-xs shrink-0',
                user.role === 1 ? 'bg-primary text-white' : 'bg-secondary-container text-primary'
              ]">
                {{ getInitials(user.username) }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-bold text-sm text-primary truncate">{{ user.username }}</p>
                <p class="text-xs text-on-surface-variant truncate">{{ user.email || '未设置邮箱' }}</p>
              </div>
              <span 
                :class="[
                  'inline-block px-2 py-1 text-[9px] font-bold uppercase tracking-tighter',
                  user.role === 1 ? 'bg-primary text-white' : 'bg-surface-dim text-primary'
                ]"
              >{{ user.role === 1 ? '管理员' : '用户' }}</span>
            </div>
            <div class="mb-3">
              <div class="flex justify-between text-[10px] mb-1">
                <span class="text-secondary">存储配额</span>
                <span class="font-bold">{{ formatSize(user.storage_used) }} / {{ formatSize(user.storage_quota) }}</span>
              </div>
              <div class="h-1 bg-secondary-container">
                <div class="h-full bg-primary transition-all duration-500" :style="{ width: `${getStoragePercent(user)}%` }"></div>
              </div>
            </div>
            <div class="flex items-center justify-between pt-3 border-t border-surface-variant">
              <span class="text-[10px] text-on-surface-variant">{{ formatDate(user.created_at) }}</span>
              <div class="flex gap-1">
                <button 
                  @click="handleEdit(user)" 
                  class="p-1.5 hover:bg-surface-container transition-all duration-200 active:scale-90"
                >
                  <span class="material-symbols-outlined text-lg">edit</span>
                </button>
                <button 
                  v-if="user.role !== 1"
                  @click="handleDelete(user)" 
                  class="p-1.5 hover:bg-surface-container transition-all duration-200 active:scale-90"
                >
                  <span class="material-symbols-outlined text-lg text-error">delete</span>
                </button>
                <button 
                  v-if="user.role !== 1"
                  @click="toggleUserStatus(user)"
                  class="p-1.5 hover:bg-surface-container transition-all duration-200 active:scale-90"
                >
                  <span :class="['material-symbols-outlined text-lg transition-colors duration-200', user.status === 1 ? 'text-primary' : 'text-error']">
                    {{ user.status === 1 ? 'toggle_on' : 'toggle_off' }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <div v-if="pagination.total > pagination.limit" class="mt-8 md:mt-12 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
      <p class="text-xs font-medium text-secondary text-center md:text-left">
        显示 {{ (pagination.page - 1) * pagination.limit + 1 }} - {{ Math.min(pagination.page * pagination.limit, pagination.total) }} 条，共计 {{ pagination.total }} 位用户
      </p>
      <div class="flex items-center gap-1">
        <button 
          @click="changePage(pagination.page - 1)"
          :disabled="pagination.page === 1"
          class="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-surface-container-low hover:bg-surface-container-high transition-all duration-200 active:scale-90 disabled:opacity-50 hover-lift"
        >
          <span class="material-symbols-outlined text-lg md:text-xl">chevron_left</span>
        </button>
        <button 
          v-for="p in visiblePages" 
          :key="p"
          @click="changePage(p)"
          :class="[
            'w-9 h-9 md:w-10 md:h-10 flex items-center justify-center font-bold text-xs transition-all duration-200 hover-lift',
            p === pagination.page ? 'bg-primary text-white' : 'bg-surface-container-low hover:bg-surface-container-high'
          ]"
        >{{ p }}</button>
        <button 
          @click="changePage(pagination.page + 1)"
          :disabled="pagination.page === pagination.totalPages"
          class="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-surface-container-low hover:bg-surface-container-high transition-all duration-200 active:scale-90 disabled:opacity-50 hover-lift"
        >
          <span class="material-symbols-outlined text-lg md:text-xl">chevron_right</span>
        </button>
      </div>
    </div>

    <UserModal 
      v-if="showCreateModal || showEditModal"
      :user="editingUser"
      @close="closeModal"
      @saved="handleSaved"
    />
  </MainLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import UserModal from '@/components/UserModal.vue'
import api from '@/utils/api'
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()
const loading = ref(false)
const users = ref([])
const searchKeyword = ref('')
const roleFilter = ref('')
const storageFilter = ref('')
const statusFilter = ref('')
const showFilterPanel = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingUser = ref(null)

const stats = reactive({
  totalUsers: 0,
  adminCount: 0,
  totalStorage: 0,
  totalFiles: 0
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})

const visiblePages = computed(() => {
  const pages = []
  const total = pagination.totalPages
  const current = pagination.page
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

const filteredUsers = computed(() => {
  let result = users.value
  
  if (storageFilter.value) {
    result = result.filter(user => {
      const used = user.storage_used
      if (storageFilter.value === 'low') return used < 1024 * 1024 * 1024
      if (storageFilter.value === 'medium') return used >= 1024 * 1024 * 1024 && used <= 10 * 1024 * 1024 * 1024
      if (storageFilter.value === 'high') return used > 10 * 1024 * 1024 * 1024
      return true
    })
  }
  
  if (statusFilter.value !== '') {
    result = result.filter(user => user.status === parseInt(statusFilter.value))
  }
  
  return result
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await api.get('/users', {
      params: {
        page: pagination.page,
        limit: pagination.limit,
        role: roleFilter.value,
        keyword: searchKeyword.value
      }
    })
    
    users.value = response.data.users
    pagination.total = response.data.pagination.total
    pagination.totalPages = response.data.pagination.total_pages
  } catch (err) {
    console.error('获取用户列表失败:', err)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const response = await api.get('/stats/system')
    stats.totalUsers = response.data.total_users
    stats.adminCount = response.data.admin_count
    stats.totalStorage = response.data.total_storage
    stats.totalFiles = response.data.total_files
  } catch (err) {
    console.error('获取系统统计失败:', err)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchUsers()
}

const changePage = (page) => {
  if (page < 1 || page > pagination.totalPages) return
  pagination.page = page
  fetchUsers()
}

const resetFilters = () => {
  roleFilter.value = ''
  storageFilter.value = ''
  statusFilter.value = ''
  searchKeyword.value = ''
  showFilterPanel.value = false
  fetchUsers()
}

const getInitials = (username) => {
  return username.slice(0, 2).toUpperCase()
}

const getStoragePercent = (user) => {
  if (user.storage_quota === 0) return 0
  return Math.min(100, Math.round((user.storage_used / user.storage_quota) * 100))
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
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
    day: '2-digit'
  }).replace(/\//g, '-')
}

const handleEdit = (user) => {
  editingUser.value = user
  showEditModal.value = true
}

const handleDelete = async (user) => {
  if (!confirm(`确定要删除用户 "${user.username}" 吗？此操作不可恢复。`)) return
  
  try {
    await api.delete(`/users/${user.user_id}`)
    fetchUsers()
    fetchStats()
    toastStore.success('用户已删除')
  } catch (err) {
  }
}

const toggleUserStatus = async (user) => {
  const newStatus = user.status === 1 ? 0 : 1
  const action = newStatus === 0 ? '禁用' : '启用'
  
  if (!confirm(`确定要${action}用户 "${user.username}" 吗？`)) return
  
  try {
    await api.patch(`/users/${user.user_id}`, { status: newStatus })
    user.status = newStatus
    toastStore.success(`用户已${action}`)
  } catch (err) {
  }
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingUser.value = null
}

const handleSaved = () => {
  closeModal()
  fetchUsers()
  fetchStats()
}

const exportUsers = () => {
  const data = filteredUsers.value.map(user => ({
    用户名: user.username,
    邮箱: user.email || '',
    角色: user.role === 1 ? '管理员' : '普通用户',
    存储已用: formatSize(user.storage_used),
    存储配额: formatSize(user.storage_quota),
    状态: user.status === 1 ? '正常' : '禁用',
    创建时间: formatDate(user.created_at)
  }))
  
  const headers = Object.keys(data[0] || {}).join(',')
  const rows = data.map(row => Object.values(row).join(',')).join('\n')
  const csv = headers + '\n' + rows
  
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `users_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
}

onMounted(() => {
  fetchUsers()
  fetchStats()
})
</script>
