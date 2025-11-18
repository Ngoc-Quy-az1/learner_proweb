import { Link } from 'react-router-dom'
import { Search, LogIn, User } from 'lucide-react'
import Logo from './Logo'

interface NavbarProps {
  variant?: 'home' | 'dashboard'
  showSearch?: boolean
  showNavLinks?: boolean
}

export default function Navbar({ variant = 'home', showSearch = false, showNavLinks = false }: NavbarProps) {
  return (
    <nav className="relative z-50 bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Logo size="md" showTagline={false} taglineColor="white" />
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          {/* Navigation Links */}
          {showNavLinks && (
            <div className="flex items-center space-x-6">
              <Link
                to="/"
                className="text-white/90 hover:text-white font-medium transition-colors"
              >
                Trang chủ
              </Link>
              <Link
                to="/login"
                className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
