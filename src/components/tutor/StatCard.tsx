import { ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  helper?: string
}

export default function StatCard({ icon, label, value, helper }: StatCardProps) {
  return (
    <div className="p-4 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 shadow-sm">
      <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-inner mb-2">
        {icon}
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-xl font-extrabold text-gray-900">{value}</p>
      {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
    </div>
  )
}

