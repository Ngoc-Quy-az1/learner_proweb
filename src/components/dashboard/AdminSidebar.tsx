import { Users, UserCog, Calendar, BarChart3, Menu, School } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

export type AdminSection =
  | 'user-management'
  | 'student-management'
  | 'tutor-management'
  | 'schedule-management'
  | 'analytics'

interface AdminSidebarProps {
  activeSection: AdminSection
  onSectionChange: (section: AdminSection) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  isMobileMenuOpen?: boolean
  onCloseMobileMenu?: () => void
}

interface MenuItem {
  id: AdminSection
  label: string
  icon: LucideIcon
}

const menuItems: MenuItem[] = [
  { id: 'user-management', label: 'Quản lý tài khoản', icon: Users },
  { id: 'student-management', label: 'Quản lý học sinh', icon: School },
  { id: 'tutor-management', label: 'Quản lý tutor', icon: UserCog },
  { id: 'schedule-management', label: 'Quản lý lịch dạy', icon: Calendar },
  { id: 'analytics', label: 'Thống kê', icon: BarChart3 },
]

export default function AdminSidebar({
  activeSection,
  onSectionChange,
  isCollapsed = false,
  onToggleCollapse,
  isMobileMenuOpen = false,
  onCloseMobileMenu,
}: AdminSidebarProps) {
  return (
    <>
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-screen ${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 z-40 flex-col`}
      >
        <div className={`border-b border-gray-200 bg-white flex items-center ${isCollapsed ? 'px-3' : 'px-6'} justify-between py-5`}>
          <div className="flex items-center space-x-2">
            <img src="/skillar-favicon.svg" alt="SKILLAR Logo" className="h-10 w-auto" />
            {!isCollapsed && (
              <div>
                <p className="text-xl sm:text-2xl md:text-3xl leading-tight" style={{ fontFamily: 'Ubuntu, sans-serif', fontWeight: 700 }}>
                  <span style={{ color: '#032757' }}>skillar</span>
                  <span style={{ color: '#528fcd' }}>Tutor</span>
                </p>
                <p className="text-xs text-gray-500">Dashboard Admin</p>
              </div>
            )}
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary-600 hover:border-primary-300"
              aria-label={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            >
              <Menu className={`w-4 h-4 ${isCollapsed ? 'scale-110' : ''}`} />
            </button>
          )}
        </div>

        <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} py-4 space-y-2 overflow-y-auto bg-white`}>
          {menuItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id
            return (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-primary-500 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600'
                }`}
                title={isCollapsed ? label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-gray-500'}`} />
                {!isCollapsed && <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>{label}</span>}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <img src="/skillar-favicon.svg" alt="SKILLAR Logo" className="h-10 w-auto" />
            <span className="text-2xl font-bold" style={{ fontFamily: 'Ubuntu, sans-serif' }}>
              Admin Menu
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
          {menuItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id
            return (
              <button
                key={id}
                onClick={() => {
                  onSectionChange(id)
                  onCloseMobileMenu && onCloseMobileMenu()
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500 border-primary-500 text-white shadow-lg'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:text-primary-600 hover:border-primary-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span className="font-semibold text-base">{label}</span>
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

