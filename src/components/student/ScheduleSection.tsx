import { MonthlyCalendar } from '../dashboard'
import type { ScheduleItem } from '../dashboard'

interface ScheduleSectionProps {
  schedules: ScheduleItem[]
  isLoading: boolean
  error: string | null
  onReload: () => void
  onJoinClass: (scheduleId: string) => void
  onViewChecklist: (scheduleId: string) => void
}

export default function ScheduleSection({
  schedules,
  isLoading,
  error,
  onReload,
  onJoinClass,
  onViewChecklist,
}: ScheduleSectionProps) {
  return (
    <div className="h-full overflow-hidden">
      <div className="h-full flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-sm font-semibold text-gray-500">
            Đang tải lịch học...
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <p className="text-sm font-semibold text-red-500">{error}</p>
            <button
              onClick={onReload}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <MonthlyCalendar
              schedules={schedules}
              onJoinClass={onJoinClass}
              onViewChecklist={onViewChecklist}
            />
            {schedules.length === 0 && !isLoading && (
              <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-100">
                Chưa có lịch học nào được lên lịch.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

