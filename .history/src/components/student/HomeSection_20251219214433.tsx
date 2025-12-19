import { useState, useMemo, useEffect, useRef } from 'react'
import { format, isToday } from 'date-fns'
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
  Layers,
  PenTool,
  Lightbulb,
  Upload,
  AlertTriangle,
  Folder,
  FileText,
  Loader2,
  Users,
  Mail,
  Phone,
  FileText as FileTextIcon,
  Plus,
  X,
} from 'lucide-react'
import MaterialUploadSection from './MaterialUploadSection'
import StudentSubjectReviewSection from './StudentSubjectReviewSection'
import StudentSessionEvaluationSection from './StudentSessionEvaluationSection'
import StudentReportSection from './StudentReportSection'
import ChecklistDetailTable from './ChecklistDetailTable'
import type { ScheduleItem } from '../dashboard'
import type { AssignmentApiItem } from '../../pages/TutorDashboard'
import type { TutorInfo, ChecklistWithDate } from './types'
import type { HomeworkDetailItem } from './HomeworkDetailTable'
import type { ChecklistDetailItem } from './ChecklistDetailTable'
import { splitFileUrls } from '../../utils/fileUrlHelper'

// Helper hiển thị text nhiều dòng theo ký tự xuống dòng \n
const renderMultilineText = (text: string) => {
  const lines = text.split('\n')
  return lines.map((line, index) => (
    <span key={index}>
      {line}
      {index < lines.length - 1 && <br />}
    </span>
  ))
}

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
  onUploadHomeworkFile?: (homeworkId: string, file: File, fileIndex?: number) => Promise<void>
  onDeleteHomeworkFile?: (homeworkId: string, fileIndex: number) => Promise<void>
  uploadScheduleOptions?: ScheduleItem[]
  selectedUploadScheduleId?: string | null
  onUploadScheduleChange?: (scheduleId: string) => void
  onUploadChecklistFile?: (taskId: string, file: File, fileIndex?: number) => Promise<void>
  onDeleteChecklistFile?: (taskId: string, fileIndex: number) => Promise<void>
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

// Helper function to extract subject from checklist name or description
const extractSubjectFromText = (text?: string): string | null => {
  if (!text) return null
  const textLower = text.toLowerCase().trim()
  
  // Common subject keywords - order matters, check longer phrases first - return full names
  const subjectKeywords: Record<string, string> = {
    'giáo dục quốc phòng an ninh': 'Giáo dục quốc phòng an ninh',
    'quốc phòng an ninh': 'Quốc phòng an ninh',
    'quoc phong an ninh': 'Giáo dục quốc phòng an ninh',
    'giáo dục công dân': 'Giáo dục công dân',
    'giao duc cong dan': 'Giáo dục công dân',
    'công dân': 'Giáo dục công dân',
    'công nghệ': 'Công nghệ',
    'cong nghe': 'Công nghệ',
    'tin học': 'Tin học',
    'tin hoc': 'Tin học',
    'tiếng anh': 'Tiếng Anh',
    'tieng anh': 'Tiếng Anh',
    'ngữ văn': 'Ngữ văn',
    'ngu van': 'Ngữ văn',
    'vật lý': 'Vật lý',
    'vat ly': 'Vật lý',
    'hóa học': 'Hóa học',
    'hoa hoc': 'Hóa học',
    'sinh học': 'Sinh học',
    'sinh hoc': 'Sinh học',
    'lịch sử': 'Lịch sử',
    'lich su': 'Lịch sử',
    'địa lý': 'Địa lý',
    'dia ly': 'Địa lý',
    'thể dục': 'Thể dục',
    'the duc': 'Thể dục',
    'âm nhạc': 'Âm nhạc',
    'am nhac': 'Âm nhạc',
    'mỹ thuật': 'Mỹ thuật',
    'my thuat': 'Mỹ thuật',
    'toán': 'Toán',
    'toan': 'Toán',
    'ly': 'Vật lý',
    'lý': 'Vật lý',
    'hoá': 'Hóa học',
    'hóa': 'Hóa học',
    'hoa': 'Hóa học',
    'sinh': 'Sinh học',
    'văn': 'Ngữ văn',
    'van': 'Ngữ văn',
    'anh': 'Tiếng Anh',
    'sử': 'Lịch sử',
    'su': 'Lịch sử',
    'địa': 'Địa lý',
    'dia': 'Địa lý',
    'gdcd': 'Giáo dục công dân',
    'tin': 'Tin học',
  }
  
  // Check for subject keywords in text (longer phrases first)
  for (const [keyword, subject] of Object.entries(subjectKeywords)) {
    if (textLower.includes(keyword)) {
      return subject
    }
  }
  
  return null
}

// Helper to format subject label - keep original name
const formatSubjectLabel = (subject: string | null | undefined): string => {
  if (!subject) return 'Chung'
  return subject.toUpperCase()
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
  onUploadHomeworkFile,
  onDeleteHomeworkFile,
  uploadScheduleOptions = [],
  selectedUploadScheduleId = null,
  onUploadScheduleChange,
  onUploadChecklistFile,
  onDeleteChecklistFile,
}: HomeSectionProps) {
  const [selectedTutorSchedule, setSelectedTutorSchedule] = useState<string | null>(null)
  const [selectedScheduleSlotId, setSelectedScheduleSlotId] = useState<string | null>(null)
  const [copiedScheduleLink, setCopiedScheduleLink] = useState<string | null>(null)
  const scheduleSlotsScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [homeworkUploading, setHomeworkUploading] = useState<string | null>(null)
  const [evaluationExpandedState, setEvaluationExpandedState] = useState<Record<string, boolean>>({})
  const [isChecklistCollapsed, setIsChecklistCollapsed] = useState(false)
  const [expandedChecklistItems, setExpandedChecklistItems] = useState<Record<string, boolean>>({})
  const [isHomeworkCollapsed, setIsHomeworkCollapsed] = useState(false)
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
    // Khi chọn slot khác thì thu gọn chi tiết checklist / bài tập và reset expanded items
    setIsChecklistCollapsed(false)
    setExpandedChecklistItems({})
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
              uploadedFileName: task.answerURL ? getFileNameFromUrl(task.answerURL) : undefined,
              uploadedFileUrl: task.answerURL || undefined,
              uploadedFileUrls: task.answerURL ? (Array.isArray(task.answerURL) ? task.answerURL : (typeof task.answerURL === 'string' ? task.answerURL.split('\n').filter((url: string) => url.trim()) : [])) : undefined,
              assignmentFileName: getFileNameFromUrl(Array.isArray(task.assignmentUrl) ? task.assignmentUrl[0] : task.assignmentUrl),
              assignmentUrl: Array.isArray(task.assignmentUrl) ? task.assignmentUrl.join('\n') : (task.assignmentUrl || undefined),
              assignmentUrls: task.assignmentUrl ? (Array.isArray(task.assignmentUrl) ? task.assignmentUrl.filter((url: string) => url && url.trim()) : (typeof task.assignmentUrl === 'string' ? task.assignmentUrl.split('\n').filter((url: string) => url.trim()) : [])) : undefined,
              solutionUrls: task.solutionUrl ? (Array.isArray(task.solutionUrl) ? task.solutionUrl.filter((url: string) => url && url.trim()) : (typeof task.solutionUrl === 'string' ? task.solutionUrl.split('\n').filter((url: string) => url.trim()) : [])) : undefined,
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
    return items.map((item) => {
      const assignmentUrls = item.assignmentUrl
        ? Array.isArray(item.assignmentUrl)
          ? item.assignmentUrl.filter((url: string) => url && url.trim())
          : splitFileUrls(item.assignmentUrl)
        : []

      const uploadedFileUrls = (item as any).answerURL
        ? Array.isArray((item as any).answerURL)
          ? (item as any).answerURL.filter((url: string) => url && url.trim())
          : splitFileUrls((item as any).answerURL)
        : []

      const solutionUrls = item.solutionUrl
        ? Array.isArray(item.solutionUrl)
          ? item.solutionUrl.filter((url: string) => url && url.trim())
          : splitFileUrls(item.solutionUrl)
        : []

      return {
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
        solutionType: solutionUrls.length > 0 ? 'file' : 'text',
        solutionText: undefined,
        solutionFileName: solutionUrls.length > 0 ? getFileNameFromUrl(solutionUrls[0]) : undefined,
        solutionUrl: solutionUrls.length > 0 ? solutionUrls.join('\n') : undefined,
        solutionPreview: undefined,
        uploadedFileName:
          uploadedFileUrls.length > 0 ? getFileNameFromUrl(uploadedFileUrls[0]) : undefined,
        uploadedFileUrl:
          uploadedFileUrls.length > 0 ? uploadedFileUrls.join('\n') : undefined,
        uploadedFileUrls: uploadedFileUrls.length > 0 ? uploadedFileUrls : undefined,
        assignmentFileName:
          assignmentUrls.length > 0 ? getFileNameFromUrl(assignmentUrls[0]) : undefined,
        assignmentUrl:
          assignmentUrls.length > 0 ? assignmentUrls.join('\n') : undefined,
        assignmentUrls: assignmentUrls.length > 0 ? assignmentUrls : undefined,
      }
    })
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
        <div className="lg:col-auto lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-2 scrollbar-thin scrollbar-thumb-primary-300 scrollbar-track-gray-100">
          <div className="card-no-transition h-full flex flex-col px-2 lg:pl-4 lg:pr-6">
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
                  className={`card border-2 transition-all group text-left w-full ${
                    canJoinClass && nearestSchedule?.meetLink
                      ? `border-gray-200 hover:border-primary-400 hover:shadow-xl cursor-pointer ${
                          hasOngoingSchedule ? 'shake-soft' : ''
                        }`
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  }`}
                  title={joinClassMessage || 'Vào lớp học'}
                >
                  <div className="flex flex-col items-center justify-center py-5 text-center min-h-[120px]">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-transform shadow-lg ${
                      canJoinClass && nearestSchedule?.meetLink
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 group-hover:scale-110'
                        : 'bg-gray-400'
                    }`}>
                      <Play className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Vào lớp học</h3>
                    <div className="h-4 mt-1">
                    {joinClassMessage && (
                        <p className="text-xs text-gray-500">{joinClassMessage}</p>
                    )}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    // Tự động chọn schedule đầu tiên nếu chưa chọn
                    if (scheduleSlots.length > 0 && !selectedScheduleSlotId) {
                      setSelectedScheduleSlotId(scheduleSlots[0].id)
                    }
                    
                    // Mở phần checklist (đảm bảo không bị collapsed)
                    setIsChecklistCollapsed(false)
                    
                    // Mở rộng TẤT CẢ các checklist items
                    setTimeout(() => {
                      const allKeys: Record<string, boolean> = {}
                      
                      // Lấy tất cả assignment keys từ assignments array
                      assignments.forEach((assignment) => {
                        const assignmentKey = assignment.id || (assignment as any)._id || `assignment-${assignment.subject}`
                        allKeys[assignmentKey] = true
                      })
                      
                      // Lấy tất cả checklist item keys từ scheduleChecklistMap
                      Object.values(scheduleChecklistMap).forEach((checklistItems) => {
                        checklistItems.forEach((item) => {
                          allKeys[item.id] = true
                        })
                      })
                      
                      // Set tất cả items thành expanded
                      setExpandedChecklistItems(allKeys)
                    }, 100)
                    
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
                    }, 300)
                  }}
                  className={`card border-2 border-gray-200 hover:border-primary-400 hover:shadow-xl transition-all cursor-pointer group text-left w-full ${
                    hasOngoingSchedule ? 'shake-soft' : ''
                  }`}
                >
                  <div className="flex flex-col items-center justify-center py-5 text-center min-h-[120px]">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                      <Target className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Xem checklist</h3>
                    <div className="h-4 mt-1"></div>
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
                      <div className="rounded-2xl border-2 border-primary-100 bg-white p-4 sm:p-6 space-y-4 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {displayTutorName ? (
                              <button
                                onClick={() => {
                                  if (activeSchedule.tutorId) {
                                    setSelectedTutorSchedule(activeSchedule.id)
                                  }
                                }}
                                className="text-left hover:opacity-80 transition-opacity w-full"
                                disabled={!activeSchedule.tutorId}
                              >
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-primary-600 transition-colors break-words">
                                  {displayTutorName}
                                </h3>
                              </button>
                            ) : (
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                              {activeSchedule.subject || 'Chung'}
                            </h3>
                            )}
                            {activeSchedule.subject && (
                              <p className="text-sm sm:text-base text-gray-600 mt-1">
                                Môn: <span className="font-semibold text-gray-900">{activeSchedule.subject}</span>
                              </p>
                            )}
                          </div>
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
                              <div className="flex flex-col items-start lg:items-end gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => canJoinThisSchedule && onJoinClass(activeSchedule.id)}
                                    disabled={!canJoinThisSchedule}
                                  className={`w-full px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-bold shadow-xl transition-all ${
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

                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <p className="text-3xl sm:text-4xl font-black text-primary-600 tracking-wide">
                              {activeSchedule.time}
                            </p>
                            {activeSchedule.meetLink && (
                              <div className="flex items-center gap-2 bg-white border border-primary-100 rounded-full px-3 sm:px-4 py-2 w-full sm:w-auto justify-center sm:justify-start">
                                <a
                                  href={activeSchedule.meetLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs sm:text-sm font-semibold text-primary-600 hover:underline whitespace-nowrap"
                                >
                                  Mở link lớp
                                </a>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(activeSchedule.meetLink || '')
                                    setCopiedScheduleLink(activeSchedule.id)
                                    setTimeout(() => setCopiedScheduleLink(null), 2000)
                                  }}
                                  className="text-primary-500 hover:text-primary-700 transition-colors flex-shrink-0"
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
                      {uploadScheduleOptions && uploadScheduleOptions.length > 0 && (
                      <MaterialUploadSection
                          scheduleOptions={uploadScheduleOptions.map(s => ({
                            id: s.id,
                            subject: getSubjectLabel?.((s as any).subjectCode) || s.subject || 'Chung',
                            date: s.date,
                          }))}
                          selectedScheduleId={selectedUploadScheduleId || activeSchedule?.id || null}
                          onScheduleChange={(scheduleId) => {
                            if (onUploadScheduleChange) {
                              onUploadScheduleChange(scheduleId)
                            }
                          }}
                        onUploadSuccess={onUploadSuccess}
                      />
                      )}

                      {/* Checklist hôm nay */}
                      <div ref={checklistSectionRef} className="rounded-2xl border-2 border-primary-50 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <button
                            type="button"
                            onClick={() => setIsChecklistCollapsed((prev) => !prev)}
                            className="flex items-center justify-between w-full text-2xl md:text-3xl font-bold text-gray-900 hover:text-primary-600 transition-colors"
                          >
                            <h4 className="text-left">Checklist hôm nay</h4>
                            {isChecklistCollapsed ? (
                              <ChevronDown className="w-5 h-5 flex-shrink-0 ml-2" />
                            ) : (
                              <ChevronUp className="w-5 h-5 flex-shrink-0 ml-2" />
                            )}
                          </button>
                        </div>
                        {!isChecklistCollapsed && (() => {
                          // Nhóm checklist theo assignments nếu có
                          const relatedAssignments = assignments.filter(
                            (assignment) => resolveAssignmentScheduleId(assignment) === activeSchedule.id
                          )
                          
                          const hasChecklist = relatedAssignments.length > 0 || scheduleChecklistMap[activeSchedule.id]?.length
                          
                          if (!hasChecklist) {
                            return <p className="text-sm text-gray-500 italic">Chưa có checklist nào cho buổi này.</p>
                          }
                          
                          return (
                            <>
                              {/* Nếu có assignments, hiển thị theo layout mới giống tutor */}
                              {relatedAssignments.length > 0 ? (
                                <div className="space-y-4">
                                  {relatedAssignments.map((assignment) => {
                                    const assignmentKey = assignment.id || (assignment as any)._id || `assignment-${assignment.subject}`
                                    const isExpanded = expandedChecklistItems[assignmentKey] || false
                                    
                                    return (
                                      <div
                                        key={assignmentKey}
                                        className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => setExpandedChecklistItems((prev) => ({
                                            ...prev,
                                            [assignmentKey]: !prev[assignmentKey]
                                          }))}
                                          className="w-full"
                                        >
                                          <div className="flex items-center px-3 sm:px-5 py-3 sm:py-4 gap-3 sm:gap-4">
                                            <p className="text-sm sm:text-base lg:text-lg font-bold text-primary-600 uppercase tracking-wide min-w-[50px] sm:min-w-[60px] max-w-[120px] sm:max-w-[180px] flex-shrink-0 break-words">
                                              {formatSubjectLabel(
                                                assignment.subject || 
                                                extractSubjectFromText(assignment.name) ||
                                                extractSubjectFromText(assignment.description) ||
                                                activeSchedule.subject || 
                                                'Chung'
                                              )}
                                            </p>
                                            <div className="h-10 sm:h-12 w-px bg-gray-300 flex-shrink-0 hidden sm:block"></div>
                                            <div className="flex-1 space-y-1 min-w-0 text-left">
                                              <h5 className="text-sm sm:text-base font-bold text-gray-900 break-words">
                                                {assignment.name || 'Checklist'}
                                              </h5>
                                              {assignment.description && (
                                                <p className="text-xs sm:text-sm text-gray-600 italic line-clamp-1 sm:line-clamp-2">
                                                  {assignment.description}
                                                </p>
                                              )}
                                  </div>
                                            <div className="flex-shrink-0">
                                              {isExpanded ? (
                                                <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                                              ) : (
                                                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                                              )}
                            </div>
                                          </div>
                                        </button>
                                        
                                        {isExpanded && (
                                          <div className="px-3 sm:px-5 pb-4 pt-2 border-t border-gray-200 space-y-4">
                                            {/* Bảng tóm tắt */}
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.35em] mb-3">
                                    BẢNG TÓM TẮT
                                  </p>
                                              
                                              {/* Mobile Card Layout */}
                                              <div className="block md:hidden space-y-3">
                                                {(assignment.tasks || []).map((task: any, taskIndex: number) => {
                                                  const mapTaskStatusToDisplay = (status?: string) => {
                                                    if (status === 'completed' || status === 'submitted') return 'done'
                                                    if (status === 'in-progress') return 'in_progress'
                                                    return 'pending'
                                                  }
                                                  const taskStatus = mapTaskStatusToDisplay(task.status)
                                                  const rowChip =
                                                    taskStatus === 'done'
                                        ? 'bg-green-100 text-green-700'
                                                      : taskStatus === 'in_progress'
                                          ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-red-100 text-red-700'
                                                  const rowNote = (task as any).note || assignment.description || '—'
                                                  
                                                  return (
                                                    <div
                                                      key={task.id || `${assignmentKey}-task-${taskIndex}`}
                                                      className="rounded-xl border-2 border-gray-200 bg-white p-4 space-y-3 shadow-sm"
                                                    >
                                                      <div className="flex items-center gap-2">
                                                        <Layers className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">Bài học</p>
                                                          <p className="text-sm font-bold text-gray-900 break-words mt-1">
                                                            {task.name || assignment.name || 'Bài học'}
                                                          </p>
                                                        </div>
                                                      </div>
                                                      
                                                      <div className="flex items-start gap-2">
                                                        <PenTool className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                                                        <div className="flex-1 min-w-0">
                                                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">Yêu cầu chi tiết</p>
                                                          <p className="text-sm text-gray-700 break-words mt-1">
                                                            {task.description || assignment.description || '—'}
                                                          </p>
                                                        </div>
                                                      </div>
                                                      
                                                      <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                                        <div className="flex-1">
                                                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-1">Trạng thái</p>
                                                          <span
                                                            className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold ${rowChip}`}
                                                          >
                                                            {taskStatus === 'done'
                                      ? 'Đã xong'
                                                              : taskStatus === 'in_progress'
                                        ? 'Đang làm'
                                                                : 'CHƯA XONG'}
                                  </span>
                                </div>
                            </div>
                                                      
                                                      {rowNote && rowNote !== '—' && (
                                                        <div className="flex items-start gap-2 pt-2 border-t border-gray-100">
                                                          <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                                                          <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">Nhận xét</p>
                                                            <p className="text-sm text-gray-600 break-words mt-1">{rowNote}</p>
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                  )
                                                })}
                                              </div>

                                              {/* Desktop Table Layout */}
                                              <div className="hidden md:block rounded-xl lg:rounded-2xl border-2 border-gray-200 bg-white shadow-sm overflow-x-auto scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-gray-100">
                                                <table className="w-full text-base border-collapse min-w-[800px]">
                                                  <thead className="bg-purple-50 text-gray-700 uppercase text-sm md:text-base tracking-[0.3em] font-semibold">
                                                    <tr>
                                                      <th className="px-5 py-3 text-center font-semibold border-b-2 border-gray-200">
                                                        <div className="flex items-center justify-center gap-2">
                                                          <Layers className="w-5 h-5" />
                                                          Bài học
                                                        </div>
                                                      </th>
                                                      <th className="px-5 py-3 text-center font-semibold border-b-2 border-gray-200">
                                                        <div className="flex items-center justify-center gap-2">
                                                          <PenTool className="w-5 h-5" />
                                                          Yêu cầu chi tiết
                                                        </div>
                                                      </th>
                                                      <th className="px-5 py-3 text-center font-semibold border-b-2 border-gray-200">
                                                        <div className="flex items-center justify-center gap-2">
                                                          <Clock className="w-5 h-5" />
                                                          Trạng thái
                                                        </div>
                                                      </th>
                                                      <th className="px-5 py-3 text-center font-semibold border-b-2 border-gray-200">
                                                        <div className="flex items-center justify-center gap-2">
                                                          <Lightbulb className="w-5 h-5" />
                                                          Nhận xét
                                                        </div>
                                                      </th>
                                        </tr>
                                      </thead>
                                                  <tbody className="divide-y divide-gray-100 bg-white">
                                                    {(assignment.tasks || []).map((task: any, taskIndex: number) => {
                                                      const mapTaskStatusToDisplay = (status?: string) => {
                                                        if (status === 'completed' || status === 'submitted') return 'done'
                                                        if (status === 'in-progress') return 'in_progress'
                                                        return 'pending'
                                                      }
                                                      const taskStatus = mapTaskStatusToDisplay(task.status)
                                                      const rowChip =
                                                        taskStatus === 'done'
                                                          ? 'bg-green-100 text-green-700'
                                                          : taskStatus === 'in_progress'
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-red-100 text-red-700'
                                                      const rowNote = (task as any).note || assignment.description || '—'
                                                      
                                                      return (
                                                        <tr key={task.id || `${assignmentKey}-task-${taskIndex}`}>
                                                          <td className="px-5 py-4 font-semibold text-gray-900 text-center text-lg break-words">
                                                            {task.name || assignment.name || 'Bài học'}
                                            </td>
                                                          <td className="px-5 py-4 text-gray-700 text-center text-base break-words">
                                                            {task.description || assignment.description || '—'}
                                            </td>
                                                          <td className="px-5 py-4 text-center text-base">
                                              <span
                                                              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${rowChip}`}
                                                            >
                                                              {taskStatus === 'done'
                                                  ? 'Đã xong'
                                                                : taskStatus === 'in_progress'
                                                    ? 'Đang làm'
                                                                  : 'CHƯA XONG'}
                                              </span>
                                            </td>
                                                          <td className="px-5 py-4 text-gray-600 text-center text-base break-words">
                                                            <span className="flex-1">{rowNote}</span>
                                            </td>
                                          </tr>
                                                      )
                                                    })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                            {/* Bảng chi tiết */}
                                            {(() => {
                                              // Map checklist items cho assignment này
                                              const assignmentTasks = assignment.tasks || []
                                              const assignmentId = assignment.id || (assignment as any)._id || assignmentKey
                                              
                                              const detailItemsForAssignment: ChecklistDetailItem[] = []
                                              
                                              if (assignmentTasks.length > 0) {
                                                assignmentTasks.forEach((task: any, taskIndex: number) => {
                                                  const taskId = task.id || `${assignmentId}-task-${taskIndex}`
                                                  const assignmentUrls = task.assignmentUrl
                                                    ? Array.isArray(task.assignmentUrl)
                                                      ? task.assignmentUrl.filter((url: string) => url && url.trim())
                                                      : splitFileUrls(task.assignmentUrl)
                                                    : []
                                                  const uploadedFileUrls = task.answerURL
                                                    ? Array.isArray(task.answerURL)
                                                      ? task.answerURL.filter((url: string) => url && url.trim())
                                                      : splitFileUrls(task.answerURL)
                                                    : []
                                                  const solutionUrls = task.solutionUrl
                                                    ? Array.isArray(task.solutionUrl)
                                                      ? task.solutionUrl.filter((url: string) => url && url.trim())
                                                      : splitFileUrls(task.solutionUrl)
                                                    : []
                                                  detailItemsForAssignment.push({
                                                    id: taskId,
                                                    lesson: task.name || assignment.name || 'Bài học',
                                                    estimatedTime: task.estimatedTime ?? 0,
                                                    actualTime: task.actualTime ?? 0,
                                                    result: mapTaskStatusToResult(task.status as string | undefined),
                                                    qualityNote: (task as any).note || '',
                                                    solutionType: solutionUrls.length > 0 ? 'file' : 'text',
                                                    solutionText: undefined,
                                                    solutionFileName: solutionUrls.length > 0 ? getFileNameFromUrl(solutionUrls[0]) : undefined,
                                                    solutionUrl: solutionUrls.length > 0 ? solutionUrls.join('\n') : undefined,
                                                    solutionUrls: solutionUrls.length > 0 ? solutionUrls : undefined,
                                                    solutionPreview: undefined,
                                                    uploadedFileName: uploadedFileUrls.length > 0 ? getFileNameFromUrl(uploadedFileUrls[0]) : undefined,
                                                    uploadedFileUrl: uploadedFileUrls.length > 0 ? uploadedFileUrls.join('\n') : undefined,
                                                    uploadedFileUrls: uploadedFileUrls.length > 0 ? uploadedFileUrls : undefined,
                                                    assignmentFileName: assignmentUrls.length > 0 ? getFileNameFromUrl(assignmentUrls[0]) : undefined,
                                                    assignmentUrl: assignmentUrls.length > 0 ? assignmentUrls.join('\n') : undefined,
                                                    assignmentUrls: assignmentUrls.length > 0 ? assignmentUrls : undefined,
                                                  })
                                                })
                                              } else {
                                                // Không có task con
                                                const assignmentUrls = assignment.supplementaryMaterials?.[0]?.url
                                                  ? Array.isArray(assignment.supplementaryMaterials[0].url)
                                                    ? assignment.supplementaryMaterials[0].url.filter((url: string) => url && url.trim())
                                                    : splitFileUrls(assignment.supplementaryMaterials[0].url)
                                                  : []
                                                detailItemsForAssignment.push({
                                                  id: assignmentId,
                                                  lesson: assignment.name || 'Bài học',
                                                  estimatedTime: 0,
                                                  actualTime: 0,
                                                  result: mapTaskStatusToResult(assignment.status as string | undefined),
                                                  qualityNote: '',
                                                  solutionType: 'text',
                                                  solutionText: undefined,
                                                  solutionFileName: undefined,
                                                  solutionPreview: undefined,
                                                  uploadedFileName: undefined,
                                                  assignmentFileName: assignmentUrls.length > 0 ? getFileNameFromUrl(assignmentUrls[0]) : undefined,
                                                  assignmentUrl: assignmentUrls.length > 0 ? assignmentUrls.join('\n') : undefined,
                                                  assignmentUrls: assignmentUrls.length > 0 ? assignmentUrls : undefined,
                                                })
                                              }
                                              
                                              return (
                                <ChecklistDetailTable
                                                  items={detailItemsForAssignment}
                                  onUpload={onUploadChecklistFile ? (taskId, file, fileIndex) => {
                                    onUploadChecklistFile(taskId, file, fileIndex).catch((error) => {
                                      console.error('Upload checklist file error:', error)
                                    })
                                  } : () => {}}
                                  onDeleteFile={onDeleteChecklistFile ? (taskId, fileIndex) => {
                                    onDeleteChecklistFile(taskId, fileIndex).catch((error) => {
                                      console.error('Delete checklist file error:', error)
                                    })
                                  } : undefined}
                                />
                                              )
                                            })()}
                              </div>
                        )}
                      </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                // Fallback: hiển thị danh sách đơn giản từ scheduleChecklistMap
                                <div className="space-y-3">
                                  {scheduleChecklistMap[activeSchedule.id].map((item) => {
                                    const isExpanded = expandedChecklistItems[item.id] || false
                                    
                                    return (
                                      <div
                                        key={item.id}
                                        className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50"
                                      >
                          <button
                            type="button"
                                          onClick={() => setExpandedChecklistItems((prev) => ({
                                            ...prev,
                                            [item.id]: !prev[item.id]
                                          }))}
                                          className="w-full"
                                        >
                                          <div className="flex items-center justify-between px-4 py-3">
                                            <div className="flex-1 min-w-0 text-left">
                                              <p className="text-sm font-semibold text-gray-900 truncate">{item.lesson}</p>
                                              <p className="text-xs text-gray-600 truncate">{item.task}</p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
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
                                              {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-gray-500" />
                                              ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-500" />
                                              )}
                                  </div>
                                </div>
                          </button>

                                        {isExpanded && (
                                          <div className="px-4 pb-4 pt-2 border-t border-gray-200">
                                <ChecklistDetailTable
                                              items={mapChecklistToDetailItems(activeSchedule.id).filter(
                                                (detailItem) => detailItem.id === item.id
                                              )}
                                              onUpload={onUploadChecklistFile ? (taskId, file, fileIndex) => {
                                                onUploadChecklistFile(taskId, file, fileIndex).catch((error) => {
                                                  console.error('Upload checklist file error:', error)
                                                })
                                              } : () => {}}
                                              onDeleteFile={onDeleteChecklistFile ? (taskId, fileIndex) => {
                                                onDeleteChecklistFile(taskId, fileIndex).catch((error) => {
                                                  console.error('Delete checklist file error:', error)
                                                })
                                              } : undefined}
                                />
                              </div>
                            )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </div>

                      {/* Bài tập hôm nay - Sau checklist */}
                      <div className="rounded-2xl border-2 border-primary-50 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <button
                            type="button"
                            onClick={() => setIsHomeworkCollapsed((prev) => !prev)}
                            className="flex items-center justify-between w-full text-2xl md:text-3xl font-bold text-gray-900 hover:text-primary-600 transition-colors"
                          >
                            <h4 className="text-left">Bài tập hôm nay</h4>
                            {isHomeworkCollapsed ? (
                              <ChevronDown className="w-5 h-5 flex-shrink-0 ml-2" />
                            ) : (
                              <ChevronUp className="w-5 h-5 flex-shrink-0 ml-2" />
                            )}
                          </button>
                        </div>
                        {!isHomeworkCollapsed && (() => {
                          // Lấy tất cả homework được tạo hôm nay (theo createdAt) từ tất cả schedules
                          const allTodayHomework: HomeworkDetailItem[] = []
                          Object.keys(homeworkDetailsMap).forEach((scheduleId) => {
                            const items = homeworkDetailsMap[scheduleId] || []
                            const todayItems = items.filter((item) => {
                              if (!item.createdAt) return false
                              try {
                                const d = new Date(item.createdAt)
                                return isToday(d)
                              } catch {
                                return false
                              }
                            })
                            allTodayHomework.push(...todayItems)
                          })

                          if (allTodayHomework.length > 0) {
                            return (
                              <div className="space-y-4">
                                {allTodayHomework.map((item) => {
                                  const difficultyLabels = {
                                    easy: 'Dễ',
                                    medium: 'Trung bình',
                                    hard: 'Khó',
                                    advanced: 'Nâng cao',
                                  }
                                  const difficultyColors = {
                                    easy: 'bg-green-100 text-green-700',
                                    medium: 'bg-yellow-100 text-yellow-700',
                                    hard: 'bg-red-100 text-red-700',
                                    advanced: 'bg-purple-100 text-purple-700',
                                  }
                                  
                                  return (
                                <div
                                  key={item.id}
                                      className="border-l-4 border-primary-500 bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden"
                                    >
                                      {/* Header */}
                                      <div className="px-4 sm:px-5 py-3 border-b border-gray-200">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-2">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-lg sm:text-xl font-bold text-gray-900 break-words">{item.task}</p>
                                          </div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            {/* Status */}
                                  <span
                                              className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-semibold whitespace-nowrap ${
                                      item.result === 'completed'
                                        ? 'bg-green-100 text-green-700'
                                                  : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                              {item.result === 'completed' ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                                  </span>
                                            {/* Difficulty */}
                                            {item.difficulty && (
                                              <span
                                                className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-semibold whitespace-nowrap ${difficultyColors[item.difficulty]}`}
                                              >
                                                {difficultyLabels[item.difficulty]}
                                              </span>
                                            )}
                                </div>
                            </div>
                                      </div>

                                      {/* Body */}
                                      <div className="px-4 sm:px-5 py-3 sm:py-4">
                                        {/* Grid layout cho thông tin chính */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pb-3 sm:pb-4">
                                          {/* Deadline */}
                                          <div className="flex items-center gap-2 sm:gap-3">
                                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <span className="text-xs sm:text-sm font-medium text-gray-500">Hạn nộp:</span>
                                              <span className="text-sm sm:text-base text-red-600 font-medium ml-2">
                                                {item.deadline
                                                  ? format(new Date(item.deadline), 'dd/MM/yyyy')
                                                  : 'Chưa có'}
                                              </span>
                                            </div>
                                          </div>

                                          {/* File bài tập */}
                                          {(() => {
                                            const assignmentUrls =
                                              item.assignmentUrls && item.assignmentUrls.length > 0
                                                ? item.assignmentUrls
                                                : item.assignmentUrl
                                                  ? splitFileUrls(item.assignmentUrl)
                                                  : []

                                            if (assignmentUrls.length === 0) return null

                                            return (
                                              <div className="flex items-start gap-2 sm:gap-3">
                                                <Folder className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                  <span className="text-xs sm:text-sm font-medium text-gray-500">File Bài Tập:</span>
                                                  <div className="mt-0.5 space-y-1">
                                                    {assignmentUrls.map((url, idx) => {
                                                      const rawName = url.split('/').pop() || url
                                                      const fileName = rawName.split('?')[0] || rawName
                                                      return (
                                                        <a
                                                          key={idx}
                                                          href={url}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="block text-sm sm:text-base text-blue-600 hover:underline break-all"
                                                          title={url}
                                                        >
                                                          {assignmentUrls.length > 1 ? `File ${idx + 1}` : fileName}
                                                        </a>
                                                      )
                                                    })}
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          })()}

                                          {/* Lời giải */}
                                          {(() => {
                                            const solutionUrls =
                                              item.solutionUrls && item.solutionUrls.length > 0
                                                ? item.solutionUrls
                                                : item.solutionUrl
                                                  ? splitFileUrls(item.solutionUrl)
                                                  : []

                                            if (solutionUrls.length === 0) return null

                                            return (
                                              <div
                                                className={`flex items-start gap-2 sm:gap-3 ${
                                                  !item.assignmentUrl && (!item.assignmentUrls || item.assignmentUrls.length === 0)
                                                    ? 'sm:col-span-2'
                                                    : ''
                                                }`}
                                              >
                                                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                  <span className="text-xs sm:text-sm font-medium text-gray-500">Lời giải:</span>
                                                  <div className="mt-0.5 space-y-1">
                                                    {solutionUrls.map((url, idx) => {
                                                      const rawName = url.split('/').pop() || url
                                                      const fileName = rawName.split('?')[0] || rawName
                                                      return (
                                                        <a
                                                          key={idx}
                                                          href={url}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="block text-sm sm:text-base text-blue-600 hover:underline break-all"
                                                          title={url}
                                                        >
                                                          {solutionUrls.length > 1 ? `File lời giải ${idx + 1}` : fileName}
                                                        </a>
                                                      )
                                                    })}
                                                  </div>
                                                </div>
                                              </div>
                                            )
                                          })()}
                                        </div>

                                        {/* Bài làm học sinh - Full width section */}
                                        <div className="pt-2 sm:pt-3 border-t border-gray-100">
                                          <div className="flex flex-col gap-2 sm:gap-3">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                                              <span className="text-xs sm:text-sm font-medium text-gray-500">Bài làm học sinh:</span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pl-6 sm:pl-8">
                                              <div className="flex-1 min-w-0 space-y-2">
                                                {(() => {
                                                  const urls =
                                                    (item as any).studentSolutionFileUrls ||
                                                    (item.studentSolutionFileUrl ? splitFileUrls(item.studentSolutionFileUrl) : [])

                                                  if (urls.length === 0) {
                                                    return (
                                                      <span className="text-sm sm:text-base text-gray-400 block">
                                                        Chưa có bài làm
                                                      </span>
                                                    )
                                                  }

                                                  return (
                                                    <>
                                                      {urls.map((url: string, idx: number) => {
                                                        const fileName = url.split('/').pop() || 'Bài làm học sinh'
                                                        return (
                                                          <div key={idx} className="flex items-center gap-2">
                                                            <a
                                                              href={url}
                                                              target="_blank"
                                                              rel="noopener noreferrer"
                                                              className="text-sm sm:text-base text-blue-600 hover:underline break-all flex-1 min-w-0"
                                                              title={url}
                                                            >
                                                              {urls.length > 1 ? `Bài làm ${idx + 1}` : fileName}
                                                            </a>
                                                            {onUploadHomeworkFile && onDeleteHomeworkFile && (
                                                              <>
                                                                <label
                                                                  className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 cursor-pointer hover:bg-primary-50"
                                                                  title="Thay thế file"
                                                                >
                                                                  <Upload className="w-3.5 h-3.5" />
                                                                  <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                                                    onChange={async (e) => {
                                                                      const file = e.target.files?.[0]
                                                                      if (!file || !onUploadHomeworkFile) return
                                                                      try {
                                                                        await onUploadHomeworkFile(item.id, file, idx)
                                                                        onUploadSuccess()
                                                                      } catch (error) {
                                                                        console.error('Upload failed:', error)
                                                                        alert('Không thể upload file. Vui lòng thử lại.')
                                                                      } finally {
                                                                        e.target.value = ''
                                                                      }
                                                                    }}
                                                                  />
                                                                </label>
                                                                <button
                                                                  type="button"
                                                                  className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-red-300 text-red-600 flex-shrink-0 hover:bg-red-50"
                                                                  title="Xóa file"
                                                                  onClick={async () => {
                                                                    try {
                                                                      await onDeleteHomeworkFile(item.id, idx)
                                                                      onUploadSuccess()
                                                                    } catch (error) {
                                                                      console.error('Delete homework file error:', error)
                                                                      alert('Không thể xóa file. Vui lòng thử lại.')
                                                                    }
                                                                  }}
                                                                >
                                                                  <X className="w-3.5 h-3.5" />
                                                                </button>
                                                              </>
                                                            )}
                                                          </div>
                                                        )
                                                      })}
                                                      {onUploadHomeworkFile && (
                                                        <label
                                                          className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg border border-dashed border-primary-300 text-primary-600 text-xs cursor-pointer hover:bg-primary-50"
                                                          title="Thêm file mới"
                                                        >
                                                          <Plus className="w-3 h-3" />
                                                          <span>Thêm file</span>
                                                          <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                                            onChange={async (e) => {
                                                              const file = e.target.files?.[0]
                                                              if (!file || !onUploadHomeworkFile) return
                                                              
                                                              // Kiểm tra kích thước file (15MB)
                                                              const MAX_FILE_SIZE = 15 * 1024 * 1024
                                                              if (file.size > MAX_FILE_SIZE) {
                                                                alert(`File "${file.name}" vượt quá 15MB. Vui lòng chọn file nhỏ hơn.`)
                                                                e.target.value = ''
                                                                return
                                                              }
                                                              
                                                              // Kiểm tra định dạng file
                                                              const allowedTypes = [
                                                                'application/pdf',
                                                                'image/jpeg',
                                                                'image/jpg',
                                                                'image/png',
                                                                'image/gif',
                                                                'image/webp',
                                                                'application/msword',
                                                                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                                                'application/vnd.ms-powerpoint',
                                                                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                                                                'application/vnd.ms-excel',
                                                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                                                              ]
                                                              const fileExtension = file.name.split('.').pop()?.toLowerCase()
                                                              const isValidType = allowedTypes.includes(file.type) || 
                                                                ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')
                                                              
                                                              if (!isValidType) {
                                                                alert(`Định dạng file "${file.name}" không được hỗ trợ. Vui lòng chọn file PDF, hình ảnh, Word, PowerPoint hoặc Excel.`)
                                                                e.target.value = ''
                                                                return
                                                              }
                                                              
                                                              try {
                                                                await onUploadHomeworkFile(item.id, file)
                                                                onUploadSuccess()
                                                              } catch (error) {
                                                                console.error('Upload failed:', error)
                                                                const errorMessage = error instanceof Error ? error.message : 'Không thể upload file. Vui lòng thử lại.'
                                                                alert(errorMessage)
                                                              } finally {
                                                                e.target.value = ''
                                                              }
                                                            }}
                                                          />
                                                        </label>
                                                      )}
                                                    </>
                                                  )
                                                })()}
                                              </div>
                                              {/* Nếu chưa có file nào thì hiển thị nút upload lớn bên phải */}
                                              {(() => {
                                                const hasFiles =
                                                  (item as any).studentSolutionFileUrls?.length ||
                                                  (item.studentSolutionFileUrl ? splitFileUrls(item.studentSolutionFileUrl).length : 0)

                                                if (hasFiles || !onUploadHomeworkFile) return null

                                                return (
                                                  <label
                                                    className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg border-2 border-primary-500 bg-primary-500 text-white hover:bg-primary-600 shadow-md font-semibold text-sm sm:text-base flex-shrink-0 transition-colors ${
                                                      homeworkUploading === item.id ? 'cursor-wait opacity-60' : 'cursor-pointer'
                                                    }`}
                                                    title="Upload bài làm"
                                                  >
                                                    {homeworkUploading === item.id ? (
                                                      <>
                                                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                                        <span>Đang tải...</span>
                                                      </>
                                                    ) : (
                                                      <>
                                                        <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        <span className="whitespace-nowrap">Upload bài làm</span>
                                                      </>
                                                    )}
                                                    <input
                                                      type="file"
                                                      className="hidden"
                                                      accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                                      onChange={async (e) => {
                                                        const file = e.target.files?.[0]
                                                        if (!file || !onUploadHomeworkFile) return
                                                        
                                                        // Kiểm tra kích thước file (15MB)
                                                        const MAX_FILE_SIZE = 15 * 1024 * 1024
                                                        if (file.size > MAX_FILE_SIZE) {
                                                          alert('File không được vượt quá 15MB. Vui lòng chọn file nhỏ hơn.')
                                                          e.target.value = ''
                                                          return
                                                        }
                                                        
                                                        // Kiểm tra định dạng file
                                                        const allowedTypes = [
                                                          'application/pdf',
                                                          'image/jpeg',
                                                          'image/jpg',
                                                          'image/png',
                                                          'image/gif',
                                                          'image/webp',
                                                          'application/msword',
                                                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                                          'application/vnd.ms-powerpoint',
                                                          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                                                          'application/vnd.ms-excel',
                                                          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                                                        ]
                                                        const fileExtension = file.name.split('.').pop()?.toLowerCase()
                                                        const isValidType = allowedTypes.includes(file.type) || 
                                                          ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')
                                                        
                                                        if (!isValidType) {
                                                          alert('Định dạng file không được hỗ trợ. Vui lòng chọn file PDF, hình ảnh, Word, PowerPoint hoặc Excel.')
                                                          e.target.value = ''
                                                          return
                                                        }
                                                        
                                                        setHomeworkUploading(item.id)
                                                        try {
                                                          await onUploadHomeworkFile(item.id, file)
                                                          onUploadSuccess()
                                                        } catch (error) {
                                                          console.error('Upload failed:', error)
                                                          const errorMessage = error instanceof Error ? error.message : 'Không thể upload file. Vui lòng thử lại.'
                                                          alert(errorMessage)
                                                        } finally {
                                                          setHomeworkUploading(null)
                                                          e.target.value = ''
                                                        }
                                                      }}
                                                      disabled={homeworkUploading === item.id}
                                                    />
                                                  </label>
                                                )
                                              })()}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Nhận xét */}
                                        {item.comment && (
                                          <>
                                            <div className="border-t border-dashed border-gray-300 my-3 sm:my-4"></div>
                                            <div className="flex items-start gap-2 sm:gap-3">
                                              <div className="w-1 h-6 bg-yellow-400 flex-shrink-0 rounded mt-0.5"></div>
                                              <div className="flex-1 min-w-0">
                                                <span className="text-sm sm:text-base font-medium text-gray-700">Nhận xét:</span>
                                                <span className="text-sm sm:text-base text-gray-900 ml-2 break-words block sm:inline">{item.comment}</span>
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          }
                          
                          // Khi chưa có bài tập, chỉ hiển thị thông báo
                          return (
                            <div className="border-l-4 border-primary-500 bg-white rounded-lg shadow-sm overflow-hidden p-6">
                              <div className="flex flex-col items-center justify-center py-8">
                                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                                <p className="text-base font-semibold text-gray-600 mb-2">
                                  Chưa có bài tập nào hôm nay
                                </p>
                                <p className="text-sm text-gray-400">
                                  Giáo viên giao bài tập thì khu vực này sẽ hiển thị chi tiết để bạn nộp bài.
                                </p>
                              </div>
                            </div>
                          )
                        })()}
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
                        <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                          {renderMultilineText(tutorProfile.experience || 'Chưa cập nhật')}
                        </p>
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
                          {renderMultilineText(
                            tutorProfile.bio || tutorProfile.moreInfo || 'Thông tin đang được bổ sung.',
                          )}
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
