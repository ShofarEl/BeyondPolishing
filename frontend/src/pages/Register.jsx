import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, GraduationCap, Database, AlertCircle, Shield, CheckCircle } from 'lucide-react'
import useAuthStore from '../store/authStore'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Register = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [consent, setConsent] = useState(false)
  const navigate = useNavigate()
  const { register: registerUser } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm()

  const studyGroup = watch('studyGroup')

  const onSubmit = async (data) => {
    if (!consent) {
      toast.error('Please provide consent to participate')
      return
    }

    setIsLoading(true)
    try {
      // Randomly assign study group
      const assignedStudyGroup = Math.random() < 0.5 ? 'editor-first' : 'challenger-first'
      
      // Create anonymous user session
      const userData = {
        studyGroup: assignedStudyGroup,
        demographicData: {
          academicLevel: data.academicLevel,
          dataScienceExperience: data.dataScienceExperience
        }
      }

      const result = await registerUser(userData)
      
      if (result.success) {
        toast.success('Starting study...')
        // Go directly to workspace
        navigate('/workspace/new')
      } else {
        toast.error(result.error || 'Failed to start study')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Failed to start study. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center space-x-2 text-primary-600 hover:text-primary-700">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
        </div>
        
        <div className="mt-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            AI-Powered Problem Framing Study
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Complete this one-time study session (≈30 minutes)
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <Shield className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">
              100% Anonymous - No email or login required
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          <div className="card-body">
            {/* Consent Section - Enhanced Visibility */}
            <div className="mb-6 p-5 bg-blue-50 border-2 border-blue-300 rounded-lg shadow-sm relative z-10">
              <h3 className="text-base font-bold text-blue-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Informed Consent
              </h3>
              <div className="text-sm text-blue-900 space-y-2 mb-4 leading-relaxed">
                <p className="font-semibold">By participating, you agree that:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li className="pl-1">Your participation is voluntary (≈30 minutes)</li>
                  <li className="pl-1">Your responses will be collected anonymously for research</li>
                  <li className="pl-1">You can stop at any time</li>
                  <li className="pl-1">You are at least 18 years old</li>
                </ul>
              </div>
              <label className="flex items-start cursor-pointer touch-manipulation p-3 bg-white border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="consent-checkbox text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 border-2 border-gray-400 rounded cursor-pointer"
                  style={{ accentColor: '#2563eb' }}
                  aria-label="Consent to participate in research study"
                />
                <span className="text-sm text-blue-900 font-medium leading-relaxed">
                  I consent to participate in this research study
                </span>
              </label>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Study Group Assignment */}
              {/* Study Group - Auto-assigned, hidden from user */}
              <input
                type="hidden"
                {...register('studyGroup')}
              />

              {/* Academic Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What is your academic level?
                </label>
                <div className="relative">
                  <select
                    {...register('academicLevel', {
                      required: 'Please select your academic level'
                    })}
                    className="input pr-10"
                  >
                    <option value="">Select your level</option>
                    <option value="undergraduate">Undergraduate Student</option>
                    <option value="graduate">Graduate Student (Master's)</option>
                    <option value="postgraduate">Postgraduate (PhD)</option>
                    <option value="other">Other</option>
                  </select>
                  <GraduationCap className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.academicLevel && (
                  <p className="mt-1 text-sm text-error-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.academicLevel.message}
                  </p>
                )}
              </div>

              {/* Data Science Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What is your data science experience?
                </label>
                <div className="relative">
                  <select
                    {...register('dataScienceExperience', {
                      required: 'Please select your experience level'
                    })}
                    className="input pr-10"
                  >
                    <option value="">Select experience level</option>
                    <option value="none">No experience</option>
                    <option value="basic">Basic (1 course or self-study)</option>
                    <option value="intermediate">Intermediate (multiple courses or projects)</option>
                    <option value="advanced">Advanced (professional or extensive work)</option>
                  </select>
                  <Database className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.dataScienceExperience && (
                  <p className="mt-1 text-sm text-error-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.dataScienceExperience.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading || !consent}
                  className="btn btn-primary w-full flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Start Study</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Study Information */}
        <div className="mt-8 card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-600" />
              What to Expect
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• <strong>Duration:</strong> Approximately 30 minutes (one-time session)</li>
              <li>• <strong>Tasks:</strong> Complete TWO data science problem framing tasks in your chosen domain</li>
              <li>• <strong>AI Modes:</strong> You'll interact with both Editor and Challenger AI modes for each task</li>
              <li>• <strong>Domain Choice:</strong> Select any domain (healthcare, finance, education, etc.) for your problems</li>
              <li>• <strong>Data Collected:</strong> Your problem statements, AI interactions, and ratings</li>
              <li>• <strong>Privacy:</strong> Completely anonymous - no personal information collected</li>
              <li>• <strong>No Login:</strong> This is a one-time session - no account or email needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
