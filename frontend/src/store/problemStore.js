import { create } from 'zustand'
import api from '../services/api'

const useProblemStore = create((set, get) => ({
  // State
  currentProblem: null,
  problems: [],
  isLoading: false,
  error: null,
  interactions: [],

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Create new problem
  createProblem: async (problemData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/problems/create', problemData)
      const { data } = response.data
      
      const newProblem = {
        problemId: data.problemId,
        taskPrompt: data.taskPrompt,
        taskCategory: data.taskCategory,
        initialProblem: data.initialProblem,
        currentProblem: data.initialProblem,
        status: data.status,
        startTime: data.startTime,
        interactions: []
      }
      
      set({
        currentProblem: newProblem,
        problems: [newProblem, ...get().problems],
        isLoading: false
      })
      
      return { success: true, data: newProblem, status: response.status }
    } catch (error) {
      const status = error.response?.status
      const errorMessage = error.response?.data?.error || 'Failed to create problem'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage, status }
    }
  },

  // Update current problem
  updateProblem: async (problemId, currentProblem) => {
    set({ isLoading: true, error: null })
    try {
      await api.put(`/problems/${problemId}`, { currentProblem })
      
      set(state => ({
        currentProblem: state.currentProblem ? {
          ...state.currentProblem,
          currentProblem
        } : null,
        problems: state.problems.map(p =>
          p.problemId === problemId
            ? { ...p, currentProblem }
            : p
        ),
        isLoading: false
      }))
      
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update problem'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Complete problem
  completeProblem: async (problemId, finalData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post(`/problems/${problemId}/complete`, finalData)
      const { data } = response.data
      
      set(state => ({
        currentProblem: null,
        problems: state.problems.map(p =>
          p.problemId === problemId
            ? { 
                ...p, 
                status: data.status,
                endTime: data.endTime,
                totalTimeSpent: data.totalTimeSpent,
                finalProblem: finalData.finalProblem,
                reasoning: finalData.reasoning
              }
            : p
        ),
        isLoading: false
      }))
      
      return { success: true, data, status: response.status }
    } catch (error) {
      const status = error.response?.status
      const errorMessage = error.response?.data?.error || 'Failed to complete problem'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage, status }
    }
  },

  // Abandon problem
  abandonProblem: async (problemId, reason) => {
    set({ isLoading: true, error: null })
    try {
      await api.post(`/problems/${problemId}/abandon`, { reason })
      
      set(state => ({
        currentProblem: null,
        problems: state.problems.map(p =>
          p.problemId === problemId
            ? { ...p, status: 'abandoned' }
            : p
        ),
        isLoading: false
      }))
      
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to abandon problem'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Fetch user's problems
  fetchProblems: async (status = null) => {
    console.log('fetchProblems called with status:', status)
    set({ isLoading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      
      console.log('Making API call to /problems with params:', params.toString())
      const response = await api.get(`/problems?${params.toString()}`)
      console.log('API response:', response.data)
      const { data } = response.data
      
      console.log('Problems data:', data.problems)
      console.log('Individual problems:', data.problems.map(p => ({
        problemId: p.problemId,
        status: p.status,
        interactions: p.interactions?.length || 0
      })))
      
      set({
        problems: data.problems,
        isLoading: false
      })
      
      return { success: true, data: data.problems }
    } catch (error) {
      console.error('fetchProblems error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to fetch problems'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get specific problem
  getProblem: async (problemId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.get(`/problems/${problemId}`)
      const { data } = response.data
      
      set({
        currentProblem: data,
        isLoading: false
      })
      
      return { success: true, data }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch problem'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Add interaction to current problem
  addInteraction: (interaction) => {
    set(state => {
      if (!state.currentProblem) return state
      
      const updatedProblem = {
        ...state.currentProblem,
        interactions: [...state.currentProblem.interactions, interaction]
      }
      
      return {
        currentProblem: updatedProblem,
        problems: state.problems.map(p =>
          p.problemId === state.currentProblem.problemId
            ? updatedProblem
            : p
        )
      }
    })
  },

  // Clear current problem
  clearCurrentProblem: () => {
    set({ currentProblem: null })
  },

  // Get current problem
  getCurrentProblem: () => {
    return get().currentProblem
  },

  // Get problems by status
  getProblemsByStatus: (status) => {
    return get().problems.filter(p => p.status === status)
  },

  // Get interaction count for current problem
  getInteractionCount: () => {
    const { currentProblem } = get()
    return currentProblem?.interactions?.length || 0
  }
}))

export default useProblemStore
