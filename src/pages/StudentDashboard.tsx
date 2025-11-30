import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layout } from '../components/common'
import { Sidebar, ScheduleItem, MonthlyCalendar, ChecklistItem, TaskItem } from '../components/dashboard'
import { BookOpen, MessageSquare, TrendingUp, Calendar, Target, UserCircle, Play, ChevronRight, ChevronDown, ChevronUp, Clock, Copy, FileText, AlertTriangle, Star, Eye, Download, ExternalLink, Folder, Lightbulb, Upload, Loader2, Layers, PenTool } from 'lucide-react'
import { format, isToday } from 'date-fns'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { apiCall, API_BASE_URL } from '../config/api'
import { getCookie } from '../utils/cookies'
import { useAuth } from '../contexts/AuthContext'
import { ChecklistDetailTable, HomeworkDetailTable, MaterialUploadSection, HomeSection, ScheduleSection, type ChecklistDetailItem, type HomeworkDetailItem } from '../components/student'
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
          attachment: task.assignmentUrl || assignment.supplementaryMaterials?.[0]?.url,
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
        attachment: assignment.supplementaryMaterials?.[0]?.url,
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
  const [selectedUploadScheduleId, setSelectedUploadScheduleId] = useState<string | null>(null)
  const [selectedChecklistScheduleId, setSelectedChecklistScheduleId] = useState<string | null>(null)
  const [selectedHomeworkScheduleId, setSelectedHomeworkScheduleId] = useState<string | null>(null)
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
  }, [user, scheduleInfoById])

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
          assignmentFileName: getFileNameFromUrl(task.assignmentUrl),
          assignmentUrl: task.assignmentUrl,
          deadline: homework.deadline,
          studentSolutionFileUrl: (task as any).answerURL,
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

  const handleFileUpload = (id: string, file: File) => {
    setHomeworkDetailItems((prev) => {
      const updatedEntries: Record<string, HomeworkDetailItem[]> = {}
      Object.entries(prev).forEach(([sessionId, items]) => {
        updatedEntries[sessionId] = items.map((item) =>
          item.id === id ? { ...item, uploadedFileName: file.name } : item
        )
      })
      return updatedEntries
    })
    console.log('Upload file for item:', id, file.name)
  }

  const handleUploadHomeworkFile = async (taskId: string, file: File) => {
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
          // Cập nhật homework task với answerURL
          // Chỉ gửi các trường được phép theo validation schema
          const payload: any = {
            tasks: tasks.map((t, idx) => {
              const isTargetTask = (t.id === task.id || `${homework.id}-task-${idx}` === taskId)
              
              if (isTargetTask) {
                // Chỉ gửi các trường được phép, loại bỏ _id, id, và các trường MongoDB khác
                return {
                  name: t.name || '',
                  assignmentUrl: t.assignmentUrl || undefined,
                  solutionUrl: t.solutionUrl || undefined,
                  answerURL: fileUrl,
                  status: t.status || undefined,
                  description: t.description || undefined,
                }
              } else {
                // Giữ nguyên task khác nhưng cũng loại bỏ _id
                return {
                  name: t.name || '',
                  assignmentUrl: t.assignmentUrl || undefined,
                  solutionUrl: t.solutionUrl || undefined,
                  answerURL: t.answerURL || undefined,
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
                  ? { ...item, studentSolutionFileUrl: fileUrl, uploadedFileName: file.name }
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

  const handleDetailSolutionUpload = (subject: string, id: string, file: File) => {
    const isImage = file.type.startsWith('image/')
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined
    updateSubjectDetailItems(subject, (items) =>
      items.map((item) => {
        if (item.id !== id) return item
        if (item.solutionPreview && item.solutionPreview.startsWith('blob:')) {
          URL.revokeObjectURL(item.solutionPreview)
        }
        return {
          ...item,
          solutionType: isImage ? 'image' : 'file',
          solutionFileName: file.name,
          solutionPreview: previewUrl,
          solutionText: isImage ? undefined : item.solutionText,
        }
      })
    )
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

  const getSubjectChecklistStats = (subject: string) => {
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
    setShowReportPreview(true)
  }

  const handleCloseReportPreview = () => {
    setShowReportPreview(false)
    setPreviewReport(null)
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
              uploadScheduleOptions={uploadScheduleOptions}
              selectedUploadScheduleId={selectedUploadScheduleId}
              onUploadScheduleChange={(scheduleId) => setSelectedUploadScheduleId(scheduleId)}
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
              uploadScheduleOptions={uploadScheduleOptions}
              selectedUploadScheduleId={selectedUploadScheduleId}
              onUploadScheduleChange={(scheduleId) => setSelectedUploadScheduleId(scheduleId)}
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
                      onUploadSolution={(id, file) => handleDetailSolutionUpload(group.subject, id, file)}
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

  const renderChecklistSection = () => {
    // Schedules có checklist (bao gồm cả quá khứ)
    const checklistScheduleIds = Object.keys(checklistItemsBySchedule)
    const checklistScheduleOptionsRaw = checklistScheduleIds
      .map((id) => {
        const schedule = schedules.find((s) => s.id === id)
        return { id, schedule }
      })
      .filter((opt) => !!opt.schedule) as { id: string; schedule: ScheduleItem }[]
    const checklistScheduleOptions = checklistScheduleOptionsRaw.sort(
      (a, b) => a.schedule.date.getTime() - b.schedule.date.getTime()
    )

    const activeChecklistSchedule =
      checklistScheduleOptions.find((opt) => opt.id === selectedChecklistScheduleId)?.schedule ||
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
        solutionPreview: undefined,
        uploadedFileName: undefined,
        assignmentFileName: getFileNameFromUrl(item.attachment),
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
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Checklist theo buổi học</h2>
            </div>
            {checklistScheduleOptions.length > 0 && (
              <select
                value={activeChecklistScheduleId || ''}
                onChange={(e) => setSelectedChecklistScheduleId(e.target.value || null)}
                className="px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {checklistScheduleOptions.map(({ id, schedule }) => (
                  <option key={id} value={id}>
                    {`${format(schedule.date, 'dd/MM/yyyy')} · ${schedule.time}${schedule.subject ? ` · ${schedule.subject}` : ''}`}
                  </option>
                ))}
              </select>
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
                                <p className="text-2xl font-bold text-primary-600 uppercase tracking-wide whitespace-nowrap w-48 flex-shrink-0">
                                  {assignment.subject || activeChecklistSchedule?.subject || 'Chung'}
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
                                              Nhiệm vụ
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
                                        solutionPreview: undefined,
                                        uploadedFileName: undefined,
                                        assignmentFileName: getFileNameFromUrl(task.assignmentUrl),
                                      })
                                    })
                                  } else {
                                    // Không có task con
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
                                      assignmentFileName: getFileNameFromUrl(
                                        assignment.supplementaryMaterials?.[0]?.url as string | undefined
                                      ),
                                    })
                                  }
                                  
                                  return (
                                    <ChecklistDetailTable
                                      items={detailItemsForAssignment}
                                      onUpload={() => {}}
                                      onUploadSolution={() => {}}
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
                      onUpload={() => {}}
                      onUploadSolution={() => {}}
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
    // Các buổi học có bài tập về nhà (bao gồm cả quá khứ)
    const homeworkScheduleIds = Object.keys(homeworkDetailItems)
    const homeworkScheduleOptionsRaw = homeworkScheduleIds
      .map((id) => {
        const schedule = schedules.find((s) => s.id === id)
        return { id, schedule }
      })
      .filter((opt) => !!opt.schedule) as { id: string; schedule: ScheduleItem }[]
    const homeworkScheduleOptions = homeworkScheduleOptionsRaw.sort(
      (a, b) => a.schedule.date.getTime() - b.schedule.date.getTime()
    )

    const activeHomeworkSchedule =
      homeworkScheduleOptions.find((opt) => opt.id === selectedHomeworkScheduleId)?.schedule ||
      homeworkScheduleOptions[homeworkScheduleOptions.length - 1]?.schedule

    const activeHomeworkScheduleId = activeHomeworkSchedule?.id
    const activeHomeworkItems: HomeworkDetailItem[] =
      activeHomeworkScheduleId && homeworkDetailItems[activeHomeworkScheduleId]
        ? homeworkDetailItems[activeHomeworkScheduleId]
        : []

    return (
      <div className="h-full overflow-y-auto space-y-3 sm:space-y-4">
        {/* Bài tập theo buổi học */}
        <div className="card hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Bài tập theo buổi học</h2>
            </div>
            {homeworkScheduleOptions.length > 0 && (
              <select
                value={activeHomeworkScheduleId || ''}
                onChange={(e) => setSelectedHomeworkScheduleId(e.target.value || null)}
                className="px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {homeworkScheduleOptions.map(({ id, schedule }) => (
                  <option key={id} value={id}>
                    {`${format(schedule.date, 'dd/MM/yyyy')} · ${schedule.time}${schedule.subject ? ` · ${schedule.subject}` : ''}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {homeworkScheduleOptions.length === 0 || !activeHomeworkScheduleId || !activeHomeworkSchedule ? (
            <p className="text-sm text-gray-500 italic">Chưa có bài tập về nhà nào cho học sinh này.</p>
          ) : (
            <div className="mt-2 pt-1 space-y-4">
              {activeHomeworkItems.map((item) => {
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
                    className="border-l-4 border-primary-500 bg-white rounded-lg shadow-sm overflow-hidden"
                  >
                    {/* Header */}
                    <div className="px-5 py-3 border-b border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-xl font-bold text-gray-900">{item.task}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Status */}
                          <span
                            className={`text-sm px-3 py-1 rounded-full font-semibold whitespace-nowrap ${
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
                              className={`text-sm px-3 py-1 rounded-full font-semibold ${difficultyColors[item.difficulty]}`}
                            >
                              {difficultyLabels[item.difficulty]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-4">
                      {/* Phần trên: Deadline, File bài tập, Bài làm HS, Lời giải */}
                      <div className="space-y-3 pb-4">
                        {/* Deadline */}
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                          <span className="text-base font-medium text-gray-700 whitespace-nowrap">Hạn nộp:</span>
                          <span className="text-base text-red-600 font-medium">
                            {item.deadline
                              ? format(new Date(item.deadline), 'dd/MM/yyyy')
                              : 'Chưa có'}
                          </span>
                        </div>

                        {/* File bài tập */}
                        {item.assignmentUrl && (
                          <div className="flex items-center gap-3">
                            <Folder className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                            <span className="text-base font-medium text-blue-600 whitespace-nowrap">File Bài Tập:</span>
                            <a
                              href={item.assignmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-base text-blue-600 hover:underline flex-1 truncate"
                              title={item.assignmentUrl}
                            >
                              {item.assignmentFileName || item.assignmentUrl.split('/').pop() || 'Xem file bài tập'}
                            </a>
                          </div>
                        )}

                        {/* Bài làm học sinh - Học sinh có thể upload */}
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          <span className="text-base font-medium text-blue-600 whitespace-nowrap">Bài làm HS:</span>
                          <div className="flex items-center gap-3 flex-1">
                            {item.uploadedFileName || item.studentSolutionFileUrl ? (
                              <a
                                href={item.studentSolutionFileUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-base text-blue-600 hover:underline flex-1 truncate"
                                title={item.studentSolutionFileUrl}
                              >
                                {item.uploadedFileName || 'Bài làm học sinh'}
                              </a>
                            ) : (
                              <span className="text-base text-gray-400 flex-1">Chưa có bài làm</span>
                            )}
                            {handleUploadHomeworkFile && (
                              <label
                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-primary-500 ${
                                  item.uploadedFileName || item.studentSolutionFileUrl
                                    ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                                    : 'bg-primary-500 text-white hover:bg-primary-600 shadow-md'
                                } font-semibold text-base flex-shrink-0 transition-colors cursor-pointer`}
                                title={item.uploadedFileName || item.studentSolutionFileUrl ? "Cập nhật bài làm" : "Upload bài làm"}
                              >
                                <Upload className="w-5 h-5" />
                                <span>{item.uploadedFileName || item.studentSolutionFileUrl ? 'Cập nhật' : 'Upload bài làm'}</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (!file || !handleUploadHomeworkFile) return
                                    try {
                                      await handleUploadHomeworkFile(item.id, file)
                                      setScheduleFetchTrigger((prev) => prev + 1)
                                    } catch (error) {
                                      console.error('Upload failed:', error)
                                      alert('Không thể upload file. Vui lòng thử lại.')
                                    } finally {
                                      e.target.value = ''
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Lời giải */}
                        {item.solutionUrl && (
                          <div className="flex items-center gap-3">
                            <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                            <span className="text-base font-medium text-blue-600 whitespace-nowrap">Lời giải:</span>
                            <a
                              href={item.solutionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-base text-blue-600 hover:underline flex-1 truncate"
                              title={item.solutionUrl}
                            >
                              {item.solutionFileName || item.solutionUrl.split('/').pop() || 'Xem lời giải'}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Separator */}
                      {item.comment && (
                        <div className="border-t border-dashed border-gray-300 my-4"></div>
                      )}

                      {/* Nhận xét */}
                      {item.comment && (
                        <div className="flex items-start gap-3 pt-2">
                          <div className="w-1 h-6 bg-yellow-400 flex-shrink-0 rounded"></div>
                          <div className="flex-1">
                            <span className="text-base font-medium text-gray-700">Nhận xét:</span>
                            <span className="text-base text-gray-900 ml-2">{item.comment}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
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
        (() => {
          const previewStats = getSubjectChecklistStats(previewReport.subject)
          return (
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

              {previewStats && (
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
                          <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white">
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
                              {item.status === 'done' ? 'Hoàn thành' : item.status === 'in_progress' ? 'Đang làm' : 'Chưa xong'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
              )}

              {previewStats && (
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
                          {previewStats.detailItems.map((item) => {
                            const badge = checklistResultConfig[item.result]
                            return (
                              <tr key={item.id}>
                                <td className="px-3 py-2 font-semibold text-gray-900">{item.lesson}</td>
                                <td className="px-3 py-2 text-gray-600">{item.estimatedTime} phút</td>
                                <td className="px-3 py-2 text-gray-600">
                                  {item.assignmentFileName ? (
                                    <div className="flex items-center gap-1 text-blue-600">
                                      <FileText className="w-3 h-3 flex-shrink-0" />
                                      <span className="text-xs font-semibold truncate max-w-[100px]">{item.assignmentFileName}</span>
                                      <Download className="w-3 h-3 cursor-pointer hover:text-blue-700 flex-shrink-0" />
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-gray-900 font-medium">{item.actualTime} phút</td>
                                <td className="px-3 py-2 text-gray-600 space-y-1">
                                  {item.solutionText && <p className="text-xs text-gray-700">{item.solutionText}</p>}
                                  {item.solutionFileName && (
                                    <p className="text-xs font-semibold text-gray-700">{item.solutionFileName}</p>
                                  )}
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
          )
        })()
      )}
    </Layout>
  )
}