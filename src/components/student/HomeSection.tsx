import { useState, useMemo, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import {
  UserCircle,
  Play,
  Target,
  Calendar,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
} from 'lucide-react'
import MaterialUploadSection from './MaterialUploadSection'
import {
  StudentSubjectReviewSection,
  StudentSessionEvaluationSection,
  StudentReportSection,
  ChecklistDetailTable,
  HomeworkDetailTable,
} from './index'
import type { AssignmentApiItem } from '../../pages/TutorDashboard'
import type { ScheduleItem } from '../dashboard'
import type { TutorInfo, ChecklistWithDate } from './types'
import type { HomeworkDetailItem } from './HomeworkDetailTable'
import type { ChecklistDetailItem } from './ChecklistDetailTable'

interface HomeSectionProps {
  todaySchedules: ScheduleItem[]
  tutorInfoMap: Record<string, TutorInfo>
  studentName?: string
  studentEmail?: string
  studentAvatarUrl?: string
  upcomingSchedule?: ScheduleItem | null
  progressPercentage: number
  completedCount: number
  totalCount: number
  scheduleChecklistMap: Record<string, ChecklistWithDate[]>
  homeworkDetailsMap: Record<string, HomeworkDetailItem[]>
  onUploadSuccess: () => void
  onJoinClass: (scheduleId: string) => void
  getScheduleStatus: (schedule: ScheduleItem) => 'ongoing' | 'upcoming' | 'completed'
  getSubjectLabel?: (subjectCode?: string) => string
  assignments?: AssignmentApiItem[]
  scheduleReviews?: Record<string, Array<{ name: string; rating: number; comment: string }>>
  scheduleReports?: Record<string, { id: string; subjectCode: string; startTime: string; tutor: string; reportURL: string } | null>
  assignmentReviews?: Record<string, { reviewId?: string; taskId: string; result: number; comment: string }>
  assignmentReviewsLoading?: boolean
}

type ScheduleSlotGroup = {
  id: string
  time: string
  meetLink?: string
  subjects: string[]
  schedules: ScheduleItem[]
}

const getAssignmentScheduleId = (assignment: AssignmentApiItem): string | undefined => {
  if (typeof assignment.scheduleId === 'string') return assignment.scheduleId
  if (assignment.scheduleId && typeof assignment.scheduleId === 'object') return assignment.scheduleId._id
  return undefined
}

export default function HomeSection({
  todaySchedules,
  tutorInfoMap,
  studentName = 'Học sinh',
  studentEmail,
  studentAvatarUrl,
  upcomingSchedule,
  progressPercentage,
  completedCount,
  totalCount,
  scheduleChecklistMap,
  homeworkDetailsMap,
  onUploadSuccess,
  onJoinClass,
  getScheduleStatus,
  getSubjectLabel,
  assignments = [],
  scheduleReviews = {},
  scheduleReports = {},
  assignmentReviews = {},
  assignmentReviewsLoading = false,
}: HomeSectionProps) {
  const [selectedTutorSchedule, setSelectedTutorSchedule] = useState<string | null>(null)
  const [selectedScheduleSlotId, setSelectedScheduleSlotId] = useState<string | null>(null)
  const [copiedScheduleLink, setCopiedScheduleLink] = useState<string | null>(null)
  const scheduleSlotsScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [showChecklistDetail, setShowChecklistDetail] = useState(false)
  const [showHomeworkDetail, setShowHomeworkDetail] = useState(false)
  const [evaluationExpandedState, setEvaluationExpandedState] = useState<Record<string, boolean>>({})
  const checklistSectionRef = useRef<HTMLDivElement>(null)
  const rightColumnRef = useRef<HTMLDivElement>(null)

  // Đồng hồ thời gian thực cho học sinh
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hours = currentTime.getHours() % 12
  const minutes = currentTime.getMinutes()
  const seconds = currentTime.getSeconds()
  const hourDeg = hours * 30 + minutes * 0.5
  const minuteDeg = minutes * 6
  const secondDeg = seconds * 6

  const hasOngoingSchedule = useMemo(
    () => todaySchedules.some((s) => getScheduleStatus(s) === 'ongoing'),
    [todaySchedules, getScheduleStatus]
  )

  // Tính toán buổi học gần nhất sắp tới và trạng thái nút "Vào lớp học"
  const { canJoinClass, joinClassMessage, nearestSchedule } = useMemo(() => {
    const now = new Date()
    const upcomingSchedules = todaySchedules
      .filter((s) => {
        const status = getScheduleStatus(s)
        return status === 'upcoming' || status === 'ongoing'
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    if (upcomingSchedules.length === 0) {
      // Kiểm tra xem có buổi học đã qua không
      const pastSchedules = todaySchedules
        .filter((s) => getScheduleStatus(s) === 'completed')
        .sort((a, b) => b.date.getTime() - a.date.getTime())
      
      if (pastSchedules.length > 0) {
        return {
          canJoinClass: false,
          joinClassMessage: 'Buổi học đã kết thúc',
          nearestSchedule: null,
        }
      }
      
      return {
        canJoinClass: false,
        joinClassMessage: 'Chưa có buổi học nào',
        nearestSchedule: null,
      }
    }

    const nearest = upcomingSchedules[0]
    
    // Parse time string để lấy startTime
    const timeMatch = nearest.time.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/)
    if (!timeMatch) {
      return {
        canJoinClass: false,
        joinClassMessage: 'Không thể xác định thời gian buổi học',
        nearestSchedule: null,
      }
    }

    const startHour = parseInt(timeMatch[1], 10)
    const startMinute = parseInt(timeMatch[2], 10)
    
    // Tạo Date object cho thời gian bắt đầu buổi học
    const scheduleStartTime = new Date(nearest.date)
    scheduleStartTime.setHours(startHour, startMinute, 0, 0)
    
    // Tính thời gian còn lại đến buổi học (tính bằng phút)
    const minutesUntilStart = (scheduleStartTime.getTime() - now.getTime()) / (1000 * 60)
    
    // Tính thời gian kết thúc buổi học
    const endHour = parseInt(timeMatch[3], 10)
    const endMinute = parseInt(timeMatch[4], 10)
    const scheduleEndTime = new Date(nearest.date)
    scheduleEndTime.setHours(endHour, endMinute, 0, 0)
    const minutesUntilEnd = (scheduleEndTime.getTime() - now.getTime()) / (1000 * 60)
    
    // Kiểm tra các điều kiện
    if (minutesUntilEnd < 0) {
      // Buổi học đã kết thúc
      return {
        canJoinClass: false,
        joinClassMessage: 'Buổi học đã kết thúc',
        nearestSchedule: nearest,
      }
    }
    
    if (minutesUntilStart > 15) {
      // Còn hơn 15 phút mới đến buổi học
      return {
        canJoinClass: false,
        joinClassMessage: 'Buổi học chưa bắt đầu',
        nearestSchedule: nearest,
      }
    }
    
    if (minutesUntilStart < -15) {
      // Đã qua 15 phút từ khi buổi học bắt đầu (có thể đang diễn ra hoặc đã kết thúc)
      if (minutesUntilEnd > 0) {
        // Buổi học đang diễn ra
        return {
          canJoinClass: true,
          joinClassMessage: '',
          nearestSchedule: nearest,
        }
      } else {
        // Buổi học đã kết thúc
        return {
          canJoinClass: false,
          joinClassMessage: 'Buổi học đã kết thúc',
          nearestSchedule: nearest,
        }
      }
    }
    
    // Trong khoảng 15 phút trước buổi học hoặc đang diễn ra
    return {
      canJoinClass: true,
      joinClassMessage: '',
      nearestSchedule: nearest,
    }
  }, [todaySchedules, getScheduleStatus, currentTime])

  useEffect(() => {
    // Khi chọn slot khác thì thu gọn chi tiết checklist / bài tập
    setShowChecklistDetail(false)
    setShowHomeworkDetail(false)
  }, [selectedScheduleSlotId])

  const getFileNameFromUrl = (url?: string | null) => {
    if (!url) return undefined
    try {
      const withoutQuery = url.split('?')[0]
      const segments = withoutQuery.split('/')
      return segments[segments.length - 1] || url
    } catch {
      return url
    }
  }

  const mapTaskStatusToResult = (status?: string): ChecklistDetailItem['result'] => {
    if (status === 'completed' || status === 'graded' || status === 'submitted') {
      return 'completed'
    }
    if (status === 'in-progress') {
      return 'not_accurate'
    }
    return 'not_completed'
  }

  const resolveAssignmentScheduleId = (assignment: AssignmentApiItem): string | undefined => {
    const raw = assignment.scheduleId as any
    if (!raw) return undefined
    if (typeof raw === 'string') return raw
    if (typeof raw === 'object' && raw._id) return raw._id as string
    return undefined
  }

  const mapChecklistToDetailItems = (scheduleId: string): ChecklistDetailItem[] => {
    // Ưu tiên map theo assignment/tasks để bảng giống phía tutor
    const relatedAssignments = assignments.filter(
      (assignment) => resolveAssignmentScheduleId(assignment) === scheduleId
    )

    if (relatedAssignments.length > 0) {
      const detailItems: ChecklistDetailItem[] = []

      relatedAssignments.forEach((assignment, assignmentIndex) => {
        const assignmentId =
          assignment.id || (assignment as any)._id || `assignment-${assignmentIndex}`
        const lessonName = assignment.name || 'Bài học'

        if (assignment.tasks && assignment.tasks.length > 0) {
          assignment.tasks.forEach((task, taskIndex) => {
            const id = task.id || `${assignmentId}-task-${taskIndex}`
            detailItems.push({
              id,
              lesson: task.name || lessonName,
              estimatedTime: task.estimatedTime ?? 0,
              actualTime: task.actualTime ?? 0,
              result: mapTaskStatusToResult(task.status as string | undefined),
              // Nhận xét: lấy đúng trường note của task (không dùng mô tả nhiệm vụ)
              qualityNote: (task as any).note || '',
              // Chỉ hiển thị file lời giải tutor upload, không hiển thị phần mô tả text
              solutionType: task.solutionUrl ? 'file' : 'text',
              solutionText: undefined,
              solutionFileName: getFileNameFromUrl(task.solutionUrl),
              solutionUrl: task.solutionUrl,
              solutionPreview: undefined,
              uploadedFileName: undefined,
              assignmentFileName: getFileNameFromUrl(task.assignmentUrl),
            })
          })
        } else {
          // Không có task con, map trực tiếp từ assignment
          detailItems.push({
            id: assignmentId,
            lesson: lessonName,
            estimatedTime: 0,
            actualTime: 0,
            result: mapTaskStatusToResult(assignment.status as string | undefined),
            // Không có task con → không có nhận xét riêng, để trống
            qualityNote: '',
            // Chỉ hiển thị file lời giải nếu có, không hiển thị mô tả text
            solutionType: 'text',
            solutionText: undefined,
            solutionFileName: undefined,
            solutionPreview: undefined,
            uploadedFileName: undefined,
            assignmentFileName: getFileNameFromUrl(
              assignment.supplementaryMaterials?.[0]?.url as string | undefined
            ),
          })
        }
      })

      return detailItems
    }

    // Fallback: map từ checklistItems đã chuẩn hoá
    const items = scheduleChecklistMap[scheduleId] || []
    return items.map((item) => ({
      id: item.id,
      lesson: item.lesson,
      estimatedTime: 0,
      actualTime: 0,
      result:
        item.status === 'done'
          ? 'completed'
          : item.status === 'in_progress'
            ? 'not_accurate'
            : 'not_completed',
      qualityNote: item.note || '',
      // Chỉ hiển thị file lời giải tutor upload, không hiển thị mô tả text
      solutionType: item.solutionUrl ? 'file' : 'text',
      solutionText: undefined,
      solutionFileName: item.solutionUrl ? getFileNameFromUrl(item.solutionUrl) : undefined,
      solutionUrl: item.solutionUrl,
      solutionPreview: undefined,
      uploadedFileName: undefined,
      assignmentFileName: item.assignmentUrl ? getFileNameFromUrl(item.assignmentUrl) : undefined,
    }))
  }

  // Group schedules by time into slots
  const scheduleSlots = useMemo<ScheduleSlotGroup[]>(() => {
    const slotMap: Record<string, { id: string; time: string; meetLink?: string; subjects: Set<string>; schedules: ScheduleItem[] }> = {}

    todaySchedules.forEach((schedule) => {
      const slotId = schedule.time

      if (!slotMap[slotId]) {
        slotMap[slotId] = {
          id: slotId,
          time: schedule.time,
          meetLink: schedule.meetLink,
          subjects: new Set<string>(),
          schedules: [],
        }
      }

      slotMap[slotId].schedules.push(schedule)
      if (schedule.subject) {
        slotMap[slotId].subjects.add(schedule.subject)
      }

      if (!slotMap[slotId].meetLink && schedule.meetLink) {
        slotMap[slotId].meetLink = schedule.meetLink
      }
    })

    return Object.values(slotMap).map((slot) => ({
      id: slot.id,
      time: slot.time,
      meetLink: slot.meetLink,
      subjects: Array.from(slot.subjects),
      schedules: slot.schedules,
    }))
  }, [todaySchedules])

  // Auto-select first slot
  useEffect(() => {
    if (scheduleSlots.length === 0) {
      setSelectedScheduleSlotId(null)
      return
    }
    setSelectedScheduleSlotId((prev) => {
      if (prev && scheduleSlots.some((slot) => slot.id === prev)) {
        return prev
      }
      return scheduleSlots[0].id
    })
  }, [scheduleSlots])

  const selectedScheduleSlot = useMemo(
    () => scheduleSlots.find((slot) => slot.id === selectedScheduleSlotId) || null,
    [scheduleSlots, selectedScheduleSlotId]
  )

  // Scroll handling
  const checkScrollButtons = () => {
    const container = scheduleSlotsScrollRef.current
    if (!container) return
    setCanScrollLeft(container.scrollLeft > 10)
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10)
  }

  useEffect(() => {
    const container = scheduleSlotsScrollRef.current
    if (!container) return
    checkScrollButtons()
    container.addEventListener('scroll', checkScrollButtons)
    window.addEventListener('resize', checkScrollButtons)
    return () => {
      container.removeEventListener('scroll', checkScrollButtons)
      window.removeEventListener('resize', checkScrollButtons)
    }
  }, [scheduleSlots.length])

  const scrollLeft = () => {
    scheduleSlotsScrollRef.current?.scrollBy({ left: -240, behavior: 'smooth' })
  }

  const scrollRight = () => {
    scheduleSlotsScrollRef.current?.scrollBy({ left: 240, behavior: 'smooth' })
  }

  return (
    <div className="h-full space-y-4">
      {/* Main Layout - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)] gap-5 lg:items-start">
        {/* Left Column - Profile & Stats */}
        <div className="lg:col-auto">
          <div className="card-no-transition h-full flex flex-col px-2 lg:px-4">
            <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-4 shadow-xl overflow-hidden">
                {studentAvatarUrl ? (
                  <img
                    src={studentAvatarUrl}
                    alt={studentName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserCircle className="w-16 h-16 text-white" />
                )}
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900 mb-1">{studentName}</h3>
              {studentEmail && <p className="text-base text-gray-600">{studentEmail}</p>}
            </div>

            <div className="flex-1 flex flex-col gap-4 py-6">
              {/* Quick Actions (đưa lên trên Tiến độ hôm nay) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    if (canJoinClass && nearestSchedule?.meetLink) {
                      onJoinClass(nearestSchedule.id)
                    }
                  }}
                  disabled={!canJoinClass || !nearestSchedule?.meetLink}
                  className={`card border-2 transition-all group text-left ${
                    canJoinClass && nearestSchedule?.meetLink
                      ? `border-gray-200 hover:border-primary-400 hover:shadow-xl cursor-pointer ${
                          hasOngoingSchedule ? 'shake-soft' : ''
                        }`
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  }`}
                  title={joinClassMessage || 'Vào lớp học'}
                >
                  <div className="flex flex-col items-center justify-center py-5 text-center">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-transform shadow-lg ${
                      canJoinClass && nearestSchedule?.meetLink
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 group-hover:scale-110'
                        : 'bg-gray-400'
                    }`}>
                      <Play className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Vào lớp học</h3>
                    {joinClassMessage && (
                      <p className="text-xs text-gray-500 mt-1">{joinClassMessage}</p>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => {
                    // Tự động chọn schedule đầu tiên nếu chưa chọn
                    if (scheduleSlots.length > 0 && !selectedScheduleSlotId) {
                      setSelectedScheduleSlotId(scheduleSlots[0].id)
                    }
                    // Mở chi tiết checklist
                    setShowChecklistDetail(true)
                    // Scroll đến phần checklist trong container bên phải
                    setTimeout(() => {
                      if (checklistSectionRef.current && rightColumnRef.current) {
                        const container = rightColumnRef.current
                        const element = checklistSectionRef.current
                        
                        // Tính toán vị trí tương đối trong container
                        const containerRect = container.getBoundingClientRect()
                        const elementRect = element.getBoundingClientRect()
                        const scrollTop = container.scrollTop
                        const elementTop = elementRect.top - containerRect.top + scrollTop
                        
                        // Scroll với offset nhỏ để không bị vượt quá
                        container.scrollTo({
                          top: elementTop - 20,
                          behavior: 'smooth'
                        })
                      }
                    }, 200)
                  }}
                  className={`card border-2 border-gray-200 hover:border-primary-400 hover:shadow-xl transition-all cursor-pointer group text-left ${
                    hasOngoingSchedule ? 'shake-soft' : ''
                  }`}
                >
                  <div className="flex flex-col items-center justify-center py-5 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                      <Target className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Xem checklist</h3>
                  </div>
                </button>
              </div>

              {/* Progress */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-md">
                <p className="text-sm text-gray-500 uppercase tracking-[0.3em] mb-3 font-semibold text-center">
                  Tiến độ hôm nay
                </p>
                <div className="text-center">
                  <div className="text-5xl font-black gradient-text mb-3">{progressPercentage}%</div>
                  <p className="text-sm text-gray-600 mb-4">
                    {completedCount}/{totalCount} hoàn thành
                  </p>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Đồng hồ hiện tại */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-md flex flex-col items-center justify-center">
                <p className="text-base text-gray-600 uppercase tracking-[0.35em] mb-4 font-semibold text-center">
                  Đồng hồ hiện tại
                </p>
                <div className="flex flex-col items-center gap-4">
                  <p className="text-4xl md:text-5xl font-black text-primary-700 tracking-[0.35em]">
                    {format(currentTime, 'HH:mm:ss')}
                  </p>
                  <svg
                    viewBox="0 0 100 100"
                    className="w-36 h-36 text-primary-600 drop-shadow-sm bg-white rounded-full"
                  >
                    <circle cx="50" cy="50" r="46" className="fill-white stroke-primary-200" strokeWidth="3" />
                    {Array.from({ length: 12 }).map((_, i) => (
                      <line
                        key={i}
                        x1="50"
                        y1="8"
                        x2="50"
                        y2={i % 3 === 0 ? 16 : 14}
                        stroke={i % 3 === 0 ? '#1d4ed8' : '#9ca3af'}
                        strokeWidth={i % 3 === 0 ? 2.4 : 1.4}
                        transform={`rotate(${i * 30} 50 50)`}
                      />
                    ))}
                    <line
                      x1="50"
                      y1="50"
                      x2="50"
                      y2="30"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      transform={`rotate(${hourDeg} 50 50)`}
                    />
                    <line
                      x1="50"
                      y1="50"
                      x2="50"
                      y2="22"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      className="text-primary-500"
                      transform={`rotate(${minuteDeg} 50 50)`}
                    />
                    <line
                      x1="50"
                      y1="52"
                      x2="50"
                      y2="18"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      transform={`rotate(${secondDeg} 50 50)`}
                    />
                    <circle cx="50" cy="50" r="3" className="fill-white stroke-primary-600" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>

              {/* Khung giờ học sắp tới */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-md flex flex-col justify-center">
                <p className="text-base text-gray-600 uppercase tracking-[0.35em] mb-4 font-semibold text-center">
                  Khung giờ học sắp tới
                </p>
                {upcomingSchedule ? (
                  <div className="flex flex-col items-center space-y-2">
                    {(() => {
                      const tutorProfile = (upcomingSchedule as any).tutorId
                        ? tutorInfoMap[(upcomingSchedule as any).tutorId as string]
                        : undefined
                      const displayTutorName = tutorProfile?.name || (upcomingSchedule as any).tutor
                      return (
                        <p className="text-[22px] font-black text-gray-900 text-center whitespace-nowrap truncate max-w-full px-2">
                          {upcomingSchedule.time}
                          {displayTutorName ? ` : ${displayTutorName}` : ''}
                        </p>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-400 mb-1">Không có lịch</p>
                    <p className="text-xs text-gray-500">Chưa có buổi học nào sắp tới</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Main Content */}
        <div ref={rightColumnRef} className="lg:col-auto space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary-300 scrollbar-track-gray-100">
          {/* Lịch học hôm nay */}
          <div className="card-no-transition">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-200">
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-primary-600" />
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Lịch học hôm nay</h2>
                </div>
              </div>
            </div>

            {todaySchedules.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-base font-semibold text-gray-600">Không có lịch học hôm nay</p>
              </div>
            ) : (
              <>
                {/* Time slots */}
                <div className="mb-6 relative">
                  {canScrollLeft && (
                    <button
                      onClick={scrollLeft}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border-2 border-primary-200 hover:bg-primary-50 transition-all"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-6 h-6 text-primary-600" />
                    </button>
                  )}
                  {canScrollRight && (
                    <button
                      onClick={scrollRight}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg border-2 border-primary-200 hover:bg-primary-50 transition-all"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-6 h-6 text-primary-600" />
                    </button>
                  )}
                  <div 
                    ref={scheduleSlotsScrollRef}
                    className="flex items-stretch gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-primary-300 scrollbar-track-gray-100"
                    style={{
                      paddingLeft: canScrollLeft ? '3rem' : '0',
                      paddingRight: canScrollRight ? '3rem' : '0',
                    }}
                  >
                    {scheduleSlots.map((slot) => {
                      const isSelected = selectedScheduleSlotId === slot.id
                      // Lấy tutor từ schedule đầu tiên
                      const firstSchedule = slot.schedules[0]
                      const tutorProfile = firstSchedule?.tutorId ? tutorInfoMap[firstSchedule.tutorId] : undefined
                      const displayTutorName = tutorProfile?.name || firstSchedule?.tutor
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedScheduleSlotId(slot.id)}
                          className={`min-w-[220px] flex flex-col justify-between rounded-2xl px-6 py-5 text-left transition-all ${
                            isSelected
                              ? 'border-2 border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 shadow-xl text-primary-800 ring-2 ring-primary-200 ring-offset-2'
                              : 'border-2 border-gray-300 bg-white hover:border-primary-400 hover:bg-primary-50 hover:shadow-lg'
                          }`}
                          style={{
                            boxShadow: isSelected ? '0 10px 25px -5px rgba(59, 130, 246, 0.3), 0 0 0 2px rgba(59, 130, 246, 0.1)' : undefined
                          }}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className={`w-5 h-5 ${isSelected ? 'text-primary-600' : 'text-gray-500'}`} />
                              <p className={`text-2xl font-black ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                                {slot.time}
                              </p>
                            </div>
                            {slot.subjects.length > 0 && (
                              <p className={`text-xs font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-600'}`}>
                                {slot.subjects.join(', ')}
                              </p>
                            )}
                          </div>
                          {displayTutorName && (
                            <div className="mt-2">
                              <p className={`text-sm font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-600'}`}>
                                {displayTutorName}
                              </p>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Selected schedule details */}
                {selectedScheduleSlot && selectedScheduleSlot.schedules.length > 0 && (() => {
                  const slotSchedules = selectedScheduleSlot.schedules
                  const activeSchedule = slotSchedules[0]
                  if (!activeSchedule) return null

                  const status = getScheduleStatus(activeSchedule)
                  const tutorProfile = activeSchedule.tutorId ? tutorInfoMap[activeSchedule.tutorId] : undefined
                  const displayTutorName = tutorProfile?.name || activeSchedule.tutor

                  return (
                    <div className="mt-2 flex flex-col gap-4">
                      {/* Schedule info card */}
                      <div className="rounded-2xl border-2 border-primary-100 bg-white p-6 space-y-4 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                              {activeSchedule.subject || 'Chung'}
                            </h3>
                            {displayTutorName && (
                              <p className="text-base text-gray-600 mt-1">
                                Tutor: <span className="font-semibold text-gray-900">{displayTutorName}</span>
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full sm:w-auto">
                            {activeSchedule.meetLink && (() => {
                              // Kiểm tra trạng thái cho schedule này
                              const scheduleTimeMatch = activeSchedule.time.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/)
                              let canJoinThisSchedule = false
                              let messageForThisSchedule = ''
                              
                              if (scheduleTimeMatch) {
                                const startHour = parseInt(scheduleTimeMatch[1], 10)
                                const startMinute = parseInt(scheduleTimeMatch[2], 10)
                                const scheduleStartTime = new Date(activeSchedule.date)
                                scheduleStartTime.setHours(startHour, startMinute, 0, 0)
                                
                                const now = new Date()
                                const minutesUntilStart = (scheduleStartTime.getTime() - now.getTime()) / (1000 * 60)
                                
                                const endHour = parseInt(scheduleTimeMatch[3], 10)
                                const endMinute = parseInt(scheduleTimeMatch[4], 10)
                                const scheduleEndTime = new Date(activeSchedule.date)
                                scheduleEndTime.setHours(endHour, endMinute, 0, 0)
                                const minutesUntilEnd = (scheduleEndTime.getTime() - now.getTime()) / (1000 * 60)
                                
                                if (minutesUntilEnd < 0) {
                                  messageForThisSchedule = 'Buổi học đã kết thúc'
                                } else if (minutesUntilStart > 15) {
                                  messageForThisSchedule = 'Buổi học chưa bắt đầu'
                                } else {
                                  canJoinThisSchedule = true
                                }
                              }
                              
                              return (
                                <div className="flex flex-col items-end gap-1">
                                  <button
                                    onClick={() => canJoinThisSchedule && onJoinClass(activeSchedule.id)}
                                    disabled={!canJoinThisSchedule}
                                    className={`px-8 py-3 text-base font-bold shadow-xl whitespace-nowrap transition-all ${
                                      canJoinThisSchedule
                                        ? 'btn-primary hover:shadow-2xl cursor-pointer'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                    title={messageForThisSchedule || 'Vào lớp'}
                                  >
                                    Vào lớp
                                  </button>
                                  {messageForThisSchedule && (
                                    <p className="text-xs text-gray-500">{messageForThisSchedule}</p>
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <p className="text-4xl font-black text-primary-600 tracking-wide">
                              {activeSchedule.time}
                            </p>
                            {activeSchedule.meetLink && (
                              <div className="flex items-center gap-2 bg-white border border-primary-100 rounded-full px-4 py-2 ml-auto">
                                <a
                                  href={activeSchedule.meetLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-semibold text-primary-600 hover:underline whitespace-nowrap"
                                >
                                  Mở link lớp
                                </a>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(activeSchedule.meetLink || '')
                                    setCopiedScheduleLink(activeSchedule.id)
                                    setTimeout(() => setCopiedScheduleLink(null), 2000)
                                  }}
                                  className="text-primary-500 hover:text-primary-700 transition-colors"
                                  title="Copy meet link"
                                >
                                  {copiedScheduleLink === activeSchedule.id ? (
                                    <Clock className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tải tài liệu cho Tutor */}
                      <MaterialUploadSection
                        scheduleOptions={[{
                          id: activeSchedule.id,
                          subject: activeSchedule.subject || 'Chung',
                          date: activeSchedule.date,
                        }]}
                        selectedScheduleId={activeSchedule.id}
                        onScheduleChange={() => {}}
                        onUploadSuccess={onUploadSuccess}
                      />

                      {/* Checklist hôm nay */}
                      <div ref={checklistSectionRef} className="rounded-2xl border-2 border-primary-50 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-2xl font-bold text-gray-900">Checklist hôm nay</h4>
                          <button
                            type="button"
                            onClick={() => setShowChecklistDetail((prev) => !prev)}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
                          >
                            <span>{showChecklistDetail ? 'Thu gọn' : 'Chi tiết'}</span>
                            {showChecklistDetail ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {scheduleChecklistMap[activeSchedule.id]?.length ? (
                          <>
                            <div className="space-y-3">
                              {scheduleChecklistMap[activeSchedule.id].map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{item.lesson}</p>
                                    <p className="text-xs text-gray-600 truncate">{item.task}</p>
                                  </div>
                                  <span
                                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                                      item.status === 'done'
                                        ? 'bg-green-100 text-green-700'
                                        : item.status === 'in_progress'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-gray-200 text-gray-700'
                                    }`}
                                  >
                                    {item.status === 'done'
                                      ? 'Đã xong'
                                      : item.status === 'in_progress'
                                        ? 'Đang làm'
                                        : 'Chưa xong'}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {showChecklistDetail && (
                              <div className="mt-4 pt-4 border-t border-gray-200 space-y-6">
                                {/* Bảng tóm tắt giống tutor */}
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.35em] mb-3">
                                    BẢNG TÓM TẮT
                                  </p>
                                  <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50">
                                    <table className="min-w-full text-xs sm:text-sm">
                                      <thead className="bg-white">
                                        <tr className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                          <th className="px-3 py-2 text-left">Bài học</th>
                                          <th className="px-3 py-2 text-left">Nhiệm vụ</th>
                                          <th className="px-3 py-2 text-center whitespace-nowrap">Trạng thái</th>
                                          <th className="px-3 py-2 text-left">Nhận xét</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(scheduleChecklistMap[activeSchedule.id] || []).map((item) => (
                                          <tr key={item.id} className="border-t border-gray-200 bg-white">
                                            <td className="px-3 py-2 text-sm font-semibold text-gray-900">
                                              {item.lesson}
                                            </td>
                                            <td className="px-3 py-2 text-sm text-gray-700">
                                              {item.task}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                              <span
                                                className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold ${
                                                  item.status === 'done'
                                                    ? 'bg-green-100 text-green-700'
                                                    : item.status === 'in_progress'
                                                      ? 'bg-yellow-100 text-yellow-700'
                                                      : 'bg-gray-200 text-gray-700'
                                                }`}
                                              >
                                                {item.status === 'done'
                                                  ? 'Đã xong'
                                                  : item.status === 'in_progress'
                                                    ? 'Đang làm'
                                                    : 'Chưa xong'}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2 text-sm text-gray-700">
                                              {item.note || '—'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Bảng chi tiết giống tutor */}
                                <ChecklistDetailTable
                                  items={mapChecklistToDetailItems(activeSchedule.id)}
                                  onUpload={() => {}}
                                  onUploadSolution={() => {}}
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Chưa có checklist nào cho buổi này.</p>
                        )}
                      </div>

                      {/* Bài tập về nhà */}
                      <div className="rounded-2xl border-2 border-primary-50 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-2xl font-bold text-gray-900">Bài tập hôm nay</h4>
                          <button
                            type="button"
                            onClick={() => setShowHomeworkDetail((prev) => !prev)}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
                          >
                            <span>{showHomeworkDetail ? 'Thu gọn' : 'Chi tiết'}</span>
                            {showHomeworkDetail ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {homeworkDetailsMap[activeSchedule.id]?.length ? (
                          <>
                            <div className="space-y-3">
                              {homeworkDetailsMap[activeSchedule.id].map((item) => (
                                <div
                                  key={item.id}
                                  className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex flex-col gap-1"
                                >
                                  <p className="text-sm font-semibold text-gray-900">{item.task}</p>
                                  {item.comment && <p className="text-xs text-gray-600">{item.comment}</p>}
                                  <span
                                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                      item.result === 'completed'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-200 text-gray-700'
                                    }`}
                                  >
                                    {item.result === 'completed' ? 'Hoàn thành' : 'Chưa hoàn thành'}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {showHomeworkDetail && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <HomeworkDetailTable
                                  items={homeworkDetailsMap[activeSchedule.id] || []}
                                  onUpload={() => {}}
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Chưa có bài tập nào cho buổi này.</p>
                        )}
                      </div>

                      {/* Đánh giá chung cho từng môn */}
                      {(() => {
                        let scheduleAssignments = assignments.filter((assignment) => {
                          const assignmentScheduleId = getAssignmentScheduleId(assignment)
                          return assignmentScheduleId === activeSchedule.id
                        })

                        if (scheduleAssignments.length === 0 && activeSchedule.subject) {
                          scheduleAssignments = assignments.filter((assignment) => {
                            const subjectLabel =
                              (getSubjectLabel && getSubjectLabel(assignment.subject as any)) ||
                              (assignment.subject as any) ||
                              ''
                            return subjectLabel === activeSchedule.subject
                          })
                        }

                        return (
                          <StudentSubjectReviewSection
                            title="Đánh giá chung cho từng môn"
                            assignments={scheduleAssignments}
                            scheduleSubject={activeSchedule.subject}
                            loading={assignmentReviewsLoading}
                            assignmentReviews={assignmentReviews}
                            getAssignmentKey={(assignment, idx) => assignment.id || assignment._id || `${assignment.subject || 'subject'}-${idx}`}
                          />
                        )
                      })()}

                      {/* Đánh giá buổi học */}
                      <StudentSessionEvaluationSection
                        scheduleId={activeSchedule.id}
                        reviews={scheduleReviews[activeSchedule.id]}
                        isExpanded={evaluationExpandedState[activeSchedule.id] ?? true}
                        scheduleStatus={status === 'ongoing' ? 'in_progress' : status === 'completed' ? 'completed' : 'upcoming'}
                        onToggle={() =>
                          setEvaluationExpandedState((prev) => ({
                            ...prev,
                            [activeSchedule.id]: !(prev[activeSchedule.id] ?? true),
                          }))
                        }
                      />

                      {/* Báo cáo buổi học */}
                      <StudentReportSection
                        scheduleId={activeSchedule.id}
                        report={scheduleReports[activeSchedule.id]}
                      />
                    </div>
                  )
                })()}
              </>
            )}
          </div>

        </div>
      </div>

      {/* Tutor Detail Modal */}
      {selectedTutorSchedule && (() => {
        const schedule = todaySchedules.find((s) => s.id === selectedTutorSchedule)
        if (!schedule || !schedule.tutorId) return null
        const tutorProfile = tutorInfoMap[schedule.tutorId]
        const displayTutorName = tutorProfile?.name || schedule.tutor || 'Tutor đang được cập nhật'
        const tutorInitial = displayTutorName.charAt(0)?.toUpperCase() || 'T'

        return (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTutorSchedule(null)}
          >
            <div
              className="bg-white rounded-[32px] shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between z-10">
                <h2 className="text-3xl font-bold text-gray-900">Thông tin chi tiết Tutor</h2>
                <button
                  onClick={() => setSelectedTutorSchedule(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="border-b border-gray-200 pb-2"></div>

                {tutorProfile ? (
                  <>
                    <div className="flex flex-col lg:flex-row items-start gap-6 border border-gray-100 rounded-3xl bg-gray-50 p-6">
                      <div className="w-28 h-28 rounded-3xl overflow-hidden border-2 border-primary-100 shadow-lg flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-600 text-white text-4xl font-bold flex items-center justify-center">
                        {tutorProfile.avatarUrl ? (
                          <img src={tutorProfile.avatarUrl} alt={displayTutorName} className="w-full h-full object-cover" />
                        ) : (
                          tutorInitial
                        )}
                      </div>
                      <div className="flex-1 space-y-4">
                        <h3 className="text-4xl font-extrabold text-gray-900">{displayTutorName}</h3>
                        <p className="text-lg text-gray-500">{tutorProfile.currentLevel || 'Tutor LearnerPro'}</p>
                        {schedule.note && (
                          <p className="text-base text-gray-600">
                            <span className="font-semibold text-gray-800">Ghi chú buổi học:</span> {schedule.note}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="p-5 border rounded-2xl bg-white shadow-sm">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</p>
                        <p className="text-lg font-semibold text-gray-900">{tutorProfile.email || 'Chưa cập nhật'}</p>
                      </div>
                      <div className="p-5 border rounded-2xl bg-white shadow-sm">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Số điện thoại</p>
                        <p className="text-lg font-semibold text-gray-900">{tutorProfile.phone || 'Chưa cập nhật'}</p>
                      </div>
                      <div className="p-5 border rounded-2xl bg-white shadow-sm">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Địa chỉ</p>
                        <p className="text-lg font-semibold text-gray-900">{tutorProfile.address || 'Chưa cập nhật'}</p>
                      </div>
                      <div className="p-5 border rounded-2xl bg-white shadow-sm">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Môn phụ trách</p>
                        <p className="text-lg font-semibold text-gray-900">{schedule.subject || 'Đang cập nhật'}</p>
                      </div>
                      <div className="p-5 border rounded-2xl bg-white shadow-sm md:col-span-2">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">CV / Hồ sơ</p>
                        {tutorProfile.cvUrl ? (
                          <a
                            href={tutorProfile.cvUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-lg font-semibold text-primary-600 hover:text-primary-700"
                          >
                            Xem CV
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </a>
                        ) : (
                          <p className="text-lg font-semibold text-gray-900">Tutor chưa cập nhật CV</p>
                        )}
                      </div>
                    </div>

                    <div className="p-5 border border-gray-100 rounded-3xl bg-gray-50">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-[0.3em] mb-3">Giới thiệu</p>
                      <p className="text-lg text-gray-700 leading-relaxed">
                        {tutorProfile.moreInfo || 'Tutor vẫn chưa cập nhật phần giới thiệu chi tiết.'}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="p-4 border border-dashed border-gray-300 rounded-2xl bg-gray-50 text-sm text-gray-600">
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
