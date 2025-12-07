import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: '/api',
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const authStore = useAuthStore()

    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore()
    const originalRequest = error.config

    // If 401 and not already retried, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry && authStore.isAuthenticated) {
      originalRequest._retry = true
      try {
        // Try to get a fresh token
        await authStore.refreshToken()
        // Retry original request with new token
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Token refresh failed, logout user
        await authStore.logout()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient
