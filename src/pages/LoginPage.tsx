import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const loggedInUser = await login(email, password)
      
      // Redirect based on role
      if (loggedInUser.role === 'student' || loggedInUser.role === 'parent') {
        navigate('/student')
      } else if (loggedInUser.role === 'tutor') {
        navigate('/tutor')
      } else if (loggedInUser.role === 'teacher') {
        navigate('/teacher')
      } else if (loggedInUser.role === 'admin') {
        navigate('/admin')
      } else {
        // Fallback to home if role is unknown
        navigate('/')
      }
    } catch (err) {
      setError('Tên đăng nhập hoặc mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4A90E2 0%, #B0B0B0 100%)' }}>
      {/* Navbar - Hidden on login page for cleaner look */}
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-xl w-full">
          {/* Login Form */}
          <div className="bg-white rounded-3xl p-10 shadow-2xl">
            {/* Logo inside form */}
            <div className="text-center mb-6 sm:mb-8">
              <Link to="/" className="inline-block">
                <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-2">
                  <img 
                    src="/skillar-favicon.svg" 
                    alt="SKILLAR Logo" 
                    className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto flex-shrink-0 object-contain" 
                  />
                  <h1 
                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold flex-shrink-0 whitespace-nowrap" 
                    style={{ fontFamily: 'Ubuntu, sans-serif', fontWeight: 900, lineHeight: '1' }}
                  >
                    <span style={{ color: '#032757' }}>skillar</span>
                    <span style={{ color: '#528fcd' }}>Tutor</span>
                  </h1>
                </div>
              </Link>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-6">Đăng nhập</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhập địa chỉ email của bạn
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhập mật khẩu của bạn
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 px-4 py-3 pr-12 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-lg font-bold text-center transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang đăng nhập...</span>
                  </div>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>

          </div>

          <div className="text-center mt-6">
            <Link to="/" className="text-white hover:text-white/80 text-sm font-medium inline-flex items-center space-x-1 group">
              <span>←</span>
              <span className="group-hover:underline">Quay lại trang chủ</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

