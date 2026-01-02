import { useState } from 'react'
import { BarChart3, TrendingUp, Clock, CheckCircle, Target, Brain } from 'lucide-react'
import useAuthStore from '../store/authStore'

const ProgressChart = ({ problems }) => {
  const [selectedMetric, setSelectedMetric] = useState('status')
  const { getStudyGroup } = useAuthStore()
  
  // Get real study group
  const studyGroup = getStudyGroup()
  const isEditorFirst = studyGroup === 'editor-first'

  // Calculate metrics
  const statusCounts = problems.reduce((acc, problem) => {
    acc[problem.status] = (acc[problem.status] || 0) + 1
    return acc
  }, {})

  const categoryCounts = problems.reduce((acc, problem) => {
    acc[problem.taskCategory] = (acc[problem.taskCategory] || 0) + 1
    return acc
  }, {})

  const totalTimeSpent = problems.reduce((sum, problem) => sum + (problem.totalTimeSpent || 0), 0)
  
  // Calculate AI interactions correctly from actual interactions array
  const totalInteractions = problems.reduce((sum, problem) => {
    const interactionCount = problem.interactions ? problem.interactions.length : 0
    return sum + interactionCount
  }, 0)
  
  // Calculate Editor vs Challenger mode usage
  const allInteractions = problems.flatMap(problem => problem.interactions || [])
  const editorInteractions = allInteractions.filter(i => i.promptType === 'editor').length
  const challengerInteractions = allInteractions.filter(i => i.promptType === 'challenger').length
  
  const averageTimePerTask = problems.length > 0 ? totalTimeSpent / problems.length : 0

  const metrics = [
    {
      id: 'status',
      name: 'Task Status',
      icon: CheckCircle,
      color: 'text-primary-600',
      data: statusCounts
    },
    {
      id: 'category',
      name: 'Task Categories',
      icon: BarChart3,
      color: 'text-success-600',
      data: categoryCounts
    }
  ]

  const renderChart = () => {
    const metric = metrics.find(m => m.id === selectedMetric)
    if (!metric) return null

    const data = metric.data
    const maxValue = Math.max(...Object.values(data))
    const entries = Object.entries(data).sort(([,a], [,b]) => b - a)

    return (
      <div className="space-y-4">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center space-x-4">
            <div className="w-24 text-sm text-gray-600 capitalize">
              {key.replace('-', ' ')}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{value}</span>
                <span className="text-sm text-gray-500">
                  {Math.round((value / Object.values(data).reduce((a, b) => a + b, 0)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${metric.color.replace('text-', 'bg-')}`}
                  style={{ width: `${(value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chart */}
      <div className="lg:col-span-2 card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Progress Overview</h3>
            <div className="flex space-x-2">
              {metrics.map((metric) => {
                const Icon = metric.icon
                return (
                  <button
                    key={metric.id}
                    onClick={() => setSelectedMetric(metric.id)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      selectedMetric === metric.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{metric.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div className="card-body">
          {renderChart()}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
          </div>
          <div className="card-body space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-success-600" />
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <span className="font-semibold text-gray-900">
                {statusCounts.completed || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <span className="font-semibold text-gray-900">
                {statusCounts['in-progress'] || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-warning-600" />
                <span className="text-sm text-gray-600">AI Interactions</span>
              </div>
              <span className="font-semibold text-gray-900">
                {totalInteractions}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-primary-600" />
                <span className="text-sm text-gray-600">Editor Mode</span>
              </div>
              <span className="font-semibold text-gray-900">
                {editorInteractions}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-warning-600" />
                <span className="text-sm text-gray-600">Challenger Mode</span>
              </div>
              <span className="font-semibold text-gray-900">
                {challengerInteractions}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">Avg Time/Task</span>
              </div>
              <span className="font-semibold text-gray-900">
                {Math.round(averageTimePerTask)}m
              </span>
            </div>
          </div>
        </div>

        {/* Study Group Info */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Study Group</h3>
          </div>
          <div className="card-body">
            <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium mb-3 ${
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
            <div className="text-sm text-gray-600">
              You're in the <strong>{isEditorFirst ? 'Editor-First' : 'Challenger-First'}</strong> group, which means 
              you'll start with {isEditorFirst ? 'refinement-focused AI assistance, then move to challenger prompts' : 'challenger prompts, then move to refinement-focused assistance'}.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgressChart
