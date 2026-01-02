import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import useAuthStore from '../store/authStore'

const Layout = () => {
  const { isAuthenticated } = useAuthStore()

  console.log('Layout render - isAuthenticated:', isAuthenticated)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout
