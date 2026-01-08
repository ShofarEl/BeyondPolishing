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
  const [currentProblem, setCurrentProblem] = useState('')
  const [userInput, setUserInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [selectedPromptType, setSelectedPromptType] = useState(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [finalReasoning, setFinalReasoning] = useState('')

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

  // Debug current response
  console.log('ProblemWorkspace - currentResponse:', currentResponse)
  console.log('ProblemWorkspace - problem interactions:', problem?.interactions?.length)

  const studyGroup = getStudyGroup()
  const isEditorFirst = studyGroup === 'editor-first'

  useEffect(() => {
    if (problemId && problemId !== 'new') {
      loadProblem()
    }
  }, [problemId])

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

    // If this is a new problem, we need to create it first
    if (problemId === 'new') {
      toast.error('Please save the problem before generating AI responses')
      return
    }

    setIsGenerating(true)
    setSelectedPromptType(promptType)
    
    try {
      console.log('Generating AI response with:', {
        problemStatement: currentProblem.substring(0, 50) + '...',
        promptType,
        problemId: problem?.problemId
      })

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
        }
        // Don't automatically show rating modal
        setUserInput('')
        toast.success('AI response generated!')
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

    try {
      if (problemId === 'new') {
        // Create new problem
        const result = await useProblemStore.getState().createProblem({
          taskPrompt: "Frame a data science problem in your chosen domain",
          taskCategory: "other",
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
                // disabled={!currentProblem.trim() || problem?.status === 'completed'} // Temporarily enabled for testing
                className="btn btn-primary flex items-center space-x-2 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Complete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Main Workspace */}
          <div className="order-1 lg:order-1 lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Problem Statement */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">
                  Problem Statement
                </h2>
                <p className="text-sm text-gray-600">
                  Describe your data science problem. Be as specific as possible about objectives, 
                  data sources, and success metrics.
                </p>
              </div>
              <div className="card-body">
                <textarea
                  value={currentProblem}
                  onChange={(e) => setCurrentProblem(e.target.value)}
                  placeholder="Enter your data science problem statement here..."
                  className="textarea h-40"
                  // disabled={problem?.status === 'completed'} // Temporarily enabled for testing
                />
                
                {problem?.status !== 'completed' && (
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {currentProblem.length}/2000 characters
                    </span>
                    <button
                      onClick={handleSaveProblem}
                      className="btn btn-secondary text-sm"
                    >
                      Save Draft
                    </button>
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
                      Get AI help to refine or challenge your problem statement
                    </p>
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
                        disabled={isGenerating || aiLoading}
                        className={`btn flex items-center space-x-3 p-4 ${
                          nextPromptType === 'editor' 
                            ? 'btn-primary' 
                            : 'btn-secondary'
                        }`}
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
                        disabled={isGenerating || aiLoading}
                        className={`btn flex items-center space-x-3 p-4 ${
                          nextPromptType === 'challenger' 
                            ? 'btn-primary' 
                            : 'btn-secondary'
                        }`}
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
                      disabled={isGenerating || aiLoading}
                      className={`btn flex items-center space-x-3 p-4 ${
                        nextPromptType === 'editor' 
                          ? 'btn-primary' 
                          : 'btn-secondary'
                      }`}
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
                      disabled={isGenerating || aiLoading}
                      className={`btn flex items-center space-x-3 p-4 ${
                        nextPromptType === 'challenger' 
                          ? 'btn-primary' 
                          : 'btn-secondary'
                      }`}
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
                  className="textarea h-32"
                  placeholder="Your final problem statement..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Reasoning
                </label>
                <textarea
                  value={finalReasoning}
                  onChange={(e) => setFinalReasoning(e.target.value)}
                  className="textarea h-32"
                  placeholder="Explain your reasoning for this problem formulation. What factors influenced your decisions? What trade-offs did you consider?"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCompleteProblem}
                disabled={!currentProblem.trim() || !finalReasoning.trim()}
                className="btn btn-primary flex-1"
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
