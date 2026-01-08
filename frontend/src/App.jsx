import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import Layout from './components/Layout'
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import Consent from './pages/Consent'
import Dashboard from './pages/Dashboard'
import ProblemWorkspace from './pages/ProblemWorkspace'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'
import MobileOptimized from './components/MobileOptimized'

function App() {
  const { isAuthenticated, isLoading, needsConsent, user } = useAuthStore()

  useEffect(() => {
  }, [])
  if (isLoading) {
    return (
      <MobileOptimized>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </MobileOptimized>
    )
  }
  return (
    <MobileOptimized>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          {/* Protected routes */}
          <Route path="/" element={<Layout />}>
            <Route
              path="consent" 
              element={
                <ProtectedRoute requireConsent={true}>
                  <Consent />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="workspace/:problemId" 
              element={
                <ProtectedRoute>
                  <ProblemWorkspace />
                </ProtectedRoute>
              } 
            />
            <Route
              path="profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </MobileOptimized>
  )
}
export default App