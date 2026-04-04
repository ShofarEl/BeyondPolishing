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

  // Get word count and validation status
  const currentWordCount = countWords(currentProblem)
  const isWordCountValid = currentWordCount >= 100 && currentWordCount <= 500
  const isWordCountTooLow = currentWordCount > 0 && currentWordCount < 100
  const isWordCountTooHigh = currentWordCount > 500

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

    // Word count validation before AI interaction
    const wordCount = countWords(currentProblem.trim())
    if (wordCount < 100) {
      toast.error('Please write at least 100 words before requesting AI feedback')
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
    
    // Word count validation
    const wordCount = countWords(trimmed)
    if (wordCount < 100) {
      toast.error('Problem statement must be at least 100 words')
      return
    }
    if (wordCount > 500) {
      toast.error('Problem statement should not exceed 500 words')
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
    
    // Word count validation for final problem
    const wordCount = countWords(finalTrimmed)
    if (wordCount < 100) {
      toast.error('Final problem statement must be at least 100 words')
      return
    }
    if (wordCount > 500) {
      toast.error('Final problem statement should not exceed 500 words')
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
                disabled={isWordCountTooLow || !currentProblem.trim()}
                className={`btn btn-primary flex items-center space-x-2 text-sm ${
                  isWordCountTooLow ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={isWordCountTooLow ? 'Write at least 100 words before completing' : ''}
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
                  <p><strong>Expected:</strong> 100-500 words describing a comprehensive data science problem</p>
                  <p><strong>Include:</strong> Clear objective, stakeholders, data sources, and success metrics</p>
                </div>
              </div>
              <div className="card-body">
                <textarea
                  value={currentProblem}
                  onChange={(e) => setCurrentProblem(e.target.value)}
                  placeholder="Start with the seed problem 'Predict down usage to scale router upgrade' and develop it into a comprehensive data science problem. Consider: What specific WiFi usage patterns need prediction? What data sources would you use? Who are the stakeholders? What does success look like?"
                  className={`textarea h-40 ${
                    isWordCountTooLow ? 'border-red-300 focus:border-red-500 focus:ring-red-500' :
                    isWordCountTooHigh ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500' :
                    isWordCountValid ? 'border-green-300 focus:border-green-500 focus:ring-green-500' :
                    ''
                  }`}
                  // disabled={problem?.status === 'completed'} // Temporarily enabled for testing
                />
                
                {problem?.status !== 'completed' && (
                  <div className="mt-3 sm:mt-4">
                    {/* Mobile-first compact layout */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                      <div className="text-sm">
                        <div className={`font-medium ${
                          isWordCountTooLow ? 'text-red-600' :
                          isWordCountTooHigh ? 'text-yellow-600' :
                          isWordCountValid ? 'text-green-600' :
                          'text-gray-500'
                        }`}>
                          {currentWordCount} words
                          {isWordCountTooLow && (
                            <span className="ml-1 sm:ml-2 text-red-500 text-xs">
                              (Min 100)
                            </span>
                          )}
                          {isWordCountTooHigh && (
                            <span className="ml-1 sm:ml-2 text-yellow-600 text-xs">
                              (Max 500)
                            </span>
                          )}
                          {isWordCountValid && (
                            <span className="ml-1 sm:ml-2 text-green-600 text-xs">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5">
                          <span className="sm:hidden">100-500 expected</span>
                          <span className="hidden sm:inline">Expected: 100-500 words</span>
                          <span className="mx-1 sm:mx-2">•</span>
                          <span>{currentProblem.length}/2000 chars</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleSaveProblem}
                        disabled={isWordCountTooLow}
                        className={`btn text-sm self-start sm:self-auto ${
                          isWordCountTooLow 
                            ? 'btn-secondary opacity-50 cursor-not-allowed' 
                            : 'btn-secondary'
                        }`}
                        title={isWordCountTooLow ? 'Minimum 100 words required to save' : 'Save Draft'}
                      >
                        Save Draft
                      </button>
                    </div>
                    
                    {/* Compact progress bar - only show when needed */}
                    {(isWordCountTooLow || currentWordCount > 0) && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                          <div 
                            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                              isWordCountTooLow ? 'bg-red-400' :
                              isWordCountTooHigh ? 'bg-yellow-400' :
                              isWordCountValid ? 'bg-green-400' :
                              'bg-gray-300'
                            }`}
                            style={{ 
                              width: `${Math.min((currentWordCount / 500) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1 sm:block hidden">
                          <span>0</span>
                          <span className="text-gray-600">100 min</span>
                          <span>500 max</span>
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
                        disabled={isGenerating || aiLoading || isWordCountTooLow}
                        className={`btn flex items-center justify-between p-4 ${
                          nextPromptType === 'editor' 
                            ? 'btn-primary' 
                            : 'btn-secondary'
                        } ${isWordCountTooLow ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isWordCountTooLow ? 'Write at least 100 words to get AI feedback' : ''}
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
                        disabled={isGenerating || aiLoading || isWordCountTooLow}
                        className={`btn flex items-center justify-between p-4 ${
                          nextPromptType === 'challenger' 
                            ? 'btn-primary' 
                            : 'btn-secondary'
                        } ${isWordCountTooLow ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isWordCountTooLow ? 'Write at least 100 words to get AI feedback' : ''}
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
                      disabled={isGenerating || aiLoading || isWordCountTooLow}
                      className={`btn flex items-center space-x-3 p-4 ${
                        nextPromptType === 'editor' 
                          ? 'btn-primary' 
                          : 'btn-secondary'
                      } ${isWordCountTooLow ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isWordCountTooLow ? 'Write at least 100 words to get AI feedback' : ''}
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
                      disabled={isGenerating || aiLoading || isWordCountTooLow}
                      className={`btn flex items-center space-x-3 p-4 ${
                        nextPromptType === 'challenger' 
                          ? 'btn-primary' 
                          : 'btn-secondary'
                      } ${isWordCountTooLow ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isWordCountTooLow ? 'Write at least 100 words to get AI feedback' : ''}
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
                    isWordCountTooLow ? 'border-red-300 focus:border-red-500 focus:ring-red-500' :
                    isWordCountTooHigh ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500' :
                    isWordCountValid ? 'border-green-300 focus:border-green-500 focus:ring-green-500' :
                    ''
                  }`}
                  placeholder="Your final problem statement..."
                />
                <div className={`mt-1 text-sm ${
                  isWordCountTooLow ? 'text-red-600' :
                  isWordCountTooHigh ? 'text-yellow-600' :
                  isWordCountValid ? 'text-green-600' :
                  'text-gray-500'
                }`}>
                  {currentWordCount} words
                  {isWordCountTooLow && (
                    <span className="ml-1 sm:ml-2 text-red-500 text-xs">
                      (Min 100)
                    </span>
                  )}
                  {isWordCountTooHigh && (
                    <span className="ml-1 sm:ml-2 text-yellow-600 text-xs">
                      (Max 500)
                    </span>
                  )}
                  {isWordCountValid && (
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
                disabled={!currentProblem.trim() || !finalReasoning.trim() || isWordCountTooLow}
                className={`btn btn-primary flex-1 ${
                  isWordCountTooLow ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title={isWordCountTooLow ? 'Minimum 100 words required to complete' : ''}
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
