import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, AlertCircle, Mail, Search, Check } from 'lucide-react'
import useAuthStore from '../store/authStore'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import api from '../services/api'

const Login = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [lookupResult, setLookupResult] = useState(null)
  const [showLookupForm, setShowLookupForm] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [emailValue, setEmailValue] = useState('')
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control
  } = useForm()

  const {
    register: registerLookup,
    handleSubmit: handleSubmitLookup,
    formState: { errors: lookupErrors }
  } = useForm()

  const email = watch('email')

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      console.log('Login form data:', data)
      const result = await login(data.participantId, data.email)
      
      if (result.success) {
        toast.success('Login successful!')
        navigate('/dashboard')
      } else {
        console.log('Login failed:', result.error)
        toast.error(result.error || 'Login failed')
      }
    } catch (error) {
      toast.error('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailLookup = async (data) => {
    console.log('handleEmailLookup called with data:', data)
    setIsLookingUp(true)
    try {
      console.log('Looking up email:', data.lookupEmail)
      const response = await api.post('/auth/lookup', { email: data.lookupEmail })
      console.log('Lookup response:', response.data)
      if (response.data.success) {
        console.log('Setting lookup result:', response.data.data)
        setLookupResult(response.data.data)
        console.log('Setting participant ID:', response.data.data.participantId)
        setValue('participantId', response.data.data.participantId)
        console.log('Setting email:', response.data.data.email)
        setValue('email', response.data.data.email, { shouldDirty: true, shouldTouch: true })
        setEmailValue(response.data.data.email)
        toast.success('Account found! Your Participant ID has been filled in.')
      }
    } catch (error) {
      console.error('Lookup error:', error.response?.data || error)
      toast.error(error.response?.data?.error || 'No account found with this email')
    } finally {
      setIsLookingUp(false)
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
            Returning Participant
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your participant ID to continue
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          <div className="card-body">
            {/* Email Lookup Section */}
            {!lookupResult && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  Can't remember your Participant ID?
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  Enter your email address to look it up automatically.
                </p>
                <form onSubmit={handleSubmitLookup((data) => {
                  console.log('Lookup form submitted with data:', data)
                  handleEmailLookup(data)
                }, (errors) => {
                  console.log('Lookup form validation errors:', errors)
                  console.log('Lookup form validation errors (detailed):', JSON.stringify(errors, null, 2))
                })} className="space-y-3">
                  <div className="relative">
                    <input
                      type="email"
                      {...registerLookup('lookupEmail', {
                        required: 'Email is required for lookup'
                      })}
                      placeholder="your.email@example.com"
                      className="input pr-10"
                    />
                    <Mail className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {lookupErrors.lookupEmail && (
                    <p className="text-sm text-error-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {lookupErrors.lookupEmail.message}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isLookingUp}
                    className="btn btn-primary w-full flex items-center justify-center space-x-2"
                    onClick={() => console.log('Lookup button clicked, isLookingUp:', isLookingUp)}
                  >
                    {isLookingUp ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Look Up My ID</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Success Message */}
            {lookupResult && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-medium text-green-900">
                    Account Found!
                  </h3>
                </div>
                <p className="text-sm text-green-700">
                  Welcome back, <strong>{lookupResult.username}</strong>! Your Participant ID has been filled in below.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Optional Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address (Optional - for extra security)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    {...register('email', {
                      onChange: (e) => setEmailValue(e.target.value)
                    })}
                    placeholder="your.email@example.com"
                    className="input pr-10"
                  />
                  <Mail className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participant ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    {...register('participantId', {
                      required: 'Participant ID is required',
                      minLength: {
                        value: 5,
                        message: 'Participant ID must be at least 5 characters'
                      }
                    })}
                    placeholder="Enter your participant ID"
                    className="input pr-10"
                  />
                  <User className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.participantId && (
                  <p className="mt-1 text-sm text-error-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.participantId.message}
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full flex items-center justify-center"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            New to the study?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Join here
            </Link>
          </p>
        </div>

        <div className="mt-8 card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Need Help Finding Your ID?
            </h3>
            <div className="text-sm text-gray-600 space-y-3">
              <p>Your participant ID was generated when you registered for the study.</p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="font-medium text-yellow-800 mb-2">📋 Where to find your ID:</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>Check your browser's saved passwords</li>
                  <li>Look for a screenshot or note you took during registration</li>
                  <li>Check your email if you received a confirmation</li>
                  <li>Ask the research team if you remember registering</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="font-medium text-blue-800 mb-1">📝 ID Format:</p>
                <p className="text-blue-700 font-mono">P + timestamp + random letters</p>
                <p className="text-blue-700 font-mono">Example: <code className="bg-blue-100 px-1 rounded">P1703123456abc</code></p>
              </div>
              
              <p className="text-center">
                <strong>Can't find it?</strong> You can{' '}
                <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                  register again
                </Link>{' '}
                with the same information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login