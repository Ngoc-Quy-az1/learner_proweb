import { Video, CheckSquare, Copy } from 'lucide-react'
import { format, addDays, isSameDay } from 'date-fns'
import { ScheduleItem } from './ScheduleWidget'

interface WeeklyCalendarProps {
  schedules: ScheduleItem[]
  onJoinClass?: (scheduleId: string) => void
  onViewChecklist?: (scheduleId: string) => void
}

interface ScheduleWithPosition extends ScheduleItem {
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  duration: number
  top: number
  height: number
}

export default function WeeklyCalendar({ schedules, onJoinClass, onViewChecklist }: WeeklyCalendarProps) {
  const today = new Date()
  // Only show 5 days: today + next 4 days
  const daysToShow = Array.from({ length: 5 }, (_, i) => addDays(today, i))
  
  // Time slots from 8:00 to 22:00 (every hour)
  const timeSlots = Array.from({ length: 15 }, (_, i) => i + 8) // 8 to 22
  
  // Process schedules with position data - exact time positioning
  const processSchedulesForDay = (date: Date): ScheduleWithPosition[] => {
    return schedules
      .filter(schedule => isSameDay(schedule.date, date))
      .map(schedule => {
        const [startTime, endTime] = schedule.time.split(' - ')
        const [startHour, startMinute] = startTime.split(':').map(Number)
        const [endHour, endMinute] = endTime.split(':').map(Number)
        
        const startTotalMinutes = startHour * 60 + startMinute
        const endTotalMinutes = endHour * 60 + endMinute
        const duration = endTotalMinutes - startTotalMinutes
        
        // Calculate position: each hour = 60px, each minute = 1px
        // Offset from 8:00 (480 minutes = 8 * 60)
        const top = (startTotalMinutes - 8 * 60) // in pixels (1 minute = 1px)
        const height = duration
        
        return {
          ...schedule,
          startHour,
          startMinute,
          endHour,
          endMinute,
          duration,
          top,
          height,
        }
      })
      .sort((a, b) => a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute))
  }
  
  // Group schedules by date
  const getSchedulesForDay = (date: Date) => {
    return processSchedulesForDay(date)
  }
  
  const getSubjectColor = (subject: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      'Toán': { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-600' },
      'Lý': { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600' },
      'Hóa': { bg: 'bg-green-500', text: 'text-white', border: 'border-green-600' },
      'Anh': { bg: 'bg-yellow-500', text: 'text-white', border: 'border-yellow-600' },
    }
    return colors[subject] || { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-600' }
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header - Days (5 days) */}
      <div className="flex-shrink-0 w-full">
        <div className="grid grid-cols-6 gap-2 mb-2 px-4">
          {/* Time column header */}
          <div className="sticky left-0 z-10 bg-gray-50 p-2 border-r-2 border-gray-300"></div>
          
          {daysToShow.map((day) => {
            const isTodayDate = isSameDay(day, today)
            const daySchedules = schedules.filter(s => isSameDay(s.date, day))
            
            return (
              <div
                key={day.toISOString()}
                className={`text-center p-3 rounded-lg border-2 transition-all ${
                  isTodayDate
                    ? 'bg-primary-50 border-primary-500 shadow-md'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`text-xs font-semibold mb-1 ${isTodayDate ? 'text-primary-600' : 'text-gray-500'}`}>
                  {format(day, 'EEE')}
                </div>
                <div className={`text-lg font-bold ${isTodayDate ? 'text-primary-700' : 'text-gray-900'}`}>
                  {format(day, 'dd')}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {daySchedules.length} buổi
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Calendar body - Fixed height with internal scroll */}
      <div className="flex-1 relative border-2 border-gray-200 rounded-lg overflow-y-auto overflow-x-hidden mx-4 mb-4 min-h-0">
          <div className="grid grid-cols-6 gap-2" style={{ height: '900px' }}>
            {/* Time column */}
            <div className="sticky left-0 z-10 bg-white border-r-2 border-gray-300">
              {timeSlots.map((hour) => (
                <div
                  key={hour}
                  className="h-15 border-b border-gray-200 p-2 text-xs text-gray-600 font-medium flex items-start justify-end pr-2"
                  style={{ height: '60px' }}
                >
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>
            
            {/* Day columns */}
            {daysToShow.map((day) => {
              const isTodayDate = isSameDay(day, today)
              const daySchedules = getSchedulesForDay(day)
              
              return (
                <div
                  key={day.toISOString()}
                  className={`relative border-l border-r border-gray-200 ${
                    isTodayDate ? 'bg-blue-50/30' : 'bg-white'
                  }`}
                >
                  {/* Hour slots */}
                  {timeSlots.map((hour) => (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className="border-b border-gray-200"
                      style={{ height: '60px' }}
                    />
                  ))}
                  
                  {/* Schedule events positioned exactly by time */}
                  {daySchedules.map((schedule) => {
                    const colors = getSubjectColor(schedule.subject)
                    const [startTime] = schedule.time.split(' - ')
                    
                    return (
                      <div
                        key={schedule.id}
                        className={`absolute left-1 right-1 ${colors.bg} ${colors.text} rounded-lg p-2 shadow-sm border-l-4 ${colors.border} hover:shadow-lg transition-all cursor-pointer z-20 overflow-hidden group`}
                        style={{
                          top: `${schedule.top}px`,
                          height: `${Math.max(schedule.height, 60)}px`,
                          minHeight: '60px',
                        }}
                        onClick={() => {
                          if (schedule.meetLink && onJoinClass) {
                            onJoinClass(schedule.id)
                          }
                        }}
                      >
                        {/* Compact display: Subject + Time */}
                        <div className="flex flex-col h-full justify-center">
                          <div className="font-bold text-sm leading-tight truncate mb-0.5">
                            {schedule.subject}
                          </div>
                          <div className="text-xs opacity-90 leading-tight truncate">
                            {startTime}
                          </div>
                        </div>
                        
                        {/* Hover overlay with actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2 p-2">
                          {schedule.meetLink && onJoinClass && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onJoinClass(schedule.id)
                              }}
                              className="bg-white text-gray-900 text-xs font-medium py-1.5 px-3 rounded flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
                            >
                              <Video className="w-3.5 h-3.5" />
                              Vào lớp
                            </button>
                          )}
                          
                          {onViewChecklist && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onViewChecklist(schedule.id)
                              }}
                              className="bg-white text-gray-900 text-xs font-medium py-1.5 px-3 rounded flex items-center gap-1.5 hover:bg-gray-100 transition-colors"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              Checklist
                            </button>
                          )}
                          
                          {schedule.meetLink && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                navigator.clipboard.writeText(schedule.meetLink || '')
                              }}
                              className="bg-white/90 text-gray-900 text-xs font-medium py-1 px-2 rounded flex items-center gap-1 hover:bg-white transition-colors"
                              title="Copy link"
                            >
                              <Copy className="w-3 h-3" />
                              Copy link
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
    </div>
  )
}

