import { ReactNode } from 'react'

interface InfoCardProps {
  icon: ReactNode
  label: string
  value: string | number
  helper?: string | null
}

export default function InfoCard({ icon, label, value, helper }: InfoCardProps) {
  const displayValue = value === undefined || value === null || value === '' ? 'Chưa cập nhật' : value
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
        <p className="text-sm font-semibold text-gray-900 break-words">{displayValue}</p>
        {helper && <p className="text-xs text-gray-500 break-all">{helper}</p>}
      </div>
    </div>
  )
}

