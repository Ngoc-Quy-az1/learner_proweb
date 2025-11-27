import { cloneElement, isValidElement, ReactElement, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LogOut, Menu, User } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
}

export default function Layout({ children, sidebar }: LayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      student: 'Học sinh',
      parent: 'Phụ huynh',
      tutor: 'Tutor',
      teacher: 'Giáo viên bộ môn',
      admin: 'Admin',
    }
    return roles[role] || role
  }

  const sidebarWithProps = sidebar && isValidElement(sidebar)
    ? cloneElement(sidebar as ReactElement<any>, {
        isCollapsed: isSidebarCollapsed,
        onToggleCollapse: () => setIsSidebarCollapsed(prev => !prev),
        isMobileMenuOpen,
        onCloseMobileMenu: () => setIsMobileMenuOpen(false),
      })
    : sidebar

  const sidebarPaddingClass = sidebar
    ? (isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72')
    : ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      {sidebarWithProps}

      {/* Mobile overlay for menu */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
      
      {/* Container for header and main content */}
      <div>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="w-full px-2 sm:px-3 lg:px-4">
            <div className="flex items-center justify-between h-24">
              <div className="flex items-center space-x-2">
                {sidebar && (
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        setIsMobileMenuOpen(prev => !prev)
                      } else {
                        setIsSidebarCollapsed(prev => !prev)
                      }
                    }}
                    className="w-11 h-11 rounded-2xl border border-gray-200 flex items-center justify-center text-gray-600 hover:text-primary-600 hover:border-primary-300 transition-colors -ml-2"
                    aria-label={isSidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
                  >
                    <Menu className={`w-5 h-5 transition-transform ${isSidebarCollapsed ? 'scale-110' : ''}`} />
                  </button>
                )}
                <div className="flex items-center space-x-2">
                  <img src="/skillar-favicon.svg" alt="SKILLAR Logo" className="h-12 w-auto" />
                  <span className="text-2xl sm:text-3xl md:text-4xl" style={{ fontFamily: 'Ubuntu, sans-serif', fontWeight: 700 }}>
                    <span style={{ color: '#032757' }}>skillar</span>
                    <span style={{ color: '#528fcd' }}>Tutor</span>
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-base">
                    <div className="font-semibold text-gray-900 text-sm">{user?.name}</div>
                    <div className="text-sm text-gray-600">{getRoleName(user?.role || '')}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 px-4 py-2.5 rounded-xl hover:bg-primary-50 transition-all duration-200 font-medium border border-gray-200 hover:border-primary-300 text-base"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={`${sidebarPaddingClass} bg-gray-50`}>
          <div className="w-full min-h-[calc(100vh-6rem)] px-2 sm:px-3 lg:px-4 py-4 text-[17px] leading-relaxed">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

