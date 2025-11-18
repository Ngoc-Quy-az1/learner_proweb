import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Users, BarChart3, Shield, Sparkles, TrendingUp, CheckCircle2, Mail, Lock, LogIn } from 'lucide-react'
import VideoBackground from '../components/VideoBackground'
import Logo from '../components/Logo'
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'

export default function HomePage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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
                <div className="inline-block bg-white/10 backdrop-blur-md px-6 py-4 lg:px-8 lg:py-6 rounded-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <Logo size="lg" showTagline={true} taglineColor="white" />
                </div>
              </div>
              
              <div className="space-y-4 lg:space-y-5">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.1]">
                  <span className="text-white block">Hệ thống quản lý</span>
                  <span className="text-primary-400 block">học tập thông minh</span>
                  <span className="text-white block">cho mọi người</span>
                </h1>
                <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-xl">
                  Hệ thống quản lý học tập là chuyên ngành của dòng thiết kế. Chúng tôi sử dụng HTML, CSS, 
                  phần mềm chỉnh sửa WYSIWYG, trình xác thực đánh dấu, v.v., để tạo các phần tử thiết kế.
                </p>
              </div>
              
              <div className="pt-2">
                <button className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-bold text-base uppercase transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Tham gia ngay
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
