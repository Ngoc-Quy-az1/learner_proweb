import { cloneElement, isValidElement, ReactElement, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, Menu, User } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  title: string
  sidebar?: React.ReactNode
}

export default function Layout({ children, title, sidebar }: LayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
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
      })
    : sidebar

  const sidebarPaddingClass = sidebar
    ? (isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72')
    : ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      {sidebarWithProps}
      
      {/* Container for header and main content */}
      <div className="transition-all duration-300">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg flex items-center justify-center text-white font-bold text-lg">
                    S
                  </div>
                  <div className="leading-tight">
                    <span className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-400 block">
                      SKILLAR
                    </span>
                    <h1 className="text-lg font-bold text-gray-900">{title}</h1>
                  </div>
                </div>
                {sidebar && (
                  <button
                    onClick={() => setIsSidebarCollapsed(prev => !prev)}
                    className="w-11 h-11 rounded-2xl border border-gray-200 flex items-center justify-center text-gray-600 hover:text-primary-600 hover:border-primary-300 transition-colors ml-4"
                    aria-label={isSidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
                  >
                    <Menu className={`w-5 h-5 transition-transform ${isSidebarCollapsed ? 'scale-110' : ''}`} />
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold text-gray-900 text-xs">{user?.name}</div>
                    <div className="text-xs text-gray-600">{getRoleName(user?.role || '')}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 px-3 py-2 rounded-xl hover:bg-primary-50 transition-all duration-200 font-medium border border-gray-200 hover:border-primary-300 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Fixed height, no page scroll */}
        <main 
          className={`${sidebarPaddingClass} ${sidebar ? 'pb-20 lg:pb-0' : ''} bg-gray-50 overflow-hidden`}
          style={{ height: 'calc(100vh - 5rem)' }}
        >
          <div className="w-full h-full px-4 sm:px-6 lg:px-8 py-2 overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

