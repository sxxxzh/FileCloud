<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div class="bg-surface-container-lowest w-full max-w-lg p-10 shadow-[0_20px_40px_rgba(28,27,27,0.2)]">
      <div class="flex items-center justify-between mb-8">
        <h3 class="text-2xl font-bold tracking-tight text-primary">上传文件</h3>
        <button @click="$emit('close')" class="p-2 hover:bg-surface-container transition-all">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div 
        @click="triggerUpload"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="handleDrop"
        :class="[
          'border-2 border-dashed p-12 text-center cursor-pointer transition-all',
          isDragging ? 'border-primary bg-surface-container' : 'border-outline-variant hover:border-primary'
        ]"
      >
        <span class="material-symbols-outlined text-5xl text-outline mb-4">cloud_upload</span>
        <p class="font-bold text-primary mb-2">点击或拖拽文件到此处</p>
        <p class="text-xs text-secondary">支持所有文件类型，最大 5GB</p>
      </div>

      <input 
        ref="fileInput"
        type="file"
        @change="handleFileSelect"
        class="hidden"
        multiple
      />

      <div v-if="uploadFiles.length > 0" class="mt-8 space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
        <div v-for="(file, index) in uploadFiles" :key="index" class="flex items-center gap-4 p-4 bg-surface-container">
          <span class="material-symbols-outlined text-primary">{{ getFileIcon(file.file.type) }}</span>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-sm truncate">{{ file.file.name }}</p>
            <div class="flex items-center gap-2 mt-2">
              <div class="flex-1 h-1 bg-secondary-container">
                <div class="h-full bg-primary transition-all" :style="{ width: `${file.progress}%` }"></div>
              </div>
              <span class="text-xs font-mono">{{ file.progress }}%</span>
            </div>
          </div>
          <span v-if="file.status === 'success'" class="material-symbols-outlined text-primary">check_circle</span>
          <span v-else-if="file.status === 'error'" class="material-symbols-outlined text-error">error</span>
        </div>
      </div>

      <div class="mt-8 flex items-center gap-4">
        <label class="flex items-center gap-3 cursor-pointer">
          <input v-model="visibility" type="checkbox" class="w-4 h-4" true-value="1" false-value="0" />
          <span class="text-sm font-medium">公开文件</span>
        </label>
      </div>

      <div class="mt-8 flex justify-end gap-4">
        <button 
          @click="$emit('close')"
          class="px-8 py-4 bg-surface-container hover:bg-surface-container-high transition-all font-bold text-xs uppercase tracking-widest"
        >
          取消
        </button>
        <button 
          @click="handleUpload"
          :disabled="uploadFiles.length === 0 || isUploading"
          class="px-8 py-4 bg-primary text-white hover:bg-primary-fixed transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
        >
          {{ isUploading ? '上传中...' : '开始上传' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/utils/api'

const emit = defineEmits(['close', 'uploaded'])

const fileInput = ref(null)
const isDragging = ref(false)
const visibility = ref(0)
const uploadFiles = ref([])
const isUploading = ref(false)

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files || [])
  addFiles(files)
}

const handleDrop = (e) => {
  isDragging.value = false
  const files = Array.from(e.dataTransfer.files || [])
  addFiles(files)
}

const addFiles = (files) => {
  files.forEach(file => {
    uploadFiles.value.push({
      file,
      progress: 0,
      status: 'pending'
    })
  })
}

const getFileIcon = (mimeType) => {
  if (!mimeType) return 'description'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'videocam'
  if (mimeType.startsWith('audio/')) return 'audiotrack'
  if (mimeType.includes('pdf')) return 'picture_as_pdf'
  return 'description'
}

const handleUpload = async () => {
  if (uploadFiles.value.length === 0 || isUploading.value) return
  
  isUploading.value = true
  
  for (const item of uploadFiles.value) {
    if (item.status !== 'pending') continue
    
    try {
      const formData = new FormData()
      formData.append('file', item.file)
      formData.append('visibility', visibility.value)
      
      await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          item.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      })
      
      item.status = 'success'
    } catch (err) {
      item.status = 'error'
      console.error('上传失败:', err)
    }
  }
  
  isUploading.value = false
  emit('uploaded')
}
</script>
