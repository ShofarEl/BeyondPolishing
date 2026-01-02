import { useState, useEffect } from 'react'
import { User, LogOut, AlertTriangle, Clock, BarChart3, Brain, Target } from 'lucide-react'
import useAuthStore from '../store/authStore'
import useProblemStore from '../store/problemStore'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Profile = () => {
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawReason, setWithdrawReason] = useState('')
  
  const { user, withdraw, logout, getStudyGroup } = useAuthStore()
  const { problems, fetchProblems } = useProblemStore()

  // Calculate real-time stats from problems data
  const calculateStats = () => {
    const allInteractions = problems.flatMap(problem => problem.interactions || [])
    const totalInteractions = allInteractions.length
    const editorInteractions = allInteractions.filter(i => i.promptType === 'editor').length
    const challengerInteractions = allInteractions.filter(i => i.promptType === 'challenger').length
    
    // Calculate average ratings from interactions that have ratings
    const ratedInteractions = allInteractions.filter(i => i.userRating)
    let averageRatings = null
    
    if (ratedInteractions.length > 0) {
      const totalRatings = ratedInteractions.reduce((acc, interaction) => {
        acc.usefulness += interaction.userRating.usefulness || 0
        acc.cognitiveLoad += interaction.userRating.cognitiveLoad || 0
        acc.satisfaction += interaction.userRating.satisfaction || 0
        return acc
      }, { usefulness: 0, cognitiveLoad: 0, satisfaction: 0 })
      
      averageRatings = {
        usefulness: totalRatings.usefulness / ratedInteractions.length,
        cognitiveLoad: totalRatings.cognitiveLoad / ratedInteractions.length,
        satisfaction: totalRatings.satisfaction / ratedInteractions.length
      }
    }
    
    return {
      totalInteractions,
      editorInteractions,
      challengerInteractions,
      averageRatings,
      ratedInteractionsCount: ratedInteractions.length
    }
  }

  const stats = calculateStats()
  const studyGroup = getStudyGroup()

  // Fetch problems when component mounts
  useEffect(() => {
    fetchProblems()
  }, [fetchProblems])

  const handleWithdraw = async () => {
    if (!showWithdrawModal) {
      setShowWithdrawModal(true)
      return
    }

    setIsWithdrawing(true)
    try {
      const result = await withdraw(withdrawReason)
      
      if (result.success) {
        toast.success('You have been withdrawn from the study. Thank you for your participation.')
        logout()
      } else {
        toast.error(result.error || 'Failed to withdraw from study')
      }
    } catch (error) {
      toast.error('Failed to withdraw from study. Please try again.')
    } finally {
      setIsWithdrawing(false)
      setShowWithdrawModal(false)
    }
  }

  const getStudyGroupDescription = (studyGroup) => {
    if (studyGroup === 'editor-first') {
      return {
        title: 'Editor-First Group',
        description: 'You start with refinement-focused AI assistance, then move to challenger prompts',
        icon: Target,
        color: 'text-primary-600 bg-primary-100'
      }
    } else {
      return {
        title: 'Challenger-First Group', 
        description: 'You start with challenger prompts, then move to refinement-focused AI assistance',
        icon: Brain,
        color: 'text-warning-600 bg-warning-100'
      }
    }
  }

  const studyGroupInfo = getStudyGroupDescription(studyGroup)
  const Icon = studyGroupInfo.icon

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Profile
          </h1>
          <p className="text-lg text-gray-600">
            Manage your study participation and view your progress
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Participant Information
                    </h3>
                    <p className="text-sm text-gray-600">
                      Your study participation details
                    </p>
                  </div>
                </div>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Participant ID
                    </label>
                    <p className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
                      {user?.participantId}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Study Group
                    </label>
                    <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${studyGroupInfo.color}`}>
                      <Icon className="w-4 h-4 mr-2" />
                      {studyGroupInfo.title}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Academic Level
                    </label>
                    <p className="text-sm text-gray-900 capitalize">
                      {user?.demographicData?.academicLevel}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Science Experience
                    </label>
                    <p className="text-sm text-gray-900 capitalize">
                      {user?.demographicData?.dataScienceExperience}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Study Group Description
                  </label>
                  <p className="text-sm text-gray-600">
                    {studyGroupInfo.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Activity Summary */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">
                  Activity Summary
                </h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 mb-2">
                      {problems.length}
                    </div>
                    <div className="text-sm text-gray-600">Tasks Started</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-success-600 mb-2">
                      {problems.filter(p => p.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-600">Tasks Completed</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary-600 mb-2">
                      {stats.editorInteractions}
                    </div>
                    <div className="text-sm text-gray-600">Editor Mode</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-warning-600 mb-2">
                      {stats.challengerInteractions}
                    </div>
                    <div className="text-sm text-gray-600">Challenger Mode</div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {stats.totalInteractions}
                    </div>
                    <div className="text-sm text-gray-600">Total AI Interactions</div>
                  </div>
                </div>

                {stats.averageRatings && stats.ratedInteractionsCount > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Average AI Response Ratings ({stats.ratedInteractionsCount} rated)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Usefulness</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {stats.averageRatings.usefulness.toFixed(1)}/5.0
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Cognitive Load</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {stats.averageRatings.cognitiveLoad.toFixed(1)}/5.0
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Satisfaction</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {stats.averageRatings.satisfaction.toFixed(1)}/5.0
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Study Information */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">
                  Study Information
                </h3>
              </div>
              <div className="card-body space-y-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Duration</div>
                    <div className="text-sm text-gray-600">~30 minutes total</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <BarChart3 className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Tasks</div>
                    <div className="text-sm text-gray-600">3-4 problem framing exercises</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Brain className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">AI Assistance</div>
                    <div className="text-sm text-gray-600">Two different prompt styles</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">
                  Account Actions
                </h3>
              </div>
              <div className="card-body space-y-4">
                <button
                  onClick={() => logout()}
                  className="btn btn-secondary w-full flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>

                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="btn btn-error w-full flex items-center justify-center space-x-2"
                >
                  {isWithdrawing ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Withdraw from Study</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Contact Information */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">
                  Need Help?
                </h3>
              </div>
              <div className="card-body">
                <p className="text-sm text-gray-600 mb-4">
                  If you have questions about the study or encounter technical issues, 
                  please contact the research team.
                </p>
                <button className="btn btn-secondary w-full">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Withdraw from Study
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to withdraw from the study? This action cannot be undone. 
                Your data will be anonymized and may still be used for research purposes.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for withdrawal (optional)
                </label>
                <textarea
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  placeholder="Please let us know why you're withdrawing..."
                  className="textarea"
                  rows={3}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="btn btn-error flex-1 flex items-center justify-center"
                >
                  {isWithdrawing ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Confirm Withdrawal'
                  )}
                </button>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile