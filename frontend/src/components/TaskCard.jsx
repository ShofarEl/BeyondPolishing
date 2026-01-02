import { Link } from 'react-router-dom'
import { Clock, CheckCircle, AlertCircle, Play, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const TaskCard = ({ problem }) => {
  // Add debugging to see what data we're getting
  console.log('TaskCard problem data:', {
    problemId: problem.problemId,
    status: problem.status,
    totalTimeSpent: problem.totalTimeSpent,
    interactionsLength: problem.interactions ? problem.interactions.length : 'no interactions',
    startTime: problem.startTime,
    taskCategory: problem.taskCategory
  })
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-600" />
      case 'in-progress':
        return <Play className="w-5 h-5 text-primary-600" />
      case 'abandoned':
        return <AlertCircle className="w-5 h-5 text-error-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800'
      case 'in-progress':
        return 'bg-primary-100 text-primary-800'
      case 'abandoned':
        return 'bg-error-100 text-error-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category) => {
    const colors = {
      healthcare: 'bg-red-100 text-red-800',
      finance: 'bg-green-100 text-green-800',
      education: 'bg-blue-100 text-blue-800',
      environment: 'bg-emerald-100 text-emerald-800',
      social: 'bg-purple-100 text-purple-800',
      business: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[category] || colors.other
  }

  const formatTimeSpent = (minutes) => {
    if (!minutes) return '0 min'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="card-body">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon(problem.status)}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(problem.status)}`}>
              {problem.status.replace('-', ' ')}
            </span>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(problem.taskCategory)}`}>
            {problem.taskCategory}
          </span>
        </div>

        {/* Task Prompt */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Problem Framing Task
          </h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            {problem.taskPrompt}
          </p>
        </div>

        {/* Current Problem Statement */}
        {problem.currentProblem && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Current Problem:</h4>
            <p className="text-sm text-gray-700 line-clamp-3">
              {problem.currentProblem}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {problem.totalTimeSpent ? formatTimeSpent(problem.totalTimeSpent) : 'Not started'}
            </span>
            {problem.interactions && problem.interactions.length > 0 && (
              <span>
                {problem.interactions.length} AI interaction{problem.interactions.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <span>
            {formatDistanceToNow(new Date(problem.startTime), { addSuffix: true })}
          </span>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          {problem.status === 'in-progress' ? (
            <Link
              to={`/workspace/${problem.problemId}`}
              className="btn btn-primary flex-1 flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Continue</span>
            </Link>
          ) : (
            <Link
              to={`/workspace/${problem.problemId}`}
              className="btn btn-secondary flex-1 flex items-center justify-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>View</span>
            </Link>
          )}
        </div>

        {/* Progress Indicator */}
        {problem.status === 'in-progress' && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{problem.interactions ? problem.interactions.length : 0} interactions</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(((problem.interactions ? problem.interactions.length : 0) / 5) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskCard
