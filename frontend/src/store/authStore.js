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

      // Register new participant
      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/register', userData)
          const { data } = response.data
          
      set({
        user: {
          participantId: data.participantId,
          email: data.email,
          username: data.username,
          studyGroup: data.studyGroup,
          consentGiven: false
        },
        token: data.token,
        isAuthenticated: false, // Will be true after consent
        isLoading: false
      })
          
          return { success: true, data }
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Registration failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Give consent
      giveConsent: async (participantId) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/consent', { participantId })
          const { data } = response.data
          
          set({
            user: {
              participantId: data.participantId,
              email: data.email,
              username: data.username,
              studyGroup: data.studyGroup,
              consentGiven: true
            },
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          })
          
          return { success: true, data }
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Consent failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Login returning participant
      login: async (participantId, email = null) => {
        set({ isLoading: true, error: null })
        try {
          const payload = { participantId }
          if (email) {
            payload.email = email
          }
          console.log('Auth store login payload:', payload)
          const response = await api.post('/auth/login', payload)
          const { data } = response.data
          
          const userData = {
            participantId: data.participantId,
            email: data.email,
            username: data.username,
            studyGroup: data.studyGroup,
            consentGiven: data.consentGiven
          }
          
          console.log('Setting auth state:', { user: userData, isAuthenticated: true })
          
          set({
            user: userData,
            token: data.token,
            isAuthenticated: true,
            isLoading: false
          })
          
          return { success: true, data }
        } catch (error) {
          console.log('Login error response:', error.response?.data)
          const errorMessage = error.response?.data?.error || 'Login failed'
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
            participantId: user.participantId
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
            participantId: user.participantId
          })
          return { success: true }
        } catch (error) {
          console.error('Session end error:', error)
          return { success: false, error: 'Failed to end session' }
        }
      },

      // Withdraw from study
      withdraw: async (reason = '') => {
        const { user } = get()
        if (!user) return { success: false, error: 'No user found' }
        
        set({ isLoading: true, error: null })
        try {
          await api.post('/auth/withdraw', {
            participantId: user.participantId,
            reason
          })
          
          // Clear user data after withdrawal
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          })
          
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Withdrawal failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Logout
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
      },

      // Check if user needs consent
      needsConsent: () => {
        const { user } = get()
        return user && !user.consentGiven
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
