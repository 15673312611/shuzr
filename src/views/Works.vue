<template>
  <div class="min-h-screen bg-[#F7F8FA] dark:bg-dark-bg p-6">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-2xl font-medium text-gray-800 dark:text-gray-200 mb-6">我的作品</h1>
      
      <!-- 作品列表 -->
      <div v-if="tasks.length > 0" class="grid grid-cols-5 gap-4">
        <div v-for="task in tasks" :key="task.id" 
             class="bg-white dark:bg-dark-card rounded-lg overflow-hidden shadow-sm dark:shadow-dark-sm hover:shadow-md dark:hover:shadow-dark-md transition-all duration-300 group h-[420px] flex flex-col">
          <!-- 视频封面 -->
          <div class="relative h-[240px] bg-gray-100 dark:bg-dark-card2 overflow-hidden">
            <img v-if="task.status === '1' || task.status === '2' || task.status === '4' || task.status === '5'" :src="getVideoThumbnail(task.videoUrl)" 
                 class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300" />
            <video v-else-if="task.status === '3'" :src="task.resultUrl" 
                   class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300" />
            <div v-else class="w-full h-full flex items-center justify-center flex-col">
              <el-icon class="text-gray-400 dark:text-gray-500" :size="40">
                <VideoCamera />
              </el-icon>
            </div>
            
            <!-- 状态标签 -->
            <div class="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium shadow-sm dark:shadow-dark-sm"
                 :class="{
                   'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400': task.status === '1' || task.status === '2',
                   'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400': task.status === '3',
                   'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400': task.status === '4' || task.status === '5'
                 }">
              {{ getStatusText(task.status) }}
            </div>

            <!-- 遮罩层 -->
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>

            <!-- 播放按钮 -->
            <div v-if="task.status === '3'" class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                @click.stop="playVideo(task)"
                class="w-12 h-12 rounded-full bg-white/90 dark:bg-dark-card/90 hover:bg-white dark:hover:bg-dark-card flex items-center justify-center transition-all duration-300 hover:scale-110">
                <div class="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-primary dark:border-l-blue-400 border-b-[8px] border-b-transparent ml-1"></div>
              </button>
            </div>
          </div>
          
          <!-- 作品信息 -->
          <div class="p-4 flex-1 flex flex-col">
            <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2 line-clamp-1 group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">{{ task.name }}</h3>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(task.createTime) }}</span>
            </div>
            
            <!-- 操作按钮 -->
            <div class="flex items-center justify-between mt-auto space-x-2">
              <el-button 
                v-if="task.status === '3'"
                @click="downloadVideo(task)"
                class="flex-1 h-11 px-0 bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-blue-700 text-white border-0 shadow-[0_2px_8px_0_rgba(59,130,246,0.10)] dark:shadow-dark-sm hover:brightness-110 hover:shadow-[0_4px_16px_0_rgba(59,130,246,0.15)] dark:hover:shadow-dark-lg transition-all duration-300 rounded-xl font-semibold tracking-wide relative overflow-hidden before:absolute before:inset-0 before:bg-white before:opacity-0 hover:before:opacity-5 before:transition-opacity before:duration-300"
                :icon="Download"
                size="default">
                <span class="text-white">下载视频</span>
              </el-button>
              <el-button 
                @click="handleDelete(task)"
                class="flex-1 h-11 px-0 bg-gradient-to-r from-red-400 to-red-500 dark:from-red-500 dark:to-red-600 text-white border-0 shadow-[0_2px_8px_0_rgba(244,63,94,0.10)] dark:shadow-dark-sm hover:brightness-110 hover:shadow-[0_4px_16px_0_rgba(244,63,94,0.15)] dark:hover:shadow-dark-lg transition-all duration-300 rounded-xl font-semibold tracking-wide relative overflow-hidden before:absolute before:inset-0 before:bg-white before:opacity-0 hover:before:opacity-5 before:transition-opacity before:duration-300"
                :icon="Delete"
                size="default">
                <span class="text-white">删除</span>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="bg-white dark:bg-dark-card rounded-lg p-20">
        <el-empty description="暂无作品" :class="{'dark:text-gray-400': true}" />
      </div>
    </div>

    <!-- 视频播放弹窗 -->
    <el-dialog
      v-model="videoDialogVisible"
      title="视频播放"
      width="800px"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      class="video-dialog"
      @closed="handleDialogClosed"
    >
      <div class="video-container">
        <video
          v-if="currentVideoUrl"
          ref="videoPlayer"
          :src="currentVideoUrl"
          controls
          class="video-player"
          autoplay
        ></video>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { VideoCamera, VideoPlay, Download, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useLoginModal } from '@/composables/useLoginModal'

const tasks = ref([])
const router = useRouter()
const { loginModalVisible, showLoginModal } = useLoginModal()

// 视频播放弹窗
const videoDialogVisible = ref(false)
const currentVideoUrl = ref('')
const videoPlayer = ref(null)

// 添加处理中任务相关变量
const processingTaskIds = ref([])
const pollingInterval = ref(null)
const POLLING_DELAY = 10000 // 10秒轮询一次

// 监听登录弹窗关闭
watch(loginModalVisible, (newValue) => {
  if (!newValue) {
    // 弹窗关闭后，检查是否已登录
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    if (token && userId) {
      // 如果已登录，重新获取作品列表
      fetchTasks()
    }
  }
})

// 获取任务列表
const fetchTasks = async () => {
  try {
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    const response = await axios.get('/api/task/list', {
      params: {
        userId: userId,
        page: 1,
        pageSize: 20
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    tasks.value = response.data.data || []
    
    // 更新处理中的任务ID列表
    updateProcessingTasks()
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // token 过期或无效，显示登录弹窗
      showLoginModal()
    } else {
      ElMessage.error('获取任务列表失败')
      console.error(error)
    }
  }
}

// 更新处理中任务ID列表
const updateProcessingTasks = () => {
  // 找出所有处理中的任务ID
  const processingIds = tasks.value
    .filter(task => task.status === '1' || task.status === '2')
    .map(task => task.id)
  
  processingTaskIds.value = processingIds
  
  // 如果有处理中的任务，开始轮询
  if (processingIds.length > 0) {
    startPolling()
  } else {
    stopPolling()
  }
}

// 开始轮询处理中的任务
const startPolling = () => {
  // 如果已经在轮询，先停止
  stopPolling()
  
  // 设置新的轮询
  pollingInterval.value = setInterval(() => {
    if (processingTaskIds.value.length > 0) {
      fetchProcessingTasksStatus()
    } else {
      stopPolling()
    }
  }, POLLING_DELAY)
}

// 停止轮询
const stopPolling = () => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
    pollingInterval.value = null
  }
}

// 只获取处理中任务的最新状态
const fetchProcessingTasksStatus = async () => {
  if (processingTaskIds.value.length === 0) return
  
  try {
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    
    // 使用现有的列表接口，但只关注处理中的任务
    const response = await axios.get('/api/task/list', {
      params: {
        userId: userId,
        page: 1,
        pageSize: 50 // 增大页面大小以确保包含所有处理中的任务
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const updatedTasks = response.data.data || []
    
    // 更新处理中任务的状态
    let hasStatusChanged = false
    
    updatedTasks.forEach(updatedTask => {
      // 只处理我们正在跟踪的任务
      if (processingTaskIds.value.includes(updatedTask.id)) {
        // 找到对应的本地任务
        const localTaskIndex = tasks.value.findIndex(t => t.id === updatedTask.id)
        
        if (localTaskIndex !== -1) {
          // 如果状态发生了变化
          if (tasks.value[localTaskIndex].status !== updatedTask.status) {
            // 更新任务状态
            tasks.value[localTaskIndex] = updatedTask
            hasStatusChanged = true
            
            // 如果任务不再是处理中状态，从处理中列表移除
            if (updatedTask.status !== '1' && updatedTask.status !== '2') {
              processingTaskIds.value = processingTaskIds.value.filter(id => id !== updatedTask.id)
              
              // 显示通知
              if (updatedTask.status === '3') {
                ElMessage.success(`作品 "${updatedTask.name}" 已完成`)
              } else if (updatedTask.status === '4' || updatedTask.status === '5') {
                ElMessage.error(`作品 "${updatedTask.name}" 处理失败`)
              }
            }
          }
        }
      }
    })
    
    // 如果所有处理中的任务都已完成，停止轮询
    if (processingTaskIds.value.length === 0) {
      stopPolling()
    }
    
  } catch (error) {
    console.error('轮询任务状态失败:', error)
    // 轮询失败不显示错误提示，静默失败
  }
}

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    '1': '处理中',
    '2': '处理中',
    '3': '已完成',
    '4': '合成失败',
    '5': '合成失败'
  }
  return statusMap[status] || '未知状态'
}

// 播放视频
const playVideo = (task) => {
  currentVideoUrl.value = task.resultUrl
  videoDialogVisible.value = true
}

// 下载视频
const downloadVideo = (task) => {
  try {
    // 显示加载提示
    const loadingInstance = ElMessage({
      message: '正在准备下载...',
      type: 'info',
      duration: 0,
      showClose: true
    })
    
    // 创建下载链接
    const link = document.createElement('a')
    link.href = task.resultUrl
    link.download = `作品_${task.name || task.id}.mp4`
    link.target = '_blank'
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    
    // 清理
    document.body.removeChild(link)
    
    // 关闭加载提示
    loadingInstance.close()
    ElMessage.success('下载已开始')
  } catch (error) {
    ElMessage.error('下载失败：' + (error.message || '未知错误'))
  }
}

const getVideoThumbnail = (url) => {
  if (!url) return ''
  // 移除URL中的查询参数
  const baseUrl = url.split('?')[0]
  // 添加获取第一帧的参数
  return `${baseUrl}?x-oss-process=video/snapshot,t_0`
}

const handleDelete = async (task) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个作品吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const token = localStorage.getItem('token')
    await axios.delete(`/api/task/${task.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    ElMessage.success('删除成功')
    // 重新获取列表
    fetchTasks()
  } catch (error) {
    if (error === 'cancel') {
      return
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      showLoginModal()
    } else {
      ElMessage.error('删除失败')
    }
  }
}

// 处理弹窗关闭
const handleDialogClosed = () => {
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.currentTime = 0
  }
}

onMounted(() => {
  fetchTasks()
})

// 组件卸载时清理轮询
onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 视频弹窗样式 */
:deep(.video-dialog) {
  .el-dialog {
    @apply dark:bg-dark-card dark:border dark:border-dark-border;
  }

  .el-dialog__body {
  padding: 0;
}

  .el-dialog__header {
  margin: 0;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
    @apply dark:border-dark-border dark:bg-dark-card2;
  }

  .el-dialog__title {
    @apply dark:text-gray-200;
}

  .el-dialog__headerbtn {
  top: 16px;
    .el-dialog__close {
      @apply dark:text-gray-400 dark:hover:text-gray-200;
    }
  }
}

/* 确认弹窗深色模式 */
:deep(.el-message-box) {
  @apply dark:bg-dark-card dark:border-dark-border;
  
  .el-message-box__title {
    @apply dark:text-gray-200;
  }
  
  .el-message-box__content {
    @apply dark:text-gray-300;
  }
  
  .el-message-box__btns {
    @apply dark:border-t dark:border-dark-border;
    
    .el-button {
      @apply dark:bg-dark-card2 dark:border-dark-border dark:text-gray-300;
      
      &.el-button--primary {
        @apply dark:bg-blue-600 dark:border-blue-600 dark:text-white;
      }
    }
  }
}

/* 消息提示深色模式 */
:deep(.el-message) {
  @apply dark:bg-dark-card dark:border dark:border-dark-border;
  
  .el-message__content {
    @apply dark:text-gray-200;
  }
  
  .el-message-icon--success {
    @apply dark:text-green-400;
  }
  
  .el-message-icon--warning {
    @apply dark:text-yellow-400;
  }
  
  .el-message-icon--error {
    @apply dark:text-red-400;
  }
  
  .el-message-icon--info {
    @apply dark:text-gray-400;
  }
}

.video-container {
  width: 100%;
  height: 450px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.video-player {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style> 