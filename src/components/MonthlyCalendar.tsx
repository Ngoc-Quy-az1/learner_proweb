import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Filter, Play } from 'lucide-react'
import { ScheduleItem } from './ScheduleWidget'

interface MonthlyCalendarProps {
  schedules: ScheduleItem[]
  onJoinClass?: (scheduleId: string) => void
  onViewChecklist?: (scheduleId: string) => void
}

const SCHEDULES_PER_DAY = 5

export default function MonthlyCalendar({ schedules, onJoinClass }: MonthlyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [schedulePages, setSchedulePages] = useState<Record<string, number>>({})

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Sunday = 0
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const daysInMonth = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  
  const getSchedulesForDate = (date: Date) => {
    return schedules.filter(schedule => isSameDay(schedule.date, date))
  }

  const hasEvent = (date: Date) => {
    return getSchedulesForDate(date).length > 0
  }

  const getSelectedDateSchedules = () => {
    if (!selectedDate) return []
    return getSchedulesForDate(selectedDate).sort((a, b) => {
      const [aStart] = a.time.split(' - ')
      const [bStart] = b.time.split(' - ')
      return aStart.localeCompare(bStart)
    })
  }

  const getWeekNumber = (date: Date) => {
    // Calculate week number in semester (assuming semester starts in September)
    const semesterStart = new Date(date.getFullYear(), 8, 1) // September 1
    const daysDiff = Math.floor((date.getTime() - semesterStart.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(1, Math.ceil(daysDiff / 7) + 1)
  }

  const getScheduleStatus = (schedule: ScheduleItem, date: Date) => {
    const statusMap: Record<'upcoming' | 'ongoing' | 'completed', { label: string; color: string }> = {
      upcoming: { label: 'Sắp tới', color: 'bg-blue-100 text-blue-700' },
      ongoing: { label: 'Đang diễn ra', color: 'bg-green-100 text-green-700' },
      completed: { label: 'Đã kết thúc', color: 'bg-gray-100 text-gray-600' },
    }

    if (schedule.status && statusMap[schedule.status]) {
      const config = statusMap[schedule.status]
      return { status: schedule.status, label: config.label, color: config.color }
    }

    const now = new Date()
    const [startTime, endTime] = schedule.time.split(' - ')
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)
    
    const startDateTime = new Date(date)
    startDateTime.setHours(startHour, startMinute, 0, 0)
    
    const endDateTime = new Date(date)
    endDateTime.setHours(endHour, endMinute, 0, 0)
    
    if (now < startDateTime) {
      return { status: 'upcoming', ...statusMap.upcoming }
    } else if (now >= startDateTime && now <= endDateTime) {
      return { status: 'ongoing', ...statusMap.ongoing }
    } else {
      return { status: 'completed', ...statusMap.completed }
    }
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  useEffect(() => {
    if (!selectedDate) return
    const key = format(selectedDate, 'yyyy-MM-dd')
    const schedulesForDay = getSelectedDateSchedules()
    const totalPages = Math.max(1, Math.ceil(schedulesForDay.length / SCHEDULES_PER_DAY))
    setSchedulePages((prev) => {
      const current = prev[key] || 1
      const next = Math.min(current, totalPages)
      if (current === next) return prev
      return { ...prev, [key]: next }
    })
  }, [selectedDate, schedules])

  return (
    <div className="flex flex-col h-full min-h-[900px] bg-white">
      {/* Header */}
      <div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <button className="hover:bg-primary-700 rounded p-1 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-bold">Lịch học</h2>
          <button className="hover:bg-primary-700 rounded p-1 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 overflow-hidden">
        {/* Left: Calendar */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 pb-4 lg:pb-0 lg:pr-4">
          {/* Calendar Grid */}
          <div className="flex-1 min-h-0">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="hover:bg-gray-100 rounded p-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <h3 className="text-sm font-semibold text-gray-900">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="hover:bg-gray-100 rounded p-1 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Day names header */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-[10px] font-semibold text-gray-600 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-0.5">
              {daysInMonth.map((day) => {
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const hasEvents = hasEvent(day)
                const isToday = isSameDay(day, new Date())

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`relative h-8 rounded transition-all ${
                      !isCurrentMonth
                        ? 'text-gray-300'
                        : isSelected
                        ? 'bg-primary-600 text-white font-bold'
                        : isToday
                        ? 'bg-primary-50 text-gray-900 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className="text-xs">{format(day, 'd')}</span>
                      {hasEvents && isCurrentMonth && (
                        <div className={`absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-primary-500'
                        }`}></div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="flex-1 overflow-y-auto min-h-[780px] mt-2 lg:mt-0 flex flex-col">
          {selectedDate ? (
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-3">
                Ngày {format(selectedDate, 'dd')} tháng {format(selectedDate, 'MM')}
              </h4>
              <div className="space-y-2">
                {getSelectedDateSchedules().length > 0 ? (() => {
                  const schedulesForDay = getSelectedDateSchedules()
                  const key = format(selectedDate, 'yyyy-MM-dd')
                  const totalPages = Math.max(1, Math.ceil(schedulesForDay.length / SCHEDULES_PER_DAY))
                  const currentPage = Math.min(schedulePages[key] || 1, totalPages)
                  const startIndex = (currentPage - 1) * SCHEDULES_PER_DAY
                  const paginatedSchedules = schedulesForDay.slice(startIndex, startIndex + SCHEDULES_PER_DAY)

                  const handleChangePage = (newPage: number) => {
                    setSchedulePages((prev) => ({
                      ...prev,
                      [key]: Math.max(1, Math.min(totalPages, newPage)),
                    }))
                  }

                  return (
                    <>
                      {paginatedSchedules.map((schedule) => {
                    const statusInfo = getScheduleStatus(schedule, selectedDate)
                    return (
                      <div
                        key={schedule.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {schedule.tutor && (
                                <div className="text-sm font-semibold text-gray-900">
                                  {schedule.tutor}
                                </div>
                              )}
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <div className="text-sm text-gray-700">
                              {schedule.subject}
                            </div>
                            <div className="text-xs text-gray-600">
                              Tuần {getWeekNumber(selectedDate)}
                            </div>
                            {schedule.note && (
                              <div className="text-xs text-gray-600">
                                {schedule.note}
                              </div>
                            )}
                          </div>
                          {schedule.meetLink && onJoinClass && statusInfo.status !== 'completed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onJoinClass(schedule.id)
                              }}
                              className="flex-shrink-0 bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm hover:shadow-md"
                            >
                              <Play className="w-3 h-3" />
                              <span>Vào lớp</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}

                      {schedulesForDay.length > SCHEDULES_PER_DAY && (
                        <div className="sticky bottom-0 bg-white pt-3 mt-3 border-t border-gray-200 flex items-center justify-between text-xs font-semibold text-gray-700">
                          <button
                            onClick={() => handleChangePage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Trước
                          </button>
                          <span>
                            Trang {currentPage}/{totalPages}
                          </span>
                          <button
                            onClick={() => handleChangePage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Sau
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )
                })() : (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    Không có lịch học trong ngày này
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              Chọn ngày để xem chi tiết
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

