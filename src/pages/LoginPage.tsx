import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, Mail, Lock } from 'lucide-react'
import VideoBackground from '../components/VideoBackground'
import Navbar from '../components/Navbar'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      // Redirect based on role
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (user.role === 'student' || user.role === 'parent') {
        navigate('/student')
      } else if (user.role === 'tutor') {
        navigate('/tutor')
      } else if (user.role === 'teacher') {
        navigate('/teacher')
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

      {/* Navbar */}
      <Navbar variant="home" showSearch={false} showNavLinks={true} />

      <div className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block transform hover:scale-105 transition-transform duration-200">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl animate-float">
              <span className="text-white font-bold text-4xl">S</span>
            </div>
          </Link>
          <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">SKILLAR</h1>
          <p className="text-white/90 font-medium drop-shadow-md">Where Growth Begins</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900/90 backdrop-blur-lg rounded-2xl p-6 lg:p-8 shadow-2xl border border-white/10">
          <div className="w-full bg-white text-primary-600 px-6 py-3 rounded-lg font-bold mb-6 text-center">
            Đăng nhập
          </div>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2.5 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="relative">
                <Mail className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-sm text-white/80 text-center mb-3 font-medium">Demo Accounts:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['student@skillar.com', 'tutor@skillar.com', 'admin@skillar.com'].map((email) => (
                <button
                  key={email}
                  onClick={() => setEmail(email)}
                  className="text-xs bg-white/10 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/20"
                >
                  {email.split('@')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-white/90 hover:text-white text-sm font-medium inline-flex items-center space-x-1 group drop-shadow-md">
            <span>←</span>
            <span className="group-hover:underline">Quay lại trang chủ</span>
          </Link>
        </div>
        </div>
      </div>
    </div>
  )
}

