import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Clock, CheckCircle, AlertCircle, BarChart3, Brain, Target, Copy } from 'lucide-react'
import useAuthStore from '../store/authStore'
import useProblemStore from '../store/problemStore'
import useAIStore from '../store/aiStore'
import LoadingSpinner from '../components/LoadingSpinner'
import TaskCard from '../components/TaskCard'
import ProgressChart from '../components/ProgressChart'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  const { user, getStudyGroup } = useAuthStore()
  const { problems, fetchProblems, isLoading } = useProblemStore()
  const { getResponseStats } = useAIStore()

  let studyGroup, stats
  try {
    studyGroup = getStudyGroup()
    
    // Calculate AI interaction stats from problems data instead of AI store
    const allInteractions = problems.flatMap(problem => problem.interactions || [])
    const totalInteractions = allInteractions.length
    const editorCount = allInteractions.filter(i => i.promptType === 'editor').length
    const challengerCount = allInteractions.filter(i => i.promptType === 'challenger').length
    
    stats = { 
      totalInteractions,
      editorCount,
      challengerCount
    }
  } catch (error) {
    console.error('Dashboard - error getting studyGroup or stats:', error)
    studyGroup = 'editor-first'
    stats = { totalInteractions: 0 }
  }

  useEffect(() => {
    try {
      fetchProblems().then(result => {
        // Data fetched successfully
      }).catch(error => {
        console.error('fetchProblems error:', error)
      })
    } catch (error) {
      console.error('Dashboard useEffect error:', error)
    }
  }, [fetchProblems])

  // Refresh data when user returns to dashboard (e.g., from workspace)
  useEffect(() => {
    const handleFocus = () => {
      fetchProblems()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchProblems()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchProblems])

  const copyParticipantId = () => {
    if (user?.participantId) {
      navigator.clipboard.writeText(user.participantId).then(() => {
        toast.success('Participant ID copied to clipboard!')
      }).catch(() => {
        toast.error('Failed to copy participant ID')
      })
    }
  }

  const filteredProblems = problems.filter(problem => {
    if (selectedCategory === 'all') return true
    return problem.status === selectedCategory
  })

  const taskCategories = [
    { id: 'infrastructure', name: 'Infrastructure', color: 'bg-blue-100 text-blue-800' },
    { id: 'healthcare', name: 'Healthcare', color: 'bg-red-100 text-red-800' },
    { id: 'finance', name: 'Finance', color: 'bg-green-100 text-green-800' },
    { id: 'education', name: 'Education', color: 'bg-blue-100 text-blue-800' },
    { id: 'environment', name: 'Environment', color: 'bg-emerald-100 text-emerald-800' },
    { id: 'social', name: 'Social', color: 'bg-purple-100 text-purple-800' },
    { id: 'business', name: 'Business', color: 'bg-yellow-100 text-yellow-800' }
  ]

  const sampleTasks = [
    {
      id: 'task-1',
      category: 'infrastructure',
      prompt: 'Predict WiFi down usage to scale router upgrade - Frame this as a comprehensive data science problem with clear stakeholders and success metrics',
      difficulty: 'intermediate'
    },
    {
      id: 'task-2', 
      category: 'infrastructure',
      prompt: 'WiFi Infrastructure Optimization - Consider alternative framings: equity, user experience, cost optimization, or predictive maintenance',
      difficulty: 'intermediate'
    },
    {
      id: 'task-3',
      category: 'infrastructure',
      prompt: 'Router Upgrade Planning - Explore different stakeholder perspectives: IT administrators, end users, budget managers, or facility planners',
      difficulty: 'intermediate'
    },
    {
      id: 'task-4',
      category: 'infrastructure',
      prompt: 'WiFi Usage Analytics - Consider various success metrics: performance, satisfaction, cost-effectiveness, or resource allocation fairness',
      difficulty: 'intermediate'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-4 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 font-display">
                Welcome back, {user?.username || 'Participant'}!
              </h1>
              <p className="text-base lg:text-lg text-gray-600 font-primary">
                Continue working on your WiFi infrastructure problem framing tasks
              </p>
              
              {/* Task Progress Indicator */}
              <div className="mt-3">
                {problems.filter(p => p.status === 'completed').length >= 2 ? (
                  <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">
                      Study Complete! Both tasks finished ({problems.filter(p => p.status === 'completed').length}/2)
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">
                      Study Progress: {problems.filter(p => p.status === 'completed').length} of 2 tasks completed
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Participant ID Display */}
            {user?.participantId && (
              <div className="bg-gray-50 rounded-lg p-3 border">
                <div className="text-sm text-gray-600 mb-1">Your Participant ID:</div>
                <div className="flex items-center space-x-2">
                  <code className="font-mono text-sm font-medium text-gray-900">
                    {user.participantId}
                  </code>
                  <button
                    onClick={copyParticipantId}
                    className="text-gray-400 hover:text-gray-600"
                    title="Copy Participant ID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              studyGroup === 'editor-first' 
                ? 'bg-primary-100 text-primary-800' 
                : 'bg-warning-100 text-warning-800'
            }`}>
              {studyGroup === 'editor-first' ? (
                <>
                  <Target className="w-4 h-4 mr-1" />
                  Editor-First Group
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-1" />
                  Challenger-First Group
                </>
              )}
            </span>
            <span className="text-sm text-gray-500">
              {problems.length} tasks started
            </span>
          </div>
        </div>

        {/* Completion Celebration */}
        {problems.filter(p => p.status === 'completed').length >= 2 && (
          <div className="mb-8 card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="card-body text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">
                Study Complete! 🎉
              </h2>
              <p className="text-green-800 mb-4">
                Thank you for completing both problem framing tasks. Your participation helps advance research in AI-assisted problem solving.
              </p>
              <div className="flex items-center justify-center space-x-6 text-sm text-green-700">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Task 1: Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Task 2: Completed</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6 mb-8">
          <div className="card">
            <div className="card-body text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-primary-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{problems.length}</div>
              <div className="text-sm text-gray-600">Tasks Started</div>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-success-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {problems.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-warning-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {problems.filter(p => p.status === 'in-progress').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-primary-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.editorCount}</div>
              <div className="text-sm text-gray-600">Editor Mode</div>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-warning-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.challengerCount}</div>
              <div className="text-sm text-gray-600">Challenger Mode</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {problems.filter(p => p.status === 'completed').length < 2 ? (
              <Link
                to="/workspace/new"
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>
                  {problems.length === 0 ? 'Start First Task' : 
                   problems.filter(p => p.status === 'completed').length === 0 ? 'Start First Task' :
                   'Start Second Task'}
                </span>
              </Link>
            ) : (
              <div className="inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">
                  Study completed! Thank you for participating.
                </span>
              </div>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedCategory('in-progress')}
                className={`btn ${
                  selectedCategory === 'in-progress' 
                    ? 'btn-primary' 
                    : 'btn-secondary'
                }`}
              >
                Continue Tasks
              </button>
              <button
                onClick={() => setSelectedCategory('completed')}
                className={`btn ${
                  selectedCategory === 'completed' 
                    ? 'btn-primary' 
                    : 'btn-secondary'
                }`}
              >
                View Completed
              </button>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`btn ${
                  selectedCategory === 'all' 
                    ? 'btn-primary' 
                    : 'btn-secondary'
                }`}
              >
                All Tasks
              </button>
            </div>
          </div>
        </div>

        {/* Recent AI Interactions */}
        {problems.some(p => p.interactions && p.interactions.length > 0) && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent AI Interactions</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {problems
                .flatMap(problem => 
                  (problem.interactions || []).map(interaction => ({
                    ...interaction,
                    problemId: problem.problemId,
                    taskCategory: problem.taskCategory,
                    taskPrompt: problem.taskPrompt
                  }))
                )
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 4)
                .map((interaction) => (
                  <div key={interaction.interactionId} className="card">
                    <div className="card-body">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1.5 rounded-full ${
                            interaction.promptType === 'editor' 
                              ? 'bg-primary-100 text-primary-600' 
                              : 'bg-warning-100 text-warning-600'
                          }`}>
                            {interaction.promptType === 'editor' ? (
                              <Target className="w-3 h-3" />
                            ) : (
                              <Brain className="w-3 h-3" />
                            )}
                          </div>
                          <span className="text-sm font-medium capitalize">
                            {interaction.promptType} Mode
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(interaction.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">Task:</div>
                        <div className="text-sm text-gray-700 line-clamp-2">
                          {interaction.taskPrompt}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">AI Response:</div>
                        <div className="text-sm text-gray-700 line-clamp-3">
                          {interaction.aiResponse || 'No response available'}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          interaction.taskCategory === 'infrastructure' ? 'bg-blue-100 text-blue-800' :
                          interaction.taskCategory === 'healthcare' ? 'bg-red-100 text-red-800' :
                          interaction.taskCategory === 'finance' ? 'bg-green-100 text-green-800' :
                          interaction.taskCategory === 'education' ? 'bg-blue-100 text-blue-800' :
                          interaction.taskCategory === 'environment' ? 'bg-emerald-100 text-emerald-800' :
                          interaction.taskCategory === 'social' ? 'bg-purple-100 text-purple-800' :
                          interaction.taskCategory === 'business' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {interaction.taskCategory}
                        </span>
                        
                        <Link
                          to={`/workspace/${interaction.problemId}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View Task →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tasks Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Loading your tasks..." />
          </div>
        ) : filteredProblems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProblems.map((problem) => (
              <TaskCard key={problem.problemId} problem={problem} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {selectedCategory === 'all' ? 'Ready to start your WiFi infrastructure study tasks' : `No ${selectedCategory} tasks`}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedCategory === 'all' 
                ? 'Complete TWO WiFi infrastructure problem framing tasks with AI assistance'
                : `You don't have any ${selectedCategory} tasks yet`
              }</p>
            {selectedCategory === 'all' && (
              <Link to="/workspace/new" className="btn btn-primary">
                Start Your First Task
              </Link>
            )}
          </div>
        )}

        {/* Sample Tasks for New Users */}
        {problems.length === 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              WiFi Infrastructure Problem Framing Examples
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sampleTasks.map((task) => (
                <div key={task.id} className="card">
                  <div className="card-body">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        taskCategories.find(cat => cat.id === task.category)?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        {taskCategories.find(cat => cat.id === task.category)?.name}
                      </span>
                      <span className="text-sm text-gray-500 capitalize">
                        {task.difficulty}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{task.prompt}</p>
                    <div className="text-sm text-gray-500">
                      These examples show different ways to approach the WiFi infrastructure seed problem.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Visualization */}
        {problems.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Progress
            </h2>
            <ProgressChart problems={problems} />
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
