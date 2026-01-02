import { Link } from 'react-router-dom'
import { ArrowRight, Brain, Target, Users, BarChart3, Shield, Clock } from 'lucide-react'
import useAuthStore from '../store/authStore'
import Header from '../components/Header'

const Home = () => {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <Header />
      
      {/* Main Content - Compact Layout */}
      <div className="text-sm">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="text-center">
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-5 font-display">
                AI-Powered Data Science
                <span className="text-primary-600"> Problem Framing</span>
              </h1>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto font-primary">
                Join our research study to explore how AI can help students develop 
                better data science problem statements through creative collaboration 
                and iterative refinement.
              </p>
              
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="btn btn-primary text-base px-6 py-2 inline-flex items-center space-x-2"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/register"
                    className="btn btn-primary text-base px-6 py-2 inline-flex items-center space-x-2"
                  >
                    <span>Join the Study</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="btn btn-secondary text-base px-6 py-2"
                  >
                    Returning Participant
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 lg:py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 font-display">
                How It Works
              </h2>
              <p className="text-lg text-gray-600 max-w-xl mx-auto font-primary">
                Our research compares two AI assistance approaches to help you 
                frame data science problems more effectively.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Editor Mode */}
              <div className="card p-6 text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-display">
                  Editor Mode
                </h3>
                <p className="text-gray-600 mb-3 font-primary text-sm">
                  Refinement-focused AI that helps polish and clarify your problem statements, 
                  suggesting specific metrics and data requirements.
                </p>
                <div className="text-xs text-primary-600 font-medium">
                  Focus: Precision & Clarity
                </div>
              </div>

              {/* Challenger Mode */}
              <div className="card p-6 text-center">
                <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-warning-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-display">
                  Challenger Mode
                </h3>
                <p className="text-gray-600 mb-3 font-primary text-sm">
                  Creative AI that challenges your assumptions and proposes alternative 
                  problem framings with different stakeholders and objectives.
                </p>
                <div className="text-xs text-warning-600 font-medium">
                  Focus: Innovation & Creativity
                </div>
              </div>

              {/* Research Study */}
              <div className="card p-6 text-center">
                <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-success-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 font-display">
                  Research Study
                </h3>
                <p className="text-gray-600 mb-3 font-primary text-sm">
                  Your participation helps us understand which AI approach leads to 
                  more creative and feasible data science problem statements.
                </p>
                <div className="text-xs text-success-600 font-medium">
                  Duration: ~30 minutes
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 lg:py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 font-display">
                Why Participate?
              </h2>
              <p className="text-lg text-gray-600 max-w-xl mx-auto font-primary">
                Join our study to improve your data science problem-framing skills 
                while contributing to educational research.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <Users className="w-10 h-10 text-primary-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-2 font-display">
                  Skill Development
                </h3>
                <p className="text-gray-600 font-primary text-sm">
                  Improve your ability to frame data science problems effectively
                </p>
              </div>

              <div className="text-center">
                <Clock className="w-10 h-10 text-primary-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-2 font-display">
                  Flexible Schedule
                </h3>
                <p className="text-gray-600 font-primary text-sm">
                  Complete tasks at your own pace within the study period
                </p>
              </div>

              <div className="text-center">
                <Shield className="w-10 h-10 text-primary-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-2 font-display">
                  Privacy Protected
                </h3>
                <p className="text-gray-600 font-primary text-sm">
                  All data is anonymized and stored securely with IRB approval
                </p>
              </div>

              <div className="text-center">
                <Brain className="w-10 h-10 text-primary-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-2 font-display">
                  Research Contribution
                </h3>
                <p className="text-gray-600 font-primary text-sm">
                  Help advance AI-assisted education and problem-solving research
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 lg:py-16 bg-primary-600">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 font-display">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-primary-100 mb-6 max-w-xl mx-auto font-primary">
              Join our research study and discover how AI can enhance your 
              data science problem-framing abilities.
            </p>
            
            {!isAuthenticated && (
              <Link
                to="/register"
                className="btn bg-white text-primary-600 hover:bg-gray-50 text-base px-6 py-2 inline-flex items-center space-x-2"
              >
                <span>Join the Study Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Home
