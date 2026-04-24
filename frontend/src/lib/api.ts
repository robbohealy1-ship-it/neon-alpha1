import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || '/api',
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('[API] Adding auth token for:', config.url)
  } else {
    console.log('[API] No token for:', config.url)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect to login if on public pages
    const currentPath = window.location.pathname
    const isPublicPage = currentPath === '/signals' || currentPath === '/alpha-picks' || currentPath === '/pricing' || currentPath === '/'

    // Only redirect to login on 401 if it's not a public endpoint and not on a public page
    const publicEndpoints = [
      '/api/signals/public',
      '/api/alpha-picks/public',
      '/api/health',
      '/api/subscription/status',
      '/api/signals/limit',
      '/api/signal-limit',
      '/api/alerts',
      '/api/telegram'
    ]
    const isPublicEndpoint = publicEndpoints.some(endpoint => error.config?.url?.includes(endpoint))

    if (error.response?.status === 401 && !isPublicEndpoint && !isPublicPage) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
