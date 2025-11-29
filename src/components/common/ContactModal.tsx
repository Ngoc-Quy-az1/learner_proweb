import { X } from 'lucide-react'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
        </button>

        {/* Blue Header Section */}
        <div className="bg-blue-600 text-white text-center py-6 sm:py-8 md:py-10 px-4 sm:px-6 md:px-8">
          {/* Advisors Avatars */}
          <div className="flex justify-center -space-x-3 sm:-space-x-4 mb-4 sm:mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 sm:border-3 md:border-4 border-white overflow-hidden bg-gray-300 shadow-lg">
              <img src="/3.jpg" alt="Advisor 1" className="w-full h-full object-cover" />
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 sm:border-3 md:border-4 border-white overflow-hidden bg-gray-300 shadow-lg">
              <img src="/4.jpg" alt="Advisor 2" className="w-full h-full object-cover" />
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 sm:border-3 md:border-4 border-white overflow-hidden bg-gray-300 shadow-lg">
              <img src="/5.jpg" alt="Advisor 3" className="w-full h-full object-cover" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
            Nói chuyện với
          </h2>
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold">
            Đội Ngũ Tư Vấn Học Tập
          </h3>
        </div>

        {/* Contact Methods */}
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6">
          {/* Phone/WhatsApp Calls */}
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-xl flex items-center justify-center">
              <img 
                src="/phone-icon.svg" 
                alt="Phone" 
                className="w-5 h-5 sm:w-6 sm:h-7"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">
                Sô điện thoại liên hệ
              </p>
              <a 
                href="tel:0815 836 636" 
                className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors break-all"
              >
                0815 836 636
              </a>
            </div>
          </div>

          {/* Zalo Chat */}
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-xl flex items-center justify-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg" 
                alt="Zalo" 
                className="w-5 h-5 sm:w-6 sm:h-7"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">
                Zalo liên hệ
              </p>
              <a 
                href="https://zalo.me/0815 836 636" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors break-all"
              >
                0815 836 636
              </a>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-xl flex items-center justify-center">
              <img 
                src="/mail-icon.svg" 
                alt="Email" 
                className="w-5 h-5 sm:w-6 sm:h-7"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">
                Gửi email
              </p>
              <a 
                href="mailto:skillartutor@gmail.com" 
                className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors break-all"
              >
                skillartutor@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

