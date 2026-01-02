import { create } from 'zustand'
import api from '../services/api'

const useAIStore = create((set, get) => ({
  // State
  isLoading: false,
  error: null,
  currentResponse: null,
  interactionHistory: [],
  ratings: {},

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Generate AI response
  generateResponse: async (requestData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await api.post('/ai/generate', requestData)
      const { data } = response.data
      
      const aiResponse = {
        id: data.interactionId,
        promptType: data.promptType,
        aiResponse: data.response,  // Changed from 'response' to 'aiResponse'
        timestamp: data.timestamp,
        model: data.model,
        ratings: null,
        feedback: '',
        wasAccepted: false,
        timeSpent: 0
      }
      
      set(state => ({
        currentResponse: aiResponse,
        interactionHistory: [aiResponse, ...state.interactionHistory],
        isLoading: false
      }))
      
      return { success: true, data: aiResponse }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to generate AI response'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Rate AI response
  rateResponse: async (interactionId, ratings, feedback = '', wasAccepted = false) => {
    set({ isLoading: true, error: null })
    try {
      await api.post('/ai/rate', {
        interactionId,
        ratings,
        feedback,
        wasAccepted
      })
      
      // Update the interaction in history
      set(state => ({
        interactionHistory: state.interactionHistory.map(interaction =>
          interaction.id === interactionId
            ? {
                ...interaction,
                ratings,
                feedback,
                wasAccepted
              }
            : interaction
        ),
        ratings: {
          ...state.ratings,
          [interactionId]: { ratings, feedback, wasAccepted }
        },
        isLoading: false
      }))
      
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to rate response'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Update interaction timing
  updateInteractionTiming: async (problemId, interactionId, timeSpent) => {
    try {
      await api.put(`/problems/${problemId}/interactions/${interactionId}/time`, {
        timeSpent
      })
      
      set(state => ({
        interactionHistory: state.interactionHistory.map(interaction =>
          interaction.id === interactionId
            ? { ...interaction, timeSpent }
            : interaction
        )
      }))
      
      return { success: true }
    } catch (error) {
      console.error('Failed to update interaction timing:', error)
      return { success: false }
    }
  },

  // Clear current response
  clearCurrentResponse: () => {
    set({ currentResponse: null })
  },

  // Get response statistics
  getResponseStats: () => {
    const { interactionHistory } = get()
    
    const stats = {
      totalInteractions: interactionHistory.length,
      editorCount: interactionHistory.filter(i => i.promptType === 'editor').length,
      challengerCount: interactionHistory.filter(i => i.promptType === 'challenger').length,
      ratedInteractions: interactionHistory.filter(i => i.ratings).length,
      acceptedResponses: interactionHistory.filter(i => i.wasAccepted).length
    }
    
    // Calculate average ratings
    const ratedInteractions = interactionHistory.filter(i => i.ratings)
    if (ratedInteractions.length > 0) {
      stats.averageRatings = {
        usefulness: ratedInteractions.reduce((sum, i) => sum + i.ratings.usefulness, 0) / ratedInteractions.length,
        cognitiveLoad: ratedInteractions.reduce((sum, i) => sum + i.ratings.cognitiveLoad, 0) / ratedInteractions.length,
        satisfaction: ratedInteractions.reduce((sum, i) => sum + i.ratings.satisfaction, 0) / ratedInteractions.length
      }
    }
    
    return stats
  },

  // Get responses by prompt type
  getResponsesByType: (promptType) => {
    return get().interactionHistory.filter(i => i.promptType === promptType)
  },

  // Get current response
  getCurrentResponse: () => {
    return get().currentResponse
  },

  // Check if response is rated
  isResponseRated: (interactionId) => {
    const { interactionHistory } = get()
    const interaction = interactionHistory.find(i => i.id === interactionId)
    return interaction && interaction.ratings
  },

  // Get rating for interaction
  getRating: (interactionId) => {
    const { ratings } = get()
    return ratings[interactionId] || null
  }
}))

export default useAIStore
