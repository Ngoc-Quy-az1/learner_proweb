import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Phone, X } from 'lucide-react'
import HeroSection from '../components/HeroSection'
import PerformanceSection from '../components/PerformanceSection'
import TutoringSection from '../components/TutoringSection'
import TestimonialsSection from '../components/TestimonialsSection'
import FooterSection from '../components/FooterSection'
import ContactModal from '../components/ContactModal'

export default function HomePage() {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  const testimonials = [
    {
      text: "My daughter scored among the highest in her common entrance exam into a top school and got admitted the same day! It's been very gratifying to see her improve under her tutor, to the point where she now contends with the top students in class.",
      author: "Mrs. Soetan",
      location: "Lekki, Lagos"
    }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Deep Blue Background with Doodles - Using #0f43d4 */}
      <div className="fixed inset-0 z-0" style={{ background: 'linear-gradient(to bottom right, #0f43d4, #0a2f9e, #081f6b)' }}>
        {/* Mathematical and Scientific Doodles - Light Purple/White */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 text-4xl text-purple-200 font-mono">x² + y² = z²</div>
          <div className="absolute top-40 right-20 text-3xl text-purple-200 font-mono">8 = 3 + 5</div>
          <div className="absolute bottom-40 left-20 text-5xl text-purple-200">?</div>
          <div className="absolute top-60 left-1/3 text-4xl text-purple-200">△</div>
          <div className="absolute bottom-60 right-1/4 text-4xl text-purple-200">□</div>
          <div className="absolute top-1/3 right-10 text-3xl text-purple-200">DNA</div>
          <div className="absolute top-1/2 left-1/4 text-3xl text-purple-200">π</div>
          <div className="absolute bottom-1/3 left-1/3 text-4xl text-purple-200">∑</div>
                </div>
              </div>
              
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

            {/* Right Section - Liên hệ, Gói dịch vụ, Đăng nhập */}
            <div className="hidden md:flex items-center space-x-6 flex-shrink-0">
              {/* Liên hệ - Dark Gray, Black Phone Icon */}
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="flex items-center space-x-2 text-gray-900 hover:text-blue-600 hover:bg-gray-100 transition-all px-4 py-2 rounded-lg"
              >
                <Phone className="w-5 h-5 text-black" />
                <span className="font-bold text-base">Liên hệ</span>
              </button>

              {/* Gói dịch vụ - Dark Gray, Bold */}
              <button
                onClick={() => navigate('/pricing')}
                className="text-gray-900 hover:text-blue-600 hover:bg-gray-100 font-bold text-base transition-all px-4 py-2 rounded-lg"
              >
                Gói dịch vụ
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

        {/* Hero Section */}
        <HeroSection onGetStarted={() => navigate('/pricing')} />


      {/* Tutoring Section */}
      <TutoringSection onGetTutor={() => navigate('/pricing')} />

      {/* Performance Section */}
      <PerformanceSection onGetStarted={() => navigate('/pricing')} />

      {/* Testimonials Section */}
      <TestimonialsSection testimonials={testimonials} />

      {/* Footer */}
      <FooterSection />

      {/* Contact Modal */}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </div>
  )
}
