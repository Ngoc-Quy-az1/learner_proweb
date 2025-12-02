import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layout } from '../components/common'
import { Sidebar, ScheduleItem, MonthlyCalendar, ChecklistItem, TaskItem } from '../components/dashboard'
import { BookOpen, MessageSquare, TrendingUp, Calendar, Target, UserCircle, Play, ChevronRight, ChevronDown, ChevronUp, Clock, Copy, FileText, Star, Eye, Download, ExternalLink, Layers, PenTool, Plus, Lightbulb, AlertTriangle, Folder, Upload, Loader2 } from 'lucide-react'
import { format, isToday } from 'date-fns'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { apiCall, API_BASE_URL } from '../config/api'
import { getCookie } from '../utils/cookies'
import { useAuth } from '../contexts/AuthContext'
import { splitFileUrls, joinFileUrls } from '../utils/fileUrlHelper'
import { ChecklistDetailTable, MaterialUploadSection, HomeSection, ScheduleSection, type ChecklistDetailItem, type HomeworkDetailItem } from '../components/student'
import StudentSubjectReviewSection from '../components/student/StudentSubjectReviewSection'
import StudentSessionEvaluationSection from '../components/student/StudentSessionEvaluationSection'
import StudentReportSection from '../components/student/StudentReportSection'
import type { ChecklistWithDate } from '../components/student/types'
import type { AssignmentApiItem as TutorAssignmentApiItem } from './TutorDashboard'

interface ScheduleApiItem {
  id: string
  startTime: string
  duration: number
  subjectCode?: string
  studentId?: string
  tutorId?: { id?: string; name?: string; fullName?: string } | string
  meetingURL?: string
  note?: string
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  reportURL?: string
  createdAt?: string
  updatedAt?: string
  supplementaryMaterials?: Array<{
    name?: string
    documentURL?: string
    url?: string
    description?: string
    requirement?: string
  }>
}

interface SchedulePaginatedResponse {
  results: ScheduleApiItem[]
  page: number
  limit: number
  totalPages: number
  totalResults: number
}

interface TutorInfo {
  id: string
  name?: string
  email?: string
  phone?: string
  avatarUrl?: string
  address?: string
  moreInfo?: string
  currentLevel?: string
  cvUrl?: string
  experience?: string
  qualification?: string
  specialties?: string[]
  subjects?: string[]
  totalStudents?: number
  bio?: string
  rating?: number
}

type AssignmentStatus = 'pending' | 'in-progress' | 'completed'
type AssignmentTaskStatus = AssignmentStatus | 'submitted' | 'graded'

interface AssignmentTaskApiItem {
  id?: string
  name?: string
  description?: string
  status?: AssignmentTaskStatus
  estimatedTime?: number
  actualTime?: number
  assignmentUrl?: string
  solutionUrl?: string
  answerURL?: string
}

interface SupplementaryMaterialApiItem {
  name?: string
  url?: string
}

interface AssignmentApiItem {
  id?: string
  _id?: string
  name?: string
  description?: string
  subject?: string
  status?: AssignmentStatus
  tasks?: AssignmentTaskApiItem[]
  scheduleId?: string | { _id?: string; studentId?: { _id: string; name?: string } }
  studentId?: string | { _id: string; name?: string }
  supplementaryMaterials?: SupplementaryMaterialApiItem[]
  createdAt?: string
  updatedAt?: string
}

interface AssignmentPaginatedResponse {
  results: AssignmentApiItem[]
  page: number
  limit: number
  totalPages: number
  totalResults: number
}

type HomeworkTaskStatus = 'pending' | 'submitted' | 'graded'

interface HomeworkTaskApiItem {
  id?: string
  name?: string
  assignmentUrl?: string
  solutionUrl?: string
  answerURL?: string
  status?: HomeworkTaskStatus
  description?: string
}

interface HomeworkApiItem {
  id: string
  studentId?: string
  scheduleId?: string
  name?: string
  description?: string
  deadline?: string
  difficulty?: TaskItem['difficulty']
  subject?: string
  tasks?: HomeworkTaskApiItem[]
  createdAt?: string
  updatedAt?: string
}

interface HomeworkPaginatedResponse {
  results: HomeworkApiItem[]
  page: number
  limit: number
  totalPages: number
  totalResults: number
}

type HomeworkTaskItem = TaskItem & { sessionDate?: Date; sessionTime?: string; sessionId?: string; scheduleId?: string }

const SUBJECT_LABELS: Record<string, string> = {
  math: 'Toán',
  physics: 'Lý',
  chemistry: 'Hóa',
  english: 'Anh',
  literature: 'Văn',
  biology: 'Sinh',
}

const getSubjectLabel = (subjectCode?: string) => {
  if (!subjectCode) return ''
  const normalizedCode = subjectCode.toLowerCase()
  if (normalizedCode === 'general' || normalizedCode === 'string') return ''
  return SUBJECT_LABELS[normalizedCode] || ''
}

const ensureValidDate = (value?: string | Date) => {
  if (!value) return new Date()
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date() : value
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

const mapAssignmentStatusToChecklist = (
  status?: AssignmentTaskStatus
): ChecklistItem['status'] => {
  if (!status || status === 'pending') {
    return 'not_done'
  }
  if (status === 'in-progress') {
    return 'in_progress'
  }
  return 'done'
}

const getAssignmentScheduleId = (assignment: AssignmentApiItem): string | undefined => {
  if (typeof assignment.scheduleId === 'string') return assignment.scheduleId
  if (assignment.scheduleId && typeof assignment.scheduleId === 'object') return assignment.scheduleId._id
  return undefined
}

const mapAssignmentsToChecklistItems = (
  assignments: AssignmentApiItem[],
  scheduleInfoById?: Record<string, { date?: Date; subject?: string }>
): ChecklistWithDate[] => {
  const items: ChecklistWithDate[] = []

  assignments.forEach((assignment) => {
    const scheduleId = getAssignmentScheduleId(assignment)
    const scheduleInfo = scheduleId ? scheduleInfoById?.[scheduleId] : undefined
    const subjectFromSchedule = scheduleInfo?.subject
    const subject =
      getSubjectLabel(assignment.subject) ||
      (subjectFromSchedule ? subjectFromSchedule : '')
    const scheduleDate = scheduleInfo?.date
    const date = scheduleDate ? new Date(scheduleDate) : ensureValidDate(assignment.updatedAt || assignment.createdAt)

    if (assignment.tasks && assignment.tasks.length > 0) {
      assignment.tasks.forEach((task, index) => {
        const assignmentId = assignment.id || assignment._id || `assignment-${index}`
        items.push({
          id: task.id || `${assignmentId}-task-${index}`,
          subject,
          // Bài học: dùng tên nhiệm vụ (task) để khớp bảng tóm tắt của tutor
          lesson: task.name || assignment.name || 'Bài học',
          // Nhiệm vụ: dùng phần mô tả / ghi chú chính của nhiệm vụ
          task: task.description || assignment.description || 'Nhiệm vụ',
          // Ghi chú: lấy trường note riêng của task nếu có
          status: mapAssignmentStatusToChecklist(task.status),
          note: (task as any).note || assignment.description,
          attachment: Array.isArray(task.assignmentUrl) ? task.assignmentUrl.join('\n') : (task.assignmentUrl || assignment.supplementaryMaterials?.[0]?.url),
          date: new Date(date),
          assignmentId: assignmentId,
          taskId: task.id,
          scheduleId,
          assignmentUrl: task.assignmentUrl,
          solutionUrl: task.solutionUrl,
        })
      })
    } else {
      const assignmentId = assignment.id || assignment._id || `assignment-${items.length}`
      items.push({
        id: assignmentId,
        subject,
        // Không có task con: coi tên assignment là bài học, mô tả là nhiệm vụ
        lesson: assignment.name || 'Bài học',
        task: assignment.description || 'Nhiệm vụ',
        status: mapAssignmentStatusToChecklist(assignment.status),
        note: assignment.description,
        date: new Date(date),
        assignmentId: assignmentId,
        scheduleId,
        attachment: Array.isArray(assignment.supplementaryMaterials?.[0]?.url) ? assignment.supplementaryMaterials[0].url.join('\n') : (assignment.supplementaryMaterials?.[0]?.url),
      })
    }
  })

  return items.sort((a, b) => a.date.getTime() - b.date.getTime())
}

const normalizeDifficulty = (value?: string): TaskItem['difficulty'] => {
  if (value === 'easy' || value === 'medium' || value === 'hard' || value === 'advanced') {
    return value
  }
  return 'medium'
}

const mapHomeworkStatusToResult = (status?: HomeworkTaskStatus): HomeworkDetailItem['result'] => {
  if (status === 'graded' || status === 'submitted') {
    return 'completed'
  }
  return 'not_completed'
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

const getFileNameFromUrl = (url?: string) => {
  if (!url) return undefined
  try {
    const withoutQuery = url.split('?')[0]
    const segments = withoutQuery.split('/')
    return segments[segments.length - 1] || url
  } catch {
    return url
  }
}

const mapScheduleFromApi = (schedule: ScheduleApiItem): ScheduleItem => {
  const startDate = new Date(schedule.startTime)
  const durationMinutes = Number(schedule.duration) || 0
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)
  const formatTimeRange = `${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`

  const tutorObject = typeof schedule.tutorId === 'object' && schedule.tutorId !== null ? schedule.tutorId : null
  const tutorName = tutorObject?.name || tutorObject?.fullName
  const tutorId =
    typeof schedule.tutorId === 'string'
      ? schedule.tutorId
      : tutorObject?.id

  const normalizedStatus =
    schedule.status && ['upcoming', 'ongoing', 'completed'].includes(schedule.status)
      ? (schedule.status as ScheduleItem['status'])
      : undefined

  return {
    id: schedule.id,
    subject: getSubjectLabel(schedule.subjectCode),
    time: formatTimeRange,
    date: startDate,
    meetLink: schedule.meetingURL,
    tutor: tutorName,
    tutorId,
    note: schedule.note,
    status: normalizedStatus,
  }
}

// Config cho export report (vẫn cần dùng trong các hàm export)
const checklistResultConfig: Record<
  ChecklistDetailItem['result'],
  { label: string; className: string }
> = {
  completed: { label: 'Hoàn thành', className: 'bg-green-100 text-green-800' },
  not_accurate: { label: 'Chưa chính xác', className: 'bg-yellow-100 text-yellow-800' },
  not_completed: { label: 'Chưa xong', className: 'bg-red-100 text-red-800' },
}

interface DailyReport {
  id: string
  subject: string
  date: Date
  tutor: string
  summary: string
  generalComment?: string
  criteria: {
    id: string
    metric: string
    description: string
    rating: number
    note: string
  }[]
}

// ChecklistDetailTable và HomeworkDetailTable đã được chuyển vào components/student

export default function StudentDashboard() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Get section from URL or default to 'home'
  const sectionFromUrl = searchParams.get('section')
  const validSections = ['home', 'schedule', 'checklist', 'homework', 'analytics']
  const defaultSection = 'home'
  const initialSection = sectionFromUrl && validSections.includes(sectionFromUrl) ? sectionFromUrl : defaultSection
  
  const [activeSection, setActiveSection] = useState(initialSection)
  
  // Sync URL when section changes
  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section)
    setSearchParams({ section }, { replace: false })
  }, [setSearchParams])
  
  // Sync section when URL changes (e.g., back button)
  useEffect(() => {
    const section = searchParams.get('section')
    if (section && validSections.includes(section)) {
      setActiveSection(section)
    } else if (!section) {
      // If no section in URL, set default and update URL
      setActiveSection(defaultSection)
      setSearchParams({ section: defaultSection }, { replace: true })
    }
  }, [searchParams, validSections, defaultSection, setSearchParams])
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [showChecklistOverlay, setShowChecklistOverlay] = useState(false)
  const [selectedTutorSchedule, setSelectedTutorSchedule] = useState<string | null>(null) // ID của schedule được chọn để xem chi tiết tutor
  const [homeworks, setHomeworks] = useState<HomeworkApiItem[]>([])
  const [_isHomeworkLoading, setIsHomeworkLoading] = useState<boolean>(false)
  const [_homeworkError, setHomeworkError] = useState<string | null>(null)
  const [homeworkDetailItems, setHomeworkDetailItems] = useState<Record<string, HomeworkDetailItem[]>>({})
  const [studentHomeworkUploading, setStudentHomeworkUploading] = useState<string | null>(null)

  useEffect(() => {
    if (activeSection !== 'home' && showChecklistOverlay) {
      setShowChecklistOverlay(false)
    }
  }, [activeSection, showChecklistOverlay])
  
  const [checklistItems, setChecklistItems] = useState<ChecklistWithDate[]>([])
  const [assignments, setAssignments] = useState<AssignmentApiItem[]>([])
  const [isChecklistLoading, setIsChecklistLoading] = useState<boolean>(false)
  const [checklistError, setChecklistError] = useState<string | null>(null)
  
  // State cho reviews và reports
  interface ScheduleReview {
    name: string
    rating: number
    comment: string
  }
  const [scheduleReviews, setScheduleReviews] = useState<Record<string, ScheduleReview[]>>({})
  interface ScheduleReport {
    id: string
    subjectCode: string
    startTime: string
    tutor: string
    reportURL: string
  }
  const [scheduleReports, setScheduleReports] = useState<Record<string, ScheduleReport | null>>({})
  const [assignmentReviews, setAssignmentReviews] = useState<Record<string, { reviewId?: string; taskId: string; result: number; comment: string }>>({})
  const [assignmentReviewsLoading, setAssignmentReviewsLoading] = useState(false)
  // Schedules data fetched from API
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [tutorInfoMap, setTutorInfoMap] = useState<Record<string, TutorInfo>>({})
  const [isSchedulesLoading, setIsSchedulesLoading] = useState<boolean>(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [scheduleFetchTrigger, setScheduleFetchTrigger] = useState(0)
  const [assignmentFetchTrigger, setAssignmentFetchTrigger] = useState(0)
  const [selectedUploadScheduleId, setSelectedUploadScheduleId] = useState<string | null>(null)
  const [selectedChecklistScheduleId, setSelectedChecklistScheduleId] = useState<string | null>(null)
  const [selectedChecklistDate, setSelectedChecklistDate] = useState<string | null>(null)
  const [selectedHomeworkDate, setSelectedHomeworkDate] = useState<string | null>(null)
  const [selectedHomeworkSessionId, setSelectedHomeworkSessionId] = useState<string | null>(null)
  const [expandedChecklistItems, setExpandedChecklistItems] = useState<Record<string, boolean>>({})

  const getScheduleStartDateTime = (schedule: ScheduleItem) => {
    const [startRaw] = schedule.time.split(' - ')
    const startDate = new Date(schedule.date)
    if (startRaw) {
      const [hours, minutes] = startRaw.split(':').map(Number)
      startDate.setHours(hours || 0, minutes || 0, 0, 0)
    }
    return startDate
  }

  const upcomingSchedule = useMemo(() => {
    const now = new Date()
    const upcoming = schedules
      .map((schedule) => ({ schedule, start: getScheduleStartDateTime(schedule) }))
      .filter(({ start }) => start >= now)
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0]
    return upcoming ? upcoming.schedule : null
  }, [schedules])

  useEffect(() => {
    let isActive = true

    const fetchSchedules = async () => {
      if (!user) {
        setSchedules([])
        setIsSchedulesLoading(false)
        return
      }

      setIsSchedulesLoading(true)
      setScheduleError(null)

      try {
        const response = await apiCall<SchedulePaginatedResponse>(
          `/schedules?studentId=${user.id}&limit=100&sortBy=startTime:asc`
        )
        if (!isActive) return
        const scheduleResults = response.results || []
        const mappedSchedules = scheduleResults
          .map((schedule) => mapScheduleFromApi(schedule))
          .sort((a, b) => a.date.getTime() - b.date.getTime())

        const tutorIds = new Set<string>()
        scheduleResults.forEach((schedule) => {
          const tutorRef = schedule.tutorId
          const tutorId = typeof tutorRef === 'string' ? tutorRef : tutorRef?.id
          if (tutorId) {
            tutorIds.add(tutorId)
          }
        })

        setSchedules(mappedSchedules)

        if (tutorIds.size > 0) {
          const tutorInfoResults = await Promise.all(
            Array.from(tutorIds).map(async (tutorId) => {
              try {
                // Fetch basic user info
                const userInfo = await apiCall<any>(`/users/${tutorId}`)
                // Fetch detailed tutor info (experience, specialties, etc.)
                let tutorDetailInfo: any = null
                try {
                  tutorDetailInfo = await apiCall<any>(`/tutors/${tutorId}/info`)
                } catch (detailError) {
                  // Tutor info might not exist, that's okay
                  console.log(`No detailed tutor info found for ${tutorId}`)
                }
                
                // Merge user info with tutor detail info
                const mergedInfo: TutorInfo = {
                  id: tutorId,
                  name: userInfo.name,
                  email: userInfo.email,
                  phone: userInfo.phone,
                  avatarUrl: userInfo.avatarUrl || userInfo.avatar,
                  address: userInfo.address,
                  ...(tutorDetailInfo && {
                    experience: tutorDetailInfo.experience,
                    qualification: tutorDetailInfo.qualification,
                    specialties: Array.isArray(tutorDetailInfo.specialties) ? tutorDetailInfo.specialties : [],
                    subjects: Array.isArray(tutorDetailInfo.subjects) ? tutorDetailInfo.subjects : [],
                    totalStudents: typeof tutorDetailInfo.totalStudents === 'number' ? tutorDetailInfo.totalStudents : 0,
                    bio: tutorDetailInfo.bio,
                    cvUrl: tutorDetailInfo.cvUrl,
                    rating: tutorDetailInfo.rating,
                    moreInfo: tutorDetailInfo.bio || userInfo.moreInfo,
                    currentLevel: tutorDetailInfo.qualification || userInfo.currentLevel,
                  }),
                }
                
                return { tutorId, tutorInfo: mergedInfo }
              } catch (error) {
                console.error(`Failed to fetch tutor info for ${tutorId}:`, error)
                return null
              }
            })
          )
          if (!isActive) return
          const nextTutorInfoMap: Record<string, TutorInfo> = {}
          tutorInfoResults.forEach((entry) => {
            if (entry) {
              nextTutorInfoMap[entry.tutorId] = entry.tutorInfo
            }
          })
          setTutorInfoMap(nextTutorInfoMap)
        } else if (isActive) {
          setTutorInfoMap({})
        }
      } catch (error) {
        if (!isActive) return
        const message = error instanceof Error ? error.message : 'Không thể tải lịch học'
        setScheduleError(message)
        setSchedules([])
      } finally {
        if (isActive) {
          setIsSchedulesLoading(false)
        }
      }
    }

    fetchSchedules()

    return () => {
      isActive = false
    }
  }, [user, scheduleFetchTrigger])

  async function handleDeleteHomeworkFile(taskId: string, fileIndex: number) {
    try {
      // Tìm homework và task tương ứng
      for (const homework of homeworks) {
        const tasks = homework.tasks || []
        const taskIndex = tasks.findIndex((t, idx) => t.id === taskId || `${homework.id}-task-${idx}` === taskId)
        if (taskIndex >= 0 && tasks[taskIndex]) {
          const task = tasks[taskIndex]

          // Parse existing answerURL thành mảng
          const existingUrls = task.answerURL
            ? Array.isArray(task.answerURL)
              ? task.answerURL.filter((url: string) => url && url.trim())
              : splitFileUrls(task.answerURL)
            : []

          // Xóa file tại vị trí fileIndex
          const newUrls = existingUrls.filter((_, idx) => idx !== fileIndex)
          // Backend mong đợi answerURL là mảng; gửi [] để xóa hết thay vì undefined (giữ nguyên)
          const newAnswerURLArray = newUrls

          // Payload PATCH homework
          const payload: any = {
            tasks: tasks.map((t, idx) => {
              const isTargetTask = (t.id === task.id || `${homework.id}-task-${idx}` === taskId)
              if (isTargetTask) {
                return {
                  name: t.name || '',
                  assignmentUrl: Array.isArray(t.assignmentUrl) ? t.assignmentUrl : (t.assignmentUrl || undefined),
                  solutionUrl: Array.isArray(t.solutionUrl) ? t.solutionUrl : (t.solutionUrl || undefined),
                  answerURL: newAnswerURLArray,
                  status: t.status || undefined,
                  description: t.description || undefined,
                }
              }
              return {
                name: t.name || '',
                assignmentUrl: Array.isArray(t.assignmentUrl) ? t.assignmentUrl : (t.assignmentUrl || undefined),
                solutionUrl: Array.isArray(t.solutionUrl) ? t.solutionUrl : (t.solutionUrl || undefined),
                answerURL: t.answerURL
                  ? Array.isArray(t.answerURL)
                    ? t.answerURL.filter((url: string) => url && url.trim())
                    : splitFileUrls(t.answerURL)
                  : undefined,
                status: t.status || undefined,
                description: t.description || undefined,
              }
            }),
          }

          await apiCall(`/homeworks/${homework.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })

          // Cập nhật state local cho homeworkDetailItems (đồng bộ với server)
          setHomeworkDetailItems((prev) => {
            const updated: Record<string, HomeworkDetailItem[]> = {}
            Object.entries(prev).forEach(([sessionId, items]) => {
              updated[sessionId] = items.map((item) => {
                if (item.id !== taskId) return item
                const currentUrls =
                  (item as any).studentSolutionFileUrls ||
                  (item.studentSolutionFileUrl ? splitFileUrls(item.studentSolutionFileUrl) : [])
                const nextUrls = currentUrls.filter((_: string, idx: number) => idx !== fileIndex)
                return {
                  ...item,
                  studentSolutionFileUrls: nextUrls,
                  studentSolutionFileUrl: nextUrls.length > 0 ? joinFileUrls(nextUrls) : undefined,
                }
              })
            })
            return updated
          })

          return
        }
      }

      // Fallback: nếu không tìm thấy task trong danh sách homework,
      // vẫn cập nhật state local để UI phản hồi ngay.
      setHomeworkDetailItems((prev) => {
        const updated: Record<string, HomeworkDetailItem[]> = {}
        Object.entries(prev).forEach(([sessionId, items]) => {
          updated[sessionId] = items.map((item) => {
            if (item.id !== taskId) return item
            const currentUrls =
              (item as any).studentSolutionFileUrls ||
              (item.studentSolutionFileUrl ? splitFileUrls(item.studentSolutionFileUrl) : [])
            const nextUrls = currentUrls.filter((_: string, idx: number) => idx !== fileIndex)
            return {
              ...item,
              studentSolutionFileUrls: nextUrls,
              studentSolutionFileUrl: nextUrls.length > 0 ? joinFileUrls(nextUrls) : undefined,
            }
          })
        })
        return updated
      })
    } catch (error) {
      console.error('Failed to delete homework file:', error)
      alert('Không thể xóa file bài làm. Vui lòng thử lại.')
      throw error
    }
  }

  const scheduleInfoById = useMemo(() => {
    const map: Record<string, { date?: Date; subject?: string }> = {}
    schedules.forEach((schedule) => {
      map[schedule.id] = { date: schedule.date, subject: schedule.subject }
    })
    return map
  }, [schedules])

  useEffect(() => {
    let isActive = true

    const fetchAssignments = async () => {
      if (!user) {
        if (isActive) {
          setChecklistItems([])
          setChecklistError(null)
        }
        return
      }

      setIsChecklistLoading(true)
      setChecklistError(null)

      const query = new URLSearchParams({
        studentId: user.id,
        limit: '200',
        sortBy: 'updatedAt:desc',
      }).toString()

      try {
        const response = await apiCall<AssignmentPaginatedResponse>(`/assignments?${query}`)
        if (!isActive) return
        const assignmentsData = response.results || []
        setAssignments(assignmentsData)
        setChecklistItems(mapAssignmentsToChecklistItems(assignmentsData, scheduleInfoById))
      } catch (error) {
        if (!isActive) return
        const message = error instanceof Error ? error.message : 'Không thể tải checklist'
        setChecklistError(message)
        setChecklistItems([])
      } finally {
        if (isActive) {
          setIsChecklistLoading(false)
        }
      }
    }

    fetchAssignments()

    return () => {
      isActive = false
    }
  }, [user, scheduleInfoById, assignmentFetchTrigger])

  useEffect(() => {
    let isActive = true

    const fetchHomeworks = async () => {
      if (!user) {
        if (isActive) {
          setHomeworks([])
          setHomeworkError(null)
          setIsHomeworkLoading(false)
        }
        return
      }

      setIsHomeworkLoading(true)
      setHomeworkError(null)

      const query = new URLSearchParams({
        studentId: user.id,
        limit: '200',
        sortBy: 'deadline:asc',
      }).toString()

      try {
        const response = await apiCall<HomeworkPaginatedResponse>(`/homeworks?${query}`)
        if (!isActive) return
        setHomeworks(response.results || [])
      } catch (error) {
        if (!isActive) return
        const message = error instanceof Error ? error.message : 'Không thể tải bài tập về nhà'
        setHomeworkError(message)
        setHomeworks([])
      } finally {
        if (isActive) {
          setIsHomeworkLoading(false)
        }
      }
    }

    fetchHomeworks()

    return () => {
      isActive = false
    }
  }, [user])

  useEffect(() => {
    const scheduleMap = schedules.reduce<Record<string, ScheduleItem>>((acc, schedule) => {
      acc[schedule.id] = schedule
      return acc
    }, {})

    const sessionMap = new Map<string, HomeworkTaskItem>()
    const detailsMap: Record<string, HomeworkDetailItem[]> = {}

    homeworks.forEach((homework) => {
      const schedule = homework.scheduleId ? scheduleMap[homework.scheduleId] : undefined
      const sessionId = homework.scheduleId || homework.id
      const sessionDate = schedule?.date ?? ensureValidDate(homework.deadline)
      const sessionTime = schedule?.time
      const subject = getSubjectLabel(homework.subject)
      const deadlineDate = homework.deadline ? ensureValidDate(homework.deadline) : sessionDate
      const difficulty = normalizeDifficulty(homework.difficulty)

      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          id: homework.id,
          task: homework.name || 'Bài tập',
          subject,
          difficulty,
          deadline: deadlineDate ? format(deadlineDate, 'dd/MM') : format(new Date(), 'dd/MM'),
          sessionDate,
          sessionTime,
          sessionId,
          scheduleId: homework.scheduleId,
        })
      }

      const mappedTasks: HomeworkDetailItem[] =
        homework.tasks?.map((task, index): HomeworkDetailItem => ({
          id: task.id || `${homework.id}-task-${index}`,
          task: task.name || homework.name || 'Bài tập',
          estimatedTime: 0,
          actualTime: undefined,
          difficulty,
          result: mapHomeworkStatusToResult(task.status),
          comment: task.description || homework.description,
          solutionType: task.solutionUrl ? 'file' : undefined,
          solutionText: undefined,
          solutionFileName: getFileNameFromUrl(task.solutionUrl),
          solutionUrl: task.solutionUrl,
          solutionUrls: Array.isArray((task as any).solutionUrl)
            ? ((task as any).solutionUrl as string[])
            : task.solutionUrl
              ? splitFileUrls(task.solutionUrl)
              : [],
          assignmentFileName: getFileNameFromUrl(task.assignmentUrl),
          assignmentUrl: task.assignmentUrl,
          assignmentUrls: Array.isArray((task as any).assignmentUrl)
            ? ((task as any).assignmentUrl as string[])
            : task.assignmentUrl
              ? splitFileUrls(task.assignmentUrl)
              : [],
          deadline: homework.deadline,
          // Bài làm HS - backend có thể trả answerURL là string hoặc array
          ...(() => {
            const rawAnswer = (task as any).answerURL
            const urls = rawAnswer
              ? Array.isArray(rawAnswer)
                ? rawAnswer.filter((url: string) => url && url.trim())
                : splitFileUrls(rawAnswer)
              : []

            return {
              studentSolutionFileUrls: urls,
              // Giữ string gộp cho tương thích chỗ cũ (nếu cần)
              studentSolutionFileUrl: urls.length > 0 ? joinFileUrls(urls) : undefined,
            }
          })(),
          createdAt: homework.createdAt,
        })) || []

      const fallbackTask: HomeworkDetailItem[] =
        mappedTasks.length === 0
          ? [
              {
                id: `${homework.id}-summary`,
                task: homework.name || 'Bài tập',
                estimatedTime: 0,
                actualTime: undefined,
                difficulty,
                result: 'not_completed',
                comment: homework.description,
                solutionType: undefined,
                solutionText: undefined,
                solutionFileName: undefined,
                assignmentFileName: undefined,
                createdAt: homework.createdAt,
              },
            ]
          : []

      detailsMap[sessionId] = [...(detailsMap[sessionId] || []), ...mappedTasks, ...fallbackTask]
    })

    setHomeworkDetailItems(detailsMap)
  }, [homeworks, schedules])

  // Filter today's data
  const todaySchedules = schedules.filter(s => isToday(s.date))
  
  // Fetch schedule reviews và reports
  useEffect(() => {
    if (!user?.id || schedules.length === 0) return
    let cancelled = false

    const fetchScheduleDetails = async () => {
      for (const schedule of schedules) {
        if (cancelled) return
        try {
          // Fetch reviews
          if (!scheduleReviews[schedule.id]) {
            const scheduleData = await apiCall<{ id: string; reviews?: Array<{ name: string; rating: number; comment: string }> }>(`/schedules/${schedule.id}`)
            if (scheduleData.reviews && Array.isArray(scheduleData.reviews)) {
              const defaultReviews = [
                { name: 'Mức độ tập trung', rating: 0, comment: '' },
                { name: 'Hiểu nội dung bài học', rating: 0, comment: '' },
                { name: 'Hoàn thành nhiệm vụ', rating: 0, comment: '' },
                { name: 'Thái độ & tinh thần học', rating: 0, comment: '' },
                { name: 'Kỹ năng trình bày & tư duy', rating: 0, comment: '' },
              ]
              const normalizedReviews = defaultReviews.map((defaultReview, index) => {
                const savedReview = scheduleData.reviews?.[index]
                if (savedReview) {
                  return {
                    name: defaultReview.name,
                    rating: savedReview.rating ?? 0,
                    comment: savedReview.comment || '',
                  }
                }
                return defaultReview
              })
              setScheduleReviews((prev) => ({
                ...prev,
                [schedule.id]: normalizedReviews,
              }))
            }
          }
          // Fetch reports
          if (!scheduleReports[schedule.id]) {
            try {
              const report = await apiCall<ScheduleReport>(`/reports/${schedule.id}`)
              setScheduleReports((prev) => ({
                ...prev,
                [schedule.id]: report,
              }))
            } catch (error) {
              // Report có thể chưa tồn tại, không cần xử lý lỗi
              setScheduleReports((prev) => ({
                ...prev,
                [schedule.id]: null,
              }))
            }
          }
        } catch (error) {
          console.error(`Failed to fetch schedule details for ${schedule.id}:`, error)
        }
      }
    }

    fetchScheduleDetails()

    return () => {
      cancelled = true
    }
  }, [user?.id, schedules, scheduleReviews, scheduleReports])

  // Fetch assignment reviews
  useEffect(() => {
    if (!user?.id || assignments.length === 0) return
    let cancelled = false
    setAssignmentReviewsLoading(true)

    const loadReviews = async () => {
      try {
        const reviewResults = await Promise.all(
          assignments.map(async (assignment, index) => {
            const assignmentID = assignment.id || assignment._id
            const assignmentKey =
              assignment.id || assignment._id || `${assignment.subject || 'subject'}-${index}`

            if (!assignmentID) return { assignmentKey, review: null }

            try {
              const review = await apiCall<{ id: string; assignmentID?: string; comment?: string }>(
                `/reviews/assignment/${assignmentID}`
              )
              return { assignmentKey, review }
            } catch {
              // Nếu API đánh giá chưa tồn tại (404) hoặc lỗi khác, coi như chưa có review
              return { assignmentKey, review: null }
            }
          })
        )

        if (cancelled) return

        const next: Record<string, { reviewId?: string; taskId: string; result: number; comment: string }> = {}
        reviewResults.forEach((result) => {
          const key = result.assignmentKey
          if (!key) return
          next[key] = {
            reviewId: result.review?.id,
            taskId: result.review?.assignmentID || '',
            result: 0,
            comment: result.review?.comment || '',
          }
        })
        setAssignmentReviews(next)
      } catch {
        // Bỏ qua lỗi tổng, vì từng request đã được xử lý an toàn phía trên
      } finally {
        if (!cancelled) {
          setAssignmentReviewsLoading(false)
        }
      }
    }

    loadReviews()

    return () => {
      cancelled = true
    }
  }, [user?.id, assignments])

  const handleStatusChange = (id: string, status: ChecklistItem['status']) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    )
  }

  const checklistItemsBySchedule = useMemo(() => {
    return checklistItems.reduce<Record<string, ChecklistWithDate[]>>((acc, item) => {
      if (!item.scheduleId) return acc
      if (!acc[item.scheduleId]) {
        acc[item.scheduleId] = []
      }
      acc[item.scheduleId].push(item)
      return acc
    }, {})
  }, [checklistItems])


  const [detailItemsBySubject, setDetailItemsBySubject] = useState<Record<string, ChecklistDetailItem[]>>({
    Toán: [
      {
        id: 'math-1',
        lesson: 'Bài 3 – Giải hệ bằng phương pháp thế',
        estimatedTime: 10,
        actualTime: 12,
        result: 'completed',
        qualityNote: 'Làm đúng, trình bày rõ',
        solutionType: 'text',
        solutionText: 'Áp dụng phương pháp thế, trình bày từng bước.',
        uploadedFileName: 'bai_3_giai_he_phuong_trinh.pdf',
        assignmentFileName: 'bai_tap_3_giai_he_phuong_phap_the.pdf',
      },
      {
        id: 'math-2',
        lesson: 'Bài 4 – Giải hệ bằng cộng đại số',
        estimatedTime: 15,
        actualTime: 20,
        result: 'not_accurate',
        qualityNote: 'Sai bước chuyển vế',
        solutionType: 'text',
        solutionText: 'Nhắc lại quy tắc cộng đại số và kiểm tra dấu.',
        uploadedFileName: 'bai_4_cong_dai_so.pdf',
        assignmentFileName: 'bai_tap_4_cong_dai_so.pdf',
      },
      {
        id: 'math-3',
        lesson: 'Bài 5 – Bài nâng cao',
        estimatedTime: 20,
        actualTime: 25,
        result: 'not_completed',
        qualityNote: 'Cần luyện thêm phần rút gọn',
        solutionType: 'text',
        solutionText: 'Đề xuất luyện thêm 3 bài tương tự với tutor.',
        assignmentFileName: 'bai_tap_5_nang_cao.pdf',
      },
    ],
    Hóa: [
      {
        id: 'chem-1',
        lesson: 'Bài 1 – Nhận biết oxi hoá khử',
        estimatedTime: 12,
        actualTime: 12,
        result: 'completed',
        qualityNote: 'Hoàn thành đúng chuẩn',
        solutionType: 'text',
        solutionText: 'Liệt kê 3 phản ứng minh họa chuẩn xác.',
        uploadedFileName: 'bai_1_oxi_hoa_khu.pdf',
        solutionFileName: 'loi_giai_bai_1.pdf',
        assignmentFileName: 'bai_tap_1_nhan_biet_oxi_hoa_khu.pdf',
      },
      {
        id: 'chem-2',
        lesson: 'Bài 2 – Cân bằng PTHH',
        estimatedTime: 18,
        actualTime: 17,
        result: 'completed',
        qualityNote: 'Trình bày đẹp, không sai sót',
        solutionType: 'text',
        solutionText: 'Áp dụng phương pháp thăng bằng electron.',
        uploadedFileName: 'bai_2_can_bang_pthh.pdf',
        solutionFileName: 'loi_giai_bai_2.pdf',
        assignmentFileName: 'bai_tap_2_can_bang_pthh.pdf',
      },
      {
        id: 'chem-3',
        lesson: 'Bài 3 – Ứng dụng thực tế',
        estimatedTime: 15,
        actualTime: 14,
        result: 'completed',
        qualityNote: 'Giải thích rõ ràng, đầy đủ ví dụ',
        solutionType: 'text',
        solutionText: 'Nêu 2 ví dụ phản ứng thực tế và giải thích.',
        uploadedFileName: 'bai_3_ung_dung_thuc_te.pdf',
        solutionFileName: 'loi_giai_bai_3.pdf',
        assignmentFileName: 'bai_tap_3_ung_dung_thuc_te.pdf',
      },
    ],
  })

  const getSubjectDetailItems = (subject: string) => detailItemsBySubject[subject] || []
  const updateSubjectDetailItems = (
    subject: string,
    updater: (items: ChecklistDetailItem[]) => ChecklistDetailItem[]
  ) => {
    setDetailItemsBySubject((prev) => {
      const currentItems = prev[subject] || []
      return {
        ...prev,
        [subject]: updater(currentItems),
      }
    })
  }

  const handleUploadHomeworkFile = async (taskId: string, file: File, fileIndex?: number) => {
    try {
      // Upload file lên server
      const formData = new FormData()
      formData.append('file', file)
      const accessToken = getCookie('accessToken')
      const response = await fetch(`${API_BASE_URL}/files/upload`, {
        method: 'POST',
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Không thể tải file. Vui lòng thử lại.')
      }
      
      const data = await response.json()
      const fileUrl =
        data?.url ||
        data?.file?.url ||
        (Array.isArray(data?.files) ? data.files[0]?.url : null)
      
      if (!fileUrl) {
        throw new Error('Không nhận được link file sau khi tải lên.')
      }

      // Tìm homework và task tương ứng
      for (const homework of homeworks) {
        const tasks = homework.tasks || []
        const taskIndex = tasks.findIndex((t, idx) => t.id === taskId || `${homework.id}-task-${idx}` === taskId)
        if (taskIndex >= 0 && tasks[taskIndex]) {
          const task = tasks[taskIndex]
          
          // Parse existing answerURL to array (luôn dùng mảng để gửi lên backend)
          const existingUrls = task.answerURL
            ? Array.isArray(task.answerURL)
              ? task.answerURL.filter((url: string) => url && url.trim())
              : splitFileUrls(task.answerURL)
            : []
          
          // Update URLs: nếu có fileIndex thì replace/append, nếu không thì thêm mới (multi-file)
          let newUrls: string[]
          if (fileIndex !== undefined && fileIndex >= 0 && fileIndex < existingUrls.length) {
            // Thay thế file tại vị trí cụ thể
            newUrls = [...existingUrls]
            newUrls[fileIndex] = fileUrl
          } else {
            // Thêm file mới
            newUrls = [...existingUrls, fileUrl]
          }
          
          // Mảng URL để gửi lên backend (API yêu cầu answerURL là array)
          const newAnswerURLArray = newUrls
          // String chỉ dùng để cập nhật state hiển thị tạm thời
          const newAnswerURL = joinFileUrls(newUrls)
          
          // Cập nhật homework task với answerURL
          // Chỉ gửi các trường được phép theo validation schema
          const payload: any = {
            tasks: tasks.map((t, idx) => {
              const isTargetTask = (t.id === task.id || `${homework.id}-task-${idx}` === taskId)
              
              if (isTargetTask) {
                // Chỉ gửi các trường được phép, loại bỏ _id, id, và các trường MongoDB khác
                return {
                  name: t.name || '',
                  assignmentUrl: Array.isArray(t.assignmentUrl) ? t.assignmentUrl : (t.assignmentUrl || undefined),
                  solutionUrl: Array.isArray(t.solutionUrl) ? t.solutionUrl : (t.solutionUrl || undefined),
                  answerURL: newAnswerURLArray, // Gửi mảng answerURL cho backend
                  status: t.status || undefined,
                  description: t.description || undefined,
                }
              } else {
                // Giữ nguyên task khác nhưng cũng loại bỏ _id
                return {
                  name: t.name || '',
                  assignmentUrl: Array.isArray(t.assignmentUrl) ? t.assignmentUrl : (t.assignmentUrl || undefined),
                  solutionUrl: Array.isArray(t.solutionUrl) ? t.solutionUrl : (t.solutionUrl || undefined),
                  answerURL: t.answerURL
                    ? Array.isArray(t.answerURL)
                      ? t.answerURL.filter((url: string) => url && url.trim())
                      : splitFileUrls(t.answerURL)
                    : undefined,
                  status: t.status || undefined,
                  description: t.description || undefined,
                }
              }
            })
          }
          
          // Loại bỏ các trường undefined để payload gọn hơn
          payload.tasks = payload.tasks.map((task: any) => {
            const cleaned: any = {}
            Object.keys(task).forEach(key => {
              if (task[key] !== undefined && task[key] !== null && task[key] !== '') {
                cleaned[key] = task[key]
              }
            })
            return cleaned
          })

          await apiCall(`/homeworks/${homework.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })

          // Cập nhật state
          setHomeworkDetailItems((prev) => {
            const updatedEntries: Record<string, HomeworkDetailItem[]> = {}
            Object.entries(prev).forEach(([sessionId, items]) => {
              updatedEntries[sessionId] = items.map((item) =>
                item.id === taskId
                  ? {
                      ...item,
                      studentSolutionFileUrl: newAnswerURL,
                      studentSolutionFileUrls: newAnswerURLArray,
                      uploadedFileName: file.name,
                    }
                  : item
              )
            })
            return updatedEntries
          })

          // Reload homeworks để cập nhật dữ liệu - trigger fetch lại
          setIsHomeworkLoading(true)
          try {
            const response = await apiCall<HomeworkPaginatedResponse>(`/homeworks?studentId=${user?.id}&limit=200`)
            if (response.results) {
              setHomeworks(response.results)
            }
          } catch (error) {
            console.error('Failed to reload homeworks:', error)
          } finally {
            setIsHomeworkLoading(false)
          }
          return
        }
      }
    } catch (error) {
      console.error('Failed to upload homework file:', error)
      const message = error instanceof Error ? error.message : 'Không thể tải file. Vui lòng thử lại.'
      alert(message)
      throw error
    }
  }

  const handleDetailFileUpload = (subject: string, id: string, file: File) => {
    updateSubjectDetailItems(subject, (items) =>
      items.map((item) => (item.id === id ? { ...item, uploadedFileName: file.name } : item))
    )
  }

  const handleUploadChecklistFile = async (taskId: string, file: File, fileIndex?: number) => {
    try {
      // Upload file lên server
      const formData = new FormData()
      formData.append('file', file)
      const accessToken = getCookie('accessToken')
      const response = await fetch(`${API_BASE_URL}/files/upload`, {
        method: 'POST',
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Không thể tải file. Vui lòng thử lại.')
      }
      
      const data = await response.json()
      const fileUrl =
        data?.url ||
        data?.file?.url ||
        (Array.isArray(data?.files) ? data.files[0]?.url : null)
      
      if (!fileUrl) {
        throw new Error('Không nhận được link file sau khi tải lên.')
      }

      // Tìm assignment và task tương ứng
      for (const assignment of assignments) {
        const assignmentId = assignment._id || assignment.id
        if (!assignmentId) continue
        
        const tasks = assignment.tasks || []
        const taskIndex = tasks.findIndex((t, idx) => {
          const tId = t.id || `${assignmentId}-task-${idx}`
          return tId === taskId || t.id === taskId
        })
        
        if (taskIndex >= 0 && tasks[taskIndex]) {
          const task = tasks[taskIndex]
          
          // Map task status từ API sang frontend
          const mapTaskStatusToApi = (status?: string): 'pending' | 'in-progress' | 'submitted' | 'undone' => {
            if (!status || status === 'pending') return 'pending'
            if (status === 'in-progress') return 'in-progress'
            if (status === 'completed' || status === 'submitted') return 'submitted'
            return 'pending'
          }
          
          // Parse existing answerURL to array (luôn dùng mảng để gửi lên backend)
          const existingUrls = task.answerURL
            ? Array.isArray(task.answerURL)
              ? task.answerURL.filter((url: string) => url && url.trim())
              : splitFileUrls(task.answerURL)
            : []
          
          // Update URLs: replace at fileIndex or add new
          let newUrls: string[]
          if (fileIndex !== undefined && fileIndex >= 0 && fileIndex < existingUrls.length) {
            // Replace file at specific index
            newUrls = [...existingUrls]
            newUrls[fileIndex] = fileUrl
          } else {
            // Add new file
            newUrls = [...existingUrls, fileUrl]
          }
          
          // Mảng URL để gửi lên backend (API yêu cầu answerURL là array)
          const newAnswerURLArray = newUrls
          
          // Cập nhật assignment task với answerURL
          const payload: any = {
            tasks: tasks.map((t, idx) => {
              const isTargetTask = (t.id === task.id || `${assignmentId}-task-${idx}` === taskId)
              
              if (isTargetTask) {
                // Chỉ gửi các trường được phép
                return {
                  name: t.name || '',
                  description: t.description || undefined,
                  status: mapTaskStatusToApi(t.status),
                  estimatedTime: typeof t.estimatedTime === 'number' && !Number.isNaN(t.estimatedTime)
                    ? Math.max(t.estimatedTime, 1)
                    : 1,
                  actualTime: typeof t.actualTime === 'number' ? t.actualTime : undefined,
                  assignmentUrl: Array.isArray(t.assignmentUrl) ? t.assignmentUrl : (t.assignmentUrl || undefined),
                  answerURL: newAnswerURLArray, // Cập nhật answerURL với nhiều file (mảng)
                  solutionUrl: Array.isArray(t.solutionUrl) ? t.solutionUrl : (t.solutionUrl || undefined),
                  note: (t as any).note || undefined,
                }
              } else {
                // Giữ nguyên task khác
                return {
                  name: t.name || '',
                  description: t.description || undefined,
                  status: mapTaskStatusToApi(t.status),
                  estimatedTime: typeof t.estimatedTime === 'number' && !Number.isNaN(t.estimatedTime)
                    ? Math.max(t.estimatedTime, 1)
                    : 1,
                  actualTime: typeof t.actualTime === 'number' ? t.actualTime : undefined,
                  assignmentUrl: Array.isArray(t.assignmentUrl) ? t.assignmentUrl : (t.assignmentUrl || undefined),
                  answerURL: t.answerURL
                    ? Array.isArray(t.answerURL)
                      ? t.answerURL.filter((url: string) => url && url.trim())
                      : splitFileUrls(t.answerURL)
                    : undefined,
                  solutionUrl: Array.isArray(t.solutionUrl) ? t.solutionUrl : (t.solutionUrl || undefined),
                  note: (t as any).note || undefined,
                }
              }
            })
          }
          
          // Loại bỏ các trường undefined để payload gọn hơn
          payload.tasks = payload.tasks.map((task: any) => {
            const cleaned: any = {}
            Object.keys(task).forEach(key => {
              if (task[key] !== undefined && task[key] !== null && task[key] !== '') {
                cleaned[key] = task[key]
              }
            })
            return cleaned
          })

          await apiCall(`/assignments/${assignmentId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })

          // Reload assignments để cập nhật dữ liệu
          setAssignmentFetchTrigger((prev) => prev + 1)
          return
        }
      }
      
      throw new Error('Không tìm thấy task tương ứng.')
    } catch (error) {
      console.error('Failed to upload checklist file:', error)
      const message = error instanceof Error ? error.message : 'Không thể tải file. Vui lòng thử lại.'
      alert(message)
      throw error
    }
  }

  const handleDeleteChecklistFile = async (taskId: string, fileIndex: number) => {
    try {
      // Tìm assignment và task tương ứng
      for (const assignment of assignments) {
        const assignmentId = assignment._id || assignment.id
        if (!assignmentId) continue
        
        const tasks = assignment.tasks || []
        const taskIndex = tasks.findIndex((t, idx) => {
          const tId = t.id || `${assignmentId}-task-${idx}`
          return tId === taskId || t.id === taskId
        })
        
        if (taskIndex >= 0 && tasks[taskIndex]) {
          const task = tasks[taskIndex]
          
          // Map task status từ API sang frontend
          const mapTaskStatusToApi = (status?: string): 'pending' | 'in-progress' | 'submitted' | 'undone' => {
            if (!status || status === 'pending') return 'pending'
            if (status === 'in-progress') return 'in-progress'
            if (status === 'completed' || status === 'submitted') return 'submitted'
            return 'pending'
          }
          
          // Parse existing answerURL to array (luôn dùng mảng để gửi lên backend)
          const existingUrls = task.answerURL
            ? Array.isArray(task.answerURL)
              ? task.answerURL.filter((url: string) => url && url.trim())
              : splitFileUrls(task.answerURL)
            : []
          
          // Remove file at fileIndex
          const newUrls = existingUrls.filter((_, idx) => idx !== fileIndex)
          
          // Mảng URL để gửi lên backend (API yêu cầu answerURL là array)
          const newAnswerURLArray = newUrls.length > 0 ? newUrls : undefined
          
          // Cập nhật assignment task với answerURL
          const payload: any = {
            tasks: tasks.map((t, idx) => {
              const isTargetTask = (t.id === task.id || `${assignmentId}-task-${idx}` === taskId)
              
              if (isTargetTask) {
                // Chỉ gửi các trường được phép
                return {
                  name: t.name || '',
                  description: t.description || undefined,
                  status: mapTaskStatusToApi(t.status),
                  estimatedTime: typeof t.estimatedTime === 'number' && !Number.isNaN(t.estimatedTime)
                    ? Math.max(t.estimatedTime, 1)
                    : 1,
                  actualTime: typeof t.actualTime === 'number' ? t.actualTime : undefined,
                  assignmentUrl: Array.isArray(t.assignmentUrl) ? t.assignmentUrl : (t.assignmentUrl || undefined),
                  answerURL: newAnswerURLArray, // Cập nhật answerURL sau khi xóa file (mảng)
                  solutionUrl: Array.isArray(t.solutionUrl) ? t.solutionUrl : (t.solutionUrl || undefined),
                  note: (t as any).note || undefined,
                }
              } else {
                // Giữ nguyên task khác
                return {
                  name: t.name || '',
                  description: t.description || undefined,
                  status: mapTaskStatusToApi(t.status),
                  estimatedTime: typeof t.estimatedTime === 'number' && !Number.isNaN(t.estimatedTime)
                    ? Math.max(t.estimatedTime, 1)
                    : 1,
                  actualTime: typeof t.actualTime === 'number' ? t.actualTime : undefined,
                  assignmentUrl: Array.isArray(t.assignmentUrl) ? t.assignmentUrl : (t.assignmentUrl || undefined),
                  answerURL: t.answerURL
                    ? Array.isArray(t.answerURL)
                      ? t.answerURL.filter((url: string) => url && url.trim())
                      : splitFileUrls(t.answerURL)
                    : undefined,
                  solutionUrl: Array.isArray(t.solutionUrl) ? t.solutionUrl : (t.solutionUrl || undefined),
                  note: (t as any).note || undefined,
                }
              }
            })
          }
          
          // Loại bỏ các trường undefined để payload gọn hơn
          payload.tasks = payload.tasks.map((task: any) => {
            const cleaned: any = {}
            Object.keys(task).forEach(key => {
              if (task[key] !== undefined && task[key] !== null && task[key] !== '') {
                cleaned[key] = task[key]
              }
            })
            return cleaned
          })

          await apiCall(`/assignments/${assignmentId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })

          // Reload assignments để cập nhật dữ liệu
          setAssignmentFetchTrigger((prev) => prev + 1)
          return
        }
      }
      
      throw new Error('Không tìm thấy task tương ứng.')
    } catch (error) {
      console.error('Failed to delete checklist file:', error)
      const message = error instanceof Error ? error.message : 'Không thể xóa file. Vui lòng thử lại.'
      alert(message)
      throw error
    }
  }

  const handleJoinClass = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId)
    if (schedule?.meetLink) {
      window.open(schedule.meetLink, '_blank')
    }
  }

  const handleReloadSchedules = () => {
    setScheduleFetchTrigger((prev) => prev + 1)
  }


  const todayDateKey = format(new Date(), 'yyyy-MM-dd')
  const reportSummaries = [
    {
      id: 'report-math-today',
      subject: 'Toán',
      date: new Date(),
      tutor: 'Tutor B',
      summary: 'Ôn luyện chương 3, tập trung vào bài nâng cao.',
      generalComment: 'Học sinh phần tính nhẩm hơi yếu, anh chị nhắc nhở cháu thôi.',
      criteria: [
        {
          id: 'r1',
          metric: 'Mức độ tập trung',
          description: 'Học sinh có duy trì sự chú ý suốt buổi học.',
          rating: 4,
          note: 'Mất tập trung 5 phút giữa buổi.',
        },
        {
          id: 'r2',
          metric: 'Hiểu nội dung bài học',
          description: 'Hiểu khái niệm, nắm được cách làm bài.',
          rating: 4,
          note: 'Hiểu phần cơ bản, còn nhầm nâng cao.',
        },
        {
          id: 'r3',
          metric: 'Hoàn thành nhiệm vụ',
          description: 'Làm đủ, đúng thời gian và yêu cầu.',
          rating: 4,
          note: '2/3 bài hoàn thành tốt.',
        },
        {
          id: 'r4',
          metric: 'Thái độ & tinh thần học',
          description: 'Chủ động hỏi, hợp tác, tôn trọng giờ học.',
          rating: 5,
          note: 'Thái độ tích cực.',
        },
        {
          id: 'r5',
          metric: 'Kỹ năng trình bày & tư duy',
          description: 'Trình bày rõ ràng, biết giải thích lại bài.',
          rating: 3,
          note: 'Cần rèn thêm diễn đạt lời giải.',
        },
      ],
    },
    {
      id: 'report-chem-today',
      subject: 'Hóa',
      date: new Date(),
      tutor: 'Tutor C',
      summary: 'Luyện tập phần phản ứng oxi hoá khử.',
      generalComment: 'Cháu làm bài tốt, nhưng cần chú ý hơn phần cân bằng phương trình.',
      criteria: [
        {
          id: 'r1',
          metric: 'Mức độ tập trung',
          description: 'Học sinh có duy trì sự chú ý suốt buổi học.',
          rating: 5,
          note: 'Tập trung suốt buổi.',
        },
        {
          id: 'r2',
          metric: 'Hiểu nội dung bài học',
          description: 'Hiểu khái niệm, nắm được cách làm bài.',
          rating: 4,
          note: 'Hiểu khái niệm mới khá nhanh.',
        },
        {
          id: 'r3',
          metric: 'Hoàn thành nhiệm vụ',
          description: 'Làm đủ, đúng thời gian và yêu cầu.',
          rating: 5,
          note: 'Hoàn thành toàn bộ bài thực hành.',
        },
        {
          id: 'r4',
          metric: 'Thái độ & tinh thần học',
          description: 'Chủ động hỏi, hợp tác, tôn trọng giờ học.',
          rating: 4,
          note: 'Tích cực trao đổi với tutor.',
        },
        {
          id: 'r5',
          metric: 'Kỹ năng trình bày & tư duy',
          description: 'Trình bày rõ ràng, biết giải thích lại bài.',
          rating: 4,
          note: 'Cần trình bày ngắn gọn hơn.',
        },
      ],
    },
    {
      id: 'report-physics-today',
      subject: 'Lý',
      date: new Date(),
      tutor: 'Tutor D',
      summary: 'Ôn lại phần sóng cơ để thuyết trình.',
      generalComment: 'Học sinh cần luyện thêm phần vẽ đồ thị sóng, phần này quan trọng cho bài kiểm tra sắp tới.',
      criteria: [
        {
          id: 'r1',
          metric: 'Mức độ tập trung',
          description: 'Học sinh có duy trì sự chú ý suốt buổi học.',
          rating: 4,
          note: 'Tập trung tốt.',
        },
        {
          id: 'r2',
          metric: 'Hiểu nội dung bài học',
          description: 'Hiểu khái niệm, nắm được cách làm bài.',
          rating: 3,
          note: 'Cần ôn lại phần cơ bản.',
        },
        {
          id: 'r3',
          metric: 'Hoàn thành nhiệm vụ',
          description: 'Làm đủ, đúng thời gian và yêu cầu.',
          rating: 4,
          note: 'Hoàn thành đúng hạn.',
        },
        {
          id: 'r4',
          metric: 'Thái độ & tinh thần học',
          description: 'Chủ động hỏi, hợp tác, tôn trọng giờ học.',
          rating: 4,
          note: 'Thái độ tốt.',
        },
        {
          id: 'r5',
          metric: 'Kỹ năng trình bày & tư duy',
          description: 'Trình bày rõ ràng, biết giải thích lại bài.',
          rating: 3,
          note: 'Cần cải thiện phần vẽ đồ thị.',
        },
      ],
    },
  ]

  const todayReports = reportSummaries.filter((report) => format(report.date, 'yyyy-MM-dd') === todayDateKey)
  const [activeReportId, setActiveReportId] = useState<string>(todayReports[0]?.id || '')
  const [previewReport, setPreviewReport] = useState<DailyReport | null>(null)
  const [showReportPreview, setShowReportPreview] = useState(false)
  const [isDetailedReviewExpanded, setIsDetailedReviewExpanded] = useState<boolean>(true)
  const [previewStats, setPreviewStats] = useState<{
    completed: number
    total: number
    percentage: number
    items: ChecklistWithDate[]
    detailItems: ChecklistDetailItem[]
  } | null>(null)

  useEffect(() => {
    if (todayReports.length === 0) {
      setActiveReportId('')
      return
    }
    if (activeReportId && !todayReports.some((report) => report.id === activeReportId)) {
      setActiveReportId(todayReports[0].id)
    }
  }, [todayReports, activeReportId])

  // Helper function to group by date
  const groupByDate = <T extends { date: Date }>(items: T[]): Record<string, T[]> => {
    const grouped: Record<string, T[]> = {}
    items.forEach((item: T) => {
      const dateKey = format(item.date, 'yyyy-MM-dd')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(item)
    })
    return grouped
  }

  const calculateDurationHours = (timeRange: string) => {
    const [startRaw, endRaw] = timeRange.split(' - ')
    if (!startRaw || !endRaw) {
      return 0
    }

    const toMinutes = (value: string) => {
      const [hours, minutes] = value.split(':').map(Number)
      return hours * 60 + (minutes || 0)
    }

    const durationMinutes = toMinutes(endRaw) - toMinutes(startRaw)
    return Math.max(durationMinutes / 60, 0)
  }

  const getScheduleStatus = (schedule: ScheduleItem) => {
    if (schedule.status) return schedule.status

    const scheduleDate = schedule.date
    const [startTimeRaw, endTimeRaw] = schedule.time.split(' - ')
    if (!startTimeRaw || !endTimeRaw) {
      return 'upcoming'
    }

    const toDateTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      const date = new Date(scheduleDate)
      date.setHours(hours, minutes || 0, 0, 0)
      return date
    }

    const startTime = toDateTime(startTimeRaw)
    const endTime = toDateTime(endTimeRaw)
    const now = new Date()

    if (now >= startTime && now <= endTime) return 'ongoing'
    if (now < startTime) return 'upcoming'
    return 'completed'
  }

  // Filter today's data (already declared above)
  const todayChecklist = checklistItems.filter(item => isToday(item.date))
  const todayScheduleChecklistMap = useMemo(() => {
    const map: Record<string, ChecklistWithDate[]> = {}
    todaySchedules.forEach((schedule) => {
      map[schedule.id] = checklistItemsBySchedule[schedule.id] || []
    })
    return map
  }, [checklistItemsBySchedule, todaySchedules])
  
  // Calculate progress based on today's checklist items only
  const completedCount = todayChecklist.filter(item => item.status === 'done').length
  const totalCount = todayChecklist.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  
  // Group checklist by date
  const checklistByDate = groupByDate(checklistItems)
  
  // Get sorted date keys
  const checklistDates = Object.keys(checklistByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Sắp xếp mới nhất trước

  const checklistBySubject = checklistItems.reduce<Record<string, { total: number; completed: number }>>((acc, item) => {
    if (!acc[item.subject]) {
      acc[item.subject] = { total: 0, completed: 0 }
    }
    acc[item.subject].total += 1
    if (item.status === 'done') {
      acc[item.subject].completed += 1
    }
    return acc
  }, {})

  const subjectPerformance = Object.entries(checklistBySubject).map(([subject, value]) => {
    const completionRate = value.total > 0 ? Math.round((value.completed / value.total) * 100) : 0
    return {
      subject,
      completionRate,
      completed: value.completed,
      total: value.total,
    }
  })

  const weeklyChecklistTrend = checklistDates.slice(0, 7).reverse().map((dateKey) => {
    const items = checklistByDate[dateKey] || []
    const completedForDate = items.filter(item => item.status === 'done').length
    return {
      dateKey,
      label: format(new Date(dateKey), 'dd/MM'),
      total: items.length,
      completed: completedForDate,
      completionRate: items.length > 0 ? Math.round((completedForDate / items.length) * 100) : 0,
    }
  })

  const upcomingSchedules = schedules.filter((schedule) => schedule.date >= new Date())
  const totalUpcomingClasses = upcomingSchedules.length
  const totalUpcomingHours = upcomingSchedules.reduce((sum, schedule) => sum + calculateDurationHours(schedule.time), 0)
  const uniqueSubjects = new Set(upcomingSchedules.map((schedule) => schedule.subject)).size || new Set(schedules.map((schedule) => schedule.subject)).size

  const subjectStudyHoursMap = schedules.reduce<Record<string, number>>((acc, schedule) => {
    const hours = calculateDurationHours(schedule.time)
    acc[schedule.subject] = (acc[schedule.subject] || 0) + hours
    return acc
  }, {})

  const subjectStudyHours = Object.entries(subjectStudyHoursMap)
    .map(([subject, hours]) => ({ subject, hours: Number(hours.toFixed(1)) }))
    .sort((a, b) => b.hours - a.hours)

  const uploadScheduleOptions = useMemo(() => {
    if (schedules.length === 0) return []
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const upcomingList = schedules.filter((schedule) => schedule.date >= startOfToday)
    const targetList = upcomingList.length > 0 ? upcomingList : schedules
    return [...targetList].sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [schedules])

  useEffect(() => {
    if (uploadScheduleOptions.length === 0) {
      if (selectedUploadScheduleId !== null) {
        setSelectedUploadScheduleId(null)
      }
      return
    }

    const exists = selectedUploadScheduleId
      ? uploadScheduleOptions.some((schedule) => schedule.id === selectedUploadScheduleId)
      : false

    if (!selectedUploadScheduleId || !exists) {
      setSelectedUploadScheduleId(uploadScheduleOptions[0].id)
    }
  }, [uploadScheduleOptions, selectedUploadScheduleId])

  function getSubjectChecklistStats(subject: string) {
    const items = todayChecklist.filter((item) => item.subject === subject)
    const detailItems = getSubjectDetailItems(subject)
    const completed = items.filter((item) => item.status === 'done').length
    const total = items.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    return { items, detailItems, completed, total, percentage }
  }

  const nextUpcomingClass = upcomingSchedules[0] || schedules.find(s => s.date >= new Date())
  const studentHighlightCards = [
    {
      id: 'checklist-progress',
      label: 'Tiến độ checklist',
      value: `${progressPercentage}%`,
      helper: `${completedCount}/${totalCount} nhiệm vụ`,
    },
    {
      id: 'next-class',
      label: 'Buổi sắp tới',
      value: nextUpcomingClass ? nextUpcomingClass.subject : 'Chưa có',
      helper: nextUpcomingClass ? `${format(nextUpcomingClass.date, 'dd/MM')} • ${nextUpcomingClass.time}` : 'Theo dõi lịch học',
    },
    {
      id: 'training-hours',
      label: 'Giờ luyện tuần này',
      value: `${totalUpcomingHours.toFixed(1)}h`,
      helper: `${totalUpcomingClasses} buổi`,
    },
  ]
  
  const handleOpenReportPreview = (report: DailyReport) => {
    setPreviewReport(report)
    const stats = getSubjectChecklistStats(report.subject)
    setPreviewStats(stats)
    setShowReportPreview(true)
  }

  const handleCloseReportPreview = () => {
    setShowReportPreview(false)
    setPreviewReport(null)
    setPreviewStats(null)
  }

  // Helper function to get subject color
  const getSubjectColor = (subject: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      'Toán': { bg: 'bg-blue-500', text: 'text-white' },
      'Lý': { bg: 'bg-green-500', text: 'text-white' },
      'Hóa': { bg: 'bg-purple-500', text: 'text-white' },
    }
    return colors[subject] || { bg: 'bg-gray-500', text: 'text-white' }
  }

  const handleExportSubjectReport = (report: DailyReport) => {
    const stats = getSubjectChecklistStats(report.subject)
    const checklistContent = stats.items
      .map(
        (item, index) =>
          `${index + 1}. ${item.lesson} - ${item.status === 'done' ? 'Hoàn thành' : 'Chưa hoàn thành'}`
      )
      .join('\n')
    const detailContent = stats.detailItems
      .map((item, index) => {
        const badge = checklistResultConfig[item.result]
        return `${index + 1}. ${item.lesson} | Ước lượng: ${item.estimatedTime} phút | Thực tế: ${item.actualTime} phút | Kết quả: ${badge.label} | Nhận xét: ${item.qualityNote || '—'}`
      })
      .join('\n')
    const criteriaContent = report.criteria
      .map((criteria, index) => `${index + 1}. ${criteria.metric}: ${criteria.rating}/5 - ${criteria.note}`)
      .join('\n')

    const pdfContent = [
      `BÁO CÁO BUỔI HỌC - ${report.subject}`,
      `Ngày: ${format(report.date, 'dd/MM/yyyy')}`,
      `Tutor: ${report.tutor}`,
      '',
      'Checklist học sinh đã thực hiện:',
      checklistContent || 'Chưa có checklist cho môn này.',
      '',
      'Chi tiết bài tập:',
      detailContent || 'Chưa có chi tiết bài tập.',
      '',
      'Nhận xét & đánh giá từ tutor:',
      criteriaContent,
      '',
      `Tổng kết: ${report.summary}`,
      `Tiến độ checklist: ${stats.completed}/${stats.total} (${stats.percentage}%)`,
    ].join('\n')

    const blob = new Blob([pdfContent], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `bao-cao-${report.subject}-${format(report.date, 'yyyy-MM-dd')}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  // Export combined report for all subjects
  const handleExportCombinedReport = () => {
    if (todayReports.length === 0) return

    const allReportsContent = todayReports.map((report) => {
      const stats = getSubjectChecklistStats(report.subject)
      const checklistContent = stats.items
        .map(
          (item, index) =>
            `${index + 1}. ${item.lesson} - ${item.status === 'done' ? 'Hoàn thành' : 'Chưa hoàn thành'}`
        )
        .join('\n')
      const detailContent = stats.detailItems
        .map((item, index) => {
          const badge = checklistResultConfig[item.result]
          return `${index + 1}. ${item.lesson} | Ước lượng: ${item.estimatedTime} phút | Thực tế: ${item.actualTime} phút | Kết quả: ${badge.label} | Nhận xét: ${item.qualityNote || '—'}`
        })
        .join('\n')
      const criteriaContent = report.criteria
        .map((criteria, index) => `${index + 1}. ${criteria.metric}: ${criteria.rating}/5 - ${criteria.note}`)
        .join('\n')

      return [
        `\n========== ${report.subject.toUpperCase()} ==========`,
        `Tutor: ${report.tutor}`,
        '',
        'Checklist học sinh đã thực hiện:',
        checklistContent || 'Chưa có checklist cho môn này.',
        '',
        'Chi tiết bài tập:',
        detailContent || 'Chưa có chi tiết bài tập.',
        '',
        'Nhận xét & đánh giá từ tutor:',
        criteriaContent,
        '',
        `Tổng kết: ${report.summary}`,
        report.generalComment ? `Đánh giá chung: ${report.generalComment}` : '',
        `Tiến độ checklist: ${stats.completed}/${stats.total} (${stats.percentage}%)`,
      ].filter(Boolean).join('\n')
    })

    const pdfContent = [
      'BÁO CÁO TỔNG HỢP BUỔI HỌC',
      `Ngày: ${format(todayReports[0].date, 'dd/MM/yyyy')}`,
      '',
      ...allReportsContent,
    ].join('\n')

    const blob = new Blob([pdfContent], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `bao-cao-tong-hop-${format(todayReports[0].date, 'yyyy-MM-dd')}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  // Render content based on active section
  const renderContent = () => {
    const content = (() => {
      switch (activeSection) {
        case 'home':
          return (
            <HomeSection
              todaySchedules={todaySchedules}
              studentName={user?.name || 'Học sinh'}
              studentEmail={user?.email}
              studentAvatarUrl={(user as any)?.avatarUrl || (user as any)?.avatar}
              upcomingSchedule={upcomingSchedule}
              tutorInfoMap={tutorInfoMap}
              progressPercentage={progressPercentage}
              completedCount={completedCount}
              totalCount={totalCount}
              scheduleChecklistMap={todayScheduleChecklistMap}
              homeworkDetailsMap={homeworkDetailItems}
              getSubjectLabel={getSubjectLabel}
              onUploadSuccess={() => setScheduleFetchTrigger((prev) => prev + 1)}
              onJoinClass={handleJoinClass}
              getScheduleStatus={getScheduleStatus}
              assignments={assignments as TutorAssignmentApiItem[]}
              scheduleReviews={scheduleReviews}
              scheduleReports={scheduleReports}
              assignmentReviews={assignmentReviews}
              assignmentReviewsLoading={assignmentReviewsLoading}
              onUploadHomeworkFile={handleUploadHomeworkFile}
              onDeleteHomeworkFile={handleDeleteHomeworkFile}
              uploadScheduleOptions={uploadScheduleOptions}
              selectedUploadScheduleId={selectedUploadScheduleId}
              onUploadScheduleChange={(scheduleId) => setSelectedUploadScheduleId(scheduleId)}
              onUploadChecklistFile={handleUploadChecklistFile}
              onDeleteChecklistFile={handleDeleteChecklistFile}
            />
          )
        case 'schedule':
          return (
            <ScheduleSection
              schedules={schedules}
              isLoading={isSchedulesLoading}
              error={scheduleError}
              onReload={handleReloadSchedules}
              onJoinClass={handleJoinClass}
              onViewChecklist={handleViewChecklist}
              tutorInfoMap={tutorInfoMap}
            />
          )
        case 'checklist':
          return renderChecklistSection()
        case 'homework':
          return renderHomeworkSection()
        case 'analytics':
          return renderAnalyticsSection()
        default:
          return (
            <HomeSection
              todaySchedules={todaySchedules}
              tutorInfoMap={tutorInfoMap}
              progressPercentage={progressPercentage}
              completedCount={completedCount}
              totalCount={totalCount}
              scheduleChecklistMap={todayScheduleChecklistMap}
              homeworkDetailsMap={homeworkDetailItems}
              getSubjectLabel={getSubjectLabel}
              onUploadSuccess={() => setScheduleFetchTrigger((prev) => prev + 1)}
              onJoinClass={handleJoinClass}
              getScheduleStatus={getScheduleStatus}
              assignments={assignments as TutorAssignmentApiItem[]}
              scheduleReviews={scheduleReviews}
              scheduleReports={scheduleReports}
              assignmentReviews={assignmentReviews}
              assignmentReviewsLoading={assignmentReviewsLoading}
              onUploadHomeworkFile={handleUploadHomeworkFile}
              onDeleteHomeworkFile={handleDeleteHomeworkFile}
              uploadScheduleOptions={uploadScheduleOptions}
              selectedUploadScheduleId={selectedUploadScheduleId}
              onUploadScheduleChange={(scheduleId) => setSelectedUploadScheduleId(scheduleId)}
              onUploadChecklistFile={handleUploadChecklistFile}
              onDeleteChecklistFile={handleDeleteChecklistFile}
            />
          )
      }
    })()
    
    return <div className="h-full overflow-hidden">{content}</div>
  }

  const renderTodayChecklistGroups = (forceExpand = false) => {
    if (isChecklistLoading) {
      return <p className="text-sm text-gray-500">Đang tải checklist...</p>
    }

    if (checklistError) {
      return <p className="text-sm text-red-500">{checklistError}</p>
    }

    const subjects = Array.from(new Set(todayChecklist.map(item => item.subject)))
    if (subjects.length === 0) {
      return <p className="text-sm text-gray-500">Không có checklist cho hôm nay.</p>
    }

    const subjectGroups = subjects.map(subject => ({
      subject,
      items: todayChecklist.filter(item => item.subject === subject),
    }))

    return (
      <div className="space-y-4">
        {subjectGroups.map((group) => {
          const subjectCompleted = group.items.filter(item => item.status === 'done').length
          const subjectTotal = group.items.length
          const subjectPercentage = subjectTotal > 0 ? Math.round((subjectCompleted / subjectTotal) * 100) : 0
          const isSelected = forceExpand ? true : selectedSubject === group.subject

          return (
            <div
              key={group.subject}
              className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
                isSelected
                  ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-primary-300 hover:shadow-md bg-gradient-to-br from-white to-gray-50'
              }`}
              onClick={() => {
                if (forceExpand) return
                setSelectedSubject(isSelected ? null : group.subject)
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className={`px-4 py-1.5 rounded-lg text-sm font-bold shadow-md ${
                    group.subject === 'Toán' ? 'bg-blue-500 text-white' :
                    group.subject === 'Hóa' ? 'bg-green-500 text-white' :
                    group.subject === 'Lý' ? 'bg-purple-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {group.subject}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {subjectCompleted}/{subjectTotal} hoàn thành ({subjectPercentage}%)
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'rotate-90 text-primary-600' : 'text-gray-400'}`} />
              </div>

              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all ${
                    subjectPercentage === 100 ? 'bg-green-500' :
                    subjectPercentage >= 50 ? 'bg-primary-500' :
                    'bg-yellow-500'
                  }`}
                  style={{ width: `${subjectPercentage}%` }}
                ></div>
              </div>

              {isSelected && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{item.lesson}</p>
                        <p className="text-xs text-gray-600 truncate">{item.task}</p>
                      </div>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as ChecklistItem['status'])}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs border-2 border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ml-3 bg-white hover:border-primary-300 cursor-pointer"
                      >
                        <option value="not_done">Chưa xong</option>
                        <option value="in_progress">Đang làm</option>
                        <option value="done">Đã xong</option>
                      </select>
                    </div>
                  ))}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Chi tiết bài tập</h4>
                    <ChecklistDetailTable
                      items={getSubjectDetailItems(group.subject)}
                      onUpload={(id, file) => handleDetailFileUpload(group.subject, id, file)}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Old renderHomeSection removed - now using HomeSection component
  const _renderHomeSection_OLD = () => (
    <div className="h-full flex flex-col lg:flex-row gap-3 lg:gap-4 overflow-hidden">
      {/* Main Layout - 2 Columns */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 min-w-0">
        {/* Left Column - Profile & Quick Actions (Fixed, No Scroll) */}
        <div className="lg:col-span-1 flex-shrink-0 h-full overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Profile Card */}
            <div className="card hover:shadow-xl transition-shadow duration-300 flex-1 flex flex-col">
              <div className="text-center mb-4 lg:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 lg:mb-3">XIN CHÀO</h2>
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-2 lg:mb-3 shadow-lg hover:scale-105 transition-transform duration-300">
                  <UserCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5">Nguyễn Văn A</h3>
                <p className="text-xs text-gray-600">student@skillar.com</p>
              </div>

              {/* Progress Stats */}
              <div className="p-3 sm:p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl border border-primary-100 shadow-inner">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-extrabold gradient-text mb-1">{progressPercentage}%</div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Hoàn thành hôm nay</p>
                  <div className="w-full h-2 sm:h-2.5 bg-white rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
                <button
                  onClick={() => {
                    if (todaySchedules.length > 0 && todaySchedules[0].meetLink) {
                      handleJoinClass(todaySchedules[0].id)
                    }
                  }}
                  className="w-full card border-2 border-gray-200 hover:border-primary-400 hover:shadow-xl transition-all cursor-pointer group text-left min-h-[100px] sm:min-h-[132px]"
                >
                  <div className="flex flex-col items-center justify-center py-3 sm:py-4 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg">
                      <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5">Vào lớp học</h3>                  </div>
                </button>

                <button
            onClick={() => {
              if (todayChecklist.length > 0) {
                setSelectedSubject(todayChecklist[0].subject)
              }
              setShowChecklistOverlay(true)
            }}
                  className="w-full card border-2 border-gray-200 hover:border-primary-400 hover:shadow-xl transition-all cursor-pointer group text-left min-h-[100px] sm:min-h-[132px]"
                >
                  <div className="flex flex-col items-center justify-center py-3 sm:py-4 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-lg">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5">Xem checklist</h3>                  </div>
                </button>
              </div>

              {/* Student highlight stats */}
              <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3">
                {studentHighlightCards.map((card) => (
                  <div key={card.id} className="border border-gray-100 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-3 sm:py-4 bg-gradient-to-br from-white to-gray-50 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50/70 to-transparent pointer-events-none"></div>
                    <div className="relative">
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 mb-1">{card.label}</p>
                      <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{card.value}</p>
                      <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1">{card.helper}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Main Content (Scrollable) */}
        <div className="lg:col-span-2 h-full overflow-y-auto space-y-3 sm:space-y-4">
          
          {/* 🚀 UPLOAD DOCUMENTS (ĐÃ CHUYỂN LÊN ĐẦU) 🚀 */}
          <MaterialUploadSection
            scheduleOptions={uploadScheduleOptions.map(s => ({
              id: s.id,
              subject: s.subject || 'Chung',
              date: s.date,
            }))}
            selectedScheduleId={selectedUploadScheduleId}
            onScheduleChange={(scheduleId) => setSelectedUploadScheduleId(scheduleId)}
            onUploadSuccess={() => setScheduleFetchTrigger((prev) => prev + 1)}
          />

          {/* Today's Schedule (Vị trí mới: thứ hai) */}
          <div className="card hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Lịch học hôm nay</h2>
                <p className="text-sm text-gray-600">{todaySchedules.length} buổi học</p>
              </div>
              <button
                onClick={() => handleSectionChange('schedule')}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {todaySchedules.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Không có lịch học hôm nay</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySchedules.map((schedule) => {
                  const status = getScheduleStatus(schedule)
                  const statusConfig = {
                    ongoing: { label: 'Đang diễn ra', className: 'bg-green-100 text-green-700' },
                    upcoming: { label: 'Sắp diễn ra', className: 'bg-yellow-100 text-yellow-700' },
                    completed: { label: 'Đã kết thúc', className: 'bg-gray-100 text-gray-600' },
                  }[status]
                  const tutorProfile = schedule.tutorId ? tutorInfoMap[schedule.tutorId] : undefined
                  const displayTutorName = tutorProfile?.name || schedule.tutor
                  const canViewTutorDetail = Boolean(schedule.tutorId)

                  return (
                    <div
                      key={schedule.id}
                      onClick={() => {
                        if (schedule.tutorId) {
                          setSelectedTutorSchedule(schedule.id)
                        }
                      }}
                      className={`border-2 border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all bg-gradient-to-br from-white to-gray-50 ${
                        canViewTutorDetail ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-3 mb-2">
                            <span
                              className={`px-3 py-1 rounded-lg text-sm font-bold ${
                                schedule.subject === 'Toán'
                                  ? 'bg-blue-500 text-white'
                                  : schedule.subject === 'Hóa'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-500 text-white'
                              }`}
                            >
                              {schedule.subject}
                            </span>
                            <span className="text-sm font-semibold text-gray-700">{schedule.time}</span>
                          </div>
                          {displayTutorName ? (
                            <p className="text-sm text-gray-600">
                              Tutor: <span className="font-semibold text-gray-900">{displayTutorName}</span>
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500">Tutor sẽ được cập nhật sớm</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <div className="flex items-center gap-2">
                            {schedule.meetLink && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleJoinClass(schedule.id)
                                }}
                                className="btn-primary text-sm px-4 py-2 whitespace-nowrap"
                              >
                                Vào lớp
                              </button>
                            )}
                            {statusConfig && (
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.className}`}>
                                {statusConfig.label}
                              </span>
                            )}
                          </div>
                          {schedule.meetLink && (
                            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200 group">
                              <input
                                type="text"
                                value={schedule.meetLink}
                                readOnly
                                className="text-xs text-gray-600 bg-transparent border-none outline-none w-32 truncate"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigator.clipboard.writeText(schedule.meetLink || '')
                                  setCopiedLink(schedule.id)
                                  setTimeout(() => setCopiedLink(null), 2000)
                                }}
                                className="text-gray-500 hover:text-primary-600 transition-colors"
                                title="Copy link"
                              >
                                {copiedLink === schedule.id ? (
                                  <Clock className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {!canViewTutorDetail && (
                        <p className="text-[11px] text-gray-400 mt-2">Tutor đang được hệ thống cập nhật.</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Modal chi tiết Tutor */}
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
                    {/* Header placeholder (removed date/time per request) */}
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
                        Hệ thống đang cập nhật thông tin chi tiết của tutor này. Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ nếu cần thêm thông tin.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Today's Checklist by Subject (Vị trí mới: thứ ba) */}
          <div className="card hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Checklist hôm nay</h2>
                <p className="text-sm text-gray-600">{completedCount}/{totalCount} hoàn thành</p>
              </div>
              <button
                onClick={() => handleSectionChange('checklist')}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Group checklist by subject */}
            {renderTodayChecklistGroups()}
          </div>

          {/* Đánh giá chi tiết */}
          {todayReports.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-primary-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Đánh giá chi tiết</h2>
                </div>
                <button
                  onClick={() => setIsDetailedReviewExpanded(!isDetailedReviewExpanded)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <span className="text-sm font-medium">
                    {isDetailedReviewExpanded ? 'Thu gọn' : 'Mở rộng'}
                  </span>
                  {isDetailedReviewExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>
              {isDetailedReviewExpanded && todayReports.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                  {todayReports[0].criteria.map((criteria) => (
                    <div
                      key={criteria.id}
                      className="border border-gray-200 rounded-xl p-4 bg-white"
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                        <div className="flex-1">
                          <p className="text-lg font-bold text-gray-900 mb-1">{criteria.metric}</p>
                          <p className="text-sm text-gray-600">{criteria.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={`${criteria.id}-preview-star-${star}`}
                              className={`w-5 h-5 ${star <= criteria.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                            />
                          ))}
                          <span className="text-lg font-bold text-gray-900 ml-2">{criteria.rating}/5</span>
                        </div>
                      </div>
                      <div className="bg-primary-50 text-primary-800 text-sm font-semibold px-3 py-2 rounded-lg">
                        {criteria.note}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Đánh giá chung - Tổng hợp cho tất cả môn */}
          {todayReports.length > 0 && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-6">
                <MessageSquare className="w-5 h-5 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">Đánh giá chung</h2>
              </div>
              <div className="space-y-4">
                {todayReports.map((report) => {
                  const subjectColor = getSubjectColor(report.subject)
                  return (
                    <div key={report.id} className="border border-gray-200 rounded-xl p-5 bg-white">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1.5 rounded-lg text-base font-bold ${subjectColor.bg} ${subjectColor.text}`}>
                          {report.subject}
                        </span>
                        <div className="flex items-center gap-2">
                          <img 
                            src="https://www.paratime.vn/wp-content/uploads/2020/02/TIME-Studio-headshot-3-elements.jpg" 
                            alt={report.tutor}
                            className="w-10 h-10 rounded-full object-cover shadow-lg border-2 border-gray-200"
                          />
                          <p className="text-base font-semibold text-gray-700">{report.tutor}</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-900 leading-relaxed">
                        {report.generalComment || report.summary}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Xuất báo cáo */}
          {todayReports.length > 0 && (
            <div className="card">
              <div className="flex items-center space-x-2 mb-6">
                <Download className="w-5 h-5 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">Xuất báo cáo</h2>
              </div>
              <div className="border-2 border-gray-200 rounded-xl p-6 bg-white">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <p className="text-lg font-bold text-gray-900 mb-2">
                      Báo cáo tổng hợp tất cả môn học hôm nay
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      Bao gồm: {todayReports.map(r => r.subject).join(', ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      Xem báo cáo demo trước khi tải xuống.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (todayReports.length > 0) {
                          handleOpenReportPreview(todayReports[0])
                        }
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white text-base font-bold hover:bg-primary-600 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                      Xem báo cáo mẫu
                    </button>
                    <button
                      onClick={handleExportCombinedReport}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-primary-500 text-primary-600 text-base font-bold hover:bg-primary-50 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      Tải báo cáo tổng hợp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderAnalyticsSection = () => (
    <div className="h-full overflow-y-auto space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-col space-y-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Checklist hoàn thành</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{progressPercentage}%</p>
            <p className="text-[10px] sm:text-xs text-gray-500">{completedCount}/{totalCount} nhiệm vụ</p>
          </div>
        </div>

        <div className="card hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-col space-y-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Buổi học sắp tới</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalUpcomingClasses}</p>
            <p className="text-[10px] sm:text-xs text-gray-500">Trong 7 ngày tiếp theo</p>
          </div>
        </div>

        <div className="card hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-col space-y-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Môn đang học</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{uniqueSubjects}</p>
            <p className="text-[10px] sm:text-xs text-gray-500">Các môn xuất hiện trong lịch</p>
          </div>
        </div>

        <div className="card hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-col space-y-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">Giờ học sắp tới</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalUpcomingHours.toFixed(1)}h</p>
            <p className="text-[10px] sm:text-xs text-gray-500">Tổng thời lượng đã lên lịch</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="card hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Hiệu suất theo môn</h2>
          </div>
          {subjectPerformance.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-500">Chưa có dữ liệu checklist.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <BarChart
                data={subjectPerformance}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="subject" type="category" width={80} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Tỷ lệ hoàn thành']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="completionRate" fill="#3b82f6" radius={[0, 8, 8, 0]}>
                  {subjectPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.subject === 'Toán' ? '#3b82f6' :
                      entry.subject === 'Hóa' ? '#10b981' :
                      entry.subject === 'Lý' ? '#8b5cf6' :
                      '#6b7280'
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Tiến độ 7 ngày gần nhất</h2>
          </div>
          {weeklyChecklistTrend.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-500">Chưa có dữ liệu để hiển thị.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <BarChart
                data={weeklyChecklistTrend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'completionRate') return [`${value}%`, 'Tỷ lệ hoàn thành']
                    return [value, name]
                  }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="completionRate" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Tỷ lệ hoàn thành (%)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Phân bổ thời gian học</h2>
          </div>
          {subjectStudyHours.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-500">Chưa có dữ liệu lịch học.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <PieChart>
                <Pie
                  data={subjectStudyHours}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props
                    const RADIAN = Math.PI / 180
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                    const x = cx + radius * Math.cos(-midAngle * RADIAN)
                    const y = cy + radius * Math.sin(-midAngle * RADIAN)
                    const data = props.payload as { subject: string; hours: number }
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="white"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        fontSize={12}
                        fontWeight="bold"
                      >
                        {`${data.subject}: ${(percent * 100).toFixed(0)}%`}
                      </text>
                    )
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="hours"
                >
                  {subjectStudyHours.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.subject === 'Toán' ? '#3b82f6' :
                      entry.subject === 'Hóa' ? '#10b981' :
                      entry.subject === 'Lý' ? '#8b5cf6' :
                      '#6b7280'
                    } />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(_value: number, _name: string, props: any) => {
                    const data = props.payload as { subject: string; hours: number }
                    return [`${data.hours.toFixed(1)} giờ`, data.subject]
                  }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )

  const handleViewChecklist = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId)
    if (schedule) {
      handleSectionChange('checklist')
      setSelectedSubject(schedule.subject || null)
    }
  }

  // Tính toán checklist schedule options ở top-level
  const checklistScheduleOptions = useMemo(() => {
    const checklistScheduleIds = Object.keys(checklistItemsBySchedule)
    const checklistScheduleOptionsRaw = checklistScheduleIds
      .map((id) => {
        const schedule = schedules.find((s) => s.id === id)
        return { id, schedule }
      })
      .filter((opt) => !!opt.schedule) as { id: string; schedule: ScheduleItem }[]
    return checklistScheduleOptionsRaw.sort(
      (a, b) => a.schedule.date.getTime() - b.schedule.date.getTime()
    )
  }, [checklistItemsBySchedule, schedules])

  // Lấy danh sách ngày duy nhất từ các buổi học
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>()
    checklistScheduleOptions.forEach(({ schedule }) => {
      const dateKey = format(schedule.date, 'yyyy-MM-dd')
      dates.add(dateKey)
    })
    return Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  }, [checklistScheduleOptions])

  // Tự động chọn ngày đầu tiên nếu chưa chọn
  useEffect(() => {
    if (uniqueDates.length > 0 && !selectedChecklistDate) {
      setSelectedChecklistDate(uniqueDates[0])
    }
  }, [uniqueDates, selectedChecklistDate])

  // Lọc các buổi học theo ngày đã chọn
  const schedulesForSelectedDate = useMemo(() => {
    if (!selectedChecklistDate) return []
    return checklistScheduleOptions.filter(({ schedule }) => {
      const dateKey = format(schedule.date, 'yyyy-MM-dd')
      return dateKey === selectedChecklistDate
    })
  }, [checklistScheduleOptions, selectedChecklistDate])

  // Tự động chọn buổi học đầu tiên trong ngày nếu chưa chọn hoặc buổi học hiện tại không thuộc ngày đã chọn
  useEffect(() => {
    if (schedulesForSelectedDate.length > 0) {
      const currentScheduleInDate = schedulesForSelectedDate.find(
        ({ id }) => id === selectedChecklistScheduleId
      )
      if (!currentScheduleInDate) {
        setSelectedChecklistScheduleId(schedulesForSelectedDate[0].id)
      }
    }
  }, [schedulesForSelectedDate, selectedChecklistScheduleId])

  // Old renderScheduleSection removed - now using ScheduleSection component
  const _renderScheduleSection_OLD = () => (
    <div className="h-full overflow-hidden">
      <div className="h-full flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
        {isSchedulesLoading ? (
          <div className="flex-1 flex items-center justify-center text-sm font-semibold text-gray-500">
            Đang tải lịch học...
          </div>
        ) : scheduleError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <p className="text-sm font-semibold text-red-500">{scheduleError}</p>
            <button
              onClick={handleReloadSchedules}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <MonthlyCalendar
              schedules={schedules}
              onJoinClass={handleJoinClass}
              onViewChecklist={handleViewChecklist}
            />
            {schedules.length === 0 && !isSchedulesLoading && (
              <div className="p-4 text-center text-sm text-gray-500 border-t border-gray-100">
                Chưa có lịch học nào được lên lịch.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

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

  const renderChecklistSection = () => {
    const activeChecklistSchedule =
      checklistScheduleOptions.find((opt) => opt.id === selectedChecklistScheduleId)?.schedule ||
      schedulesForSelectedDate[0]?.schedule ||
      checklistScheduleOptions[checklistScheduleOptions.length - 1]?.schedule

    const activeChecklistScheduleId = activeChecklistSchedule?.id

    const mapChecklistItemsToDetail = (items: ChecklistWithDate[]): ChecklistDetailItem[] => {
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
        solutionType: item.solutionUrl ? 'file' : 'text',
        solutionText: undefined,
        solutionFileName: item.solutionUrl ? getFileNameFromUrl(item.solutionUrl) : undefined,
        solutionUrl: item.solutionUrl,
        solutionUrls: item.solutionUrl ? splitFileUrls(item.solutionUrl) : undefined,
        solutionPreview: undefined,
        uploadedFileName: undefined,
        assignmentFileName: getFileNameFromUrl(Array.isArray(item.attachment) ? item.attachment[0] : item.attachment),
        assignmentUrl: Array.isArray(item.attachment) ? item.attachment.join('\n') : (item.attachment || undefined),
        assignmentUrls: item.attachment ? (Array.isArray(item.attachment) ? item.attachment.filter((url: string) => url && url.trim()) : splitFileUrls(item.attachment)) : undefined,
      }))
    }

    const activeChecklistItemsDetail: ChecklistDetailItem[] =
      activeChecklistScheduleId && checklistItemsBySchedule[activeChecklistScheduleId]
        ? mapChecklistItemsToDetail(checklistItemsBySchedule[activeChecklistScheduleId])
        : []

    // Assignments cho phần "Đánh giá chung cho từng môn"
    const scheduleAssignments = activeChecklistSchedule
      ? (() => {
          let filtered = assignments.filter((assignment) => {
            const assignmentScheduleId = getAssignmentScheduleId(assignment)
            return assignmentScheduleId === activeChecklistSchedule.id
          })

          if (filtered.length === 0 && activeChecklistSchedule.subject) {
            filtered = assignments.filter((assignment) => {
              const subjectLabel =
                (getSubjectLabel && getSubjectLabel(assignment.subject as any)) ||
                (assignment.subject as any) ||
                ''
              return subjectLabel === activeChecklistSchedule.subject
            })
          }

          return filtered
        })()
      : []

    const scheduleStatus =
      activeChecklistSchedule && getScheduleStatus(activeChecklistSchedule as ScheduleItem)

    return (
      <div className="h-full overflow-y-auto space-y-3 sm:space-y-4">
        {/* Chọn buổi học & chi tiết giống trang chủ */}
        <div className="card hover:shadow-xl transition-shadow duration-300">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Checklist theo buổi học</h2>
            </div>
            {checklistScheduleOptions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                {/* Dropdown chọn ngày */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Chọn ngày:</label>
                  <select
                    value={selectedChecklistDate || ''}
                    onChange={(e) => {
                      const newDate = e.target.value || null
                      setSelectedChecklistDate(newDate)
                      // Reset buổi học khi đổi ngày
                      if (newDate) {
                        const firstScheduleInNewDate = checklistScheduleOptions.find(({ schedule }) => {
                          const dateKey = format(schedule.date, 'yyyy-MM-dd')
                          return dateKey === newDate
                        })
                        if (firstScheduleInNewDate) {
                          setSelectedChecklistScheduleId(firstScheduleInNewDate.id)
                        }
                      }
                    }}
                    className="flex-1 px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {uniqueDates.map((dateKey) => (
                      <option key={dateKey} value={dateKey}>
                        {format(new Date(dateKey), 'dd/MM/yyyy')}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Dropdown chọn buổi học trong ngày */}
                {selectedChecklistDate && schedulesForSelectedDate.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Chọn buổi học:</label>
                    <select
                      value={activeChecklistScheduleId || ''}
                      onChange={(e) => setSelectedChecklistScheduleId(e.target.value || null)}
                      className="flex-1 px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {schedulesForSelectedDate.map(({ id, schedule }) => (
                        <option key={id} value={id}>
                          {`${schedule.time}${schedule.subject ? ` · ${schedule.subject}` : ''}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {checklistScheduleOptions.length === 0 || !activeChecklistScheduleId || !activeChecklistSchedule ? (
            <p className="text-sm text-gray-500 italic">
              Chưa có checklist nào được tạo cho học sinh này.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Hiển thị assignments theo nhóm giống trang chủ */}
              {(() => {
                const relatedAssignments = assignments.filter(
                  (assignment) => getAssignmentScheduleId(assignment) === activeChecklistScheduleId
                )
                
                if (relatedAssignments.length > 0) {
                  return (
                    <div className="space-y-4">
                      {relatedAssignments.map((assignment, index) => {
                        const assignmentKey = assignment.id || (assignment as any)._id || `assignment-${index}`
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
                              <div className="flex items-center px-5 py-4 gap-4">
                                <p className="text-lg font-bold text-primary-600 uppercase tracking-wide min-w-[60px] max-w-[180px] flex-shrink-0">
                                  {formatSubjectLabel(
                                    assignment.subject || 
                                    extractSubjectFromText(assignment.name) ||
                                    extractSubjectFromText(assignment.description) ||
                                    activeChecklistSchedule?.subject || 
                                    'Chung'
                                  )}
                                </p>
                                <div className="h-12 w-px bg-gray-300 flex-shrink-0"></div>
                                <div className="flex-1 space-y-1 min-w-0 text-left">
                                  <h5 className="text-base font-bold text-gray-900">
                                    {assignment.name || 'Checklist'}
                                  </h5>
                                  {assignment.description && (
                                    <p className="text-sm text-gray-600 italic line-clamp-1">
                                      {assignment.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex-shrink-0">
                                  {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-500" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                  )}
                                </div>
                              </div>
                            </button>
                            
                            {isExpanded && (
                              <div className="px-5 pb-4 pt-2 border-t border-gray-200 space-y-4">
                                {/* Bảng tóm tắt */}
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.35em] mb-3">
                                    BẢNG TÓM TẮT
                                  </p>
                                  <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-sm overflow-x-auto scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-gray-100">
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
                                              <td className="px-5 py-4 font-semibold text-gray-900 text-center text-lg">
                                                {task.name || assignment.name || 'Bài học'}
                                              </td>
                                              <td className="px-5 py-4 text-gray-700 text-center text-base">
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
                                              <td className="px-5 py-4 text-gray-600 text-center text-base">
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
                                      detailItemsForAssignment.push({
                                        id: taskId,
                                        lesson: task.name || assignment.name || 'Bài học',
                                        estimatedTime: task.estimatedTime ?? 0,
                                        actualTime: task.actualTime ?? 0,
                                        result: mapTaskStatusToResult(task.status as string | undefined),
                                        qualityNote: (task as any).note || '',
                                        solutionType: task.solutionUrl ? 'file' : 'text',
                                        solutionText: undefined,
                                        solutionFileName: getFileNameFromUrl(task.solutionUrl),
                                        solutionUrl: task.solutionUrl,
                                        solutionUrls: task.solutionUrl ? (Array.isArray(task.solutionUrl) ? task.solutionUrl.filter((url: string) => url && url.trim()) : splitFileUrls(task.solutionUrl)) : undefined,
                                        solutionPreview: undefined,
                                        uploadedFileName: task.answerURL ? getFileNameFromUrl(Array.isArray(task.answerURL) ? task.answerURL[0] : task.answerURL) : undefined,
                                        uploadedFileUrl: Array.isArray(task.answerURL) ? task.answerURL.join('\n') : (task.answerURL || undefined),
                                        uploadedFileUrls: task.answerURL ? (Array.isArray(task.answerURL) ? task.answerURL.filter((url: string) => url && url.trim()) : splitFileUrls(task.answerURL)) : undefined,
                                        assignmentFileName: getFileNameFromUrl(Array.isArray(task.assignmentUrl) ? task.assignmentUrl[0] : task.assignmentUrl),
                                        assignmentUrl: Array.isArray(task.assignmentUrl) ? task.assignmentUrl.join('\n') : (task.assignmentUrl || undefined),
                                        assignmentUrls: task.assignmentUrl ? (Array.isArray(task.assignmentUrl) ? task.assignmentUrl.filter((url: string) => url && url.trim()) : splitFileUrls(task.assignmentUrl)) : undefined,
                                      })
                                    })
                                  } else {
                                    // Không có task con
                                    const assignmentUrl = assignment.supplementaryMaterials?.[0]?.url as string | undefined
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
                                      assignmentFileName: getFileNameFromUrl(assignmentUrl),
                                      assignmentUrl: assignmentUrl || undefined,
                                      assignmentUrls: assignmentUrl ? (Array.isArray(assignmentUrl) ? assignmentUrl.filter((url: string) => url && url.trim()) : splitFileUrls(assignmentUrl)) : undefined,
                                    })
                                  }
                                  
                                  return (
                                    <ChecklistDetailTable
                                      items={detailItemsForAssignment}
                                      onUpload={handleUploadChecklistFile ? (taskId, file, fileIndex) => {
                                        handleUploadChecklistFile(taskId, file, fileIndex).catch((error) => {
                                          console.error('Upload checklist file error:', error)
                                        })
                                      } : () => {}}
                                      onDeleteFile={handleDeleteChecklistFile ? (taskId, fileIndex) => {
                                        handleDeleteChecklistFile(taskId, fileIndex).catch((error) => {
                                          console.error('Delete checklist file error:', error)
                                        })
                                      } : undefined}
                                      onStatusChange={(taskId, result) => {
                                        // Map ChecklistDetailItem['result'] to ChecklistItem['status']
                                        const status: ChecklistItem['status'] = 
                                          result === 'completed' ? 'done' :
                                          result === 'not_accurate' ? 'in_progress' :
                                          'not_done'
                                        handleStatusChange(taskId, status)
                                      }}
                                    />
                                  )
                                })()}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                }
                // Fallback: hiển thị bảng chi tiết từ checklistItemsBySchedule nếu không có assignments
                return (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em] mb-1">
                      Checklist buổi học
                    </p>
                    <ChecklistDetailTable
                      items={activeChecklistItemsDetail}
                      onUpload={handleUploadChecklistFile ? (taskId, file) => {
                        handleUploadChecklistFile(taskId, file).catch((error) => {
                          console.error('Upload checklist file error:', error)
                        })
                      } : () => {}}
                      onStatusChange={(taskId, result: ChecklistDetailItem['result']) => {
                        // Map ChecklistDetailItem['result'] to ChecklistItem['status']
                        const status: ChecklistItem['status'] = 
                          result === 'completed' ? 'done' :
                          result === 'not_accurate' ? 'in_progress' :
                          'not_done'
                        handleStatusChange(taskId, status)
                      }}
                    />
                  </div>
                )
              })()}

              {/* Đánh giá chung cho từng môn */}
              <StudentSubjectReviewSection
                title="Đánh giá chung cho từng môn"
                assignments={scheduleAssignments as TutorAssignmentApiItem[]}
                scheduleSubject={activeChecklistSchedule.subject}
                loading={assignmentReviewsLoading}
                assignmentReviews={assignmentReviews}
                getAssignmentKey={(assignment, idx) =>
                  assignment.id || assignment._id || `${assignment.subject || 'subject'}-${idx}`
                }
                alwaysExpanded={true}
              />

              {/* Đánh giá buổi học */}
              <StudentSessionEvaluationSection
                scheduleId={activeChecklistScheduleId}
                reviews={scheduleReviews[activeChecklistScheduleId]}
                isExpanded={true}
                scheduleStatus={
                  scheduleStatus === 'ongoing'
                    ? 'in_progress'
                    : scheduleStatus === 'completed'
                    ? 'completed'
                    : 'upcoming'
                }
                onToggle={() => {}}
                alwaysExpanded={true}
              />

              {/* Báo cáo buổi học */}
              <StudentReportSection
                scheduleId={activeChecklistScheduleId}
                report={scheduleReports[activeChecklistScheduleId] ?? null}
                alwaysExpanded={true}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Keep legacy renderers referenced for future reuse without triggering unused variable errors
  void _renderHomeSection_OLD
  void _renderScheduleSection_OLD

  const renderHomeworkSection = () => {
    // Map scheduleId -> schedule để lấy ngày học và môn
    const scheduleMap = schedules.reduce<Record<string, ScheduleItem>>((acc, schedule) => {
      acc[schedule.id] = schedule
      return acc
    }, {})

    // Gom các session homeworks lại theo buổi (scheduleId hoặc id homework)
    const sessions = Object.entries(homeworkDetailItems).map(([sessionId, items]) => {
      const schedule = scheduleMap[sessionId]
      const homework = homeworks.find(
        (hw) => hw.scheduleId === sessionId || hw.id === sessionId,
      )

      const subject =
        schedule?.subject ||
        (homework ? getSubjectLabel(homework.subject) : '') ||
        'Chung'

      const date =
        schedule?.date ||
        (homework?.deadline ? ensureValidDate(homework.deadline) : new Date())

      return { sessionId, subject, date, schedule, items }
    })

    // Sắp xếp theo ngày
    sessions.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Danh sách ngày duy nhất có bài tập
    const homeworkDates = Array.from(
      new Set(sessions.map((s) => format(s.date, 'yyyy-MM-dd'))),
    ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

    // Ngày hôm nay theo định dạng key
    const todayKey = format(new Date(), 'yyyy-MM-dd')

    // Ngày đang chọn:
    // - Nếu người dùng đã chọn thì dùng selectedHomeworkDate
    // - Nếu không, ưu tiên hôm nay nếu có dữ liệu
    // - Nếu cũng không có thì lấy ngày đầu tiên có bài
    const activeDateKey =
      selectedHomeworkDate ||
      (homeworkDates.includes(todayKey) ? todayKey : homeworkDates[0] || null)
    const sessionsForDate =
      activeDateKey === null
        ? []
        : sessions.filter(
            (s) => format(s.date, 'yyyy-MM-dd') === activeDateKey,
          )

    // Chọn buổi học trong ngày
    const activeSessionId =
      selectedHomeworkSessionId || (sessionsForDate[0]?.sessionId ?? null)

    const sessionsToRender =
      activeSessionId === null
        ? sessionsForDate
        : sessionsForDate.filter((s) => s.sessionId === activeSessionId)

    return (
      <div className="h-full overflow-y-auto space-y-3 sm:space-y-4">
        {sessions.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-sm text-gray-500">
              Chưa có bài tập về nhà nào được giao cho bạn.
            </p>
          </div>
        ) : (
          <>
            {/* Thanh chọn ngày & buổi học */}
            {homeworkDates.length > 0 && (
              <div className="card-no-transition mb-3 sm:mb-4">
                <div className="mb-4 flex items-center space-x-3">
                  <Calendar className="w-6 h-6 text-primary-600" />
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                      Lịch sử bài tập về nhà
                    </h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Dropdown chọn ngày */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                      Chọn ngày:
                    </label>
                    <select
                      value={activeDateKey || ''}
                      onChange={(e) => {
                        const value = e.target.value || null
                        setSelectedHomeworkDate(value)
                        // Reset buổi học khi đổi ngày
                        setSelectedHomeworkSessionId(null)
                      }}
                      className="flex-1 w-full sm:w-auto px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {homeworkDates.map((dateKey) => (
                        <option key={dateKey} value={dateKey}>
                          {format(new Date(dateKey), 'dd/MM/yyyy')}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dropdown chọn buổi học trong ngày */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                      Chọn buổi học:
                    </label>
                    <select
                      value={activeSessionId || ''}
                      onChange={(e) =>
                        setSelectedHomeworkSessionId(e.target.value || null)
                      }
                      className="flex-1 w-full sm:w-auto px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {sessionsForDate.map((session) => {
                        const rawTutorName =
                          (session.schedule && (session.schedule as any).tutor) ||
                          (session.schedule && (session.schedule as any).tutorName) ||
                          (session.schedule &&
                            (session.schedule as any).tutorId &&
                            tutorInfoMap[(session.schedule as any).tutorId]?.name)

                        const tutorLabel = rawTutorName || 'Tutor'

                        return (
                          <option key={session.sessionId} value={session.sessionId}>
                            {session.schedule?.time
                              ? `${session.schedule.time} · ${tutorLabel}`
                              : tutorLabel}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {sessionsForDate.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-sm text-gray-500">
                  Không có bài tập nào cho ngày đã chọn.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessionsToRender.map(({ sessionId, items }) => (
                  <div
                    key={sessionId}
                    className="card rounded-2xl border-2 border-primary-50 bg-white p-4 sm:p-6 shadow-sm hover:shadow-xl transition-shadow duration-300"
                  >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg sm:text-xl font-bold text-gray-900">
                      Bài tập buổi này
                    </h4>
                  </div>

                    <div className="space-y-4">
                      {items.map((item) => {
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
                                  <p className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                                    {item.task}
                                  </p>
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
                                    <span className="text-xs sm:text-sm font-medium text-gray-500">
                                      Hạn nộp:
                                    </span>
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
                                        <span className="text-xs sm:text-sm font-medium text-gray-500">
                                          File Bài Tập:
                                        </span>
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
                                        !item.assignmentUrl &&
                                        (!item.assignmentUrls || item.assignmentUrls.length === 0)
                                          ? 'sm:col-span-2'
                                          : ''
                                      }`}
                                    >
                                      <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                      <div className="flex-1 min-w-0">
                                        <span className="text-xs sm:text-sm font-medium text-gray-500">
                                          Lời giải:
                                        </span>
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
                                                {solutionUrls.length > 1
                                                  ? `File lời giải ${idx + 1}`
                                                  : fileName}
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
                                    <span className="text-xs sm:text-sm font-medium text-gray-500">
                                      Bài làm học sinh:
                                    </span>
                                  </div>
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pl-6 sm:pl-8">
                                    <div className="flex-1 min-w-0 space-y-2">
                                      {(() => {
                                        const urls =
                                          (item as any).studentSolutionFileUrls ||
                                          (item.studentSolutionFileUrl
                                            ? splitFileUrls(item.studentSolutionFileUrl)
                                            : [])

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
                                              const fileName =
                                                url.split('/').pop() || 'Bài làm học sinh'
                                              const key = `${item.id}-${idx}`
                                              const isBusy = studentHomeworkUploading === key
                                              return (
                                                <div key={idx} className="flex items-center gap-2">
                                                  <a
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm sm:text-base text-blue-600 hover:underline break-all flex-1 min-w-0"
                                                    title={url}
                                                  >
                                                    {urls.length > 1
                                                      ? `Bài làm ${idx + 1}`
                                                      : fileName}
                                                  </a>
                                                  {/* Nút thay file */}
                                                  <label
                                                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 ${
                                                      isBusy ? 'cursor-wait opacity-60' : 'cursor-pointer hover:bg-primary-50'
                                                    }`}
                                                    title={isBusy ? 'Đang cập nhật...' : 'Thay thế file'}
                                                  >
                                                    {isBusy ? (
                                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                      <Upload className="w-3.5 h-3.5" />
                                                    )}
                                                    <input
                                                      type="file"
                                                      className="hidden"
                                                      accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                                      onChange={async (e) => {
                                                        const file = e.target.files?.[0]
                                                        if (!file) return
                                                        const key = `${item.id}-${idx}`
                                                        setStudentHomeworkUploading(key)
                                                        try {
                                                          await handleUploadHomeworkFile(
                                                            item.id,
                                                            file,
                                                            idx,
                                                          )
                                                          setScheduleFetchTrigger((prev) => prev + 1)
                                                        } catch (error) {
                                                          console.error('Upload failed:', error)
                                                          alert('Không thể upload file. Vui lòng thử lại.')
                                                        } finally {
                                                          setStudentHomeworkUploading(null)
                                                          e.target.value = ''
                                                        }
                                                      }}
                                                      disabled={isBusy}
                                                    />
                                                  </label>
                                                  {/* Nút xoá file */}
                                                  <button
                                                    type="button"
                                                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-red-300 text-red-600 flex-shrink-0 ${
                                                      isBusy ? 'cursor-wait opacity-60' : 'hover:bg-red-50'
                                                    }`}
                                                    title={isBusy ? 'Đang xóa...' : 'Xóa file'}
                                                    onClick={async () => {
                                                      if (isBusy) return
                                                      const key = `${item.id}-${idx}`
                                                      setStudentHomeworkUploading(key)
                                                      try {
                                                        await handleDeleteHomeworkFile(item.id, idx)
                                                        setScheduleFetchTrigger((prev) => prev + 1)
                                                      } catch (error) {
                                                        console.error('Delete homework file error:', error)
                                                        alert('Không thể xóa file. Vui lòng thử lại.')
                                                      } finally {
                                                        setStudentHomeworkUploading(null)
                                                      }
                                                    }}
                                                  >
                                                    {isBusy ? (
                                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                      '×'
                                                    )}
                                                  </button>
                                                </div>
                                              )
                                            })}
                                          </>
                                        )
                                      })()}
                                    </div>
                                  </div>
                                  {/* Nút thêm file mới */}
                                  <div className="pl-6 sm:pl-8">
                                    <label
                                      className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-primary-300 text-primary-600 text-xs sm:text-sm font-semibold ${
                                        studentHomeworkUploading === `${item.id}-new`
                                          ? 'cursor-wait opacity-60'
                                          : 'cursor-pointer hover:bg-primary-50'
                                      }`}
                                      title={
                                        studentHomeworkUploading === `${item.id}-new`
                                          ? 'Đang upload...'
                                          : 'Thêm file mới'
                                      }
                                    >
                                      {studentHomeworkUploading === `${item.id}-new` ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <>
                                          <Plus className="w-3.5 h-3.5" />
                                          <span>Thêm file</span>
                                        </>
                                      )}
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0]
                                          if (!file) return
                                          setStudentHomeworkUploading(`${item.id}-new`)
                                          try {
                                            await handleUploadHomeworkFile(item.id, file)
                                            setScheduleFetchTrigger((prev) => prev + 1)
                                          } catch (error) {
                                            console.error('Upload failed:', error)
                                            alert('Không thể upload file. Vui lòng thử lại.')
                                          } finally {
                                            setStudentHomeworkUploading(null)
                                            e.target.value = ''
                                          }
                                        }}
                                        disabled={studentHomeworkUploading === `${item.id}-new`}
                                      />
                                    </label>
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
                                      <span className="text-sm sm:text-base font-medium text-gray-700">
                                        Nhận xét:
                                      </span>
                                      <span className="text-sm sm:text-base text-gray-900 ml-2 break-words block sm:inline">
                                        {item.comment}
                                      </span>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <Layout 
      sidebar={<Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />}
    >
      {renderContent()}
      {showChecklistOverlay && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Checklist hôm nay</h3>
                <p className="text-sm text-gray-500">Chi tiết nhiệm vụ được mở đầy đủ để rà soát nhanh.</p>
              </div>
              <button
                onClick={() => setShowChecklistOverlay(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {completedCount}/{totalCount} nhiệm vụ đã hoàn thành · {todayChecklist.length} nhiệm vụ hôm nay
                </p>
                <span className="text-sm font-semibold text-primary-600">
                  Tiến độ hiện tại: {progressPercentage}%
                </span>
              </div>
              {renderTodayChecklistGroups(true)}
            </div>
          </div>
        </div>
      )}
      {showReportPreview && previewReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Báo buổi học</h3>
                <p className="text-sm text-gray-500">
                  Ngày {format(previewReport.date, 'dd/MM/yyyy')} · Tutor {previewReport.tutor}
                </p>
              </div>
              <button
                onClick={handleCloseReportPreview}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              <div className="border border-gray-200 rounded-2xl p-4 bg-gradient-to-br from-white to-gray-50">
                <p className="text-sm font-semibold text-gray-500 uppercase">Tổng quan</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{previewReport.summary}</p>
              </div>

              {previewReport && previewStats && (
                <div className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-900 uppercase">Checklist hôm nay</p>
                    <span className="text-xs font-semibold text-primary-600">
                      {previewStats.completed}/{previewStats.total} ({previewStats.percentage}%)
                    </span>
                  </div>
                  <div className="space-y-2">
                    {previewStats.items.length === 0 ? (
                      <p className="text-sm text-gray-500">Không có nhiệm vụ nào cho môn này.</p>
                    ) : (
                      previewStats.items.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
                        >
                          <span className="font-medium text-gray-700">
                            {index + 1}. {item.lesson}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              item.status === 'done'
                                ? 'bg-green-100 text-green-700'
                                : item.status === 'in_progress'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {item.status === 'done'
                              ? 'Hoàn thành'
                              : item.status === 'in_progress'
                                ? 'Đang làm'
                                : 'Chưa xong'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {previewReport && previewStats && (
                <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
                  <p className="text-sm font-bold text-gray-900 uppercase">Chi tiết bài tập</p>
                  {previewStats.detailItems.length === 0 ? (
                    <p className="text-sm text-gray-500">Chưa có dữ liệu chi tiết.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr className="text-xs uppercase tracking-wider text-gray-500">
                            <th className="px-3 py-2 text-left font-semibold">Bài tập</th>
                            <th className="px-3 py-2 text-left font-semibold">Ước lượng</th>
                            <th className="px-3 py-2 text-left font-semibold">File bài tập</th>
                            <th className="px-3 py-2 text-left font-semibold">Thực tế</th>
                            <th className="px-3 py-2 text-left font-semibold">Lời giải</th>
                            <th className="px-3 py-2 text-left font-semibold">Kết quả</th>
                            <th className="px-3 py-2 text-left font-semibold">Nhận xét</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewStats.detailItems.map((item: ChecklistDetailItem) => {
                            const badge = checklistResultConfig[item.result]
                            return (
                              <tr key={item.id}>
                                <td className="px-3 py-2 font-semibold text-gray-900">{item.lesson}</td>
                                <td className="px-3 py-2 text-gray-600">{item.estimatedTime} phút</td>
                                <td className="px-3 py-2 text-gray-600">
                                  {(() => {
                                    const urls =
                                      (item as any).assignmentUrls ||
                                      ((item.assignmentUrl || (item as any).assignmentUrl)
                                        ? Array.isArray(item.assignmentUrl || (item as any).assignmentUrl)
                                          ? (item.assignmentUrl || (item as any).assignmentUrl).filter(
                                              (url: string) => url && url.trim(),
                                            )
                                          : splitFileUrls(item.assignmentUrl || (item as any).assignmentUrl)
                                        : [])
                                    return urls.length > 0 ? (
                                      <div className="flex flex-col gap-1">
                                        {urls.map((url: string, idx: number) => (
                                          <a
                                            key={idx}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                                          >
                                            <FileText className="w-3 h-3 flex-shrink-0" />
                                            <span className="text-xs font-semibold truncate max-w-[100px]">
                                              {urls.length > 1 ? `File ${idx + 1}` : 'Xem file'}
                                            </span>
                                            <Download className="w-3 h-3 cursor-pointer hover:text-blue-700 flex-shrink-0" />
                                          </a>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )
                                  })()}
                                </td>
                                <td className="px-3 py-2 text-gray-900 font-medium">{item.actualTime} phút</td>
                                <td className="px-3 py-2 text-gray-600 space-y-1">
                                  {item.solutionText && <p className="text-xs text-gray-700">{item.solutionText}</p>}
                                  {(() => {
                                    const urls = (item as any).solutionUrls || splitFileUrls(item.solutionUrl)
                                    return urls.length > 0 ? (
                                      <div className="flex flex-col gap-1">
                                        {urls.map((url: string, idx: number) => (
                                          <a
                                            key={idx}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-semibold text-gray-700 hover:text-primary-600 hover:underline"
                                            title={url}
                                          >
                                            {urls.length > 1 ? `File lời giải ${idx + 1}` : 'File lời giải'}
                                          </a>
                                        ))}
                                      </div>
                                    ) : null
                                  })()}
                                </td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${badge.className}`}>
                                    {badge.label}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-gray-500">{item.qualityNote || '—'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="border border-gray-200 rounded-2xl p-4">
                <p className="text-sm font-bold text-gray-900 uppercase mb-3">Nhận xét chi tiết</p>
                <div className="grid grid-cols-1 gap-3">
                  {previewReport.criteria.map((criteria) => (
                    <div key={`${previewReport.id}-preview-${criteria.id}`} className="border border-gray-200 rounded-2xl p-4 bg-white">
                      <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{criteria.metric}</p>
                          <p className="text-xs text-gray-500">{criteria.description}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={`${criteria.id}-modal-star-${star}`}
                              className={`w-4 h-4 ${star <= criteria.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                            />
                          ))}
                          <span className="text-xs font-semibold text-gray-600 ml-1">{criteria.rating}/5</span>
                        </div>
                      </div>
                      <div className="bg-primary-50/70 text-primary-700 text-xs font-medium px-3 py-2 rounded-xl">
                        {criteria.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-gray-200 rounded-2xl p-4 bg-gradient-to-br from-white to-gray-50">
                <p className="text-base font-bold text-gray-900 uppercase tracking-wide">
                  Nhận xét chung cho môn học từ Tutor
                </p>

                <p className="text-sm font-medium text-gray-600 mt-2 leading-relaxed">
                  Môn này cần cải thiện nhiều hơn phần tính nhẩm...
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Xem nhanh trước khi xuất báo cáo chính thức.</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCloseReportPreview}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    handleExportSubjectReport(previewReport)
                    handleCloseReportPreview()
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Xuất file PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}