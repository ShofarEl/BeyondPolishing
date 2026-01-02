const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              About This Study
            </h3>
            <p className="text-sm text-gray-600">
              This research application evaluates how different AI prompt styles 
              affect students' problem-framing creativity and reasoning in data science contexts.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Research Team
            </h3>
            <p className="text-sm text-gray-600">
              For questions about this study or to report technical issues, 
              please contact the research team.
            </p>
          </div>

          {/* Privacy */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Privacy & Ethics
            </h3>
            <p className="text-sm text-gray-600">
              This study follows IRB-approved protocols. All data is anonymized 
              and stored securely. You can withdraw at any time.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © 2024 AI Data Science Problem Framing Research
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Privacy Policy
              </button>
              <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Terms of Service
              </button>
              <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
