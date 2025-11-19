import { Home, Users, Calendar, CheckSquare, Menu } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface TutorSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

interface MenuItem {
  id: string
  label: string
  icon: LucideIcon
}

export default function TutorSidebar({ activeSection, onSectionChange, isCollapsed = false, onToggleCollapse }: TutorSidebarProps) {
  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'students', label: 'Quản lý học sinh', icon: Users },
    { id: 'schedule', label: 'Lịch dạy', icon: Calendar },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex fixed left-0 top-0 h-screen ${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 z-40 flex-col`}>
        <div className={`border-b border-gray-200 bg-white flex items-center ${isCollapsed ? 'px-3' : 'px-6'} justify-between py-5`}>
          <div className="flex items-center space-x-2">
            <img src="/skillar-favicon.svg" alt="SKILLAR Logo" className="h-10 w-auto" />
            {!isCollapsed && (
              <div>
                <p className="text-lg font-semibold leading-tight font-display">
                  <span style={{ color: '#528fcd' }}>skillar</span>
                  <span style={{ color: '#032757' }}>Tutor</span>
                </p>
                <p className="text-xs text-gray-500">Dashboard Tutor</p>
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
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            const isChecklist = item.id === 'checklist'
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? isChecklist
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-200'
                      : 'bg-primary-500 text-white shadow-md'
                    : isChecklist
                      ? 'text-gray-700 hover:bg-primary-50 hover:text-primary-600 border border-transparent hover:border-primary-200'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : isChecklist ? 'text-primary-600' : 'text-gray-500'}`} />
                {!isCollapsed && (
                  <span className={`font-medium ${isActive ? 'text-white' : isChecklist ? 'text-gray-900' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 z-40 shadow-lg">
        <nav className="flex justify-around items-center px-2 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            const isChecklist = item.id === 'checklist'
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? isChecklist
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-primary-500 text-white'
                    : isChecklist
                      ? 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
                      : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-white' : isChecklist ? 'text-primary-600' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-white' : isChecklist ? 'text-gray-900' : 'text-gray-600'}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    </>
  )
}

