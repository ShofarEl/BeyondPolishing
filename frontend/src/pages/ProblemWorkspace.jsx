import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Send, ThumbsUp, ThumbsDown, Clock, Brain, Target, CheckCircle, AlertCircle } from 'lucide-react'
import useAuthStore from '../store/authStore'
import useProblemStore from '../store/problemStore'
import useAIStore from '../store/aiStore'
import LoadingSpinner from '../components/LoadingSpinner'
import AIResponseCard from '../components/AIResponseCard'
import RatingModal from '../components/RatingModal'
import toast from 'react-hot-toast'

const ProblemWorkspace = () => {
  const { problemId } = useParams()
  const navigate = useNavigate()
  const [currentProblem, setCurrentProblem] = useState('Predict down usage to scale router upgrade')
  const [userInput, setUserInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedPromptType, setSelectedPromptType] = useState(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [finalReasoning, setFinalReasoning] = useState('')

  // Helper function to count words
  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  // Get character count and validation status
  const currentCharCount = currentProblem.trim().length
  const isCharCountValid = currentCharCount >= 50
  const isCharCountTooLow = currentCharCount > 0 && currentCharCount < 50

  const { user, getStudyGroup } = useAuthStore()
  const { 
    currentProblem: problem, 
    getProblem, 
    updateProblem, 
    completeProblem,
    isLoading: problemLoading 
  } = useProblemStore()
  const { 
    currentResponse, 
    generateResponse, 
    rateResponse, 
    clearCurrentResponse,
    isLoading: aiLoading 
  } = useAIStore()

  // Debug current response (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('ProblemWorkspace - currentResponse:', currentResponse)
    console.log('ProblemWorkspace - problem interactions:', problem?.interactions?.length)
  }

  const studyGroup = getStudyGroup()
  const isEditorFirst = studyGroup === 'editor-first'

  useEffect(() => {
    if (problemId && problemId !== 'new') {
      loadProblem()
    } else if (problemId === 'new') {
      // Set the fixed WiFi seed problem for new problems
      setCurrentProblem('Predict down usage to scale router upgrade')
    }
  }, [problemId])

  // Update current problem when problem data is loaded
  useEffect(() => {
    if (problem && problemId !== 'new') {
      if (problem.finalProblem) {
        setCurrentProblem(problem.finalProblem)
      } else if (problem.initialProblem) {
        setCurrentProblem(problem.initialProblem)
      }
    }
  }, [problem, problemId])

  const loadProblem = async () => {
    try {
      await getProblem(problemId)
    } catch (error) {
      toast.error('Failed to load problem')
      navigate('/dashboard')
    }
  }

  const handleGenerateResponse = async (promptType) => {
    if (!currentProblem.trim()) {
      toast.error('Please enter a problem statement first')
      return
    }

    // Character count validation before AI interaction
    const charCount = currentProblem.trim().length
    if (charCount < 50) {
      toast.error('Please write at least 50 characters before requesting AI feedback')
      return
    }

    // If this is a new problem, we need to create it first
    if (problemId === 'new') {
      toast.error('Please save the problem before generating AI responses')
      return
    }

    setIsGenerating(true)
    setSelectedPromptType(promptType)
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Generating AI response with:', {
          problemStatement: currentProblem.substring(0, 50) + '...',
          promptType,
          problemId: problem?.problemId
        })
      }

      const result = await generateResponse({
        problemStatement: currentProblem,
        userInput: userInput.trim() || undefined,
        promptType,
        problemId: problem?.problemId
      })

      if (result.success) {
        // Refresh problem data to get the latest interactions
        if (problem?.problemId) {
          await loadProblem()
          
          // Check if both tasks are now complete after refresh
          setTimeout(() => {
            const updatedStatus = getCompletionStatus()
            if (updatedStatus.editorDone && updatedStatus.challengerDone && updatedStatus.totalInteractions === 2) {
              // Both tasks completed for the first time
              toast.success('🎊 Congratulations! Both Editor and Challenger tasks completed!', {
                duration: 5000,
                style: {
                  background: '#059669',
                  color: 'white',
                  fontWeight: 'bold'
                }
              })
            }
          }, 500) // Small delay to ensure state is updated
        }
        // Don't automatically show rating modal
        setUserInput('')
        
        // Check if this is the first time completing this prompt type
        const currentInteractions = problem?.interactions || []
        const hasUsedThisType = currentInteractions.some(i => i.promptType === promptType)
        
        if (!hasUsedThisType) {
          // This is their first time using this prompt type
          if (promptType === 'editor') {
            toast.success('🎉 Editor Task Complete! Great job refining your problem statement.', {
              duration: 4000,
              style: {
                background: '#10B981',
                color: 'white',
              }
            })
          } else if (promptType === 'challenger') {
            toast.success('🎉 Challenger Task Complete! Excellent creative reframing.', {
              duration: 4000,
              style: {
                background: '#10B981',
                color: 'white',
              }
            })
          }
        } else {
          toast.success('AI response generated!')
        }
      } else {
        toast.error(result.error || 'Failed to generate AI response')
      }
    } catch (error) {
      console.error('AI generation error:', error)
      toast.error('Failed to generate AI response')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveProblem = async () => {
    const trimmed = currentProblem.trim()
    if (!trimmed) {
      toast.error('Please enter a problem statement')
      return
    }
    if (trimmed.length < 10) {
      toast.error('Problem statement must be at least 10 characters')
      return
    }
    
    // Character count validation
    const charCount = trimmed.length
    if (charCount < 50) {
      toast.error('Problem statement must be at least 50 characters')
      return
    }

    try {
      if (problemId === 'new') {
        // Create new problem with fixed WiFi seed
        const result = await useProblemStore.getState().createProblem({
          taskPrompt: "Frame a data science problem for WiFi infrastructure optimization",
          taskCategory: "infrastructure",
          initialProblem: trimmed,
          deviceInfo: {
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            platform: navigator.platform
          }
        })

        if (result.success) {
          navigate(`/workspace/${result.data.problemId}`)
        } else {
          if (result.status === 403) {
            toast.error('Consent is required to create problems')
            navigate('/consent')
            return
          }
          toast.error(result.error || 'Failed to create problem')
        }
      } else {
        // Update existing problem
        await updateProblem(problemId, trimmed)
        toast.success('Problem saved')
      }
    } catch (error) {
      const message = error?.response?.data?.error || 'Failed to save problem'
      toast.error(message)
    }
  }

  const handleCompleteProblem = async () => {
    if (problemId === 'new') {
      toast.error('Please save the problem before completing it')
      return
    }
    const finalTrimmed = currentProblem.trim()
    if (!finalTrimmed) {
      toast.error('Please enter a final problem statement')
      return
    }
    if (finalTrimmed.length < 10) {
      toast.error('Final problem statement must be at least 10 characters')
      return
    }
    
    // Character count validation for final problem
    const charCount = finalTrimmed.length
    if (charCount < 50) {
      toast.error('Final problem statement must be at least 50 characters')
      return
    }
    
    const reasoningTrimmed = finalReasoning.trim()
    if (!reasoningTrimmed) {
      toast.error('Please provide your reasoning')
      return
    }
    if (reasoningTrimmed.length < 20) {
      toast.error('Reasoning must be at least 20 characters')
      return
    }

    try {
      const result = await completeProblem(problemId, {
        finalProblem: finalTrimmed,
        reasoning: reasoningTrimmed
      })

      if (result.success) {
        toast.success('Problem completed successfully!')
        navigate('/dashboard')
      } else {
        if (result.status === 403) {
          toast.error('Consent is required to complete problems')
          navigate('/consent')
          return
        }
        const serverMsg = result.error
        const details = result?.details
        if (Array.isArray(details) && details.length > 0) {
          const first = details[0]
          toast.error(first?.msg || serverMsg || 'Validation failed')
        } else {
          toast.error(serverMsg || 'Failed to complete problem')
        }
      }
    } catch (error) {
      const message = error?.response?.data?.error || 'Failed to complete problem'
      toast.error(message)
    }
  }

  const getPromptTypeForNextInteraction = () => {
    if (!problem || !problem.interactions) return isEditorFirst ? 'editor' : 'challenger'
    
    const editorCount = problem.interactions.filter(i => i.promptType === 'editor').length
    const challengerCount = problem.interactions.filter(i => i.promptType === 'challenger').length
    
    if (isEditorFirst) {
      return editorCount <= challengerCount ? 'editor' : 'challenger'
    } else {
      return challengerCount <= editorCount ? 'challenger' : 'editor'
    }
  }

  const nextPromptType = getPromptTypeForNextInteraction()

  // Helper functions to check completion status
  const getCompletionStatus = () => {
    if (!problem || !problem.interactions) return { editorDone: false, challengerDone: false }
    
    const editorInteractions = problem.interactions.filter(i => i.promptType === 'editor')
    const challengerInteractions = problem.interactions.filter(i => i.promptType === 'challenger')
    
    return {
      editorDone: editorInteractions.length > 0,
      challengerDone: challengerInteractions.length > 0,
      totalInteractions: problem.interactions.length
    }
  }

  const completionStatus = getCompletionStatus()
  const tasksCompleted = (completionStatus.editorDone ? 1 : 0) + (completionStatus.challengerDone ? 1 : 0)

  if (problemLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading workspace..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between h-auto sm:h-16 py-4 sm:py-0">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </button>
              
              <div className="h-6 w-px bg-gray-300 hidden sm:block" />
              
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 font-display">
                {problemId === 'new' ? 'New Problem' : 'Problem Workspace'}
              </h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={handleSaveProblem}
                className="btn btn-secondary flex items-center space-x-2 text-sm"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </button>
              
              <button
                onClick={() => setShowCompletionModal(true)}
                disabled={isCharCountTooLow || !currentProblem.trim()}
                className={`btn btn-primary flex items-center space-x-2 text-sm ${
                  isCharCountTooLow ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={isCharCountTooLow ? 'Write at least 50 characters before completing' : ''}
              >
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Complete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      {problem && problem.interactions && problem.interactions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
            {/* Mobile Layout */}
            <div className="sm:hidden">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Progress:</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full transition-all duration-500 ${completionStatus.editorDone ? 'bg-green-500 scale-110' : 'bg-gray-300'}`} />
                  <div className={`w-3 h-3 rounded-full transition-all duration-500 ${completionStatus.challengerDone ? 'bg-green-500 scale-110' : 'bg-gray-300'}`} />
                  <span className="text-sm text-gray-600 ml-2">{tasksCompleted}/2</span>
                  {tasksCompleted === 2 && <span className="text-green-600">🎉</span>}
                </div>
              </div>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-sm font-medium text-gray-900">Study Progress:</h3>
                <div className="flex items-center space-x-3">
                  {/* Editor Status */}
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-all duration-500 ${
                    completionStatus.editorDone 
                      ? 'bg-green-100 text-green-800 scale-105' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      completionStatus.editorDone ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span>Editor {completionStatus.editorDone ? 'Done' : 'Pending'}</span>
                    {completionStatus.editorDone && <span className="text-green-600 animate-pulse">✓</span>}
                  </div>
                  
                  {/* Challenger Status */}
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-all duration-500 ${
                    completionStatus.challengerDone 
                      ? 'bg-green-100 text-green-800 scale-105' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      completionStatus.challengerDone ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span>Challenger {completionStatus.challengerDone ? 'Done' : 'Pending'}</span>
                    {completionStatus.challengerDone && <span className="text-green-600 animate-pulse">✓</span>}
                  </div>
                </div>
              </div>
              
              {/* Overall Progress */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {tasksCompleted}/2 Tasks Complete
                </span>
                {tasksCompleted === 2 && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    <span>🎉</span>
                    <span>All Done!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Main Workspace */}
          <div className="order-1 lg:order-1 lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Problem Statement */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">
                  WiFi Infrastructure Problem
                </h2>
                <p className="text-sm text-gray-600">
                  Work with the provided seed problem about WiFi infrastructure optimization. 
                  Use AI assistance to refine and reframe this problem statement.
                </p>
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                  <strong>Seed Problem:</strong> "Predict down usage to scale router upgrade" - Use AI assistance to develop this into a comprehensive data science problem statement.
                </div>
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <p><strong>Expected:</strong> Minimum 50 characters describing a comprehensive data science problem</p>
                  <p><strong>Include:</strong> Clear objective, stakeholders, data sources, and success metrics</p>
                </div>
              </div>
              <div className="card-body">
                <textarea
                  value={currentProblem}
                  onChange={(e) => setCurrentProblem(e.target.value)}
                  placeholder="Start with the seed problem 'Predict down usage to scale router upgrade' and develop it into a comprehensive data science problem. Consider: What specific WiFi usage patterns need prediction? What data sources would you use? Who are the stakeholders? What does success look like?"
                  className={`textarea h-40 ${
                    isCharCountTooLow ? 'border-red-300 focus:border-red-500 focus:ring-red-500' :
                    isCharCountValid ? 'border-green-300 focus:border-green-500 focus:ring-green-500' :
                    ''
                  }`}
                  title="Write at least 50 characters to describe your WiFi infrastructure problem. Include objectives, stakeholders, data sources, and success metrics."
                  // disabled={problem?.status === 'completed'} // Temporarily enabled for testing
                />
                
                {problem?.status !== 'completed' && (
                  <div className="mt-3 sm:mt-4">
                    {/* Mobile-first compact layout */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                      <div className="text-sm">
                        <div className={`font-medium ${
                          isCharCountTooLow ? 'text-red-600' :
                          isCharCountValid ? 'text-green-600' :
                          'text-gray-500'
                        }`}>
                          {currentCharCount} characters
                          {isCharCountTooLow && (
                            <span className="ml-1 sm:ml-2 text-red-500 text-xs">
                              (Min 50)
                            </span>
                          )}
                          {isCharCountValid && (
                            <span className="ml-1 sm:ml-2 text-green-600 text-xs">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5">
                          <span className="sm:hidden">Min 50 chars</span>
                          <span className="hidden sm:inline">Minimum: 50 characters</span>
                          <span className="mx-1 sm:mx-2">•</span>
                          <span>{countWords(currentProblem)} words</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleSaveProblem}
                        disabled={isCharCountTooLow}
                        className={`btn text-sm self-start sm:self-auto ${
                          isCharCountTooLow 
                            ? 'btn-secondary opacity-50 cursor-not-allowed' 
                            : 'btn-secondary'
                        }`}
                        title={isCharCountTooLow ? 'Minimum 50 characters required to save' : 'Save Draft'}
                      >
                        Save Draft
                      </button>
                    </div>
                    
                    {/* Compact progress bar - only show when needed */}
                    {(isCharCountTooLow || currentCharCount > 0) && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                          <div 
                            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                              isCharCountTooLow ? 'bg-red-400' :
                              isCharCountValid ? 'bg-green-400' :
                              'bg-gray-300'
                            }`}
                            style={{ 
                              width: `${Math.min((currentCharCount / 200) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1 sm:block hidden">
                          <span>0</span>
                          <span className="text-gray-600">50 min</span>
                          <span>200+ good</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* AI Assistant - Mobile: Show right after problem statement */}
            <div className="lg:hidden">
              {/* {problem?.status !== 'completed' && ( */}
              {true && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-gray-900">
                      AI Assistant
                    </h3>
                    <p className="text-sm text-gray-600">
                      Get AI help to refine or reframe the WiFi infrastructure problem
                    </p>
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                      <strong>Study Requirement:</strong> Work with the WiFi infrastructure seed problem using both Editor and Challenger AI modes to develop comprehensive problem framings.
                    </div>
                  </div>
                  <div className="card-body space-y-4">
                    {/* Additional Context */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Context (Optional)
                      </label>
                      <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Provide any additional context or specific questions..."
                        className="textarea h-20"
                      />
                    </div>

                    {/* Prompt Type Buttons */}
                    <div className="grid grid-cols-1 gap-3">
                      <button
                        onClick={() => handleGenerateResponse('editor')}
                        disabled={isGenerating || aiLoading || isCharCountTooLow}
                        className={`btn flex items-center justify-between p-4 ${
                          nextPromptType === 'editor' 
                            ? 'btn-primary' 
                            : 'btn-secondary'
                        } ${isCharCountTooLow ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isCharCountTooLow ? 'Write at least 50 characters to get AI feedback' : 'Get AI help to refine and improve your problem statement'}
                      >
                        <div className="flex items-center space-x-2 text-left">
                          <Target className="w-5 h-5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">Editor Mode</div>
                            <div className="text-xs opacity-75">Helps refine and clarify your statement with specific suggestions</div>
                          </div>
                        </div>
                        {nextPromptType === 'editor' && (
                          <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded whitespace-nowrap ml-2">
                            Suggested Next
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => handleGenerateResponse('challenger')}
                        disabled={isGenerating || aiLoading || isCharCountTooLow}
                        className={`btn flex items-center justify-between p-4 ${
                          nextPromptType === 'challenger' 
                            ? 'btn-primary' 
                            : 'btn-secondary'
                        } ${isCharCountTooLow ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isCharCountTooLow ? 'Write at least 50 characters to get AI feedback' : 'Get AI help to challenge assumptions and explore alternative problem framings'}
                      >
                        <div className="flex items-center space-x-2 text-left">
                          <Brain className="w-5 h-5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">Challenger Mode</div>
                            <div className="text-xs opacity-75">Challenges assumptions and proposes alternative framings</div>
                          </div>
                        </div>
                        {nextPromptType === 'challenger' && (
                          <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded whitespace-nowrap ml-2">
                            Suggested Next
                          </span>
                        )}
                      </button>
                    </div>

                    {isGenerating && (
                      <div className="flex items-center justify-center py-4">
                        <LoadingSpinner size="sm" text="Generating AI response..." />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Current AI Response - Mobile */}
              {currentResponse && (
                <AIResponseCard
                  interaction={currentResponse}
                  isCurrent={true}
                  onRate={() => setShowRatingModal(true)}
                />
              )}
            </div>

            {/* AI Interaction History */}
            {problem?.interactions && problem.interactions.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">
                    AI Interaction History
                  </h3>
                </div>
                <div className="card-body space-y-4">
                  {problem.interactions.map((interaction, index) => (
                    <AIResponseCard
                      key={interaction.interactionId}
                      interaction={interaction}
                      onRate={() => {
                        // Handle rating if not already rated
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Assistant Sidebar - Desktop Only */}
          <div className="hidden lg:block order-2 lg:order-2 lg:col-span-2 space-y-4 lg:space-y-6">
            {/* AI Prompt Controls - Desktop */}
            {/* {problem?.status !== 'completed' && ( */}
            {true && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">
                    AI Assistant
                  </h3>
                  <p className="text-sm text-gray-600">
                    Get AI help to refine or challenge your problem statement
                  </p>
                </div>
                <div className="card-body space-y-4">
                  {/* Additional Context */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Context (Optional)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      Ask specific questions or provide context for the AI (e.g., "Focus on privacy concerns" or "Suggest alternative metrics")
                    </p>
                    <textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Example: Can you suggest alternative stakeholders for this WiFi problem? What data privacy concerns should I consider? How might we reframe this from an equity perspective?"
                      className="textarea h-20"
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      {userInput.trim().split(/\s+/).filter(w => w.length > 0).length} words
                    </div>
                  </div>

                  {/* Prompt Type Buttons */}
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => handleGenerateResponse('editor')}
                      disabled={isGenerating || aiLoading || isCharCountTooLow}
                      className={`btn flex items-center space-x-3 p-4 ${
                        nextPromptType === 'editor' 
                          ? 'btn-primary' 
                          : 'btn-secondary'
                      } ${isCharCountTooLow ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isCharCountTooLow ? 'Write at least 50 characters to get AI feedback' : 'Get AI help to refine and improve your problem statement'}
                    >
                      <div className="flex items-center space-x-2">
                        <Target className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-medium">Editor Mode</div>
                          <div className="text-xs opacity-75">Refine & clarify</div>
                        </div>
                      </div>
                      {nextPromptType === 'editor' && (
                        <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                          Suggested
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => handleGenerateResponse('challenger')}
                      disabled={isGenerating || aiLoading || isCharCountTooLow}
                      className={`btn flex items-center space-x-3 p-4 ${
                        nextPromptType === 'challenger' 
                          ? 'btn-primary' 
                          : 'btn-secondary'
                      } ${isCharCountTooLow ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isCharCountTooLow ? 'Write at least 50 characters to get AI feedback' : 'Get AI help to challenge assumptions and explore alternative problem framings'}
                    >
                      <div className="flex items-center space-x-2">
                        <Brain className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-medium">Challenger Mode</div>
                          <div className="text-xs opacity-75">Challenge & reframe</div>
                        </div>
                      </div>
                      {nextPromptType === 'challenger' && (
                        <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                          Suggested
                        </span>
                      )}
                    </button>
                  </div>

                  {isGenerating && (
                    <div className="flex items-center justify-center py-4">
                      <LoadingSpinner size="sm" text="Generating AI response..." />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Current AI Response - Desktop */}
            {currentResponse && (
              <AIResponseCard
                interaction={currentResponse}
                isCurrent={true}
                onRate={() => setShowRatingModal(true)}
              />
            )}

            {/* Study Group Info - Desktop */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">
                  Your Study Group
                </h3>
              </div>
              <div className="card-body">
                <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                  isEditorFirst 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'bg-warning-100 text-warning-800'
                }`}>
                  {isEditorFirst ? (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Editor-First Group
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Challenger-First Group
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {isEditorFirst 
                    ? 'You start with refinement prompts, then challenger prompts'
                    : 'You start with challenger prompts, then refinement prompts'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && currentResponse && (
        <RatingModal
          interaction={currentResponse}
          onClose={() => setShowRatingModal(false)}
          onRate={async (ratings, feedback, wasAccepted) => {
            try {
              await rateResponse(currentResponse.id, ratings, feedback, wasAccepted)
              setShowRatingModal(false)
              clearCurrentResponse()
              toast.success('Thank you for rating the AI response!')
            } catch (error) {
              toast.error('Failed to submit rating')
            }
          }}
        />
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Complete Problem
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Final Problem Statement
                </label>
                <textarea
                  value={currentProblem}
                  onChange={(e) => setCurrentProblem(e.target.value)}
                  className={`textarea h-32 ${
                    isCharCountTooLow ? 'border-red-300 focus:border-red-500 focus:ring-red-500' :
                    isCharCountValid ? 'border-green-300 focus:border-green-500 focus:ring-green-500' :
                    ''
                  }`}
                  placeholder="Your final problem statement..."
                  title="Write at least 50 characters for your final problem statement"
                />
                <div className={`mt-1 text-sm ${
                  isCharCountTooLow ? 'text-red-600' :
                  isCharCountValid ? 'text-green-600' :
                  'text-gray-500'
                }`}>
                  {currentCharCount} characters
                  {isCharCountTooLow && (
                    <span className="ml-1 sm:ml-2 text-red-500 text-xs">
                      (Min 50)
                    </span>
                  )}
                  {isCharCountValid && (
                    <span className="ml-1 sm:ml-2 text-green-600 text-xs">
                      ✓
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Reasoning (minimum 50 words)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Explain why you chose this problem formulation. What factors influenced your decisions? What trade-offs did you consider?
                </p>
                <textarea
                  value={finalReasoning}
                  onChange={(e) => setFinalReasoning(e.target.value)}
                  className="textarea h-32"
                  placeholder="Example: I chose this problem because it addresses a critical healthcare issue with clear stakeholders (hospital administrators and care coordinators). The AI feedback helped me refine the success metrics and consider data privacy concerns..."
                />
                <div className="mt-1 text-xs text-gray-500">
                  {finalReasoning.trim().split(/\s+/).filter(w => w.length > 0).length} words (minimum 50 required)
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCompleteProblem}
                disabled={!currentProblem.trim() || !finalReasoning.trim() || isCharCountTooLow}
                className={`btn btn-primary flex-1 ${
                  isCharCountTooLow ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={isCharCountTooLow ? 'Minimum 50 characters required to complete' : ''}
              >
                Complete Problem
              </button>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProblemWorkspace
