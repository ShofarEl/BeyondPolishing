import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Star, Clock, Brain, Target, MessageSquare } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const AIResponseCard = ({ interaction, isCurrent = false, onRate }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Add null safety check
  if (!interaction) {
    return <div className="text-gray-500">No interaction data available</div>
  }
  
  const getPromptTypeIcon = (promptType) => {
    return promptType === 'editor' ? Target : Brain
  }

  const getPromptTypeColor = (promptType) => {
    return promptType === 'editor' 
      ? 'text-primary-600 bg-primary-100' 
      : 'text-warning-600 bg-warning-100'
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const Icon = getPromptTypeIcon(interaction.promptType)

  return (
    <div className={`rounded-lg p-4 ${
      isCurrent ? 'bg-primary-50' : 'bg-white'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${getPromptTypeColor(interaction.promptType)}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 capitalize font-display">
                {interaction.promptType} Mode
              </span>
              {isCurrent && (
                <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded">
                  New
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{formatTime(interaction.timestamp)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {interaction.ratings && (
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(interaction.ratings.usefulness)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
          
          {isCurrent && !interaction.ratings && (
            <button
              onClick={onRate}
              className="btn btn-primary text-sm"
            >
              <span className="hidden sm:inline">Rate Response</span>
              <span className="sm:hidden">Rate</span>
            </button>
          )}
        </div>
      </div>

      {/* Response Content */}
      <div className="space-y-3">
        <div className="text-gray-900 leading-relaxed prose prose-gray max-w-none prose-base font-primary">
          {isExpanded || (interaction.aiResponse && interaction.aiResponse.length < 500) ? (
            <ReactMarkdown>{interaction.aiResponse || 'No response available'}</ReactMarkdown>
          ) : (
            <div>
              <ReactMarkdown>{(interaction.aiResponse || '').substring(0, 500) + '...'}</ReactMarkdown>
              <button
                onClick={() => setIsExpanded(true)}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block font-primary"
              >
                Show full response
              </button>
            </div>
          )}
          
          {isExpanded && interaction.aiResponse && interaction.aiResponse.length > 500 && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block font-primary"
            >
              Show less
            </button>
          )}
        </div>

        {/* User Feedback */}
        {interaction.userFeedback && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Your Feedback</span>
            </div>
            <p className="text-sm text-gray-600">{interaction.userFeedback}</p>
          </div>
        )}

        {/* Rating Summary */}
        {interaction.ratings && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Usefulness</div>
                <div className="font-medium">{interaction.ratings.usefulness}/5</div>
              </div>
              <div>
                <div className="text-gray-500">Cognitive Load</div>
                <div className="font-medium">{interaction.ratings.cognitiveLoad}/5</div>
              </div>
              <div>
                <div className="text-gray-500">Satisfaction</div>
                <div className="font-medium">{interaction.ratings.satisfaction}/5</div>
              </div>
            </div>
            
            {interaction.wasAccepted && (
              <div className="mt-2 flex items-center space-x-1 text-success-600">
                <ThumbsUp className="w-4 h-4" />
                <span className="text-sm font-medium">Accepted</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {isCurrent && !interaction.ratings && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Was this helpful?</span>
              <button
                onClick={() => onRate && onRate()}
                className="flex items-center space-x-1 text-success-600 hover:text-success-700"
              >
                <ThumbsUp className="w-4 h-4" />
                <span className="text-sm">Yes</span>
              </button>
              <button
                onClick={() => onRate && onRate()}
                className="flex items-center space-x-1 text-gray-400 hover:text-gray-600"
              >
                <ThumbsDown className="w-4 h-4" />
                <span className="text-sm">No</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIResponseCard
