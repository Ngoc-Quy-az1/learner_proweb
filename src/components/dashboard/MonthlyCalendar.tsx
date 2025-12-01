import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Filter, Play, Copy, Check, Mail, Phone, Users, FileText as FileTextIcon } from 'lucide-react'
import { ScheduleItem } from './ScheduleWidget'

interface TutorInfo {
  id: string
  name?: string
  email?: string
  phone?: string
  address?: string
  avatarUrl?: string
  cvUrl?: string
  moreInfo?: string
  currentLevel?: string
  qualification?: string
  experience?: string
  specialties?: string[]
  subjects?: string[]
  totalStudents?: number
  bio?: string
  rating?: number
}

interface MonthlyCalendarProps {
  schedules: ScheduleItem[]
  onJoinClass?: (scheduleId: string) => void
  onViewChecklist?: (scheduleId: string) => void
  tutorInfoMap?: Record<string, TutorInfo>
}

const SCHEDULES_PER_DAY = 4

// Component for copy link button with feedback
const CopyLinkButton = ({ link }: { link: string }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2.5 rounded-lg transition-colors"
      title={copied ? "Đã copy!" : "Copy link"}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  )
}

export default function MonthlyCalendar({ schedules, onJoinClass, tutorInfoMap = {} }: MonthlyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [schedulePages, setSchedulePages] = useState<Record<string, number>>({})
  const [selectedTutorSchedule, setSelectedTutorSchedule] = useState<string | null>(null)

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

  const getScheduleStatus = (schedule: ScheduleItem, date: Date) => {
    const statusMap: Record<'upcoming' | 'ongoing' | 'completed' | 'cancelled', { label: string; color: string }> = {
      upcoming: { label: 'Sắp tới', color: 'bg-blue-100 text-blue-700' },
      ongoing: { label: 'Đang diễn ra', color: 'bg-green-100 text-green-700' },
      completed: { label: 'Đã kết thúc', color: 'bg-gray-100 text-gray-600' },
      cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
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

  const isNearStartTime = (schedule: ScheduleItem, date: Date, minutesThreshold: number = 15) => {
    const status = schedule.status || 'upcoming'
    if (status === 'completed') return false
    
    const now = new Date()
    const [startTime] = schedule.time.split(' - ')
    const [startHour, startMinute] = startTime.split(':').map(Number)
    
    const startDateTime = new Date(date)
    startDateTime.setHours(startHour, startMinute, 0, 0)
    
    const diffMinutes = (startDateTime.getTime() - now.getTime()) / (1000 * 60)
    return diffMinutes > 0 && diffMinutes <= minutesThreshold
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
          <h2 className="text-2xl md:text-3xl font-bold">Lịch học</h2>
          <button className="hover:bg-primary-700 rounded p-1 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 overflow-hidden">
        {/* Left: Calendar */}
        <div className="w-full lg:w-1/2 flex-shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 pb-4 lg:pb-0 lg:pr-4">
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
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">
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
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-base md:text-lg font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {daysInMonth.map((day) => {
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const hasEvents = hasEvent(day)
                const isToday = isSameDay(day, new Date())

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`relative h-16 rounded-lg transition-all ${
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
                      <span className="text-lg md:text-xl font-semibold">{format(day, 'd')}</span>
                      {hasEvents && isCurrentMonth && (
                        <div className={`absolute bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full ${
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
        <div className="w-full lg:w-1/2 overflow-y-auto min-h-[780px] mt-2 lg:mt-0 flex flex-col">
          {selectedDate ? (
            <div>
              <h4 className="text-lg font-bold text-gray-1200 mb-4">
                Ngày {format(selectedDate, 'dd')} tháng {format(selectedDate, 'MM')}
              </h4>
              <div className="space-y-3">
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
                    const nearStart = isNearStartTime(schedule, selectedDate)
                    const getSubjectColor = (subject: string) => {
                      if (!subject) return null
                      const colors: Record<string, { bg: string; text: string }> = {
                        'Toán': { bg: 'bg-blue-500', text: 'text-white' },
                        'Lý': { bg: 'bg-green-500', text: 'text-white' },
                        'Hóa': { bg: 'bg-purple-500', text: 'text-white' },
                        'Anh': { bg: 'bg-yellow-500', text: 'text-white' },
                        'Văn': { bg: 'bg-pink-500', text: 'text-white' },
                        'Sinh': { bg: 'bg-teal-500', text: 'text-white' },
                      }
                      return colors[subject] || null
                    }
                    const subjectColor = getSubjectColor(schedule.subject)
                    const showSubject = schedule.subject && schedule.subject.trim() !== ''
                    
                    return (
                      <div
                        key={schedule.id}
                        className="bg-white rounded-xl p-4 sm:p-5 border-2 border-gray-200 hover:border-primary-400 hover:shadow-lg transition-all"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {showSubject && subjectColor && (
                                <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold ${subjectColor.bg} ${subjectColor.text} shadow-sm`}>
                                  {schedule.subject}
                                </span>
                              )}
                              <span className={`text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full ${statusInfo.color} ${
                                nearStart && statusInfo.status === 'upcoming' ? 'animate-pulse' : ''
                              }`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-3xl sm:text-4xl font-bold text-primary-600">{schedule.time}</span>
                            </div>
                          </div>
                          <div className="flex flex-col lg:items-end gap-3 w-full lg:w-auto">
                            {(() => {
                              // Ưu tiên lấy tên tutor từ tutorInfoMap nếu có tutorId
                              let displayTutorName = schedule.tutor
                              if (schedule.tutorId && tutorInfoMap[schedule.tutorId]) {
                                displayTutorName = tutorInfoMap[schedule.tutorId].name || schedule.tutor
                              }
                              const canViewTutorDetail = Boolean(schedule.tutorId)
                              return displayTutorName ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (schedule.tutorId) {
                                      setSelectedTutorSchedule(schedule.id)
                                    }
                                  }}
                                  disabled={!canViewTutorDetail}
                                  className={`text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-left lg:text-right hover:text-primary-600 transition-colors break-words ${
                                    canViewTutorDetail ? 'cursor-pointer' : 'cursor-default'
                                  }`}
                                >
                                  {displayTutorName}
                                </button>
                              ) : null
                            })()}
                            {schedule.meetLink && onJoinClass && statusInfo.status !== 'completed' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onJoinClass(schedule.id)
                                  }}
                                  className="w-full lg:w-auto lg:min-w-[160px] bg-primary-500 hover:bg-primary-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                                >
                                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                                  <span>Vào lớp</span>
                                </button>
                                <div className="flex items-center gap-2 w-full">
                                  <input
                                    type="text"
                                    value={schedule.meetLink}
                                    readOnly
                                    className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 truncate"
                                  />
                                  <CopyLinkButton link={schedule.meetLink || ''} />
                                </div>
                              </>
                            )}
                          </div>
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

      {/* Tutor Detail Modal */}
      {selectedTutorSchedule && (() => {
        const schedule = schedules.find((s) => s.id === selectedTutorSchedule)
        if (!schedule || !schedule.tutorId) return null
        const tutorProfile = tutorInfoMap[schedule.tutorId]
        const displayTutorName = tutorProfile?.name || schedule.tutor || 'Tutor đang được cập nhật'
        const tutorInitial = displayTutorName.charAt(0)?.toUpperCase() || 'T'

        return (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
            onClick={() => setSelectedTutorSchedule(null)}
          >
            <div
              className="bg-white rounded-2xl sm:rounded-[32px] shadow-2xl max-w-4xl w-full max-h-[96vh] sm:max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between z-10">
                <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">Thông tin chi tiết Tutor</h2>
                <button
                  onClick={() => setSelectedTutorSchedule(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
                >
                  <span className="text-xl sm:text-2xl">&times;</span>
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="border-b border-gray-200 pb-2"></div>

                {tutorProfile ? (
                  <>
                    {/* Main Profile Card */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 border border-gray-100 rounded-2xl sm:rounded-3xl bg-gray-50 p-4 sm:p-6">
                      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-primary-100 shadow-lg flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-600 text-white text-2xl sm:text-4xl font-bold flex items-center justify-center">
                        {tutorProfile.avatarUrl ? (
                          <img src={tutorProfile.avatarUrl} alt={displayTutorName} className="w-full h-full object-cover" />
                        ) : (
                          tutorInitial
                        )}
                      </div>
                      <div className="flex-1 space-y-1 sm:space-y-2 text-center sm:text-left">
                        <p className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-[0.2em]">TUTOR</p>
                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 break-words">{displayTutorName}</h3>
                        <p className="text-base sm:text-lg text-gray-500">{tutorProfile.qualification || tutorProfile.currentLevel || 'Tutor LearnerPro'}</p>
                      </div>
                    </div>

                    {/* Kinh nghiệm và Liên hệ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {/* Kinh nghiệm */}
                      <div className="p-4 sm:p-5 border rounded-xl sm:rounded-2xl bg-white shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em] mb-2">KINH NGHIỆM</p>
                        <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">{tutorProfile.experience || 'Chưa cập nhật'}</p>
                      </div>
                      
                      {/* Liên hệ */}
                      <div className="p-4 sm:p-5 border rounded-xl sm:rounded-2xl bg-white shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em] mb-2">LIÊN HỆ</p>
                        <div className="space-y-1">
                          {tutorProfile.email && (
                            <div className="flex items-start sm:items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                              <p className="text-sm sm:text-base font-semibold text-gray-900 break-all">{tutorProfile.email}</p>
                            </div>
                          )}
                          {tutorProfile.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <p className="text-sm sm:text-base font-semibold text-gray-900 break-all">{tutorProfile.phone}</p>
                            </div>
                          )}
                          {!tutorProfile.email && !tutorProfile.phone && (
                            <p className="text-sm sm:text-base font-semibold text-gray-900">Chưa cập nhật</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Môn phụ trách, Chuyên môn, Tổng học viên */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      {/* Môn phụ trách */}
                      <div className="p-4 sm:p-5 border rounded-xl sm:rounded-2xl bg-white shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em] mb-2 sm:mb-3">MÔN PHỤ TRÁCH</p>
                        <div className="flex flex-wrap gap-2">
                          {tutorProfile.subjects && tutorProfile.subjects.length > 0 ? (
                            tutorProfile.subjects.map((subject, idx) => (
                              <span
                                key={idx}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold text-white bg-purple-500"
                              >
                                {subject}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm sm:text-base font-semibold text-gray-900">{schedule.subject || 'Chưa cập nhật'}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Chuyên môn */}
                      <div className="p-4 sm:p-5 border rounded-xl sm:rounded-2xl bg-white shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em] mb-2 sm:mb-3">CHUYÊN MÔN</p>
                        <div className="flex flex-wrap gap-2">
                          {tutorProfile.specialties && tutorProfile.specialties.length > 0 ? (
                            tutorProfile.specialties.map((specialty, idx) => (
                              <span
                                key={idx}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold text-white bg-yellow-500"
                              >
                                {specialty}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm sm:text-base font-semibold text-gray-900">
                              {tutorProfile.qualification || 'Chưa cập nhật'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Tổng học viên */}
                      <div className="p-4 sm:p-5 border rounded-xl sm:rounded-2xl bg-white shadow-sm sm:col-span-2 md:col-span-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em] mb-2 sm:mb-3">TỔNG HỌC VIÊN</p>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0" />
                          <p className="text-sm sm:text-base font-semibold text-gray-900">
                            {typeof tutorProfile.totalStudents === 'number' ? tutorProfile.totalStudents : 0} học viên đã dạy
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Hồ sơ & CV và Giới thiệu */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {/* Hồ sơ & CV */}
                      <div className="p-4 sm:p-5 border rounded-xl sm:rounded-2xl bg-white shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em] mb-2 sm:mb-3">HỒ SƠ & CV</p>
                        {tutorProfile.cvUrl ? (
                          <a
                            href={tutorProfile.cvUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-primary-600 hover:text-primary-700"
                          >
                            <FileTextIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                            <span>Xem CV</span>
                          </a>
                        ) : (
                          <p className="text-sm sm:text-base font-semibold text-gray-900">Chưa cập nhật</p>
                        )}
                      </div>

                      {/* Giới thiệu */}
                      <div className="p-4 sm:p-5 border rounded-xl sm:rounded-2xl bg-white shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em] mb-2 sm:mb-3">GIỚI THIỆU</p>
                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                          {tutorProfile.bio || tutorProfile.moreInfo || 'Thông tin đang được bổ sung.'}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 border border-dashed border-gray-300 rounded-xl sm:rounded-2xl bg-gray-50 text-sm text-gray-600">
                    Hệ thống đang cập nhật thông tin chi tiết của tutor này.
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

