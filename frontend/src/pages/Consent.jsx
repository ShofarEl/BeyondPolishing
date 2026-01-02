import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle, FileText, Shield, Clock, Users, Copy } from 'lucide-react'
import useAuthStore from '../store/authStore'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Consent = () => {
  const [hasReadConsent, setHasReadConsent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [participantId, setParticipantId] = useState('')
  const { giveConsent, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Get participant ID from localStorage or user store
    const tempId = localStorage.getItem('tempParticipantId')
    if (tempId) {
      setParticipantId(tempId)
    } else if (user?.participantId) {
      setParticipantId(user.participantId)
    }
  }, [user])

  const copyParticipantId = () => {
    navigator.clipboard.writeText(participantId).then(() => {
      toast.success('Participant ID copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy participant ID')
    })
  }

  const handleGiveConsent = async () => {
    if (!hasReadConsent) {
      toast.error('Please read the consent form first')
      return
    }

    setIsLoading(true)
    try {
      const result = await giveConsent(participantId)
      
      if (result.success) {
        // Clear temporary storage
        localStorage.removeItem('tempParticipantId')
        toast.success('Thank you for giving consent!')
        navigate('/dashboard')
      } else {
        toast.error(result.error || 'Failed to process consent')
      }
    } catch (error) {
      toast.error('Failed to process consent. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Informed Consent Form
          </h1>
          <p className="text-lg text-gray-600">
            Please read the following information carefully before participating
          </p>
        </div>

        {/* Participant ID Display - SUPER PROMINENT */}
        {participantId && (
          <div className="mb-8 card bg-gradient-to-r from-primary-500 to-primary-600 border-primary-400 shadow-xl">
            <div className="card-body text-center text-white">
              <div className="text-4xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold mb-4">
                YOUR PARTICIPANT ID
              </h2>
              
              <div className="bg-white bg-opacity-20 rounded-xl p-6 mb-4">
                <code className="text-3xl font-mono font-bold tracking-wider">
                  {participantId}
                </code>
              </div>
              
              <button
                onClick={copyParticipantId}
                className="bg-white text-primary-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 mx-auto mb-4"
              >
                <Copy className="w-5 h-5" />
                <span>COPY THIS ID</span>
              </button>
              
              <div className="bg-red-500 bg-opacity-20 border border-red-300 rounded-lg p-4 text-left">
                <h3 className="font-bold text-lg mb-2">🚨 CRITICAL: SAVE THIS ID NOW!</h3>
                <ul className="space-y-1 text-sm">
                  <li>• You CANNOT log back in without this ID</li>
                  <li>• Take a screenshot of this page</li>
                  <li>• Copy and paste it to a notes app</li>
                  <li>• Write it down somewhere safe</li>
                  <li>• You will lose access if you don't save it!</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="card mb-8">
          <div className="card-body">
            <div className="prose max-w-none">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Study Title: AI-Powered Data Science Problem Framing
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Purpose of the Study</h3>
                  <p className="text-gray-700">
                    This research study aims to understand how different types of AI assistance 
                    can help students develop better data science problem statements. We are 
                    comparing two approaches: refinement-focused AI (editor) and creative 
                    challenge-focused AI (challenger).
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">What You Will Do</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Complete 3-4 data science problem framing tasks</li>
                    <li>Interact with AI assistants that provide different types of feedback</li>
                    <li>Rate the helpfulness and usability of the AI suggestions</li>
                    <li>Provide your reasoning for problem formulation decisions</li>
                    <li>The study will take approximately 30 minutes</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Risks and Benefits</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Benefits:</h4>
                      <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                        <li>Improve your data science problem framing skills</li>
                        <li>Experience with AI-assisted problem solving</li>
                        <li>Contribute to educational research</li>
                        <li>Receive course credit or compensation</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Risks:</h4>
                      <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                        <li>Minimal risk - similar to typical coursework</li>
                        <li>Potential fatigue from cognitive tasks</li>
                        <li>No physical risks involved</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Data Collection and Privacy</h3>
                  <p className="text-gray-700 mb-3">
                    We will collect the following information:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Your problem statements and revisions</li>
                    <li>AI interactions and your ratings</li>
                    <li>Time spent on tasks</li>
                    <li>Basic demographic information (academic level, experience)</li>
                  </ul>
                  <p className="text-gray-700 mt-3">
                    <strong>All data is anonymized</strong> - your name and personal identifiers 
                    are not stored. Data is encrypted and stored securely on password-protected 
                    servers. Only the research team has access to the data.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your Rights</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Participation is completely voluntary</li>
                    <li>You can withdraw at any time without penalty</li>
                    <li>You can ask questions about the study at any time</li>
                    <li>You can request that your data be deleted</li>
                    <li>Your participation is not connected to your grades</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Information</h3>
                  <p className="text-gray-700">
                    If you have questions about this study, please contact the research team. 
                    For questions about your rights as a research participant, contact the 
                    Institutional Review Board.
                  </p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">IRB Approval</h4>
                    <p className="text-blue-800 text-sm mt-1">
                      This study has been reviewed and approved by the Institutional Review Board. 
                      Protocol #: [IRB-NUMBER]
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Consent Checkbox */}
        <div className="card">
          <div className="card-body">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasReadConsent}
                onChange={(e) => setHasReadConsent(e.target.checked)}
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">
                  I have read and understand the information above
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  By checking this box, I give my informed consent to participate in this research study. 
                  I understand that I can withdraw at any time without penalty.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGiveConsent}
            disabled={!hasReadConsent || isLoading}
            className="btn btn-primary px-8 py-3 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>I Consent - Start Study</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary px-8 py-3"
          >
            Decline Participation
          </button>
        </div>

        {/* Study Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="card-body">
              <Clock className="w-8 h-8 text-primary-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">30 Minutes</h3>
              <p className="text-sm text-gray-600">
                Estimated time to complete all tasks
              </p>
            </div>
          </div>
          
          <div className="card text-center">
            <div className="card-body">
              <Shield className="w-8 h-8 text-primary-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Privacy Protected</h3>
              <p className="text-sm text-gray-600">
                All data is anonymized and secure
              </p>
            </div>
          </div>
          
          <div className="card text-center">
            <div className="card-body">
              <Users className="w-8 h-8 text-primary-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Voluntary</h3>
              <p className="text-sm text-gray-600">
                You can withdraw at any time
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Consent
