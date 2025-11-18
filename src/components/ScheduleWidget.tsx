import { Calendar, Video, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

export interface ScheduleItem {
  id: string
  subject: string
  time: string
  date: Date
  meetLink?: string
  tutor?: string
  note?: string
}

interface ScheduleWidgetProps {
  schedules: ScheduleItem[]
  onJoinClass?: (scheduleId: string) => void
}

export default function ScheduleWidget({ schedules, onJoinClass }: ScheduleWidgetProps) {
  const today = new Date()
  const thisWeek = schedules.filter(
    (s) => s.date >= today && s.date <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  )

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      'Toán': { bg: 'bg-gradient-to-r from-blue-500 to-blue-600', text: 'text-white', border: 'border-blue-500' },
      'Lý': { bg: 'bg-gradient-to-r from-purple-500 to-purple-600', text: 'text-white', border: 'border-purple-500' },
      'Hóa': { bg: 'bg-gradient-to-r from-green-500 to-green-600', text: 'text-white', border: 'border-green-500' },
      'Anh': { bg: 'bg-gradient-to-r from-yellow-500 to-yellow-600', text: 'text-white', border: 'border-yellow-500' },
    }
    return colors[subject] || { bg: 'bg-gradient-to-r from-gray-500 to-gray-600', text: 'text-white', border: 'border-gray-500' }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Lịch học tuần này</h2>
            <p className="text-sm text-gray-600">Xem và tham gia các buổi học</p>
          </div>
        </div>
      </div>

      {thisWeek.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Không có lịch học nào trong tuần này</p>
        </div>
      ) : (
        <div className="space-y-4">
          {thisWeek.map((schedule) => {
            const colors = getSubjectColor(schedule.subject)
            return (
              <div
                key={schedule.id}
                className="border-2 border-gray-200 rounded-2xl p-5 hover:shadow-xl hover:border-primary-300 transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-3 mb-3">
                      <span className={`px-4 py-1.5 rounded-xl text-sm font-bold shadow-md ${colors.bg} ${colors.text}`}>
                        {schedule.subject}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">
                        {format(schedule.date, 'EEEE, dd/MM/yyyy')}
                      </span>
                      <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                        {schedule.time}
                      </span>
                    </div>
                    {schedule.tutor && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="font-medium">Tutor:</span>
                        <span>{schedule.tutor}</span>
                      </div>
                    )}
                  </div>
                  {schedule.meetLink && onJoinClass && (
                    <button
                      onClick={() => onJoinClass(schedule.id)}
                      className="btn-primary flex items-center space-x-2 ml-4 whitespace-nowrap"
                    >
                      <Video className="w-4 h-4" />
                      <span>Vào lớp</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

