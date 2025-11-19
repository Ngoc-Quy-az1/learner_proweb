import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Users, BarChart3, Shield, Sparkles, TrendingUp, CheckCircle2, Mail, Lock, LogIn, Phone, Download, X } from 'lucide-react'
import VideoBackground from '../components/VideoBackground'
import Logo from '../components/Logo'
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'

export default function HomePage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [registrationPhone, setRegistrationPhone] = useState('')
  const [registrationError, setRegistrationError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      // Redirect based on role
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (user.role === 'student' || user.role === 'parent') {
        navigate('/student')
      } else if (user.role === 'tutor') {
        navigate('/tutor')
      } else if (user.role === 'admin') {
        navigate('/admin')
      }
    } catch (err) {
      setError('Tên đăng nhập hoặc mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Video Background */}
      <VideoBackground />

      {/* Header */}
      <Navbar variant="home" showSearch={true} showNavLinks={true} />

      {/* Hero Section - 2 Columns at Edges */}
      <section className="relative z-10 min-h-[calc(100vh-80px)] flex items-center py-8 lg:py-16">
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Column - Content */}
            <div className="text-white space-y-6 lg:space-y-8 px-6 sm:px-8 lg:px-12 xl:px-20">
              {/* Prominent Logo */}
              <div className="mb-4 lg:mb-6 animate-float">
                <div className="inline-block bg-white/10 backdrop-blur-md px-8 py-6 lg:px-12 lg:py-8 rounded-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <Logo size="xl" showTagline={true} taglineColor="white" />
                </div>
              </div>
              
              <div className="space-y-5 lg:space-y-6">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-extrabold leading-tight tracking-tight">
                  <span className="text-white block mb-2">Hệ thống quản lý</span>
                  <span className="text-primary-400 block mb-2">học tập thông minh</span>
                  <span className="text-white block">cho mọi người</span>
                </h1>
                <p className="text-lg sm:text-xl text-white/90 leading-relaxed max-w-2xl font-medium">
                Học tập chính là hành trình khai phóng tư duy, liên tục tiếp thu và ứng dụng tri thức mới, từ đó mở rộng tầm nhìn, chinh phục mọi thách thức, kiến tạo nên phiên bản tốt nhất của chính bản thân chúng ta mỗi ngày.
                </p>
              </div>
              
              <div className="pt-4">
                <button 
                  onClick={() => setShowRegistrationForm(true)}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-10 py-4 rounded-xl font-bold text-lg uppercase transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 tracking-wide"
                >
                  THAM GIA NGAY
                </button>
              </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="w-full lg:w-auto px-6 sm:px-8 lg:px-12 xl:px-20 flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-gray-900/90 backdrop-blur-lg rounded-2xl p-6 lg:p-8 shadow-2xl border border-white/10">
                <div className="w-full bg-white text-primary-600 px-6 py-3 rounded-lg font-bold mb-6 text-center">
                  Đăng nhập
                </div>
                
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2.5 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Tên đăng nhập"
                        className="w-full bg-transparent border-b-2 border-gray-600 text-white placeholder-white/60 pl-8 pr-4 py-3 focus:border-primary-500 focus:outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <Lock className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mật khẩu"
                        className="w-full bg-transparent border-b-2 border-gray-600 text-white placeholder-white/60 pl-8 pr-4 py-3 focus:border-primary-500 focus:outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold text-center transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-4"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang đăng nhập...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span>Đăng nhập</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 bg-white/95 backdrop-blur-sm py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Tính năng <span className="gradient-text">nổi bật</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Mọi thứ bạn cần để quản lý học tập hiệu quả
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="feature-card text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Checklist Bài Học</h3>
              <p className="text-gray-600 leading-relaxed">
                Theo dõi tiến độ học tập với checklist chi tiết từng bài học, nhiệm vụ
              </p>
            </div>

            <div className="feature-card text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Kết Nối Đa Chiều</h3>
              <p className="text-gray-600 leading-relaxed">
                Học sinh, phụ huynh, tutor và giáo viên cùng tương tác trong một nền tảng
              </p>
            </div>

            <div className="feature-card text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Báo Cáo Chi Tiết</h3>
              <p className="text-gray-600 leading-relaxed">
                Báo cáo buổi học tự động với đánh giá toàn diện, xuất PDF dễ dàng
              </p>
            </div>

            <div className="feature-card text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Quản Lý An Toàn</h3>
              <p className="text-gray-600 leading-relaxed">
                Hệ thống bảo mật cao, quản lý tập trung bởi admin, dữ liệu được mã hóa
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Tại sao chọn SKILLAR?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: TrendingUp, title: 'Tiến bộ rõ rệt', desc: 'Theo dõi và đo lường tiến độ học tập một cách chi tiết' },
              { icon: CheckCircle2, title: 'Dễ sử dụng', desc: 'Giao diện thân thiện, dễ dàng sử dụng cho mọi lứa tuổi' },
              { icon: Sparkles, title: 'Công nghệ hiện đại', desc: 'Nền tảng web hiện đại, tốc độ nhanh, bảo mật cao' },
            ].map((benefit, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <benefit.icon className="w-12 h-12 text-yellow-300 mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">{benefit.title}</h3>
                <p className="text-primary-100 leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form Modal */}
      {showRegistrationForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => {
                setShowRegistrationForm(false)
                setRegistrationPhone('')
                setRegistrationError('')
              }}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Đăng ký tham gia</h2>
                <p className="text-gray-600">Điền thông tin để nhận form đăng ký</p>
              </div>

              {registrationError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {registrationError}
                </div>
              )}

              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!registrationPhone || registrationPhone.trim() === '') {
                    setRegistrationError('Vui lòng nhập số điện thoại')
                    return
                  }
                  if (!/^[0-9]{10,11}$/.test(registrationPhone.replace(/\s/g, ''))) {
                    setRegistrationError('Số điện thoại không hợp lệ')
                    return
                  }
                  // Download form logic here
                  const link = document.createElement('a')
                  link.href = '/registration-form.pdf' // Đường dẫn tới file form PDF
                  link.download = 'form-dang-ky-skillar.pdf'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  
                  setRegistrationError('')
                  setRegistrationPhone('')
                  setShowRegistrationForm(false)
                }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={registrationPhone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        setRegistrationPhone(value)
                        setRegistrationError('')
                      }}
                      placeholder="Nhập số điện thoại của bạn"
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 pl-12 pr-4 py-4 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none transition-all"
                      required
                      maxLength={11}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Ví dụ: 0912345678</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegistrationForm(false)
                      setRegistrationPhone('')
                      setRegistrationError('')
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Tải form đăng ký</span>
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Bằng cách đăng ký, bạn đồng ý với <a href="#" className="text-primary-600 hover:underline">Điều khoản sử dụng</a> và <a href="#" className="text-primary-600 hover:underline">Chính sách bảo mật</a> của chúng tôi
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Logo size="sm" showTagline={true} taglineColor="white" />
              </div>
              <p className="text-gray-400">Where Growth Begins</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Liên kết nhanh</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#home" className="hover:text-white transition-colors">Đăng nhập</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">Về chúng tôi</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Liên hệ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Hướng dẫn sử dụng</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Câu hỏi thường gặp</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400">© 2024 SKILLAR. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
