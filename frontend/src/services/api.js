import axios from 'axios'
import useAuthStore from '../store/authStore'

// Determine API URL based on environment
const getApiUrl = () => {
  // Check if we have a custom API URL from environment
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Fallback logic for different environments
  if (import.meta.env.PROD) {
    // Production - Railway backend URL
    return 'https://beyondpolishing-production.up.railway.app/api'
  }
  
  // Development
  return 'http://localhost:3001/api'
}

// Create axios instance
const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const { response } = error
    
    if (response?.status === 401) {
      // Token expired or invalid
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    
    // Note: Do not auto-redirect on 403 here. Let route guards control navigation.
    
    return Promise.reject(error)
  }
)

export default api
