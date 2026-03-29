<template>
  <MainLayout>
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8 mb-8 md:mb-16">
      <div>
        <span class="text-[10px] tracking-[0.2em] text-secondary font-bold mb-1 md:mb-2 block uppercase">Management</span>
        <h2 class="text-3xl md:text-5xl lg:text-7xl font-black tracking-tighter text-primary">我分享的链接</h2>
        <p class="mt-2 md:mt-4 text-sm md:text-base text-on-surface-variant font-medium tracking-tight">{{ pagination.total }} 个活跃链接 — 正在监控数据传输状态</p>
      </div>
    </div>

    <div class="bg-surface-container-low p-1 mb-8 md:mb-12 flex flex-col gap-1">
      <div class="relative flex-grow">
        <span class="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary">search</span>
        <input 
          v-model="searchKeyword"
          @input="handleSearch"
          class="w-full bg-surface-container-lowest border-none pl-12 md:pl-14 pr-4 md:pr-6 py-4 md:py-5 text-sm focus:ring-0 focus:bg-white placeholder:text-outline transition-colors" 
          placeholder="搜索文件名或提取码..." 
          type="text"
        />
      </div>
      <div class="flex flex-col md:flex-row gap-1">
        <select 
          v-model="statusFilter" 
          @change="fetchShares"
          class="bg-surface-container-lowest px-4 md:px-6 py-3 md:py-5 flex items-center gap-3 hover:bg-white transition-all w-full md:w-auto text-xs md:text-sm font-bold uppercase tracking-wider"
        >
          <option value="">全部状态</option>
          <option value="active">有效</option>
          <option value="expired">已过期</option>
        </select>
        <select 
          v-model="sortBy" 
          @change="fetchShares"
          class="bg-surface-container-lowest px-4 md:px-6 py-3 md:py-5 flex items-center gap-3 hover:bg-white transition-all w-full md:w-auto text-xs md:text-sm font-bold uppercase tracking-wider"
        >
          <option value="time">按时间排序</option>
          <option value="downloads">按下载量排序</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="text-secondary">加载中...</div>
    </div>

    <div v-else-if="shares.length === 0" class="text-center py-20">
      <span class="material-symbols-outlined text-5xl md:text-6xl text-outline mb-4">share</span>
      <p class="text-secondary">暂无分享记录</p>
    </div>

    <div v-else class="space-y-2 md:space-y-4">
      <div class="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-surface-dim text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
        <div class="col-span-4">文件名称</div>
        <div v-if="isAdmin" class="col-span-1">上传者</div>
        <div class="col-span-2">状态</div>
        <div class="col-span-2">过期时间</div>
        <div :class="isAdmin ? 'col-span-1' : 'col-span-1'">下载次数</div>
        <div :class="isAdmin ? 'col-span-2' : 'col-span-2'" class="text-right">操作</div>
      </div>

      <TransitionGroup name="slide-up" tag="div" class="space-y-2 md:space-y-0">
        <div 
          v-for="share in shares" 
          :key="share.share_id" 
          :class="[
            'transition-all duration-200 group hover-lift',
            share.is_expired ? 'bg-surface-container-low opacity-60 grayscale hover:grayscale-0' : 'bg-surface-container-lowest hover:bg-white'
          ]"
        >
          <div class="md:grid md:grid-cols-12 md:gap-4 md:items-center md:px-8 md:py-8 px-4 py-4">
            <div :class="isAdmin ? 'md:col-span-4' : 'md:col-span-5'" class="flex items-center gap-3 md:gap-6">
              <div :class="[
                'w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0 overflow-hidden',
                share.is_expired ? 'bg-surface-variant text-secondary' : 'bg-primary text-white'
              ]">
                <img 
                  v-if="share.thumbnail" 
                  :src="share.thumbnail" 
                  class="w-full h-full object-cover"
                  alt=""
                />
                <span v-else class="material-symbols-outlined text-xl md:text-2xl">{{ getFileIcon(share.filename) }}</span>
              </div>
              <div class="min-w-0 flex-1 overflow-hidden">
                <h4 class="font-bold text-sm md:text-lg tracking-tight text-primary truncate" :title="share.filename">{{ share.filename }}</h4>
                <p class="text-[10px] text-secondary uppercase tracking-widest mt-0.5 md:mt-1 truncate">{{ formatSize(share.file_size) }} · {{ getFileType(share.filename) }}</p>
              </div>
            </div>
            <div v-if="isAdmin" class="hidden md:block col-span-1">
              <span class="text-xs font-medium text-on-surface-variant truncate block" :title="share.username">{{ share.username || '-' }}</span>
            </div>
            <div class="hidden md:block col-span-2">
              <div v-if="share.is_expired" class="inline-flex items-center gap-2 px-3 py-1 bg-error-container text-error text-[10px] font-bold uppercase tracking-widest">
                <span class="material-symbols-outlined !text-[14px]">history</span>
                已过期
              </div>
              <div v-else-if="share.has_password" class="inline-flex items-center gap-2 px-3 py-1 bg-surface-container text-[10px] font-bold uppercase tracking-widest">
                <span class="material-symbols-outlined !text-[14px]">lock</span>
                密码保护
              </div>
              <div v-else class="inline-flex items-center gap-2 px-3 py-1 bg-surface-container text-[10px] font-bold uppercase tracking-widest">
                <span class="material-symbols-outlined !text-[14px]">public</span>
                公开链接
              </div>
            </div>
            <div class="hidden md:block col-span-2">
              <p v-if="share.is_expired" class="text-sm font-medium text-error">{{ formatDate(share.expire_at) }}</p>
              <p v-else class="text-sm font-medium text-on-surface-variant">{{ share.expire_at ? formatDate(share.expire_at) : '永久有效' }}</p>
            </div>
            <div class="hidden md:block col-span-1">
              <p class="text-sm font-black">{{ share.download_count }}</p>
            </div>
            <div :class="isAdmin ? 'col-span-2' : 'col-span-2'" class="hidden md:flex justify-end gap-1">
              <template v-if="share.is_expired">
                <button 
                  @click="handleReactivate(share)"
                  class="bg-primary text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all duration-200 hover-lift"
                >
                  重新激活
                </button>
              </template>
              <template v-else>
                <button 
                  @click="copyShareLink(share.share_code)"
                  class="p-3 hover:bg-surface-container transition-all duration-200 active:scale-90"
                  title="复制链接"
                >
                  <span class="material-symbols-outlined">content_copy</span>
                </button>
                <button 
                  @click="handleDelete(share)"
                  class="p-3 hover:bg-surface-container text-error transition-all duration-200 active:scale-90"
                  title="取消分享"
                >
                  <span class="material-symbols-outlined">link_off</span>
                </button>
              </template>
            </div>
            <div class="flex md:hidden items-center justify-between mt-3 pt-3 border-t border-surface-variant">
              <div class="flex items-center gap-2 flex-wrap">
                <div v-if="share.is_expired" class="inline-flex items-center gap-1 px-2 py-1 bg-error-container text-error text-[9px] font-bold uppercase tracking-tighter">
                  <span class="material-symbols-outlined !text-[12px]">history</span>
                  已过期
                </div>
                <div v-else-if="share.has_password" class="inline-flex items-center gap-1 px-2 py-1 bg-surface-container text-[9px] font-bold uppercase tracking-tighter">
                  <span class="material-symbols-outlined !text-[12px]">lock</span>
                  密码
                </div>
                <div v-else class="inline-flex items-center gap-1 px-2 py-1 bg-surface-container text-[9px] font-bold uppercase tracking-tighter">
                  <span class="material-symbols-outlined !text-[12px]">public</span>
                  公开
                </div>
                <span class="text-[10px] text-on-surface-variant">{{ share.download_count }}次下载</span>
                <span v-if="isAdmin && share.username" class="text-[10px] text-secondary">上传者: {{ share.username }}</span>
              </div>
              <div class="flex gap-1">
                <template v-if="share.is_expired">
                  <button 
                    @click="handleReactivate(share)"
                    class="bg-primary text-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all duration-200"
                  >
                    激活
                  </button>
                </template>
                <template v-else>
                  <button 
                    @click="copyShareLink(share.share_code)"
                    class="p-1.5 hover:bg-surface-container transition-all duration-200 active:scale-90"
                  >
                    <span class="material-symbols-outlined text-lg">content_copy</span>
                  </button>
                  <button 
                    @click="handleDelete(share)"
                    class="p-1.5 hover:bg-surface-container text-error transition-all duration-200 active:scale-90"
                  >
                    <span class="material-symbols-outlined text-lg">link_off</span>
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <div v-if="pagination.total > pagination.limit" class="mt-8 md:mt-12 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
      <p class="text-xs font-medium text-secondary text-center md:text-left">
        显示 {{ (pagination.page - 1) * pagination.limit + 1 }} - {{ Math.min(pagination.page * pagination.limit, pagination.total) }} 条，共计 {{ pagination.total }} 个分享
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

    <section class="mt-12 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      <div class="col-span-1 md:col-span-2 bg-primary p-6 md:p-12 text-white flex flex-col justify-between min-h-[200px] md:min-h-[300px]">
        <h3 class="text-2xl md:text-3xl font-black tracking-tight leading-none uppercase">安全概览</h3>
        <div class="flex justify-between items-end">
          <div>
            <p class="text-4xl md:text-6xl font-black">{{ activePercent }}%</p>
            <p class="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60 mt-2">链接有效性验证率</p>
          </div>
          <div class="text-right">
            <span class="material-symbols-outlined !text-[36px] md:!text-[48px] opacity-30">verified_user</span>
          </div>
        </div>
      </div>
      <div class="col-span-1 bg-surface-container-high p-6 md:p-8 flex flex-col justify-between">
        <div>
          <h5 class="text-[10px] font-black uppercase tracking-widest mb-3 md:mb-4">存储占用</h5>
          <div class="h-2 w-full bg-secondary-container mb-2">
            <div class="h-full bg-primary" :style="{ width: `${storagePercent}%` }"></div>
          </div>
          <p class="text-xs md:text-sm font-bold">{{ formatSize(storageStats.used) }} / {{ formatSize(storageStats.quota) }}</p>
        </div>
        <div class="mt-6 md:mt-8">
          <p class="text-xs text-on-surface-variant leading-relaxed">
            您已创建 {{ pagination.total }} 个分享链接，其中 {{ activeCount }} 个处于活跃状态。
          </p>
          <button 
            @click="cleanExpiredShares"
            class="mt-4 md:mt-6 border border-outline px-4 md:px-6 py-2 md:py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all w-full"
          >
            清理过期链接
          </button>
        </div>
      </div>
    </section>

    <div 
      v-if="showReactivateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
    >
      <div class="bg-surface-container-lowest w-full max-w-lg p-6 md:p-10 shadow-[0_20px_40px_rgba(28,27,27,0.2)]">
        <div class="flex items-center justify-between mb-6 md:mb-8">
          <h3 class="text-xl md:text-2xl font-bold tracking-tight text-primary">重新激活分享</h3>
          <button @click="showReactivateModal = false" class="p-2 hover:bg-surface-container transition-all">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="mb-6 md:mb-8 p-4 bg-surface-container">
          <div class="flex items-center gap-4">
            <span class="material-symbols-outlined text-primary text-xl md:text-2xl">description</span>
            <div>
              <p class="font-bold text-sm truncate">{{ reactivateFile?.filename }}</p>
            </div>
          </div>
        </div>

        <form @submit.prevent="confirmReactivate" class="space-y-4 md:space-y-6">
          <div class="space-y-2">
            <label class="text-[10px] uppercase font-bold tracking-[0.1em] text-secondary">有效期 (小时)</label>
            <input 
              v-model="reactivateForm.expire_hours"
              type="number"
              min="0"
              class="block w-full px-4 py-3 md:py-4 bg-surface-container border-none focus:ring-0 focus:bg-surface-container-high transition-all text-sm"
              placeholder="留空表示永久有效"
            />
          </div>

          <div class="flex justify-end gap-3 md:gap-4 mt-6 md:mt-8">
            <button 
              type="button"
              @click="showReactivateModal = false"
              class="px-6 md:px-8 py-3 md:py-4 bg-surface-container hover:bg-surface-container-high transition-all font-bold text-xs uppercase tracking-widest"
            >
              取消
            </button>
            <button 
              type="submit"
              :disabled="reactivating"
              class="px-6 md:px-8 py-3 md:py-4 bg-primary text-white hover:bg-primary-fixed transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {{ reactivating ? '激活中...' : '确认激活' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import api from '@/utils/api'
import { useToastStore } from '@/stores/toast'
import { useAuthStore } from '@/stores/auth'

const toastStore = useToastStore()
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isAdmin)
const loading = ref(false)
const shares = ref([])
const searchKeyword = ref('')
const statusFilter = ref('')
const sortBy = ref('time')
const showReactivateModal = ref(false)
const reactivateFile = ref(null)
const reactivating = ref(false)

const reactivateForm = reactive({
  expire_hours: 24
})

const storageStats = reactive({
  used: 0,
  quota: 100 * 1024 * 1024 * 1024
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})

const activeCount = computed(() => {
  return shares.value.filter(s => !s.is_expired).length
})

const activePercent = computed(() => {
  if (pagination.total === 0) return 100
  return Math.round((activeCount.value / shares.value.length) * 100) || 0
})

const storagePercent = computed(() => {
  if (storageStats.quota === 0) return 0
  return Math.round((storageStats.used / storageStats.quota) * 100)
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

const fetchShares = async () => {
  loading.value = true
  try {
    const response = await api.get('/shares', {
      params: {
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter.value
      }
    })
    
    let sharesList = response.data.shares
    
    if (searchKeyword.value) {
      sharesList = sharesList.filter(s => 
        s.filename.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        s.share_code.toLowerCase().includes(searchKeyword.value.toLowerCase())
      )
    }
    
    if (sortBy.value === 'downloads') {
      sharesList.sort((a, b) => b.download_count - a.download_count)
    }
    
    shares.value = sharesList
    pagination.total = response.data.pagination.total
    pagination.totalPages = response.data.pagination.total_pages
  } catch (err) {
    console.error('获取分享列表失败:', err)
  } finally {
    loading.value = false
  }
}

const fetchStorageStats = async () => {
  try {
    const response = await api.get('/stats/storage')
    storageStats.used = response.data.used
    storageStats.quota = response.data.quota
  } catch (err) {
    console.error('获取存储统计失败:', err)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchShares()
}

const changePage = (page) => {
  if (page < 1 || page > pagination.totalPages) return
  pagination.page = page
  fetchShares()
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
    day: '2-digit'
  }).replace(/\//g, '-')
}

const getFileIcon = (filename) => {
  if (!filename) return 'description'
  const ext = filename.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
  if (['mp4', 'avi', 'mov', 'mkv'].includes(ext)) return 'videocam'
  if (['mp3', 'wav', 'flac'].includes(ext)) return 'audiotrack'
  if (ext === 'pdf') return 'picture_as_pdf'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'folder_zip'
  return 'description'
}

const getFileType = (filename) => {
  if (!filename) return 'File'
  const ext = filename.split('.').pop()?.toLowerCase()
  const types = {
    pdf: 'PDF Document',
    doc: 'Word Document',
    docx: 'Word Document',
    xls: 'Excel Spreadsheet',
    xlsx: 'Excel Spreadsheet',
    ppt: 'PowerPoint',
    pptx: 'PowerPoint',
    zip: 'Archive',
    rar: 'Archive',
    '7z': 'Archive'
  }
  return types[ext] || ext?.toUpperCase() || 'File'
}

const copyShareLink = async (code) => {
  const link = `${window.location.origin}/s/${code}`
  try {
    await navigator.clipboard.writeText(link)
    toastStore.success('分享链接已复制到剪贴板')
  } catch (err) {
    const textArea = document.createElement('textarea')
    textArea.value = link
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    toastStore.success('分享链接已复制到剪贴板')
  }
}

const handleDelete = async (share) => {
  if (!confirm(`确定要取消分享 "${share.filename}" 吗？`)) return
  
  try {
    await api.delete(`/shares/${share.share_id}`)
    fetchShares()
    toastStore.success('分享已取消')
  } catch (err) {
  }
}

const handleReactivate = (share) => {
  reactivateFile.value = share
  reactivateForm.expire_hours = 24
  showReactivateModal.value = true
}

const confirmReactivate = async () => {
  if (!reactivateFile.value) return
  
  reactivating.value = true
  
  try {
    await api.delete(`/shares/${reactivateFile.value.share_id}`)
    
    const response = await api.post('/shares', {
      file_id: reactivateFile.value.file_id || getFileIdFromShare(reactivateFile.value),
      expire_hours: reactivateForm.expire_hours || null,
      max_downloads: -1
    })
    
    showReactivateModal.value = false
    fetchShares()
    toastStore.success('分享已重新激活')
  } catch (err) {
  } finally {
    reactivating.value = false
  }
}

const getFileIdFromShare = (share) => {
  return share.file_id
}

const cleanExpiredShares = async () => {
  const expiredShares = shares.value.filter(s => s.is_expired)
  if (expiredShares.length === 0) {
    toastStore.info('没有过期的分享链接')
    return
  }
  
  if (!confirm(`确定要删除 ${expiredShares.length} 个过期的分享链接吗？`)) return
  
  try {
    for (const share of expiredShares) {
      await api.delete(`/shares/${share.share_id}`)
    }
    fetchShares()
    toastStore.success('过期链接已清理')
  } catch (err) {
  }
}

onMounted(() => {
  fetchShares()
  fetchStorageStats()
})
</script>
