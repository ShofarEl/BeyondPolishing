import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, GraduationCap, Database, AlertCircle, Mail, AtSign } from 'lucide-react'
import useAuthStore from '../store/authStore'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Register = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { register: registerUser } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm()

  const studyGroup = watch('studyGroup')

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const result = await registerUser(data)
      
      if (result.success) {
        toast.success('Registration successful!')
        // Store participant ID for easy access
        localStorage.setItem('tempParticipantId', result.data.participantId)
        // Navigate to consent page
        navigate('/consent')
      } else {
        toast.error(result.error || 'Registration failed')
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.')
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
            Join Our Research Study
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Help us understand how AI can improve data science problem framing
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email address is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    placeholder="your.email@example.com"
                    className="input pr-10"
                  />
                  <Mail className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-error-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    {...register('username', {
                      required: 'Username is required',
                      minLength: {
                        value: 2,
                        message: 'Username must be at least 2 characters'
                      },
                      maxLength: {
                        value: 50,
                        message: 'Username must not exceed 50 characters'
                      }
                    })}
                    placeholder="Choose a username"
                    className="input pr-10"
                  />
                  <AtSign className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-error-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Study Group Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Study Group Assignment
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      value="editor-first"
                      {...register('studyGroup', { required: 'Please select a study group' })}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-lg transition-colors ${
                      studyGroup === 'editor-first'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-primary-600" />
                        <div>
                          <div className="font-medium text-gray-900">Editor-First Group</div>
                          <div className="text-sm text-gray-600">
                            Start with refinement prompts, then challenger prompts
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                  
                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      value="challenger-first"
                      {...register('studyGroup', { required: 'Please select a study group' })}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-lg transition-colors ${
                      studyGroup === 'challenger-first'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Database className="w-5 h-5 text-warning-600" />
                        <div>
                          <div className="font-medium text-gray-900">Challenger-First Group</div>
                          <div className="text-sm text-gray-600">
                            Start with challenger prompts, then refinement prompts
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
                {errors.studyGroup && (
                  <p className="mt-1 text-sm text-error-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.studyGroup.message}
                  </p>
                )}
              </div>

              {/* Academic Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Level
                </label>
                <div className="relative">
                  <select
                    {...register('demographicData.academicLevel', {
                      required: 'Please select your academic level'
                    })}
                    className="input pr-10"
                  >
                    <option value="">Select your level</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="graduate">Graduate</option>
                    <option value="other">Other</option>
                  </select>
                  <GraduationCap className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.demographicData?.academicLevel && (
                  <p className="mt-1 text-sm text-error-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.demographicData.academicLevel.message}
                  </p>
                )}
              </div>

              {/* Data Science Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Science Experience
                </label>
                <div className="relative">
                  <select
                    {...register('demographicData.dataScienceExperience', {
                      required: 'Please select your experience level'
                    })}
                    className="input pr-10"
                  >
                    <option value="">Select experience level</option>
                    <option value="none">No experience</option>
                    <option value="basic">Basic (1-2 courses)</option>
                    <option value="intermediate">Intermediate (3+ courses or projects)</option>
                    <option value="advanced">Advanced (Professional experience)</option>
                  </select>
                  <Database className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.demographicData?.dataScienceExperience && (
                  <p className="mt-1 text-sm text-error-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.demographicData.dataScienceExperience.message}
                  </p>
                )}
              </div>

              {/* Recruitment Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How did you hear about this study? (Optional)
                </label>
                <input
                  type="text"
                  {...register('recruitmentSource')}
                  placeholder="e.g., Course announcement, flyer, friend..."
                  className="input"
                />
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full flex items-center justify-center"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Join Study'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already a participant?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Login here
            </Link>
          </p>
        </div>

        {/* Study Information */}
        <div className="mt-8 card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              About This Study
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Duration: Approximately 30 minutes</li>
              <li>• Tasks: 3-4 data science problem framing exercises</li>
              <li>• Compensation: Course credit or small incentive</li>
              <li>• Privacy: All data is anonymized and secure</li>
              <li>• Voluntary: You can withdraw at any time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
