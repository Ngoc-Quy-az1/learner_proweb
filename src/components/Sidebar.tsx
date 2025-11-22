import { Home, Calendar, CheckSquare, BookOpen, TrendingUp, Menu } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  isMobileMenuOpen?: boolean
  onCloseMobileMenu?: () => void
}

interface MenuItem {
  id: string
  label: string
  icon: LucideIcon
}

export default function Sidebar({
  activeSection,
  onSectionChange,
  isCollapsed = false,
  onToggleCollapse,
  isMobileMenuOpen = false,
  onCloseMobileMenu
}: SidebarProps) {
  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'schedule', label: 'Lịch học', icon: Calendar },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare },
    { id: 'analytics', label: 'Thống kê', icon: TrendingUp },
    { id: 'homework', label: 'Bài tập về nhà', icon: BookOpen },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex fixed left-0 top-0 h-screen ${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 z-40 flex-col transition-all duration-300`}>
        <div className={`border-b border-gray-200 bg-white flex items-center ${isCollapsed ? 'px-3' : 'px-6'} justify-between py-5`}>
          <div className="flex items-center space-x-2">
            <img src="/skillar-favicon.svg" alt="SKILLAR Logo" className="h-10 w-auto" />
            {!isCollapsed && (
              <div>
                <p className="text-3xl leading-tight" style={{ fontFamily: 'Ubuntu, sans-serif', fontWeight: 700 }}>
                  <span style={{ color: '#528fcd' }}>skillar</span>
                  <span style={{ color: '#032757' }}>Tutor</span>
                </p>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            )}
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary-600 hover:border-primary-300 transition-colors"
              aria-label={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            >
              <Menu className={`w-4 h-4 transition-transform ${isCollapsed ? 'scale-110' : ''}`} />
            </button>
          )}
        </div>
        
        <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} py-4 space-y-2 overflow-y-auto bg-white`}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                title={item.label}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'space-x-3 px-4'} py-3.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                {!isCollapsed && (
                  <span className={`font-semibold text-base ${isActive ? 'text-white' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Mobile sidebar drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <img src="/skillar-favicon.svg" alt="SKILLAR Logo" className="h-10 w-auto" />
            <span className="text-2xl font-bold" style={{ fontFamily: 'Ubuntu, sans-serif' }}>
              Menu
            </span>
          </div>
          <button
            onClick={onCloseMobileMenu}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:text-primary-600 hover:border-primary-300 transition-colors"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSectionChange(item.id)
                  onCloseMobileMenu && onCloseMobileMenu()
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500 border-primary-500 text-white shadow-lg'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:text-primary-600 hover:border-primary-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span className="font-semibold text-base">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

