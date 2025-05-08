import axios from 'axios'
import { useUserStore } from '@/stores/user'
import { useLoginModal } from '@/composables/useLoginModal'

// 创建需要登录的接口白名单
const whiteList = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/check'
]

const request = axios.create({
  timeout: 30000,
  withCredentials: true
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const { url, method } = config
    console.log(`[Request] ${method?.toUpperCase()} ${url}`)
    
    // 检查是否是白名单接口
    const isWhitelisted = whiteList.some(path => url?.includes(path))
    
    // 获取token
    const userStore = useUserStore()
    const token = userStore.token || localStorage.getItem('token')
    
    // 如果有token，添加到请求头
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
      console.log('Token added to request headers:', token)
      return config
    }
    
    // 如果没有token且不在白名单中，拦截请求
    if (!isWhitelisted) {
      console.log('Request requires authentication')
      const { showLoginModal } = useLoginModal()
      showLoginModal()
      return Promise.reject(new Error('请先登录'))
    }
    
    return config
  },
  error => {
    console.error('[Request Error]', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const { status, config: { url }, data } = response
    console.log(`[Response] ${status} ${url}`, data)
    
    // 如果响应中包含新的token，更新本地存储
    if (data?.token) {
      try {
        const userStore = useUserStore()
        userStore.setToken(data.token)
        console.log('Token updated from response data')
      } catch (error) {
        console.error('Error updating token:', error)
      }
    }
    
    return data
  },
  error => {
    console.error('[Response Error]', error)
    
    const status = error.response?.status
    const message = error.response?.data?.message || '请求失败，请重试'
    
    // 处理401和403状态码
    if (status === 401 || status === 403) {
      console.log(`Received ${status} response, handling auth error`)
      const userStore = useUserStore()
      userStore.logout()
      const { showLoginModal } = useLoginModal()
      showLoginModal()
      return Promise.reject(new Error(message))
    }
    
    // 其他错误
    console.error(`Error ${status}:`, message)
    return Promise.reject(new Error(message))
  }
)

export default request 