import { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  gradient: string
}

export default function StatCard({ label, value, icon, gradient }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex flex-col items-center text-center">
        <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg mb-3`}>
          {icon}
        </div>
        <p className="text-xs text-gray-600 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

