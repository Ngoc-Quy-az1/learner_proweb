import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import PricingCards from '../components/PricingCards'
import ContactModal from '../components/ContactModal'

export default function PricingPage() {
  const navigate = useNavigate()
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0054E5' }}>
      {/* Navbar */}
      <nav className="relative z-50 bg-white border-b border-gray-200 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Logo size="md" showTagline={false} taglineColor="black" />
            <button
              onClick={() => navigate('/')}
              className="text-gray-900 hover:text-blue-600 font-bold text-sm sm:text-base transition-all px-3 sm:px-4 py-2 rounded-lg whitespace-nowrap"
            >
              <span className="hidden sm:inline">← Quay lại trang chủ</span>
              <span className="sm:hidden">← Trang chủ</span>
            </button>
          </div>
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
