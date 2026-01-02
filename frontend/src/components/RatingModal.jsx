import { useState } from 'react'
import { X, Star, Brain, Zap, Heart } from 'lucide-react'

const RatingModal = ({ interaction, onClose, onRate }) => {
  const [ratings, setRatings] = useState({
    usefulness: 0,
    cognitiveLoad: 0,
    satisfaction: 0
  })
  const [feedback, setFeedback] = useState('')
  const [wasAccepted, setWasAccepted] = useState(false)

  const handleRatingChange = (category, value) => {
    setRatings(prev => ({
      ...prev,
      [category]: value
    }))
  }

  const handleSubmit = () => {
    // Validate that all ratings are provided
    if (ratings.usefulness === 0 || ratings.cognitiveLoad === 0 || ratings.satisfaction === 0) {
      alert('Please provide all ratings before submitting')
      return
    }

    onRate(ratings, feedback, wasAccepted)
  }

  const StarRating = ({ category, label, icon: Icon, description }) => (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Icon className="w-5 h-5 text-gray-600" />
        <span className="font-medium text-gray-900">{label}</span>
      </div>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => handleRatingChange(category, value)}
            className="focus:outline-none"
          >
            <Star
              className={`w-8 h-8 ${
                value <= ratings[category]
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Rate AI Response
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* AI Response Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">AI Response</h4>
            <p className="text-sm text-gray-700 line-clamp-3">
              {interaction.response}
            </p>
          </div>

          {/* Ratings */}
          <div className="space-y-6">
            <StarRating
              category="usefulness"
              label="Usefulness"
              icon={Heart}
              description="How helpful was this AI response for improving your problem statement?"
            />

            <StarRating
              category="cognitiveLoad"
              label="Cognitive Load"
              icon={Brain}
              description="How much mental effort did this response require from you? (1=low effort, 5=high effort)"
            />

            <StarRating
              category="satisfaction"
              label="Overall Satisfaction"
              icon={Zap}
              description="How satisfied are you with this AI response overall?"
            />
          </div>

          {/* Additional Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Feedback (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Any specific comments about this AI response..."
              className="textarea h-24"
            />
          </div>

          {/* Acceptance */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="accepted"
                checked={wasAccepted}
                onChange={(e) => setWasAccepted(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="accepted" className="text-sm text-gray-700">
                I incorporated or plan to incorporate this AI suggestion into my problem statement
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn btn-primary"
          >
            Submit Rating
          </button>
        </div>
      </div>
    </div>
  )
}

export default RatingModal
