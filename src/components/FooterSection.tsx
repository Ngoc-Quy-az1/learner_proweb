export default function FooterSection() {
  return (
    <footer className="relative z-10 text-white py-16" style={{ backgroundColor: '#1A202C' }}>
      <div className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-10">
          <div>
            <div className="mb-6">
              <div className="inline-block bg-white p-4 sm:p-6 rounded-xl shadow-2xl mb-4">
                <div className="flex items-center space-x-3 sm:space-x-5 flex-wrap">
                  <img src="/skillar-favicon.svg" alt="SKILLAR Logo" className="h-12 sm:h-16 md:h-20 w-auto flex-shrink-0" />
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold whitespace-nowrap" style={{ fontFamily: 'Ubuntu, sans-serif', fontWeight: 700 }}>
                    <span style={{ color: '#032757' }}>skillar</span>
                    <span style={{ color: '#528fcd' }}>Tutor</span>
                  </h2>
                </div>
              </div>
              <div className="text-white text-base sm:text-lg font-medium space-y-1">
                <p>Footer tagline thay đổi</p>
                <p className="text-2xl font-semibold">Where Focus Begins</p>
                <p className="text-base">Hoặc</p>
                <p className="text-xl font-semibold">Where Better Study Habits Grow</p>
              </div>
            </div>
          </div>
          <div className="text-left">
            <h4 className="font-bold mb-6 text-white text-3xl sm:text-4xl">Liên kết nhanh</h4>
            <ul className="space-y-4 sm:space-y-5 text-white text-xl sm:text-2xl">
              <li><a href="#home" className="hover:text-blue-400 transition-colors font-semibold">Đăng nhập</a></li>
              <li><a href="#about" className="hover:text-blue-400 transition-colors font-semibold">Về chúng tôi</a></li>
              <li><a href="#contact" className="hover:text-blue-400 transition-colors font-semibold">Liên hệ</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center">
          <p className="text-white text-lg">© 2024 SKILLAR. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

