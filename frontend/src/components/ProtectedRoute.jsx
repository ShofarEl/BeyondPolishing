import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import LoadingSpinner from './LoadingSpinner'

const ProtectedRoute = ({ children, requireConsent = false }) => {
  const { isAuthenticated, isLoading, needsConsent, user } = useAuthStore()

  console.log('ProtectedRoute render:', { isAuthenticated, isLoading, requireConsent, needsConsent: needsConsent?.() })

  if (isLoading) {
    console.log('ProtectedRoute: showing loading spinner')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('ProtectedRoute: not authenticated, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // If consent is required but not given, redirect to consent page
  if (requireConsent && needsConsent()) {
    console.log('ProtectedRoute: consent required, redirecting to consent')
    return <Navigate to="/consent" replace />
  }

  // If we're on a route that doesn't require consent, allow access regardless of consent status
  console.log('ProtectedRoute: no consent requirement, allowing access')

  console.log('ProtectedRoute: rendering children')
  return children
}

export default ProtectedRoute
