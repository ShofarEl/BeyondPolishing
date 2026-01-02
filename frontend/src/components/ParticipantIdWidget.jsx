import { useState } from 'react'
import { Copy, Eye, EyeOff, Check } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const ParticipantIdWidget = ({ variant = 'header' }) => {
  const [copied, setCopied] = useState(false)
  const [showId, setShowId] = useState(true)
  const { user } = useAuthStore()

  if (!user?.participantId) return null

  const copyParticipantId = async () => {
    try {
      await navigator.clipboard.writeText(user.participantId)
      setCopied(true)
      toast.success('Participant ID copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy ID')
    }
  }

  if (variant === 'floating') {
    return (
      <div className="fixed top-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">Your ID:</span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowId(!showId)}
              className="text-gray-400 hover:text-gray-600"
              title={showId ? 'Hide ID' : 'Show ID'}
            >
              {showId ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
            <button
              onClick={copyParticipantId}
              className="text-gray-400 hover:text-gray-600"
              title="Copy ID"
            >
              {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
        {showId ? (
          <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded block break-all">
            {user.participantId}
          </code>
        ) : (
          <div className="text-xs text-gray-500">••••••••••••••••</div>
        )}
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className="bg-primary-600 text-white py-2 px-4 text-center">
        <div className="flex items-center justify-center space-x-4">
          <span className="text-sm font-medium">Participant ID:</span>
          <code className="bg-primary-700 px-3 py-1 rounded font-mono text-sm">
            {user.participantId}
          </code>
          <button
            onClick={copyParticipantId}
            className="bg-primary-700 hover:bg-primary-800 px-2 py-1 rounded text-xs"
            title="Copy ID"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
    )
  }

  // Default header variant
  return (
    <div className="bg-gray-50 rounded-lg p-3 border">
      <div className="text-sm text-gray-600 mb-1">Your Participant ID:</div>
      <div className="flex items-center space-x-2">
        <code className="font-mono text-sm font-medium text-gray-900 flex-1">
          {user.participantId}
        </code>
        <button
          onClick={copyParticipantId}
          className="text-gray-400 hover:text-gray-600"
          title="Copy Participant ID"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export default ParticipantIdWidget
