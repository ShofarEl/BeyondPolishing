import { useEffect } from 'react'

const MobileOptimized = ({ children }) => {
  useEffect(() => {
    // Prevent zoom on double tap
    let lastTouchEnd = 0
    const preventZoom = (e) => {
      const now = new Date().getTime()
      if (now - lastTouchEnd <= 300) {
        e.preventDefault()
      }
      lastTouchEnd = now
    }

    // Add event listeners
    document.addEventListener('touchend', preventZoom, { passive: false })
    
    // Prevent zoom on input focus (iOS Safari)
    const preventInputZoom = () => {
      const inputs = document.querySelectorAll('input, textarea, select')
      inputs.forEach(input => {
        input.addEventListener('focus', () => {
          input.style.fontSize = '16px'
        })
        input.addEventListener('blur', () => {
          input.style.fontSize = ''
        })
      })
    }

    preventInputZoom()

    // Cleanup
    return () => {
      document.removeEventListener('touchend', preventZoom)
    }
  }, [])

  return (
    <div className="mobile-optimized">
      {children}
    </div>
  )
}

export default MobileOptimized