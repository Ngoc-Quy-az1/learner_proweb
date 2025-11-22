import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Phone, X } from 'lucide-react'
import PricingCards from '../components/PricingCards'
import ContactModal from '../components/ContactModal'

export default function PricingPage() {
  const navigate = useNavigate()
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0054E5' }}>
      {/* Header/Navbar */}
      <nav className="relative z-50 bg-white border-b border-gray-200 sticky top-0">
        <div className="w-full mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="flex items-center justify-between h-20">
            {/* Logo - Left Side - Bold and Prominent */}
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="flex items-center space-x-3 min-w-0">
                <img src="/skillar-favicon.svg" alt="SKILLAR Logo" className="h-14 w-auto flex-shrink-0" />
                <span className="text-4xl flex-shrink-0 whitespace-nowrap" style={{ fontFamily: "'Ubuntu', sans-serif", fontWeight: 900 }}>
                  <span style={{ color: '#528fcd' }}>skillar</span>
                  <span style={{ color: '#032757' }}>Tutor</span>
                </span>
              </Link>
            </div>

            {/* Center Section - Empty for spacing */}
            <div className="hidden lg:flex items-center flex-1 justify-center ml-4">
            </div>

            {/* Right Section - Trang chủ, Gói dịch vụ, Liên hệ, Đăng nhập */}
            <div className="hidden md:flex items-center space-x-6 flex-shrink-0">
              {/* Trang chủ - Dark Gray, Bold */}
              <button
                onClick={() => navigate('/')}
                className="text-gray-900 hover:text-blue-600 hover:bg-gray-100 font-bold text-base transition-all px-4 py-2 rounded-lg"
              >
                Trang chủ
              </button>

              {/* Gói dịch vụ - Dark Gray, Bold */}
              <button
                onClick={() => navigate('/pricing')}
                className="text-gray-900 hover:text-blue-600 hover:bg-gray-100 font-bold text-base transition-all px-4 py-2 rounded-lg"
              >
                Gói dịch vụ
              </button>

              {/* Liên hệ - Dark Gray, Black Phone Icon */}
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="flex items-center space-x-2 text-gray-900 hover:text-blue-600 hover:bg-gray-100 transition-all px-4 py-2 rounded-lg"
              >
                <Phone className="w-5 h-5 text-black" />
                <span className="font-bold text-base">Liên hệ</span>
              </button>

              {/* Đăng nhập - Dark Gray, Bold */}
              <button
                onClick={() => navigate('/login')}
                className="text-gray-900 hover:text-blue-600 hover:bg-gray-100 font-bold text-base transition-all px-4 py-2 rounded-lg"
              >
                Đăng nhập
              </button>
            </div>
                
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 text-gray-900 hover:text-blue-600"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-3">
                {/* Trang chủ */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    navigate('/')
                  }}
                  className="text-left text-gray-900 hover:text-blue-600 hover:bg-gray-100 font-bold text-base transition-all px-4 py-3 rounded-lg"
                >
                  Trang chủ
                </button>

                {/* Gói dịch vụ */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    navigate('/pricing')
                  }}
                  className="text-left text-gray-900 hover:text-blue-600 hover:bg-gray-100 font-bold text-base transition-all px-4 py-3 rounded-lg"
                >
                  Gói dịch vụ
                </button>

                {/* Liên hệ */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    setIsContactModalOpen(true)
                  }}
                  className="flex items-center space-x-2 text-gray-900 hover:text-blue-600 hover:bg-gray-100 px-4 py-3 rounded-lg transition-all"
                >
                  <Phone className="w-5 h-5 text-black" />
                  <span className="font-bold text-base">Liên hệ</span>
                </button>

                {/* Đăng nhập */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    navigate('/login')
                  }}
                  className="text-left text-gray-900 hover:text-blue-600 hover:bg-gray-100 font-bold text-base transition-all px-4 py-3 rounded-lg"
                >
                  Đăng nhập
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Pricing Section */}
      <div className="relative py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Pricing Cards Component */}
          <PricingCards onContactClick={() => setIsContactModalOpen(true)} />
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </div>
  )
}
