import { Home, Users, Calendar, CheckSquare, FileText } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface TutorSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

interface MenuItem {
  id: string
  label: string
  icon: LucideIcon
}

export default function TutorSidebar({ activeSection, onSectionChange }: TutorSidebarProps) {
  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'students', label: 'Quản lý học sinh', icon: Users },
    { id: 'schedule', label: 'Lịch dạy', icon: Calendar },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare },
    { id: 'reports', label: 'Báo cáo', icon: FileText },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 z-40 flex-col">
        <div className="p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Menu</h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto bg-white">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>
                  {item.label}
                </span>
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
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-600'}`}>
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

