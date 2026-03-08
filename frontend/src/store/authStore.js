import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Register anonymous participant
      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/register', userData)
          const { data } = response.data
          
          set({
            user: {
              sessionId: data.sessionId,
              studyGroup: data.studyGroup,
              consentGiven: true
            },
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          })
          
          return { success: true, data }
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Registration failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Start session
      startSession: async () => {
        const { user } = get()
        if (!user) return { success: false, error: 'No user found' }
        
        try {
          const response = await api.post('/auth/session/start', {
            sessionId: user.sessionId
          })
          return { success: true, data: response.data.data }
        } catch (error) {
          console.error('Session start error:', error)
          return { success: false, error: 'Failed to start session' }
        }
      },

      // End session
      endSession: async () => {
        const { user } = get()
        if (!user) return { success: false, error: 'No user found' }
        
        try {
          await api.post('/auth/session/end', {
            sessionId: user.sessionId
          })
          return { success: true }
        } catch (error) {
          console.error('Session end error:', error)
          return { success: false, error: 'Failed to end session' }
        }
      },

      // Logout (clear session)
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
      },

      // Get user's study group
      getStudyGroup: () => {
        const { user } = get()
        return user?.studyGroup
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

export default useAuthStore
