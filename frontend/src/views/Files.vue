<template>
  <MainLayout :show-upload-button="true" @upload="showUploadModal = true">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8 mb-8 md:mb-16">
      <div>
        <h2 class="text-3xl md:text-5xl lg:text-7xl font-black tracking-tighter text-primary mb-1 md:mb-2">我的文件</h2>
        <p class="text-sm md:text-base text-on-surface-variant font-medium tracking-tight">管理您的数字资产与机密文档</p>
      </div>
      <div class="w-full md:w-80">
        <div class="flex justify-between items-end mb-2 md:mb-3">
          <span class="text-[10px] font-bold uppercase tracking-widest text-secondary">已用空间</span>
          <span class="text-xs font-bold font-mono">{{ formatSize(stats.used) }} / {{ formatSize(stats.quota) }}</span>
        </div>
        <div class="h-1 bg-secondary-container w-full overflow-hidden">
          <div class="h-full bg-primary transition-all duration-500" :style="{ width: `${stats.usedPercent}%` }"></div>
        </div>
      </div>
    </div>

    <div class="relative mb-8 md:mb-16">
      <div class="absolute inset-y-0 left-4 md:left-6 flex items-center pointer-events-none">
        <span class="material-symbols-outlined text-outline">search</span>
      </div>
      <input 
        v-model="searchKeyword"
        @input="handleSearch"
        class="w-full bg-surface-container border-none py-4 md:py-6 pl-12 md:pl-16 pr-4 md:pr-8 text-base md:text-lg focus:ring-0 focus:bg-surface-container-high transition-colors placeholder:text-outline" 
        placeholder="搜索文件名..." 
        type="text"
      />
      <div class="absolute left-0 bottom-0 w-0 h-[1px] bg-primary transition-all duration-300 focus-within:w-full"></div>
    </div>

    <div class="flex flex-col md:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
      <div class="flex flex-col sm:flex-row gap-2 overflow-x-auto pb-1">
        <div class="flex gap-2">
          <button 
            @click="visibilityFilter = ''"
            :class="[
              'px-4 md:px-6 py-2 md:py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 hover-lift whitespace-nowrap',
              visibilityFilter === '' ? 'bg-primary text-white' : 'bg-surface-container-low hover:bg-surface-container'
            ]"
          >全部</button>
          <button 
            @click="visibilityFilter = '0'"
            :class="[
              'px-4 md:px-6 py-2 md:py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 hover-lift whitespace-nowrap',
              visibilityFilter === '0' ? 'bg-primary text-white' : 'bg-surface-container-low hover:bg-surface-container'
            ]"
          >私密</button>
          <button 
            @click="visibilityFilter = '1'"
            :class="[
              'px-4 md:px-6 py-2 md:py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 hover-lift whitespace-nowrap',
              visibilityFilter === '1' ? 'bg-primary text-white' : 'bg-surface-container-low hover:bg-surface-container'
            ]"
          >公开</button>
        </div>
        <div class="hidden sm:block w-px bg-surface-variant"></div>
        <div class="flex gap-2">
          <select 
            v-model="fileTypeFilter"
            @change="fetchFiles"
            class="bg-surface-container-low px-3 md:px-4 py-2 md:py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap hover:bg-surface-container transition-all"
          >
            <option value="">所有类型</option>
            <option value="image">图片</option>
            <option value="video">视频</option>
            <option value="audio">音频</option>
            <option value="document">文档</option>
            <option value="archive">压缩包</option>
            <option value="code">代码</option>
          </select>
          <select 
            v-model="sortBy"
            @change="fetchFiles"
            class="bg-surface-container-low px-3 md:px-4 py-2 md:py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap hover:bg-surface-container transition-all"
          >
            <option value="time_desc">最新上传</option>
            <option value="time_asc">最早上传</option>
            <option value="size_desc">最大文件</option>
            <option value="size_asc">最小文件</option>
            <option value="name_asc">名称 A-Z</option>
            <option value="name_desc">名称 Z-A</option>
            <option value="downloads_desc">下载最多</option>
            <option value="downloads_asc">下载最少</option>
          </select>
        </div>
      </div>
      <div class="flex-grow"></div>
      <div class="flex gap-3 md:gap-4 items-center">
        <span 
          @click="viewMode = 'list'"
          :class="['material-symbols-outlined cursor-pointer hover:text-primary transition-colors text-2xl', viewMode === 'list' ? 'text-primary' : 'text-outline']"
        >view_list</span>
        <span 
          @click="viewMode = 'grid'"
          :class="['material-symbols-outlined cursor-pointer hover:text-primary transition-colors text-2xl', viewMode === 'grid' ? 'text-primary' : 'text-outline']"
        >grid_view</span>
      </div>
    </div>

    <section class="mb-12 md:mb-20">
      <div v-if="loading" class="flex justify-center py-20">
        <div class="text-secondary">加载中...</div>
      </div>

      <div v-else-if="files.length === 0" class="text-center py-20">
        <span class="material-symbols-outlined text-5xl md:text-6xl text-outline mb-4">folder_open</span>
        <p class="text-secondary">暂无文件，点击右下角按钮上传</p>
      </div>

      <template v-else-if="viewMode === 'list'">
        <div class="hidden md:grid grid-cols-12 px-6 py-4 bg-surface-dim text-[10px] font-bold uppercase tracking-widest text-secondary">
          <div class="col-span-4">文件名</div>
          <div v-if="isAdmin" class="col-span-1">上传者</div>
          <div :class="isAdmin ? 'col-span-1' : 'col-span-2'">大小</div>
          <div :class="isAdmin ? 'col-span-2' : 'col-span-2'">状态</div>
          <div :class="isAdmin ? 'col-span-2' : 'col-span-2'">修改日期</div>
          <div :class="isAdmin ? 'col-span-2' : 'col-span-1'" class="text-right">操作</div>
        </div>

        <div class="space-y-2 md:space-y-4">
          <TransitionGroup name="slide-up" tag="div">
            <div 
              v-for="file in files" 
              :key="file.file_id"
              class="bg-surface-container-lowest hover:bg-surface-container transition-all duration-200 group hover-lift"
            >
              <div class="md:grid md:grid-cols-12 md:px-6 md:py-8 md:items-center px-4 py-4">
                <div :class="isAdmin ? 'md:col-span-4' : 'md:col-span-5'" class="flex items-center gap-3 md:gap-6">
                  <div class="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-surface-container text-primary group-hover:bg-white transition-all duration-200 shrink-0 overflow-hidden">
                    <img 
                      v-if="file.thumbnail" 
                      :src="file.thumbnail" 
                      class="w-full h-full object-cover"
                      alt=""
                    />
                    <span v-else class="material-symbols-outlined text-xl md:text-2xl">{{ getFileIcon(file.mime_type) }}</span>
                  </div>
                  <div class="min-w-0 flex-1 overflow-hidden">
                    <h5 class="font-bold text-sm tracking-tight truncate" :title="file.original_name">{{ file.original_name }}</h5>
                    <p class="text-[10px] text-on-surface-variant uppercase tracking-tighter mt-0.5 truncate">{{ getFileType(file.mime_type) }} · {{ formatSize(file.file_size) }}</p>
                  </div>
                </div>
                <div v-if="isAdmin" class="hidden md:block col-span-1">
                  <span class="text-xs font-medium text-on-surface-variant truncate block" :title="file.username">{{ file.username || '-' }}</span>
                </div>
                <div :class="isAdmin ? 'col-span-1' : 'col-span-2'" class="hidden md:block text-xs font-mono">{{ formatSize(file.file_size) }}</div>
                <div class="hidden md:block col-span-2">
                  <button 
                    @click.stop="toggleVisibility(file)"
                    :class="[
                      'inline-flex items-center gap-1 px-2 py-1 text-[9px] font-bold uppercase tracking-tighter transition-all duration-200 hover-lift',
                      file.visibility === 1 ? 'bg-primary text-white' : 'bg-surface-dim text-primary hover:bg-surface-container-high'
                    ]"
                  >
                    <span class="material-symbols-outlined !text-[12px]">{{ file.visibility === 1 ? 'public' : 'lock' }}</span>
                    {{ file.visibility === 1 ? '公开' : '私密' }}
                  </button>
                </div>
                <div class="hidden md:block col-span-2 text-xs text-on-surface-variant">{{ formatDate(file.created_at) }}</div>
                <div :class="isAdmin ? 'col-span-2' : 'col-span-1'" class="hidden md:flex justify-end gap-1">
                  <button 
                    @click.stop="handleShare(file)"
                    class="p-2 hover:bg-surface-container transition-all duration-200 active:scale-90"
                    title="分享"
                  >
                    <span class="material-symbols-outlined text-outline hover:text-primary transition-colors">share</span>
                  </button>
                  <button 
                    @click.stop="handleDownload(file)"
                    class="p-2 hover:bg-surface-container transition-all duration-200 active:scale-90"
                    title="下载"
                  >
                    <span class="material-symbols-outlined text-outline hover:text-primary transition-colors">download</span>
                  </button>
                  <button 
                    @click.stop="showFileMenu(file, $event)"
                    class="p-2 hover:bg-surface-container transition-all duration-200 active:scale-90"
                    title="更多"
                  >
                    <span class="material-symbols-outlined text-outline hover:text-primary transition-colors">more_vert</span>
                  </button>
                </div>
                <div class="flex md:hidden items-center justify-between mt-3 pt-3 border-t border-surface-variant">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span 
                      :class="[
                        'inline-flex items-center gap-1 px-2 py-1 text-[9px] font-bold uppercase tracking-tighter',
                        file.visibility === 1 ? 'bg-primary text-white' : 'bg-surface-dim text-primary'
                      ]"
                    >
                      <span class="material-symbols-outlined !text-[12px]">{{ file.visibility === 1 ? 'public' : 'lock' }}</span>
                      {{ file.visibility === 1 ? '公开' : '私密' }}
                    </span>
                    <span class="text-[10px] text-on-surface-variant">{{ formatDate(file.created_at) }}</span>
                    <span v-if="isAdmin && file.username" class="text-[10px] text-secondary">上传者: {{ file.username }}</span>
                  </div>
                  <div class="flex gap-1">
                    <button 
                      @click.stop="handleShare(file)"
                      class="p-1.5 hover:bg-surface-container transition-all duration-200 active:scale-90"
                    >
                      <span class="material-symbols-outlined text-lg text-outline">share</span>
                    </button>
                    <button 
                      @click.stop="handleDownload(file)"
                      class="p-1.5 hover:bg-surface-container transition-all duration-200 active:scale-90"
                    >
                      <span class="material-symbols-outlined text-lg text-outline">download</span>
                    </button>
                    <button 
                      @click.stop="showFileMenu(file, $event)"
                      class="p-1.5 hover:bg-surface-container transition-all duration-200 active:scale-90"
                    >
                      <span class="material-symbols-outlined text-lg text-outline">more_vert</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </template>

      <template v-else>
        <TransitionGroup name="scale" tag="div" class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6">
          <div 
            v-for="file in files" 
            :key="file.file_id"
            class="bg-surface-container-lowest rounded-lg overflow-hidden group cursor-pointer hover-lift"
            @click="handleFileClick(file)"
          >
            <div class="relative w-full aspect-[4/3] flex items-center justify-center bg-surface-container group-hover:bg-white transition-all duration-300 overflow-hidden">
              <div class="absolute top-2 right-2 md:top-3 md:right-3 flex gap-1 md:gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <button 
                  @click.stop="handleShare(file)"
                  class="w-7 h-7 md:w-8 md:h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 active:scale-90"
                  title="分享"
                >
                  <span class="material-symbols-outlined text-primary text-base md:text-lg">share</span>
                </button>
                <button 
                  @click.stop="handleDownload(file)"
                  class="w-7 h-7 md:w-8 md:h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 active:scale-90"
                  title="下载"
                >
                  <span class="material-symbols-outlined text-primary text-base md:text-lg">download</span>
                </button>
              </div>
              <img 
                v-if="file.thumbnail" 
                :src="file.thumbnail" 
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                alt=""
              />
              <span v-else :class="['material-symbols-outlined text-3xl md:text-5xl group-hover:scale-110 transition-transform duration-300', file.visibility === 1 ? 'text-primary' : 'text-outline']">
                {{ getFileIcon(file.mime_type) }}
              </span>
            </div>
            <div class="p-3 md:p-5 overflow-hidden">
              <div class="flex items-start justify-between gap-2 mb-1 md:mb-2">
                <h5 class="font-bold text-xs md:text-sm tracking-tight truncate flex-1" :title="file.original_name">{{ file.original_name }}</h5>
                <span 
                  :class="[
                    'inline-block w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0 mt-1',
                    file.visibility === 1 ? 'bg-primary' : 'bg-outline'
                  ]"
                ></span>
              </div>
              <div class="flex items-center justify-between text-[10px] md:text-[11px] text-on-surface-variant">
                <span class="font-mono truncate">{{ formatSize(file.file_size) }}</span>
                <span class="truncate ml-2">{{ formatDate(file.created_at) }}</span>
              </div>
              <div v-if="isAdmin && file.username" class="text-[10px] text-secondary mt-1 truncate">
                上传者: {{ file.username }}
              </div>
            </div>
          </div>
        </TransitionGroup>
      </template>

      <div v-if="pagination.total > pagination.limit" class="mt-8 md:mt-12 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
        <p class="text-xs font-medium text-secondary text-center md:text-left">
          显示 {{ (pagination.page - 1) * pagination.limit + 1 }} - {{ Math.min(pagination.page * pagination.limit, pagination.total) }} 条，共计 {{ pagination.total }} 个文件
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
    </section>

    <UploadModal 
      v-if="showUploadModal"
      @close="showUploadModal = false"
      @uploaded="handleUploaded"
    />

    <ShareModal 
      v-if="showShareModal"
      :file="selectedFile"
      @close="showShareModal = false"
      @created="handleShareCreated"
    />

    <div 
      v-if="showContextMenu"
      class="fixed inset-0 z-50"
      @click="showContextMenu = false"
    >
      <div 
        class="absolute bg-surface-container-lowest shadow-lg py-2 min-w-[140px] md:min-w-[160px] rounded-lg"
        :style="{ top: Math.min(contextMenuY, windowHeight - 200) + 'px', left: Math.min(contextMenuX, windowWidth - 180) + 'px' }"
      >
        <button 
          @click="handleContextMenuAction('share')"
          class="w-full px-3 md:px-4 py-2 md:py-3 text-left text-sm hover:bg-surface-container flex items-center gap-2 md:gap-3"
        >
          <span class="material-symbols-outlined text-base md:text-sm">share</span>
          创建分享
        </button>
        <button 
          @click="handleContextMenuAction('download')"
          class="w-full px-3 md:px-4 py-2 md:py-3 text-left text-sm hover:bg-surface-container flex items-center gap-2 md:gap-3"
        >
          <span class="material-symbols-outlined text-base md:text-sm">download</span>
          下载文件
        </button>
        <button 
          @click="handleContextMenuAction('visibility')"
          class="w-full px-3 md:px-4 py-2 md:py-3 text-left text-sm hover:bg-surface-container flex items-center gap-2 md:gap-3"
        >
          <span class="material-symbols-outlined text-base md:text-sm">{{ contextMenuFile?.visibility === 1 ? 'lock' : 'public' }}</span>
          {{ contextMenuFile?.visibility === 1 ? '设为私密' : '设为公开' }}
        </button>
        <div class="border-t border-surface-variant my-1"></div>
        <button 
          @click="handleContextMenuAction('delete')"
          class="w-full px-3 md:px-4 py-2 md:py-3 text-left text-sm hover:bg-error-container text-error flex items-center gap-2 md:gap-3"
        >
          <span class="material-symbols-outlined text-base md:text-sm">delete</span>
          删除文件
        </button>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import UploadModal from '@/components/UploadModal.vue'
import ShareModal from '@/components/ShareModal.vue'
import api from '@/utils/api'
import { useToastStore } from '@/stores/toast'
import { useAuthStore } from '@/stores/auth'

const toastStore = useToastStore()
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isAdmin)
const loading = ref(false)
const files = ref([])
const searchKeyword = ref('')
const viewMode = ref('list')
const visibilityFilter = ref('')
const fileTypeFilter = ref('')
const sortBy = ref('time_desc')
const showUploadModal = ref(false)
const showShareModal = ref(false)
const selectedFile = ref(null)
const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuFile = ref(null)
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 375)
const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 667)

const stats = reactive({
  used: 0,
  quota: 100 * 1024 * 1024 * 1024,
  usedPercent: 0
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

watch(visibilityFilter, () => {
  pagination.page = 1
  fetchFiles()
})

watch(fileTypeFilter, () => {
  pagination.page = 1
  fetchFiles()
})

const fetchFiles = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      keyword: searchKeyword.value,
      sort_by: sortBy.value
    }
    if (visibilityFilter.value !== '') {
      params.visibility = visibilityFilter.value
    }
    if (fileTypeFilter.value) {
      params.file_type = fileTypeFilter.value
    }
    
    const response = await api.get('/files', { params })
    
    files.value = response.data.files
    pagination.total = response.data.pagination.total
    pagination.totalPages = response.data.pagination.total_pages
  } catch (err) {
    console.error('获取文件列表失败:', err)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const response = await api.get('/stats/storage')
    stats.used = response.data.used
    stats.quota = response.data.quota
    stats.usedPercent = response.data.used_percent
  } catch (err) {
    console.error('获取存储统计失败:', err)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchFiles()
}

const changePage = (page) => {
  if (page < 1 || page > pagination.totalPages) return
  pagination.page = page
  fetchFiles()
}

const toggleVisibility = async (file) => {
  try {
    const newVisibility = file.visibility === 1 ? 0 : 1
    await api.patch(`/files/${file.file_id}/visibility`, { visibility: newVisibility })
    file.visibility = newVisibility
    toastStore.success('可见性已更新')
  } catch (err) {
  }
}

const showFileMenu = (file, event) => {
  contextMenuFile.value = file
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  showContextMenu.value = true
}

const handleContextMenuAction = (action) => {
  showContextMenu.value = false
  const file = contextMenuFile.value
  
  switch (action) {
    case 'share':
      handleShare(file)
      break
    case 'download':
      handleDownload(file)
      break
    case 'visibility':
      toggleVisibility(file)
      break
    case 'delete':
      handleDelete(file)
      break
  }
}

const handleFileClick = (file) => {
  selectedFile.value = file
  showShareModal.value = true
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
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\//g, '-')
}

const getFileIcon = (mimeType) => {
  if (!mimeType) return 'description'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'videocam'
  if (mimeType.startsWith('audio/')) return 'audiotrack'
  if (mimeType.includes('pdf')) return 'picture_as_pdf'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'folder_zip'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'description'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'table'
  return 'description'
}

const getFileType = (mimeType) => {
  if (!mimeType) return 'Unknown'
  if (mimeType.startsWith('image/')) return 'Image'
  if (mimeType.startsWith('video/')) return 'Video'
  if (mimeType.startsWith('audio/')) return 'Audio'
  if (mimeType.includes('pdf')) return 'PDF Document'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'Archive'
  return mimeType.split('/')[1]?.toUpperCase() || 'File'
}

const handleShare = (file) => {
  selectedFile.value = file
  showShareModal.value = true
}

const handleDownload = async (file) => {
  const token = localStorage.getItem('token')
  const link = document.createElement('a')
  link.href = `http://39.102.48.146:3000/api/v1/files/download/${file.file_id}?token=${token}`
  link.download = file.original_name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const handleDelete = async (file) => {
  if (!confirm(`确定要删除文件 "${file.original_name}" 吗？`)) return
  
  try {
    await api.delete(`/files/${file.file_id}`)
    fetchFiles()
    fetchStats()
    toastStore.success('文件已删除')
  } catch (err) {
  }
}

const handleUploaded = () => {
  showUploadModal.value = false
  fetchFiles()
  fetchStats()
}

const handleShareCreated = () => {
  showShareModal.value = false
}

const updateWindowSize = () => {
  windowWidth.value = window.innerWidth
  windowHeight.value = window.innerHeight
}

onMounted(() => {
  fetchFiles()
  fetchStats()
  window.addEventListener('resize', updateWindowSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowSize)
})
</script>
