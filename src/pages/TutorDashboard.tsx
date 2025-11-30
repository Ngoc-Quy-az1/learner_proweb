import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layout } from '../components/common'
import { TutorSidebar, ChecklistItem, MonthlyCalendar, ScheduleItem } from '../components/dashboard'
import { Users, Calendar, Plus, Clock, UserCircle, Copy, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Upload, Search, Loader2, Layers, Folder, Lightbulb, PenTool } from 'lucide-react'
import { format, isToday, differenceInYears } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { apiCall, API_BASE_URL } from '../config/api'
import {
  ChecklistForm,
  SubjectEvaluation,
  StudentInfoDetails,
  SubjectReviewSection,
  SessionEvaluationSection,
  HomeworkSection,
  TodayChecklistSection,
  type ChecklistFormData,
  type TutorChecklistDetail,
  type HomeworkItem,
} from '../components/tutor'
import { TutorDashboardContext } from '../contexts/TutorDashboardContext'
import type { TutorInfo } from '../components/student/types'
import { getCookie } from '../utils/cookies'
interface TutorSchedule {
  id: string
  studentId: string
  subject: string
  student: string
  time: string
  date: Date
  meetLink?: string
  note?: string
  materials?: ScheduleMaterialItem[]
}

interface ScheduleMaterialItem {
  id: string
  name: string
  url: string
  uploadedAt?: string
  note?: string
}

type AssignmentStatus = 'pending' | 'in-progress' | 'completed'
type AssignmentTaskStatus = 'pending' | 'in-progress' | 'completed'

interface AssignmentTaskApiItem {
  id?: string
  name?: string
  description?: string
  status?: AssignmentTaskStatus
  assignmentUrl?: string
  solutionUrl?: string
  estimatedTime?: number
  actualTime?: number
   answerURL?: string
  note?: string
}

export interface AssignmentApiItem {
  id?: string
  _id?: string
  scheduleId?:
    | string
    | {
        _id: string
        studentId?: {
          _id: string
          name?: string
        }
      }
  studentId?: string | { _id: string; name?: string }
  tutorId?: string
  name?: string
  description?: string
  subject?: string
  status?: AssignmentStatus
  tasks?: AssignmentTaskApiItem[]
  supplementaryMaterials?: Array<{
    name?: string
    url?: string
    requirement?: string
  }>
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

// TutorChecklistDetail interface đã được export từ DetailTable component

interface HomeworkTaskApiResponse {
  id?: string
  name?: string
  assignmentUrl?: string
  solutionUrl?: string
  answerURL?: string
  status?: 'pending' | 'submitted' | 'graded' | 'undone' | 'in-progress'
  description?: string
}

interface HomeworkApiResponse {
  id: string
  studentId?: string
  scheduleId?: string
  name?: string
  description?: string
  deadline?: string
  difficulty?: 'easy' | 'medium' | 'hard' | 'advanced'
  subject?: string
  status?: 'in-progress' | 'completed' | 'undone'
  tasks?: HomeworkTaskApiResponse[]
  createdAt?: string
  updatedAt?: string
}

// TutorChecklistExercise interface đã được export từ ChecklistForm component

interface SubjectEvaluation {
  concentration: number // 1-5 sao
  understanding: number // 1-5 sao
  taskCompletion: number // 1-5 sao
  attitude: number // 1-5 sao
  presentation: number // 1-5 sao
  generalComment: string // Đánh giá chung
}

interface ReviewGrade {
  taskId: string
  result: number
  comment: string
}

interface ReviewResponse {
  id: string
  assignmentID?: string
  assignmentGrades?: ReviewGrade[]
  comment?: string
  createdAt?: string
  updatedAt?: string
}

interface AssignmentReviewState {
  taskId: string
  result: number
  comment: string
  reviewId?: string
}

type ScheduleSlotGroup = {
  id: string
  time: string
  meetLink?: string
  subjects: string[]
  schedules: TutorSchedule[]
}

type ScheduleInfo = {
  studentId: string
  subject: string
  time?: string
  date?: Date
  meetLink?: string
}

type AssignmentCardContext = {
  assignment: AssignmentApiItem
  studentId: string
  studentName: string
  subjectLabel: string
  scheduleId?: string
  scheduleInfo?: ScheduleInfo
}

const resolveUserId = (value: unknown, fallback?: string): string | undefined => {
  if (!value) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    const candidate = value as { id?: string; _id?: string }
    if (candidate.id && typeof candidate.id === 'string') return candidate.id
    if (candidate._id && typeof candidate._id === 'string') return candidate._id
  }
  return fallback
}

const resolveAssignmentScheduleId = (scheduleRef: AssignmentApiItem['scheduleId']): string | undefined => {
  if (!scheduleRef) return undefined
  if (typeof scheduleRef === 'string') return scheduleRef
  if (typeof scheduleRef === 'object') {
    return scheduleRef._id || (scheduleRef as { id?: string }).id
  }
  return undefined
}

const resolveAssignmentStudentId = (studentRef: AssignmentApiItem['studentId']): string | undefined => {
  if (!studentRef) return undefined
  if (typeof studentRef === 'string') return studentRef
  if (typeof studentRef === 'object') {
    return studentRef._id || (studentRef as { id?: string }).id
  }
  return undefined
}

const getAssignmentIdentifier = (
  assignment: AssignmentApiItem,
  fallbackIndex?: number
): string => {
  return (
    assignment.id ||
    assignment._id ||
    `${assignment.subject || 'subject'}-${resolveAssignmentStudentId(assignment.studentId) || fallbackIndex || '0'}`
  )
}

const SUBJECT_LABELS: Record<string, string> = {
  MATH101: 'Toán',
  PHYSICS101: 'Lý',
  CHEMISTRY101: 'Hóa',
  BIOLOGY101: 'Sinh',
  ENGLISH101: 'Anh',
  GENERAL: 'Chung',
  TOAN: 'Toán',
  HOA: 'Hóa',
  LY: 'Lý',
}

const getSubjectDisplayName = (code?: string, fallback?: string) => {
  if (!code || !code.trim()) return fallback || 'Chung'
  const normalized = code.toUpperCase()
  return SUBJECT_LABELS[normalized] || code || fallback || 'Chung'
}

const mapAssignmentStatusToChecklist = (
  status?: AssignmentStatus | AssignmentTaskStatus
): ChecklistItem['status'] => {
  if (!status || status === 'pending') return 'not_done'
  if (status === 'in-progress') return 'in_progress'
  return 'done'
}

const mapChecklistStatusToAssignment = (
  status: ChecklistItem['status']
): AssignmentTaskStatus => {
  if (status === 'in_progress') return 'in-progress'
  if (status === 'done') return 'completed'
  return 'pending'
}

// Map frontend task status to backend API status
// Frontend: 'pending' | 'in-progress' | 'completed'
// Backend: 'pending' | 'in-progress' | 'submitted' | 'undone'
const mapTaskStatusToApi = (
  status: 'pending' | 'in-progress' | 'completed' | undefined
): 'pending' | 'in-progress' | 'submitted' | 'undone' => {
  if (!status || status === 'pending') return 'pending'
  if (status === 'in-progress') return 'in-progress'
  if (status === 'completed') return 'submitted'
  return 'pending'
}

// Map backend API status to frontend task status
// Backend: 'pending' | 'in-progress' | 'submitted' | 'undone'
// Frontend: 'pending' | 'in-progress' | 'completed'
const mapApiStatusToTask = (
  status: 'pending' | 'in-progress' | 'submitted' | 'undone' | undefined
): 'pending' | 'in-progress' | 'completed' | undefined => {
  if (!status || status === 'pending' || status === 'undone') return 'pending'
  if (status === 'in-progress') return 'in-progress'
  if (status === 'submitted') return 'completed'
  return 'pending'
}

interface ScheduleApiItem {
  id: string
  startTime: string
  duration: number
  subjectCode: string
  studentId: string | { id: string; name: string }
  tutorId: string | { id: string; name: string }
  note?: string
  meetingURL?: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  reportURL?: string
  createdAt: string
  updatedAt: string
  supplementaryMaterials?: Array<{
    _id?: string
    name?: string
    documentURL?: string
    description?: string
  }>
}

interface SchedulePaginatedResponse {
  results: ScheduleApiItem[]
  page: number
  limit: number
  totalPages: number
  totalResults: number
}

interface StudentInfo {
  id: string
  userId?: string
  name: string
  email: string
  phone?: string
  avatarUrl?: string
  address?: string
  birthday?: string
  currentLevel?: string
  grade?: string
  moreInfo?: string
  isEmailVerified?: boolean
  isActive?: boolean
}

interface StudentInfoDetail {
  id: string
  userId?:
    | string
    | {
        id?: string
        role?: string
        name?: string
        email?: string
        avatarUrl?: string
      }
  school?: string
  grade?: string
  parent1Name?: string
  parent1Email?: string
  parent1Number?: string
  parent1Request?: string
  parent2Name?: string
  parent2Email?: string
  parent2Number?: string
  parent2Request?: string
  academicLevel?: string
  hobbies?: string[]
  favoriteSubjects?: string[]
  strengths?: string[]
  improvements?: string[]
  notes?: string
  createdAt?: string
  updatedAt?: string
}

interface DashboardStudent extends StudentInfo {
  subject?: string
  subjects: string[]
  progress?: number
  parent?: string
  contact?: string
  preferredChannel?: string
  age?: number
  dateOfBirth?: string
  school?: string
  grade?: string
  favoriteSubjects?: string[]
  strengths?: string[]
  improvements?: string[]
  hobbies?: string[]
  parent1Name?: string
  parent1Email?: string
  parent1Number?: string
  parent2Name?: string
  parent2Email?: string
  parent2Number?: string
  parentNotes?: string
}


export default function TutorDashboard() {
  const { user } = useAuth()
  const [tutorProfile, setTutorProfile] = useState<TutorInfo | null>(null)
  const tutorName = tutorProfile?.name || user?.name || 'Tutor B'
  const tutorEmail = tutorProfile?.email || user?.email || 'tutor@skillar.com'
  const tutorAvatar = tutorProfile?.avatarUrl || user?.avatar
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Get section from URL or default to 'home'
  const sectionFromUrl = searchParams.get('section')
  const validSections = ['home', 'students', 'schedule', 'checklist']
  const defaultSection = 'home'
  const initialSection = sectionFromUrl && validSections.includes(sectionFromUrl) ? sectionFromUrl : defaultSection
  
  const [activeSection, setActiveSection] = useState(initialSection)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
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
  const [selectedStudent, setSelectedStudent] = useState<string>('1')
  const [studentSearch, setStudentSearch] = useState('')
  const [tutorSchedules, setTutorSchedules] = useState<TutorSchedule[]>([])
  const [schedulesLoading, setSchedulesLoading] = useState(true)
  const [studentInfoMap, setStudentInfoMap] = useState<Record<string, StudentInfo>>({})
  const [studentInfoDetailsMap, setStudentInfoDetailsMap] = useState<Record<string, StudentInfoDetail>>({})
  const [showChecklistForm, setShowChecklistForm] = useState(false)
  const [isSubmittingChecklist, setIsSubmittingChecklist] = useState(false)
  const [checklistForm, setChecklistForm] = useState<ChecklistFormData>({
    studentId: '1',
    scheduleId: '',
    lesson: '',
    name: '',
    description: '',
    tasks: '',
    note: '',
    dueDate: '',
    exercises: [
      {
        id: 'exercise-1',
        title: '',
        requirement: '',
        estimatedTime: '',
        note: '',
      },
    ],
  })
  const [copiedScheduleLink, setCopiedScheduleLink] = useState<string | null>(null)
  const [selectedScheduleSlotId, setSelectedScheduleSlotId] = useState<string | null>(null)
  const [quickViewStudentId, setQuickViewStudentId] = useState<string | null>(null)
  const [expandedQuickViewAssignmentId, setExpandedQuickViewAssignmentId] = useState<string | null>(null)
  const [editingQuickViewAssignmentId, setEditingQuickViewAssignmentId] = useState<string | null>(null)
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, AssignmentTaskApiItem[]>>({})
  const [savingAssignmentId, setSavingAssignmentId] = useState<string | null>(null)
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null)
  const [taskFileUploadingKey, setTaskFileUploadingKey] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<{ type: 'lesson' | 'task' | 'note'; itemId: string } | null>(null)
  const [expandedEvaluations, setExpandedEvaluations] = useState<Record<string, boolean>>({}) // scheduleId -> boolean
  
  // State cho đánh giá
  interface ScheduleReview {
    name: string
    rating: number
    comment: string
  }
  const [scheduleReviews, setScheduleReviews] = useState<Record<string, ScheduleReview[]>>({}) // scheduleId -> reviews
  const [savingReviews, setSavingReviews] = useState<string | null>(null) // scheduleId đang lưu

  interface ScheduleReport {
    id: string
    subjectCode: string
    startTime: string
    tutor: string
    reportURL: string
  }

  const [scheduleReports, setScheduleReports] = useState<Record<string, ScheduleReport | null>>({})
  const [reportLoadingScheduleId, setReportLoadingScheduleId] = useState<string | null>(null)
  const [reportError, setReportError] = useState<string | null>(null)
  
  const scheduleSlotsScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  
  // Stte cho form thêm bài tập
  interface HomeworkFormData {
    description: string
    deadline: string
    tasks: Array<{
      name: string
      assignmentUrl: string
      solutionUrl: string
      status: 'undone' | 'in-progress' | 'submitted'
      description: string
    }>
  }
  const [showHomeworkForm, setShowHomeworkForm] = useState(false)
  const [homeworkFormData, setHomeworkFormData] = useState<HomeworkFormData>({
    description: '',
    deadline: '',
    tasks: [{
      name: '',
      assignmentUrl: '',
      solutionUrl: '',
      status: 'undone',
      description: ''
    }]
  })
  const [homeworkFormStudentId, setHomeworkFormStudentId] = useState<string | null>(null)
  const [homeworkFormScheduleId, setHomeworkFormScheduleId] = useState<string | null>(null)
  const [homeworkFormSubject, setHomeworkFormSubject] = useState<string>('')
  const [submittingHomework, setSubmittingHomework] = useState(false)
  const [homeworkFormErrors, setHomeworkFormErrors] = useState<{
    name?: string
    deadline?: string
    tasks?: Array<{
      name?: string
    }>
  }>({})
  const deadlineInputRef = useRef<HTMLInputElement>(null)

  // Ẩn native calendar picker indicator
  useEffect(() => {
    if (deadlineInputRef.current) {
      const style = document.createElement('style')
      style.textContent = `
        #homework-deadline-input::-webkit-calendar-picker-indicator {
          display: none !important;
          -webkit-appearance: none !important;
          opacity: 0 !important;
          width: 0 !important;
          height: 0 !important;
        }
      `
      document.head.appendChild(style)
      return () => {
        document.head.removeChild(style)
      }
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const fetchTutorProfile = async () => {
      if (!user?.id) {
        if (isMounted) setTutorProfile(null)
        return
      }
      try {
        const profile = await apiCall<TutorInfo>(`/users/${user.id}`)
        if (!isMounted) return
        setTutorProfile({
          ...profile,
          id: profile?.id || user.id,
        })
      } catch (error) {
        console.error('Failed to fetch tutor profile:', error)
        if (isMounted) setTutorProfile(null)
      }
    }

    fetchTutorProfile()
    return () => {
      isMounted = false
    }
  }, [user?.id])

  const scheduleOptionsByStudent = useMemo(() => {
    const map: Record<string, Array<{ id: string; label: string }>> = {}
    tutorSchedules.forEach((schedule) => {
      if (!map[schedule.studentId]) map[schedule.studentId] = []
      // Loại bỏ "Chung" khỏi label
      const subjectPart = schedule.subject === 'Chung' ? '' : ` · ${schedule.subject}`
      map[schedule.studentId].push({
        id: schedule.id,
        label: `${format(schedule.date, 'dd/MM')} · ${schedule.time}${subjectPart}`,
      })
    })
    return map
  }, [tutorSchedules])
  // State cho checklist section - chọn ngày, học sinh, và buổi học
  const [checklistSelectedDate, setChecklistSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [checklistSelectedStudentId, setChecklistSelectedStudentId] = useState<string | null>(null)
  const [checklistSelectedScheduleId, setChecklistSelectedScheduleId] = useState<string | null>(null)
  const [selectedChecklistScheduleSlotId, setSelectedChecklistScheduleSlotId] = useState<string | null>(null)
  
  // Đánh giá môn học theo studentId và subject
  const [subjectEvaluations, setSubjectEvaluations] = useState<Record<string, Record<string, SubjectEvaluation>>>({
    '1': {
      'Toán': {
        concentration: 4,
        understanding: 4,
        taskCompletion: 4,
        attitude: 5,
        presentation: 3,
        generalComment: 'Học sinh có tiến bộ tốt, cần rèn luyện thêm phần diễn đạt.'
      },
      'Hóa': {
        concentration: 5,
        understanding: 4,
        taskCompletion: 5,
        attitude: 5,
        presentation: 4,
        generalComment: 'Học sinh rất tích cực và hiểu bài tốt.'
      }
    },
    '4': {
      'Toán': {
        concentration: 4,
        understanding: 3,
        taskCompletion: 4,
        attitude: 4,
        presentation: 3,
        generalComment: 'Cần cải thiện kỹ năng giải thích bài toán.'
      }
    },
    '8': {
      'Toán': {
        concentration: 5,
        understanding: 5,
        taskCompletion: 5,
        attitude: 5,
        presentation: 5,
        generalComment: 'Học sinh xuất sắc, hoàn thành tốt mọi nhiệm vụ.'
      }
    },
    '11': {
      'Toán': {
        concentration: 3,
        understanding: 3,
        taskCompletion: 3,
        attitude: 4,
        presentation: 3,
        generalComment: 'Cần tập trung hơn và làm đầy đủ bài tập.'
      }
    }
  })
const [expandedHomeworkSections, setExpandedHomeworkSections] = useState<Record<string, boolean>>({})
const [assignmentReviews, setAssignmentReviews] = useState<Record<string, AssignmentReviewState>>({})
const [assignmentReviewsLoading, setAssignmentReviewsLoading] = useState(false)
  const [assignmentReviewSaving, setAssignmentReviewSaving] = useState<Record<string, boolean>>({})

  const [isHomeChecklistExpanded, setIsHomeChecklistExpanded] = useState(false)
  // Thu / mở báo cáo buổi học
  const [isHomeReportExpanded, setIsHomeReportExpanded] = useState(false)
  const [isChecklistReportExpanded, setIsChecklistReportExpanded] = useState(false)

  const [checklistItemsByStudent, setChecklistItemsByStudent] = useState<Record<string, ChecklistItem[]>>({})
  const [checklistItemMeta, setChecklistItemMeta] = useState<Record<string, { assignmentId: string; taskId?: string }>>({})
  const [assignments, setAssignments] = useState<AssignmentApiItem[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null)
  const [assignmentFetchTrigger, setAssignmentFetchTrigger] = useState(0)

  const students = useMemo<DashboardStudent[]>(() => {
    if (Object.keys(studentInfoMap).length === 0) return []

    const subjectsByStudent: Record<string, Set<string>> = {}
    tutorSchedules.forEach((schedule) => {
      const studentId = schedule.studentId
      if (!subjectsByStudent[studentId]) {
        subjectsByStudent[studentId] = new Set()
      }
      if (schedule.subject) {
        subjectsByStudent[studentId].add(schedule.subject)
      }
    })

    return Object.entries(studentInfoMap).map(([studentId, info]) => {
      const detail = studentInfoDetailsMap[studentId]
      const detailUser = detail && typeof detail.userId === 'object' ? detail.userId : undefined

      const subjects = Array.from(subjectsByStudent[studentId] || [])
      const checklistItems = checklistItemsByStudent[studentId] || []
      const completedItems = checklistItems.filter((item) => item.status === 'done').length
      const progress =
        checklistItems.length > 0 ? Math.round((completedItems / checklistItems.length) * 100) : undefined

      const birthday = info.birthday ? new Date(info.birthday) : null
      const hasValidBirthday = birthday && !isNaN(birthday.getTime())
      const age = hasValidBirthday ? differenceInYears(new Date(), birthday) : undefined

      const grade = detail?.grade || detail?.academicLevel || info.currentLevel || 'Chưa cập nhật'
      const school = detail?.school || info.currentLevel || 'Chưa cập nhật'
      const parentInfo =
        detail?.parent1Name ||
        detail?.parent2Name ||
        info.moreInfo ||
        'Chưa cập nhật'
      const parentContact =
        detail?.parent1Number ||
        detail?.parent1Email ||
        detail?.parent2Number ||
        detail?.parent2Email ||
        info.phone ||
        info.email ||
        'Chưa cập nhật'

      const studentEmail = info.email || detailUser?.email || ''
      const studentName = info.name || detailUser?.name || 'Chưa có tên'
      const studentAvatar = info.avatarUrl || detailUser?.avatarUrl

      return {
        id: studentId,
        userId: info.userId || (detailUser?.id ?? studentId),
        name: studentName,
        email: studentEmail,
        phone: info.phone,
        avatarUrl: studentAvatar,
        address: info.address,
        subject: subjects[0],
        subjects,
        progress,
        parent: parentInfo,
        contact: parentContact,
        preferredChannel: info.moreInfo ? 'Ghi chú' : 'Chưa cập nhật',
        moreInfo: detail?.notes || info.moreInfo,
        age,
        dateOfBirth: hasValidBirthday ? format(birthday as Date, 'dd/MM/yyyy') : undefined,
        school,
        grade,
        favoriteSubjects: detail?.favoriteSubjects,
        strengths: detail?.strengths,
        improvements: detail?.improvements,
        hobbies: detail?.hobbies,
        parent1Name: detail?.parent1Name,
        parent1Email: detail?.parent1Email,
        parent1Number: detail?.parent1Number,
        parent2Name: detail?.parent2Name,
        parent2Email: detail?.parent2Email,
        parent2Number: detail?.parent2Number,
        parentNotes: detail?.notes,
      }
    })
  }, [studentInfoMap, tutorSchedules, checklistItemsByStudent, studentInfoDetailsMap])

  const scheduleInfoById = useMemo(() => {
    const map: Record<string, ScheduleInfo> = {}
    tutorSchedules.forEach((schedule) => {
      map[schedule.id] = {
        studentId: schedule.studentId,
        subject: schedule.subject,
        time: schedule.time,
        date: schedule.date,
        meetLink: schedule.meetLink,
      }
    })
    return map
  }, [tutorSchedules])

  const getAssignmentScheduleId = (assignment: AssignmentApiItem): string | undefined => {
    if (typeof assignment.scheduleId === 'string') return assignment.scheduleId
    if (assignment.scheduleId && typeof assignment.scheduleId === 'object') return assignment.scheduleId._id
    return undefined
  }

  const getAssignmentStudentId = (assignment: AssignmentApiItem): string | undefined => {
    if (typeof assignment.studentId === 'string') return assignment.studentId
    if (assignment.studentId && typeof assignment.studentId === 'object') return assignment.studentId._id
    if (
      assignment.scheduleId &&
      typeof assignment.scheduleId === 'object' &&
      assignment.scheduleId.studentId &&
      typeof assignment.scheduleId.studentId === 'object'
    ) {
      return assignment.scheduleId.studentId._id
    }
    const scheduleId = getAssignmentScheduleId(assignment)
    if (scheduleId && scheduleInfoById[scheduleId]) {
      return scheduleInfoById[scheduleId].studentId
    }
    return undefined
  }

  const studentMap = useMemo(() => {
    const map: Record<string, { id: string; name?: string; grade?: string }> = {}
    students.forEach((student) => {
      map[student.id] = student
    })
    return map
  }, [students])

  const assignmentsWithContext = useMemo<AssignmentCardContext[]>(() => {
    const contexts: AssignmentCardContext[] = []
    assignments.forEach((assignment) => {
      const studentId = getAssignmentStudentId(assignment)
      if (!studentId) {
        return
      }
      const scheduleId = getAssignmentScheduleId(assignment)
      const scheduleInfo = scheduleId ? scheduleInfoById[scheduleId] : undefined
      const subjectLabel = getSubjectDisplayName(assignment.subject, scheduleInfo?.subject)
      const fallbackStudentName =
        typeof assignment.studentId === 'object' && assignment.studentId !== null
          ? assignment.studentId.name
          : undefined

      contexts.push({
        assignment,
        studentId,
        studentName: studentMap[studentId]?.name || fallbackStudentName || 'Học sinh',
        subjectLabel,
        scheduleId,
        scheduleInfo,
      })
    })
    return contexts
  }, [assignments, scheduleInfoById, studentMap])

  useEffect(() => {
    if (assignments.length === 0) {
      setChecklistItemsByStudent({})
      setChecklistItemMeta({})
      return
    }

    const nextByStudent: Record<string, ChecklistItem[]> = {}
    const nextMeta: Record<string, { assignmentId: string; taskId?: string }> = {}

    assignments.forEach((assignment) => {
      let scheduleIdString: string | undefined
      if (typeof assignment.scheduleId === 'string') {
        scheduleIdString = assignment.scheduleId
      } else if (assignment.scheduleId && typeof assignment.scheduleId === 'object') {
        scheduleIdString = assignment.scheduleId._id
      }

      const relatedSchedule = scheduleIdString ? scheduleInfoById[scheduleIdString] : undefined

      let studentId: string | undefined
      if (typeof assignment.studentId === 'string') {
        studentId = assignment.studentId
      } else if (assignment.studentId && typeof assignment.studentId === 'object') {
        studentId = assignment.studentId._id
      } else if (
        assignment.scheduleId &&
        typeof assignment.scheduleId === 'object' &&
        assignment.scheduleId.studentId &&
        typeof assignment.scheduleId.studentId === 'object'
      ) {
        studentId = assignment.scheduleId.studentId._id
      } else if (relatedSchedule) {
        studentId = relatedSchedule.studentId
      }
      if (!studentId) return

      const subject = getSubjectDisplayName(assignment.subject, relatedSchedule?.subject)

      if (!nextByStudent[studentId]) {
        nextByStudent[studentId] = []
      }

      const assignmentId = assignment._id || assignment.id || `assignment-${Date.now()}-${Math.random()}`
      if (assignment.tasks && assignment.tasks.length > 0) {
        assignment.tasks.forEach((task, index) => {
          const itemId = task.id || `${assignmentId}-task-${index}`
          nextByStudent[studentId].push({
            id: itemId,
            subject,
            lesson: assignment.name || 'Bài học',
            task: task.name || assignment.description || 'Nhiệm vụ',
            status: mapAssignmentStatusToChecklist(task.status),
            note: task.description || assignment.description,
            attachment: task.assignmentUrl || task.solutionUrl,
          })
          nextMeta[itemId] = { assignmentId, taskId: task.id || undefined }
        })
      } else {
        const itemId = assignmentId
        nextByStudent[studentId].push({
          id: itemId,
          subject,
          lesson: assignment.name || 'Bài học',
          task: assignment.description || 'Nhiệm vụ',
          status: mapAssignmentStatusToChecklist(assignment.status),
          note: assignment.description,
        })
        nextMeta[itemId] = { assignmentId }
      }
    })

    setChecklistItemsByStudent(nextByStudent)
    setChecklistItemMeta(nextMeta)
  }, [assignments, scheduleInfoById])

  // Fetch schedules from API
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!user?.id) return
      
      try {
        setSchedulesLoading(true)
        const response = await apiCall<SchedulePaginatedResponse>(
          `/schedules?tutorId=${user.id}&limit=100&sortBy=startTime:asc`
        )
        
        // Build fallback info from schedules and collect IDs to fetch
        const studentIds = new Set<string>()
        const fallbackStudentInfoMapLocal: Record<string, StudentInfo> = {}
        response.results.forEach((schedule) => {
          const studentRef = schedule.studentId
          const studentId = resolveUserId(studentRef)
          if (!studentId) return
          studentIds.add(studentId)
          if (studentRef && typeof studentRef === 'object') {
            const studentRefData = studentRef as any
            fallbackStudentInfoMapLocal[studentId] = {
              id: studentId,
              userId: resolveUserId(studentRefData.userId, studentId) || studentId,
              name: studentRefData.name || 'Chưa có tên',
              email: studentRefData.email || '',
              phone: studentRefData.phone,
              avatarUrl: studentRefData.avatarUrl || studentRefData.avatar,
              address: studentRefData.address,
              birthday: studentRefData.birthday,
              currentLevel: studentRefData.currentLevel,
              moreInfo: studentRefData.moreInfo,
            }
          }
        })
        
        // Fetch all student info in parallel
        const studentInfoPromises = Array.from(studentIds).map(async (studentId) => {
          try {
            const studentInfo = await apiCall<StudentInfo>(`/users/${studentId}`)
            return { studentId, studentInfo }
          } catch (error) {
            console.error(`Failed to fetch student info for ${studentId}:`, error)
            return null
          }
        })
        
        const studentInfoResults = await Promise.all(studentInfoPromises)
        const mergedStudentInfoMap: Record<string, StudentInfo> = { ...fallbackStudentInfoMapLocal }
        studentInfoResults.forEach((result) => {
          if (result) {
            mergedStudentInfoMap[result.studentId] = {
              ...result.studentInfo,
              userId: result.studentId,
            }
          }
        })
        setStudentInfoMap(mergedStudentInfoMap)
        
        // Map API response to TutorSchedule format
        const mappedSchedules: TutorSchedule[] = response.results.map((schedule) => {
          const studentId = resolveUserId(schedule.studentId) || ''
          const studentInfo = mergedStudentInfoMap[studentId]
          const startTime = new Date(schedule.startTime)
          const endTime = new Date(startTime.getTime() + schedule.duration * 60 * 1000)
          const timeString = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`
          const materials = (schedule.supplementaryMaterials || [])
            .map((material, index) => ({
              id: material._id || `${schedule.id}-${index}`,
              name: material.name || `Tài liệu ${index + 1}`,
              url: material.documentURL || '',
              uploadedAt: schedule.updatedAt,
              note: material.description,
            }))
            .filter((item) => item.url)
          
        const subject = getSubjectDisplayName(schedule.subjectCode, schedule.subjectCode)
          
          return {
            id: schedule.id,
            studentId: studentId,
            subject: subject,
            student: studentInfo?.name || fallbackStudentInfoMapLocal[studentId]?.name || 'Chưa có tên',
            time: timeString,
            date: startTime,
            meetLink: schedule.meetingURL,
            note: schedule.note,
            materials,
          }
        })
        
        setTutorSchedules(mappedSchedules)
      } catch (error) {
        console.error('Failed to fetch schedules:', error)
      } finally {
        setSchedulesLoading(false)
      }
    }
    
    fetchSchedules()
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    const fetchAssignments = async () => {
      setAssignmentsLoading(true)
      setAssignmentsError(null)
      try {
        const query = new URLSearchParams({
          tutorId: user.id,
          limit: '200',
          sortBy: 'updatedAt:desc',
        }).toString()
        const response = await apiCall<AssignmentPaginatedResponse>(`/assignments?${query}`)
        if (!cancelled) {
          // Map task status from API format to frontend format
          const mappedAssignments = (response.results || []).map((assignment) => ({
            ...assignment,
            tasks: assignment.tasks?.map((task) => ({
              ...task,
              status: mapApiStatusToTask(task.status as any) as AssignmentTaskStatus,
            })),
          }))
          setAssignments(mappedAssignments)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch assignments:', error)
          const message = error instanceof Error ? error.message : 'Không thể tải checklist'
          setAssignmentsError(message)
          setAssignments([])
        }
      } finally {
        if (!cancelled) {
          setAssignmentsLoading(false)
        }
      }
    }

    fetchAssignments()
    return () => {
      cancelled = true
    }
  }, [user?.id, assignmentFetchTrigger])

  // Fetch homeworks từ API
  useEffect(() => {
    if (!user?.id || students.length === 0) return
    let cancelled = false

    const fetchHomeworks = async () => {
      try {
        // Lấy danh sách studentIds từ students
        const studentIds = students.map(s => s.id)
        
        // Fetch homeworks cho tất cả học sinh
        const allHomeworks: HomeworkApiResponse[] = []
        for (const studentId of studentIds) {
          try {
            const query = new URLSearchParams({
              studentId: studentId,
              limit: '200',
              sortBy: 'deadline:desc',
            }).toString()
            const response = await apiCall<{ results?: HomeworkApiResponse[] }>(`/homeworks?${query}`)
            if (response.results && Array.isArray(response.results)) {
              allHomeworks.push(...response.results)
            }
          } catch (error) {
            console.error(`Failed to fetch homeworks for student ${studentId}:`, error)
          }
        }

        if (cancelled) return

        // Map dữ liệu từ API sang format HomeworkItem và nhóm theo studentId và subject
        const mappedData: Record<string, Record<string, HomeworkItem[]>> = {}
        
        allHomeworks.forEach((homework) => {
          const studentId = homework.studentId || ''
          const subject = homework.subject || 'Chung'
          
          if (!mappedData[studentId]) {
            mappedData[studentId] = {}
          }
          if (!mappedData[studentId][subject]) {
            mappedData[studentId][subject] = []
          }

          // Mỗi task trong homework sẽ là một HomeworkItem
          if (homework.tasks && Array.isArray(homework.tasks) && homework.tasks.length > 0) {
            const mappedItems: HomeworkItem[] = homework.tasks.map((task: HomeworkTaskApiResponse, index: number) => {
              // Map homework status từ API sang frontend result
              // Homework status: 'in-progress', 'completed', 'undone'
              // Frontend result: 'not_done', 'in_progress', 'completed'
              let result: HomeworkItem['result'] = 'not_done'
              const homeworkStatus = homework.status
              
              if (homeworkStatus === 'completed') {
                result = 'completed'
              } else if (homeworkStatus === 'in-progress') {
                result = 'in_progress'
              } else {
                // 'undone' hoặc không có -> 'not_done'
                result = 'not_done'
              }
              
              return {
                id: task.id || `${homework.id}-task-${index}`,
                homeworkId: homework.id,
                scheduleId: homework.scheduleId,
                task: task.name || homework.name || 'Bài tập',
                deadline: homework.deadline || '',
                assignmentUrl: task.assignmentUrl || undefined,
                studentSolutionFile: task.answerURL || undefined,
                tutorSolution: task.solutionUrl || undefined,
                difficulty: (homework.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
                result: result,
                note: task.description || homework.description || '',
                subject: subject
              }
            })
            mappedData[studentId][subject].push(...mappedItems)
          } else {
            // Nếu không có tasks, tạo một HomeworkItem từ homework chính
            const mappedItem: HomeworkItem = {
              id: homework.id,
              homeworkId: homework.id,
              scheduleId: homework.scheduleId,
              task: homework.name || 'Bài tập',
              deadline: homework.deadline || '',
              assignmentUrl: undefined,
              studentSolutionFile: undefined,
              tutorSolution: undefined,
              difficulty: (homework.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
              result: 'not_done',
              note: homework.description || '',
              subject: subject
            }
            mappedData[studentId][subject].push(mappedItem)
          }
        })

        setHomeworkItemsByStudentAndSubject(mappedData)
        console.log('Fetched and mapped homeworks:', mappedData)
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch homeworks:', error)
        }
      }
    }

    fetchHomeworks()
    return () => {
      cancelled = true
    }
  }, [user?.id, students, assignmentFetchTrigger])

  // Fetch detailed student info (grade, parents, hobbies...)
  useEffect(() => {
    const studentEntries = Object.entries(studentInfoMap)
    if (studentEntries.length === 0) return

    const missingEntries = studentEntries.filter(([studentId]) => !studentInfoDetailsMap[studentId])
    if (missingEntries.length === 0) return

    let cancelled = false

    const fetchDetails = async () => {
      try {
        const detailResults = await Promise.all(
          missingEntries.map(async ([studentId, info]) => {
            try {
              const detail = await apiCall<StudentInfoDetail>(
                `/students/${info.userId || info.id}/info`
              )
              return { studentId, detail }
            } catch (error) {
              console.error(`Failed to fetch student info detail for ${studentId}:`, error)
              return null
            }
          })
        )

        if (cancelled) return

        const nextDetails: Record<string, StudentInfoDetail> = {}
        detailResults.forEach((result) => {
          if (result?.detail) {
            nextDetails[result.studentId] = result.detail
          }
        })

        if (Object.keys(nextDetails).length > 0) {
          setStudentInfoDetailsMap((prev) => ({ ...prev, ...nextDetails }))
          setStudentInfoMap((prev) => {
            const nextMap = { ...prev }
            detailResults.forEach((result) => {
              if (!result?.detail) return
              const detailUser =
                result.detail && typeof result.detail.userId === 'object'
                  ? (result.detail.userId as { id?: string; name?: string; email?: string; avatarUrl?: string })
                  : undefined
              const existing = nextMap[result.studentId]
              if (existing) {
                nextMap[result.studentId] = {
                  ...existing,
                  userId: existing.userId || detailUser?.id || result.studentId,
                  name: existing.name || detailUser?.name || 'Chưa có tên',
                  email: existing.email || detailUser?.email || '',
                  avatarUrl: existing.avatarUrl || detailUser?.avatarUrl,
                }
              } else if (detailUser) {
                nextMap[result.studentId] = {
                  id: result.studentId,
                  userId: detailUser.id || result.studentId,
                  name: detailUser.name || 'Chưa có tên',
                  email: detailUser.email || '',
                  avatarUrl: detailUser.avatarUrl,
                }
              }
            })
            return nextMap
          })
        }
      } catch (error) {
        console.error('Failed to fetch student info details:', error)
      }
    }

    fetchDetails()

    return () => {
      cancelled = true
    }
  }, [studentInfoMap, studentInfoDetailsMap])

  // supplementaryMaterials are included directly in the schedules payload

  const [studentPage, setStudentPage] = useState(1)
  const studentsPerPage = 12
  const filteredStudents = useMemo(() => {
    const normalizedQuery = studentSearch.trim().toLowerCase()
    return students.filter((student) => {
      const matchesName = student.name.toLowerCase().includes(normalizedQuery)
      return matchesName
    })
  }, [students, studentSearch])
  useEffect(() => {
    setStudentPage(1)
  }, [studentSearch])
  const studentPages = Math.max(1, Math.ceil(filteredStudents.length / studentsPerPage))
  const paginatedStudents = filteredStudents.slice(
    (studentPage - 1) * studentsPerPage,
    studentPage * studentsPerPage
  )
  const selectedStudentDetail = students.find((student) => student.id === selectedStudent)

  useEffect(() => {
    if (students.length === 0) return
    setSelectedStudent((prev) => (students.some((student) => student.id === prev) ? prev : students[0].id))
  }, [students])

  // Map assignments (tasks) -> chi tiết bài tập cho từng học sinh / môn
  useEffect(() => {
    if (!assignments.length) {
      setTutorDetailItemsByStudentAndSubject({})
      return
    }

    const next: Record<string, Record<string, TutorChecklistDetail[]>> = {}

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

    assignments.forEach((assignment) => {
      // Chuẩn hóa scheduleId
      let scheduleIdString: string | undefined
      if (typeof assignment.scheduleId === 'string') {
        scheduleIdString = assignment.scheduleId
      } else if (assignment.scheduleId && typeof assignment.scheduleId === 'object') {
        scheduleIdString = assignment.scheduleId._id
      }

      const relatedSchedule = scheduleIdString ? scheduleInfoById[scheduleIdString] : undefined

      // Lấy studentId giống logic checklist
      let studentId: string | undefined
      if (typeof assignment.studentId === 'string') {
        studentId = assignment.studentId
      } else if (assignment.studentId && typeof assignment.studentId === 'object') {
        studentId = assignment.studentId._id
      } else if (
        assignment.scheduleId &&
        typeof assignment.scheduleId === 'object' &&
        assignment.scheduleId.studentId &&
        typeof assignment.scheduleId.studentId === 'object'
      ) {
        studentId = assignment.scheduleId.studentId._id
      } else if (relatedSchedule) {
        studentId = relatedSchedule.studentId
      }

      if (!studentId) return

      const subject = getSubjectDisplayName(assignment.subject, relatedSchedule?.subject)

      if (!next[studentId]) next[studentId] = {}
      if (!next[studentId][subject]) next[studentId][subject] = []

      const tasks = assignment.tasks || []
      if (!tasks.length) return

      tasks.forEach((task, index) => {
        const id = task.id || `${assignment.id}-task-${index}`

        const estimatedMinutes =
          typeof task.estimatedTime === 'number' && !Number.isNaN(task.estimatedTime)
            ? task.estimatedTime
            : 0
        const actualMinutes =
          typeof task.actualTime === 'number' && !Number.isNaN(task.actualTime)
            ? task.actualTime
            : 0

        const estimatedTime = `${estimatedMinutes} phút`
        const actualTime = `${actualMinutes} phút`

        let result: TutorChecklistDetail['result'] = 'not_done'
        const taskStatusStr = String(task.status)
        if (taskStatusStr === 'completed') {
          result = 'completed'
        } else if (
          taskStatusStr === 'in-progress' ||
          taskStatusStr === 'in_progress' ||
          taskStatusStr === 'in progress'
        ) {
          result = 'in_progress'
        } else if (taskStatusStr === 'incorrect' || taskStatusStr === 'wrong') {
          result = 'incorrect'
        }

        next[studentId][subject].push({
          id,
          lesson: task.name || assignment.name || 'Bài tập',
          estimatedTime,
          actualTime,
          result,
          solution: task.description || assignment.description || '',
          note: assignment.description || '',
          uploadedFile: getFileNameFromUrl(task.answerURL),
          assignmentFileName: getFileNameFromUrl(task.assignmentUrl),
        })
      })
    })

    setTutorDetailItemsByStudentAndSubject(next)
  }, [assignments, scheduleInfoById])

  const updateChecklistItemById = (
    id: string,
    updater: (item: ChecklistItem) => ChecklistItem
  ) => {
    setChecklistItemsByStudent((prev) => {
      let updated = false
      const next: typeof prev = {}
      Object.entries(prev).forEach(([studentId, items]) => {
        const index = items.findIndex((item) => item.id === id)
        if (index !== -1) {
          const nextItems = [...items]
          nextItems[index] = updater(items[index])
          next[studentId] = nextItems
          updated = true
        } else {
          next[studentId] = items
        }
      })
      return updated ? next : prev
    })
  }

  const handleStatusChange = async (id: string, status: ChecklistItem['status']) => {
    updateChecklistItemById(id, (item) => ({ ...item, status }))
    const meta = checklistItemMeta[id]
    if (!meta) return
    try {
      const payload = meta.taskId
        ? { tasks: [{ id: meta.taskId, status: mapChecklistStatusToAssignment(status) }] }
        : { status: mapChecklistStatusToAssignment(status) }
      await apiCall(`/assignments/${meta.assignmentId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      setAssignmentFetchTrigger((prev) => prev + 1)
    } catch (error) {
      console.error('Failed to update checklist status:', error)
      setAssignmentsError('Không thể cập nhật trạng thái checklist.')
      setAssignmentFetchTrigger((prev) => prev + 1)
    }
  }

  const handleNoteChange = (id: string, note: string) => {
    updateChecklistItemById(id, (item) => ({ ...item, note }))
    const meta = checklistItemMeta[id]
    if (!meta) return
    const payload = meta.taskId
      ? {
          tasks: [
            {
              id: meta.taskId,
              description: note,
            },
          ],
        }
      : { description: note }
    apiCall(`/assignments/${meta.assignmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
      .then(() => setAssignmentFetchTrigger((prev) => prev + 1))
      .catch((error) => {
        console.error('Failed to update note:', error)
        setAssignmentsError('Không thể lưu ghi chú checklist.')
      })
  }

  const handleLessonChange = (id: string, lesson: string) => {
    updateChecklistItemById(id, (item) => ({ ...item, lesson }))
    const meta = checklistItemMeta[id]
    if (!meta) return
    apiCall(`/assignments/${meta.assignmentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: lesson }),
    })
      .then(() => setAssignmentFetchTrigger((prev) => prev + 1))
      .catch((error) => {
        console.error('Failed to update lesson name:', error)
        setAssignmentsError('Không thể cập nhật tên bài học.')
      })
  }

  const handleTaskChange = (id: string, task: string) => {
    updateChecklistItemById(id, (item) => ({ ...item, task }))
    const meta = checklistItemMeta[id]
    if (!meta) return
    const payload = meta.taskId
      ? { tasks: [{ id: meta.taskId, name: task }] }
      : { description: task }
    apiCall(`/assignments/${meta.assignmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
      .then(() => setAssignmentFetchTrigger((prev) => prev + 1))
      .catch((error) => {
        console.error('Failed to update task name:', error)
        setAssignmentsError('Không thể cập nhật nhiệm vụ.')
      })
  }

  const handleDeleteChecklistItem = async (id: string) => {
    const meta = checklistItemMeta[id]
    if (!meta) return
    try {
      await apiCall(`/assignments/${meta.assignmentId}`, {
        method: 'DELETE',
      })
      setAssignmentFetchTrigger((prev) => prev + 1)
    } catch (error) {
      console.error('Failed to delete assignment:', error)
      setAssignmentsError('Không thể xóa checklist. Vui lòng thử lại.')
    }
  }
  const studentsAt14h = useMemo(() => {
    const schedule14h = tutorSchedules.find(s => s.time === '14:00 - 15:30' && isToday(s.date))
    if (!schedule14h) return []
    return tutorSchedules
      .filter(s => s.time === '14:00 - 15:30' && isToday(s.date))
      .map(s => students.find(st => st.id === s.studentId))
      .filter(Boolean) as typeof students
  }, [tutorSchedules, students])

  // Tự động chọn học sinh đầu tiên trong danh sách khung giờ 14h khi vào trang checklist
  useEffect(() => {
    if (activeSection === 'checklist' && studentsAt14h.length > 0 && !studentsAt14h.find(s => s?.id === selectedStudent)) {
      setSelectedStudent(studentsAt14h[0]?.id || '1')
    }
  }, [activeSection, studentsAt14h, selectedStudent])

  const handleJoinSchedule = (scheduleId: string) => {
    const schedule = tutorSchedules.find(schedule => schedule.id === scheduleId)
    if (schedule?.meetLink) {
      window.open(schedule.meetLink, '_blank')
    }
  }

  const getScheduleStatus = (schedule: TutorSchedule) => {
    const [startRaw, endRaw] = schedule.time.split(' - ')
    if (!startRaw || !endRaw) {
      return 'upcoming'
    }

    const toDateTime = (value: string) => {
      const [hours, minutes] = value.split(':').map(Number)
      const date = new Date(schedule.date)
      date.setHours(hours, minutes || 0, 0, 0)
      return date
    }

    const startTime = toDateTime(startRaw)
    const endTime = toDateTime(endRaw)
    const now = new Date()

    if (now >= startTime && now <= endTime) return 'in_progress'
    if (now < startTime) return 'upcoming'
    return 'completed'
  }

  // Convert TutorSchedule to ScheduleItem for MonthlyCalendar
  const calendarSchedules = useMemo<ScheduleItem[]>(() => {
    return tutorSchedules.map((schedule): ScheduleItem => {
      const status = getScheduleStatus(schedule)
      const statusMap: Record<string, 'upcoming' | 'ongoing' | 'completed'> = {
        'in_progress': 'ongoing',
        'upcoming': 'upcoming',
        'completed': 'completed',
      }
      return {
        id: schedule.id,
        subject: schedule.subject,
        time: schedule.time,
        date: schedule.date,
        meetLink: schedule.meetLink,
        tutor: schedule.student, // Display student name in calendar
        note: schedule.note || `Học sinh: ${schedule.student}`, // Use note from API if available, otherwise show student name
        status: statusMap[status] || 'upcoming',
      }
    })
  }, [tutorSchedules, getScheduleStatus])

  // Filter schedules to only show today's schedules for home section
  const todayTutorSchedules = useMemo(
    () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return tutorSchedules.filter(schedule => {
        const scheduleDate = new Date(schedule.date)
        scheduleDate.setHours(0, 0, 0, 0)
        return scheduleDate.getTime() === today.getTime()
      })
    },
    [tutorSchedules]
  )
  const todayStudentIds = useMemo(() => new Set(todayTutorSchedules.map((schedule) => schedule.studentId)), [todayTutorSchedules])
  const todayStudentsForHome = useMemo(
    () => students.filter((student) => todayStudentIds.has(student.id)),
    [students, todayStudentIds]
  )

  const getScheduleStartDateTime = (schedule: TutorSchedule) => {
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
    const upcoming = tutorSchedules
      .map((schedule) => ({ schedule, start: getScheduleStartDateTime(schedule) }))
      .filter(({ start }) => start >= now)
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0]
    return upcoming ? upcoming.schedule : null
  }, [tutorSchedules])

  // Số học sinh & danh sách học sinh trong cùng ca sắp tới (cùng thời gian bắt đầu)
  const { upcomingStudentCount, upcomingStudents } = useMemo(() => {
    if (!upcomingSchedule) {
      return { upcomingStudentCount: 0, upcomingStudents: [] as string[] }
    }
    const upcomingStart = getScheduleStartDateTime(upcomingSchedule).getTime()
    const sameSlotSchedules = tutorSchedules.filter(
      (schedule) => getScheduleStartDateTime(schedule).getTime() === upcomingStart
    )
    const names = sameSlotSchedules.map((schedule) => {
      const info = studentInfoMap[schedule.studentId]
      return info?.name || 'Chưa có tên'
    })
    return { upcomingStudentCount: sameSlotSchedules.length, upcomingStudents: names }
  }, [upcomingSchedule, tutorSchedules, studentInfoMap])

  // Đồng hồ thời gian thực cho tutor
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

  const [showUpcomingStudentList, setShowUpcomingStudentList] = useState(false)

  const averageStudentProgress = useMemo(() => {
    if (students.length === 0) return 0
    const total = students.reduce((sum, student) => sum + (student.progress || 0), 0)
    return Math.round(total / students.length)
  }, [students])

  const pendingChecklistCount = useMemo(() => {
    return Object.values(checklistItemsByStudent).reduce((sum, items) => {
      return sum + items.filter((item) => item.status !== 'done').length
    }, 0)
  }, [checklistItemsByStudent])

  const uniqueSubjectsCount = useMemo(() => {
    return new Set(tutorSchedules.map((schedule) => schedule.subject)).size
  }, [tutorSchedules])

  const scheduleSlots = useMemo<ScheduleSlotGroup[]>(() => {
    // Gom các buổi học theo KHUNG GIỜ (time) thay vì theo meetLink/subject
    const slotMap: Record<string, { id: string; time: string; meetLink?: string; subjects: Set<string>; schedules: TutorSchedule[] }> = {}

    todayTutorSchedules.forEach((schedule) => {
      // Dùng duy nhất time làm khóa để tránh tạo nhiều ô cho cùng 1 khung giờ
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
      slotMap[slotId].subjects.add(schedule.subject)

      // Nếu slot chưa có meetLink, ưu tiên lấy meetLink của buổi học đầu tiên có link
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
  }, [todayTutorSchedules])

  useEffect(() => {
    if (scheduleSlots.length === 0) {
      setSelectedScheduleSlotId(null)
      setQuickViewStudentId(null)
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

  useEffect(() => {
    if (!selectedScheduleSlot) {
      setQuickViewStudentId(null)
      setExpandedQuickViewAssignmentId(null)
      return
    }
    setQuickViewStudentId((prev) => {
      if (prev && selectedScheduleSlot.schedules.some((schedule) => schedule.studentId === prev)) {
        return prev
      }
      return selectedScheduleSlot.schedules[0]?.studentId || null
    })
    setExpandedQuickViewAssignmentId(null)
  }, [selectedScheduleSlot])

  useEffect(() => {
    setExpandedQuickViewAssignmentId(null)
  }, [quickViewStudentId])

  // Fetch schedule details khi selectedScheduleSlot hoặc quickViewStudentId thay đổi
  useEffect(() => {
    if (!selectedScheduleSlot || !quickViewStudentId) return
    const activeSchedule = selectedScheduleSlot.schedules.find((schedule) => schedule.studentId === quickViewStudentId) || selectedScheduleSlot.schedules[0]
    if (activeSchedule && !scheduleReviews[activeSchedule.id]) {
      fetchScheduleDetails(activeSchedule.id)
    }
  }, [selectedScheduleSlot, quickViewStudentId])

const quickViewData = useMemo(() => {
  if (!selectedScheduleSlot || selectedScheduleSlot.schedules.length === 0) {
    return null
  }
  const slotSchedules = selectedScheduleSlot.schedules
  const fallbackStudentId = slotSchedules[0]?.studentId || null
  const activeStudentId =
    quickViewStudentId && slotSchedules.some((schedule) => schedule.studentId === quickViewStudentId)
      ? quickViewStudentId
      : fallbackStudentId
  const activeSchedule =
    slotSchedules.find((schedule) => schedule.studentId === activeStudentId) || slotSchedules[0]
  if (!activeSchedule) return null
  const activeStudentInfo = studentInfoMap[activeSchedule.studentId]
  const materials = activeSchedule.materials || []
  const quickViewAssignments = assignments
    .filter((assignment) => {
      const assignmentScheduleId = resolveAssignmentScheduleId(assignment.scheduleId)
      const assignmentStudentId = resolveAssignmentStudentId(assignment.studentId)
      if (assignmentScheduleId) {
        return assignmentScheduleId === activeSchedule.id
      }
      return assignmentStudentId === activeSchedule.studentId
    })
    .sort((a, b) => {
      const getTime = (value?: string) => (value ? new Date(value).getTime() : 0)
      return getTime(b.updatedAt || b.createdAt) - getTime(a.updatedAt || a.createdAt)
    })

  return {
    slotSchedules,
    activeSchedule,
    activeStudentId,
    activeStudentInfo,
    materials,
    quickViewAssignments,
  }
}, [selectedScheduleSlot, quickViewStudentId, assignments, studentInfoMap])

  // Detail items theo studentId và subject - map từ /assignments
  const [tutorDetailItemsByStudentAndSubject, setTutorDetailItemsByStudentAndSubject] =
    useState<Record<string, Record<string, TutorChecklistDetail[]>>>({})

  const handleDetailChange = (studentId: string, subject: string, detailId: string, field: keyof TutorChecklistDetail, value: string) => {
    setTutorDetailItemsByStudentAndSubject(prev => {
      const newData = { ...prev }
      if (!newData[studentId]) newData[studentId] = {}
      if (!newData[studentId][subject]) newData[studentId][subject] = []
      newData[studentId][subject] = newData[studentId][subject].map(item =>
        item.id === detailId ? { ...item, [field]: value } : item
      )
      return newData
    })
  }

  // Homework items theo studentId và subject
  // Khởi tạo với object rỗng thay vì dữ liệu mock để tránh xung đột
  const [homeworkItemsByStudentAndSubject, setHomeworkItemsByStudentAndSubject] = useState<Record<string, Record<string, HomeworkItem[]>>>({})

  const handleHomeworkChange = (studentId: string, subject: string, homeworkId: string, field: keyof HomeworkItem, value: string | 'easy' | 'medium' | 'hard' | 'completed' | 'in_progress' | 'not_done' | 'incorrect') => {
    // Chỉ cập nhật state, không gọi API
    setHomeworkItemsByStudentAndSubject(prev => {
      const newData = { ...prev }
      if (!newData[studentId]) newData[studentId] = {}
      if (!newData[studentId][subject]) newData[studentId][subject] = []
      
      newData[studentId][subject] = newData[studentId][subject].map(item => {
        if (item.id === homeworkId) {
          return { ...item, [field]: value }
        }
        return item
      })
      return newData
    })
  }

  // Hàm lưu bài tập về nhà (gọi API PATCH)
  const handleSaveHomework = async (studentId: string, subject: string, homeworkId: string) => {
    const homeworkItem = homeworkItemsByStudentAndSubject[studentId]?.[subject]?.find(item => item.id === homeworkId)
    if (!homeworkItem || !homeworkItem.homeworkId) {
      console.error('Homework item not found or missing homeworkId')
      return
    }

    try {
      // Map result sang homework status cho API: 'in-progress', 'completed', 'undone'
      // Frontend result: 'not_done', 'in_progress', 'completed'
      const mapResultToHomeworkStatus = (result: string): 'in-progress' | 'completed' | 'undone' => {
        if (result === 'completed') return 'completed'
        if (result === 'in_progress') return 'in-progress'
        return 'undone'
      }
      
      // Task status: 'in-progress', 'submitted', 'undone'
      const mapResultToTaskStatus = (result: string): 'in-progress' | 'submitted' | 'undone' => {
        if (result === 'completed') return 'submitted' // Đã hoàn thành -> đã nộp
        if (result === 'in_progress') return 'in-progress' // Đang làm -> đang làm
        return 'undone' // Chưa làm -> chưa làm
      }

      // Map difficulty sang format API (có thể có 'advanced')
      const mapDifficulty = (difficulty: string): 'easy' | 'medium' | 'hard' | 'advanced' => {
        return difficulty as 'easy' | 'medium' | 'hard' | 'advanced'
      }

      // Chuẩn bị payload theo API schema
      const homeworkStatus = homeworkItem.result ? mapResultToHomeworkStatus(homeworkItem.result) : 'undone'
      const payload: any = {
        name: homeworkItem.task || undefined,
        description: homeworkItem.note || undefined,
        deadline: homeworkItem.deadline ? new Date(homeworkItem.deadline).toISOString() : undefined,
        difficulty: homeworkItem.difficulty ? mapDifficulty(homeworkItem.difficulty) : undefined,
        subject: homeworkItem.subject || subject || undefined,
        status: homeworkStatus, // Homework status: 'in-progress', 'completed', 'undone'
        tasks: [{
          name: homeworkItem.task || undefined,
          assignmentUrl: homeworkItem.assignmentUrl || undefined,
          solutionUrl: homeworkItem.tutorSolution || undefined,
          answerURL: homeworkItem.studentSolutionFile || undefined,
          status: homeworkItem.result ? mapResultToTaskStatus(homeworkItem.result) : 'undone',
          description: homeworkItem.note || undefined
        }]
      }

      // Chỉ gửi các field có giá trị
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === '') {
          delete payload[key]
        }
      })

      // Gọi API PATCH
      await apiCall(`/homeworks/${homeworkItem.homeworkId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      console.log('Homework updated successfully:', homeworkItem.homeworkId)
      
      // Reload homework data sau khi save thành công
      setAssignmentFetchTrigger((prev) => prev + 1)
    } catch (error) {
      console.error('Failed to update homework:', error)
      const message = error instanceof Error ? error.message : 'Không thể cập nhật bài tập về nhà. Vui lòng thử lại.'
      setAssignmentsError(message)
    }
  }

  const handleDeleteHomework = async (studentId: string, subject: string, homeworkId: string) => {
    const homeworkItem = homeworkItemsByStudentAndSubject[studentId]?.[subject]?.find(item => item.id === homeworkId)
    
    // Nếu có homeworkId từ API, gọi API DELETE trước
    if (homeworkItem?.homeworkId) {
      try {
        await apiCall(`/homeworks/${homeworkItem.homeworkId}`, {
          method: 'DELETE',
        })
        console.log('Homework deleted successfully:', homeworkItem.homeworkId)
      } catch (error) {
        console.error('Failed to delete homework:', error)
        const message = error instanceof Error ? error.message : 'Không thể xóa bài tập về nhà. Vui lòng thử lại.'
        setAssignmentsError(message)
        return // Không xóa khỏi state nếu API call thất bại
      }
    }

    // Xóa khỏi state sau khi API call thành công
    setHomeworkItemsByStudentAndSubject(prev => {
      const newData = { ...prev }
      if (!newData[studentId]) newData[studentId] = {}
      if (!newData[studentId][subject]) newData[studentId][subject] = []
      newData[studentId][subject] = newData[studentId][subject].filter(item => item.id !== homeworkId)
      return newData
    })
  }

  // Hàm mở form thêm bài tập
  const openHomeworkForm = (studentId: string, scheduleId: string, subject: string) => {
    // Mặc định là ngày hôm nay
    const defaultDeadline = new Date()
    defaultDeadline.setHours(0, 0, 0, 0) // Set giờ mặc định 0h
    const deadlineString = defaultDeadline.toISOString()
    
    setHomeworkFormStudentId(studentId)
    setHomeworkFormScheduleId(scheduleId)
    setHomeworkFormSubject(subject)
    setHomeworkFormData({
      description: '',
      deadline: deadlineString,
      tasks: [{
        name: '',
        assignmentUrl: '',
        solutionUrl: '',
        status: 'undone',
        description: ''
      }]
    })
    setHomeworkFormErrors({})
    setShowHomeworkForm(true)
  }

  // Hàm submit bài tập về nhà
  const handleSubmitHomework = async () => {
    // Reset errors
    setHomeworkFormErrors({})
    setAssignmentsError(null)

    // Validate
    const errors: typeof homeworkFormErrors = {}
    let hasError = false

    if (!homeworkFormStudentId || !homeworkFormScheduleId || !homeworkFormSubject) {
      setAssignmentsError('Thiếu thông tin học sinh hoặc lịch học.')
      return
    }

    if (!homeworkFormData.description.trim()) {
      errors.name = 'Vui lòng nhập tên bài tập'
      hasError = true
    }

    if (!homeworkFormData.deadline) {
      errors.deadline = 'Vui lòng chọn deadline'
      hasError = true
    }

    if (homeworkFormData.tasks.length === 0) {
      errors.tasks = [{ name: 'Vui lòng thêm ít nhất một nhiệm vụ' }]
      hasError = true
    } else {
      const taskErrors = homeworkFormData.tasks.map((task) => {
        if (!task.name.trim()) {
          return { name: 'Vui lòng nhập tên bài tập cho nhiệm vụ này' }
        }
        return {}
      })
      if (taskErrors.some(e => Object.keys(e).length > 0)) {
        errors.tasks = taskErrors
        hasError = true
      }
    }

    if (hasError) {
      setHomeworkFormErrors(errors)
      return
    }

    setSubmittingHomework(true)

    try {
      // Format deadline: lấy ngày và set giờ 0h
      const deadlineDate = new Date(homeworkFormData.deadline)
      deadlineDate.setHours(0, 0, 0, 0)
      const formattedDeadline = deadlineDate.toISOString()

      const payload = {
        studentId: homeworkFormStudentId,
        scheduleId: homeworkFormScheduleId,
        name: homeworkFormData.description,
        deadline: formattedDeadline,
        subject: homeworkFormSubject,
        tasks: homeworkFormData.tasks
          .filter(task => task.name.trim()) // Chỉ lấy các task có tên
          .map(task => ({
            name: task.name,
            assignmentUrl: task.assignmentUrl || undefined,
            solutionUrl: task.solutionUrl || undefined,
            status: 'undone', // Mặc định undone khi mới tạo
            description: task.description || undefined
          })) 
      }

      const response = await apiCall<{ id: string }>('/homeworks', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      // Lưu lại studentId và subject trước khi reset form
      const savedStudentId = homeworkFormStudentId
      const savedSubject = homeworkFormSubject
      
      // Fetch bài tập vừa tạo để hiển thị
      if (response.id && savedStudentId && savedSubject) {
        try {
          const newHomework = await apiCall<HomeworkApiResponse>(`/homeworks/${response.id}`)
          console.log('Homework created and fetched:', newHomework)
          console.log('StudentId:', savedStudentId, 'Subject:', savedSubject)
          
          // Map dữ liệu từ API response sang HomeworkItem format
          // Mỗi task trong homework sẽ là một HomeworkItem
          if (newHomework.tasks && Array.isArray(newHomework.tasks) && newHomework.tasks.length > 0) {
            const mappedHomeworkItems: HomeworkItem[] = newHomework.tasks.map((task: HomeworkTaskApiResponse, index: number) => {
              // Map homework status từ API sang frontend result
              // Homework status: 'in-progress', 'completed', 'undone'
              // Frontend result: 'not_done', 'in_progress', 'completed'
              let result: HomeworkItem['result'] = 'not_done'
              const homeworkStatus = newHomework.status
              
              if (homeworkStatus === 'completed') {
                result = 'completed'
              } else if (homeworkStatus === 'in-progress') {
                result = 'in_progress'
              } else {
                // 'undone' hoặc không có -> 'not_done'
                result = 'not_done'
              }
              
              return {
                id: task.id || `${newHomework.id}-task-${index}`,
                homeworkId: newHomework.id, // Lưu homeworkId để dùng cho PATCH
                scheduleId: newHomework.scheduleId,
                task: task.name || newHomework.name || 'Bài tập',
                deadline: newHomework.deadline || '',
                assignmentUrl: task.assignmentUrl || undefined,
                studentSolutionFile: task.answerURL || undefined,
                tutorSolution: task.solutionUrl || undefined,
                difficulty: (newHomework.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
                result: result,
                note: task.description || newHomework.description || '',
                subject: newHomework.subject || savedSubject
              }
            })
            
            console.log('Mapped homework items:', mappedHomeworkItems)
            
            // Cập nhật state với bài tập mới
            setHomeworkItemsByStudentAndSubject(prev => {
              const newData = { ...prev }
              console.log('[setHomeworkItemsByStudentAndSubject] Before update:', {
                savedStudentId,
                savedSubject,
                prevData: prev[savedStudentId]?.[savedSubject],
                mappedItems: mappedHomeworkItems
              })
              
              if (!newData[savedStudentId]) {
                newData[savedStudentId] = {}
              }
              if (!newData[savedStudentId][savedSubject]) {
                newData[savedStudentId][savedSubject] = []
              }
              // Thêm các bài tập mới vào đầu danh sách
              newData[savedStudentId][savedSubject] = [
                ...mappedHomeworkItems,
                ...newData[savedStudentId][savedSubject]
              ]
              console.log('[setHomeworkItemsByStudentAndSubject] After update:', {
                studentId: savedStudentId,
                subject: savedSubject,
                items: newData[savedStudentId][savedSubject],
                totalItems: newData[savedStudentId][savedSubject].length
              })
              return newData
            })
          } else {
            // Nếu không có tasks, tạo một HomeworkItem từ homework chính
            const mappedHomeworkItem: HomeworkItem = {
              id: newHomework.id,
              homeworkId: newHomework.id, // Lưu homeworkId để dùng cho PATCH
              scheduleId: newHomework.scheduleId,
              task: newHomework.name || 'Bài tập',
              deadline: newHomework.deadline || '',
              assignmentUrl: undefined,
              studentSolutionFile: undefined,
              tutorSolution: undefined,
              difficulty: (newHomework.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
              result: 'not_done',
              note: newHomework.description || '',
              subject: newHomework.subject || savedSubject
            }
            
            console.log('Mapped homework item (no tasks):', mappedHomeworkItem)
            
            setHomeworkItemsByStudentAndSubject(prev => {
              const newData = { ...prev }
              console.log('[setHomeworkItemsByStudentAndSubject] Before update (no tasks):', {
                savedStudentId,
                savedSubject,
                prevData: prev[savedStudentId]?.[savedSubject],
                mappedItem: mappedHomeworkItem
              })
              
              if (!newData[savedStudentId]) {
                newData[savedStudentId] = {}
              }
              if (!newData[savedStudentId][savedSubject]) {
                newData[savedStudentId][savedSubject] = []
              }
              // Thêm bài tập mới vào đầu danh sách
              newData[savedStudentId][savedSubject] = [
                mappedHomeworkItem,
                ...newData[savedStudentId][savedSubject]
              ]
              console.log('[setHomeworkItemsByStudentAndSubject] After update (no tasks):', {
                studentId: savedStudentId,
                subject: savedSubject,
                items: newData[savedStudentId][savedSubject],
                totalItems: newData[savedStudentId][savedSubject].length
              })
              return newData
            })
          }
        } catch (fetchError) {
          console.error('Failed to fetch new homework:', fetchError)
          // Vẫn refresh danh sách nếu fetch thất bại
          setAssignmentFetchTrigger((prev) => prev + 1)
        }
      } else {
        console.warn('Missing studentId or subject:', { studentId: savedStudentId, subject: savedSubject, responseId: response.id })
        // Nếu không fetch được, vẫn refresh danh sách
        setAssignmentFetchTrigger((prev) => prev + 1)
      }

      // Đóng form và reset
      setShowHomeworkForm(false)
      setHomeworkFormData({
        description: '',
        deadline: '',
        tasks: [{
          name: '',
          assignmentUrl: '',
          solutionUrl: '',
          status: 'undone',
          description: ''
        }]
      })
      setHomeworkFormErrors({})
      
      // Refresh danh sách homework
      setAssignmentFetchTrigger((prev) => prev + 1)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo bài tập về nhà. Vui lòng thử lại.'
      setAssignmentsError(message)
    } finally {
      setSubmittingHomework(false)
    }
  }

  // Hàm thêm task vào form
  const handleAddHomeworkTask = () => {
    setHomeworkFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, {
        name: '',
        assignmentUrl: '',
        solutionUrl: '',
        status: 'undone' as const,
        description: ''
      }]
    }))
    // Clear task errors khi thêm task mới
    setHomeworkFormErrors(prev => ({
      ...prev,
      tasks: [...(prev.tasks || []), {}]
    }))
  }

  // Hàm xóa task khỏi form
  const handleRemoveHomeworkTask = (index: number) => {
    setHomeworkFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }))
    // Xóa error tương ứng
    setHomeworkFormErrors(prev => ({
      ...prev,
      tasks: prev.tasks?.filter((_, i) => i !== index) || []
    }))
  }

  // Hàm cập nhật task trong form
  const handleHomeworkTaskChange = (index: number, field: string, value: string) => {
    setHomeworkFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }))
  }

  // Hàm upload file cho homework task
  const handleHomeworkTaskFileUpload = async (
    taskIndex: number,
    field: 'assignmentUrl' | 'solutionUrl',
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const uploadKey = `homework-task-${taskIndex}-${field}`
    setTaskFileUploadingKey(uploadKey)
    try {
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
      handleHomeworkTaskChange(taskIndex, field, fileUrl)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể tải file. Vui lòng thử lại.'
      setAssignmentsError(message)
    } finally {
      setTaskFileUploadingKey(null)
    }
  }

  const handleEvaluationChange = (studentId: string, subject: string, field: keyof SubjectEvaluation, value: number | string) => {
    setSubjectEvaluations(prev => {
      const newData = { ...prev }
      if (!newData[studentId]) newData[studentId] = {}
      if (!newData[studentId][subject]) {
        newData[studentId][subject] = {
          concentration: 0,
          understanding: 0,
          taskCompletion: 0,
          attitude: 0,
          presentation: 0,
          generalComment: ''
        }
      }
      newData[studentId][subject] = {
        ...newData[studentId][subject],
        [field]: value
      }
      return newData
    })
  }

  // Hàm upload file cho homework
  const handleHomeworkFileUpload = async (
    homeworkId: string,
    field: 'assignmentUrl' | 'tutorSolution' | 'studentSolutionFile',
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const uploadKey = `${homeworkId}-${field}`
    setTaskFileUploadingKey(uploadKey)
    try {
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
      // Tìm studentId và subject từ homework item
      let foundStudentId: string | null = null
      let foundSubject: string | null = null
      for (const [sid, subjects] of Object.entries(homeworkItemsByStudentAndSubject)) {
        for (const [subj, items] of Object.entries(subjects)) {
          if (items.some(item => item.id === homeworkId)) {
            foundStudentId = sid
            foundSubject = subj
            break
          }
        }
        if (foundStudentId) break
      }
      if (foundStudentId && foundSubject) {
        // Cập nhật state với file URL
        await handleHomeworkChange(foundStudentId, foundSubject, homeworkId, field, fileUrl)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể tải file. Vui lòng thử lại.'
      setAssignmentsError(message)
    } finally {
      setTaskFileUploadingKey(null)
    }
  }

  const renderHomeworkSection = (
    studentId: string,
    subject: string,
    scheduleId?: string,
    options?: { canEdit?: boolean }
  ) => {
    if (!studentId) return null

    const subjectMap = homeworkItemsByStudentAndSubject[studentId] || {}
    const canEditSection = options?.canEdit ?? true

    const handleToggleSection = (sectionKey: string, nextValue: boolean) => {
      setExpandedHomeworkSections((prev) => ({
        ...prev,
        [sectionKey]: nextValue,
      }))
    }

    const handleChangeField = (
      subjectKey: string,
      homeworkId: string,
      field: keyof HomeworkItem,
      value: string | HomeworkItem['difficulty']
    ) => {
      handleHomeworkChange(studentId, subjectKey, homeworkId, field, value)
    }

    const handleSaveHomeworkWrapper = (subjectKey: string, homeworkId: string) => {
      handleSaveHomework(studentId, subjectKey, homeworkId)
    }

    const handleDeleteHomeworkWrapper = (subjectKey: string, homeworkId: string) => {
      handleDeleteHomework(studentId, subjectKey, homeworkId)
    }

    const handleAddHomework = (subjectKey: string, targetScheduleId?: string) => {
      if (targetScheduleId) {
        openHomeworkForm(studentId, targetScheduleId, subjectKey)
      } else {
        setAssignmentsError('Không tìm thấy thông tin lịch học để gắn bài tập.')
      }
    }

    const handleUploadFileWrapper = (
      homeworkId: string,
      field: 'assignmentUrl' | 'tutorSolution' | 'studentSolutionFile',
      files: FileList | null
    ) => {
      handleHomeworkFileUpload(homeworkId, field, files)
    }

    return (
      <HomeworkSection
        studentId={studentId}
        subject={subject}
        scheduleId={scheduleId}
        homeworkMap={subjectMap}
        expandedSections={expandedHomeworkSections}
        onToggleSection={handleToggleSection}
        onChangeField={handleChangeField}
        onSaveHomework={handleSaveHomeworkWrapper}
        onDeleteHomework={handleDeleteHomeworkWrapper}
        onAddHomework={handleAddHomework}
        onUploadFile={handleUploadFileWrapper}
        taskFileUploadingKey={taskFileUploadingKey}
        canEdit={canEditSection}
        resolveSubjectName={getSubjectDisplayName}
      />
    )
  }

  // Render component đánh giá môn học - sử dụng component mới
  const renderSubjectEvaluation = (studentId: string, subject: string) => {
    const evaluation = subjectEvaluations[studentId]?.[subject] || {
      concentration: 0,
      understanding: 0,
      taskCompletion: 0,
      attitude: 0,
      presentation: 0,
      generalComment: ''
    }

    return (
      <SubjectEvaluation
        evaluation={evaluation}
        subject={subject}
        onChange={(field, value) => handleEvaluationChange(studentId, subject, field, value)}
                />
    )
  }

  const openChecklistForm = async (studentId?: string, scheduleId?: string) => {
    if (tutorSchedules.length === 0) {
      setAssignmentsError('Bạn chưa có buổi học nào để tạo checklist.')
      return
    }
    const defaultStudentId = studentId || todayStudentsForHome[0]?.id || students[0]?.id || tutorSchedules[0]?.studentId || '1'
    
    // Fetch student info detail if not already cached
    if (!studentInfoDetailsMap[defaultStudentId]) {
      try {
        const studentInfo = studentInfoMap[defaultStudentId]
        if (studentInfo?.id) {
          const studentInfoDetail = await apiCall<StudentInfoDetail>(`/students/${studentInfo.id}/info`)
          setStudentInfoDetailsMap(prev => ({
            ...prev,
            [defaultStudentId]: studentInfoDetail
          }))
        }
      } catch (error) {
        console.error('Failed to fetch student info detail:', error)
        // Continue anyway, grade will be undefined
      }
    }
    
    const studentSchedules = tutorSchedules.filter((schedule) => schedule.studentId === defaultStudentId)
    const resolvedScheduleId =
      scheduleId && studentSchedules.some((schedule) => schedule.id === scheduleId)
        ? scheduleId
        : studentSchedules[0]?.id || ''
    const resolvedScheduleDate = studentSchedules.find((schedule) => schedule.id === resolvedScheduleId)?.date
    const resolvedDueDate = resolvedScheduleDate ? format(resolvedScheduleDate, 'yyyy-MM-dd') : ''

    setChecklistForm({
      studentId: defaultStudentId,
      scheduleId: resolvedScheduleId,
      lesson: '',
      name: '',
      description: '',
      tasks: '',
      note: '',
      dueDate: resolvedDueDate,
      exercises: [
        { id: `exercise-${Date.now()}`, title: '', requirement: '', estimatedTime: '', note: '', assignmentUrl: '' },
      ],
    })
    setShowChecklistForm(true)
  }

  const handleChecklistFormSubmit = async () => {
    if (!checklistForm.studentId) {
      setAssignmentsError('Vui lòng chọn học sinh để tạo checklist.')
      return
    }

    if (!checklistForm.scheduleId) {
      setAssignmentsError('Vui lòng chọn khung giờ/buổi học để tạo checklist.')
      return
    }

    if (!checklistForm.name) {
      setAssignmentsError('Vui lòng nhập tên checklist.')
      return
    }

    const relatedSchedule = tutorSchedules.find(
      (schedule) => schedule.id === checklistForm.scheduleId && schedule.studentId === checklistForm.studentId
    ) || tutorSchedules.find((schedule) => schedule.id === checklistForm.scheduleId)

    if (!relatedSchedule) {
      setAssignmentsError('Không tìm thấy buổi học phù hợp để gắn checklist.')
      return
    }

    try {
      setIsSubmittingChecklist(true)
      setAssignmentsError(null)

      // Map exercises to tasks (không upload files ở thời điểm tạo)
      const tasksWithFiles = checklistForm.exercises.map((exercise, index) => ({
        name: exercise.title || `Bài ${index + 1}`,
        description: exercise.requirement || undefined,
        note: exercise.note || undefined,
        estimatedTime: exercise.estimatedTime ? Number(exercise.estimatedTime) : undefined,
        assignmentUrl: exercise.assignmentUrl || undefined,
        status: 'pending' as AssignmentTaskStatus,
      }))

      // Lấy supplementaryMaterials từ schedule (tài liệu phụ huynh đã gửi)
      const supplementaryMaterials: Array<{ name: string; url: string; requirement?: string }> = 
        (relatedSchedule.materials || []).map((material) => ({
          name: material.name,
          url: material.url,
          requirement: material.note || undefined,
        }))

    const payload = {
      scheduleId: relatedSchedule.id,
      subject: checklistForm.lesson || relatedSchedule.subject,
        name: checklistForm.name,
        description: checklistForm.description || undefined,
      status: 'pending',
        tasks: tasksWithFiles,
        supplementaryMaterials: supplementaryMaterials.length > 0 ? supplementaryMaterials : undefined,
    }

      await apiCall('/assignments', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setShowChecklistForm(false)
      setAssignmentFetchTrigger((prev) => prev + 1)
    } catch (error) {
      console.error('Failed to create checklist:', error)
      const errorMessage = error instanceof Error ? error.message : 'Không thể tạo checklist mới. Vui lòng thử lại.'
      setAssignmentsError(errorMessage)
    } finally {
      setIsSubmittingChecklist(false)
    }
  }

  const clearAssignmentDraft = (assignmentKey: string) => {
    setAssignmentDrafts((prev) => {
      if (!prev[assignmentKey]) return prev
      const next = { ...prev }
      delete next[assignmentKey]
      return next
    })
  }

  const handleCollapseQuickViewAssignment = (assignmentKey: string) => {
    setExpandedQuickViewAssignmentId((prev) => (prev === assignmentKey ? null : assignmentKey))
    if (editingQuickViewAssignmentId === assignmentKey) {
      setEditingQuickViewAssignmentId(null)
    }
    clearAssignmentDraft(assignmentKey)
  }

  const handleAssignmentTaskFieldChange = (
    assignmentKey: string,
    taskIndex: number,
    field: keyof AssignmentTaskApiItem,
    value: string | number | null
  ) => {
    setAssignmentDrafts((prev) => {
      const draftList = prev[assignmentKey] ? [...prev[assignmentKey]] : []
      const currentTask = draftList[taskIndex] ? { ...draftList[taskIndex] } : { id: `task-${taskIndex}` }
      const numericFields: Array<keyof AssignmentTaskApiItem> = ['estimatedTime', 'actualTime']
      const normalizedValue =
        value === '' || value === null
          ? undefined
          : numericFields.includes(field)
            ? Number(value)
            : value
      draftList[taskIndex] = {
        ...currentTask,
        [field]: normalizedValue,
      }
      return {
        ...prev,
        [assignmentKey]: draftList,
      }
    })
  }

  const saveAssignmentEdits = async (assignmentKey: string, assignment: AssignmentApiItem) => {
    const draftTasks =
      assignmentDrafts[assignmentKey] && assignmentDrafts[assignmentKey].length > 0
        ? assignmentDrafts[assignmentKey]
        : assignment.tasks || []
    const assignmentId = assignment._id || assignment.id
    if (!assignmentId) {
      setAssignmentsError('Không tìm thấy ID của checklist.')
      return
    }
    setSavingAssignmentId(assignmentKey)
    try {
      const response = await apiCall<AssignmentApiItem>(`/assignments/${assignmentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: assignment.name,
          description: assignment.description,
          subject: assignment.subject,
          status: assignment.status,
          // Backend không cho phép field "id" trong từng task và yêu cầu estimatedTime >= 1,
          // nên ta chuẩn hóa lại payload tại đây.
          tasks: draftTasks.map((task) => ({
            name: task.name,
            description: task.description,
            status: mapTaskStatusToApi(task.status),
            note: task.note,
            estimatedTime:
              typeof task.estimatedTime === 'number' && !Number.isNaN(task.estimatedTime)
                ? Math.max(task.estimatedTime, 1)
                : 1,
            actualTime: typeof task.actualTime === 'number' ? task.actualTime : undefined,
            assignmentUrl: task.assignmentUrl,
            answerURL: task.answerURL,
            solutionUrl: task.solutionUrl,
          })),
        }),
      })

      // Map response status from API format to frontend format
      const mappedTasks = (response.tasks || []).map((task) => ({
        ...task,
        status: mapApiStatusToTask(task.status as any) as AssignmentTaskStatus,
      }))

      setAssignments((prev) =>
        prev.map((item) => {
          const itemId = item._id || item.id
          return itemId === assignmentId ? { ...item, tasks: mappedTasks } : item
        })
      )
      setEditingQuickViewAssignmentId(null)
      clearAssignmentDraft(assignmentKey)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể cập nhật checklist. Vui lòng thử lại.'
      setAssignmentsError(message)
    } finally {
      setSavingAssignmentId(null)
    }
  }

  const handleToggleEditAssignment = (assignmentKey: string, assignment: AssignmentApiItem) => {
    const isEditing = editingQuickViewAssignmentId === assignmentKey
    if (isEditing) {
      saveAssignmentEdits(assignmentKey, assignment)
      return
    }

    setAssignmentDrafts((prev) => ({
      ...prev,
      [assignmentKey]: (assignment.tasks || []).map((task) => ({ ...task })),
    }))
    setEditingQuickViewAssignmentId(assignmentKey)
  }

  const handleAddAssignmentTask = (assignmentKey: string, assignment: AssignmentApiItem) => {
    setAssignmentDrafts((prev) => {
      const baseDraft = prev[assignmentKey]
        ? [...prev[assignmentKey]]
        : (assignment.tasks || []).map((task) => ({ ...task }))
      baseDraft.push({
        id: `temp-${Date.now()}`,
        name: '',
        description: '',
        status: 'pending',
        note: '',
      })
      return {
        ...prev,
        [assignmentKey]: baseDraft,
      }
    })
    setExpandedQuickViewAssignmentId(assignmentKey)
    setEditingQuickViewAssignmentId(assignmentKey)
  }

  const handleRemoveAssignmentTask = (
    assignmentKey: string,
    assignment: AssignmentApiItem,
    taskIndex: number
  ) => {
    setAssignmentDrafts((prev) => {
      const baseDraft = prev[assignmentKey]
        ? [...prev[assignmentKey]]
        : (assignment.tasks || []).map((task) => ({ ...task }))
      const nextDraft = baseDraft.filter((_, idx) => idx !== taskIndex)
      return {
        ...prev,
        [assignmentKey]: nextDraft,
      }
    })
  }

  const renderTimeInput = (
    value: number | undefined,
    placeholder: string,
    onChange: (nextValue: string) => void,
    onAdjust: (delta: number) => void
  ) => (
    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 px-1 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder={placeholder}
      />
      <div className="flex flex-col border-l border-gray-200">
        <button
          type="button"
          onClick={() => onAdjust(1)}
          className="px-0.5 py-0 hover:bg-gray-100"
        >
          <ChevronUp className="w-2.5 h-2.5 text-gray-600" />
        </button>
        <button
          type="button"
          onClick={() => onAdjust(-1)}
          className="px-0.5 py-0 hover:bg-gray-100"
        >
          <ChevronDown className="w-2.5 h-2.5 text-gray-600" />
        </button>
      </div>
    </div>
  )

  const adjustAssignmentTaskTime = (
    assignmentKey: string,
    taskIndex: number,
    field: 'estimatedTime' | 'actualTime',
    delta: number
  ) => {
    setAssignmentDrafts((prev) => {
      const draftList = prev[assignmentKey] ? [...prev[assignmentKey]] : []
      const currentTask = draftList[taskIndex] ? { ...draftList[taskIndex] } : { id: `task-${taskIndex}` }
      const currentValue = Number(currentTask[field] || 0)
      const nextValue = Math.max(0, currentValue + delta)
      currentTask[field] = nextValue
      draftList[taskIndex] = currentTask
      return {
        ...prev,
        [assignmentKey]: draftList,
      }
    })
  }

  const handleAssignmentTaskFileUpload = async (
    assignmentKey: string,
    taskIndex: number,
    field: 'assignmentUrl' | 'answerURL' | 'solutionUrl',
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const uploadKey = `${assignmentKey}-${taskIndex}-${field}`
    setTaskFileUploadingKey(uploadKey)
    try {
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
      handleAssignmentTaskFieldChange(assignmentKey, taskIndex, field, fileUrl)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể tải file. Vui lòng thử lại.'
      setAssignmentsError(message)
    } finally {
      setTaskFileUploadingKey(null)
    }
  }

  const handleDeleteAssignment = async (assignment: AssignmentApiItem) => {
    const assignmentId = assignment._id || assignment.id
    if (!assignmentId) {
      setAssignmentsError('Không tìm thấy ID của checklist.')
      return
    }
    setDeletingAssignmentId(assignmentId)
    try {
      await apiCall(`/assignments/${assignmentId}`, {
        method: 'DELETE',
      })
      setAssignments((prev) => prev.filter((item) => {
        const itemId = item._id || item.id
        return itemId !== assignmentId
      }))
      const assignmentKey = assignment.id || assignment._id || `${assignment.subject || 'subject'}-${resolveAssignmentStudentId(assignment.studentId) || ''}`
      if (expandedQuickViewAssignmentId === assignmentKey) {
        setExpandedQuickViewAssignmentId(null)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể xoá checklist. Vui lòng thử lại.'
      setAssignmentsError(message)
    } finally {
      setDeletingAssignmentId(null)
    }
  }

  // Hàm để fetch schedule details và lấy reviews
  const fetchScheduleDetails = async (scheduleId: string) => {
    try {
      const schedule = await apiCall<{ id: string; reviews?: ScheduleReview[] }>(`/schedules/${scheduleId}`)
      if (schedule.reviews && Array.isArray(schedule.reviews)) {
        const defaultReviews = getDefaultReviews()
        // Đảm bảo reviews có đủ 5 mục và name đúng
        // Loại bỏ _id và các trường không cần thiết khi lưu vào state
        const normalizedReviews = defaultReviews.map((defaultReview, index) => {
          const savedReview = schedule.reviews?.[index]
          if (savedReview) {
            return {
              name: defaultReview.name, // Đảm bảo name luôn đúng từ default
              rating: savedReview.rating ?? 0,
              comment: savedReview.comment || '',
            }
          }
          return defaultReview
        })
        setScheduleReviews((prev) => ({
          ...prev,
          [scheduleId]: normalizedReviews,
        }))
      }
    } catch (error) {
      console.error('Failed to fetch schedule details:', error)
    }
  }

  // Hàm để lưu đánh giá
  const handleSaveReviews = async (scheduleId: string, reviews: ScheduleReview[]) => {
    setSavingReviews(scheduleId)
    try {
      const defaultReviews = getDefaultReviews()
      // Đảm bảo reviews có đủ 5 mục và name đúng trước khi lưu
      // Chỉ gửi các trường cần thiết, loại bỏ _id và các trường không cần thiết
      const normalizedReviews = defaultReviews.map((defaultReview, index) => {
        const review = reviews[index]
        if (review) {
          return {
            name: defaultReview.name, // Đảm bảo name luôn đúng từ default
            rating: review.rating ?? 0,
            comment: review.comment || '',
          }
        }
        return defaultReview
      })
      
      await apiCall(`/schedules/${scheduleId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          reviews: normalizedReviews,
        }),
      })
      setScheduleReviews((prev) => ({
        ...prev,
        [scheduleId]: normalizedReviews,
      }))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể lưu đánh giá. Vui lòng thử lại.'
      setAssignmentsError(message)
    } finally {
      setSavingReviews(null)
    }
  }

  // Hàm helper để tạo reviews mặc định
  const getDefaultReviews = (): ScheduleReview[] => [
    { name: 'Mức độ tập trung', rating: 0, comment: '' },
    { name: 'Hiểu nội dung bài học', rating: 0, comment: '' },
    { name: 'Hoàn thành nhiệm vụ', rating: 0, comment: '' },
    { name: 'Thái độ & tinh thần học', rating: 0, comment: '' },
    { name: 'Kỹ năng trình bày & tư duy', rating: 0, comment: '' },
  ]

  // Hàm kiểm tra và cập nhật trạng thái scroll
  const checkScrollButtons = useCallback(() => {
    const container = scheduleSlotsScrollRef.current
    if (!container) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }
    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1)
  }, [])

  // Hàm scroll trái
  const scrollLeft = useCallback(() => {
    const container = scheduleSlotsScrollRef.current
    if (container) {
      container.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }, [])

  // Hàm scroll phải
  const scrollRight = useCallback(() => {
    const container = scheduleSlotsScrollRef.current
    if (container) {
      container.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }, [])

  // Effect để check scroll khi scheduleSlots thay đổi hoặc sau khi render
  useEffect(() => {
    // Delay một chút để đảm bảo DOM đã render xong
    const timer = setTimeout(() => {
      checkScrollButtons()
    }, 100)
    
    const container = scheduleSlotsScrollRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollButtons)
      window.addEventListener('resize', checkScrollButtons)
      return () => {
        clearTimeout(timer)
        container.removeEventListener('scroll', checkScrollButtons)
        window.removeEventListener('resize', checkScrollButtons)
      }
    }
    return () => clearTimeout(timer)
  }, [todayTutorSchedules.length, checkScrollButtons])

  // Hàm để cập nhật review
  const handleReviewChange = (scheduleId: string, index: number, field: 'rating' | 'comment', value: number | string) => {
    const defaultReviews = getDefaultReviews()
    const currentReviews = scheduleReviews[scheduleId] || defaultReviews
    
    // Đảm bảo reviews có đủ 5 mục và name đúng
    // Loại bỏ _id và các trường không cần thiết
    const reviews = currentReviews.length === 5 
      ? currentReviews.map((review, idx) => ({
          name: defaultReviews[idx].name, // Đảm bảo name luôn đúng
          rating: review.rating ?? 0,
          comment: review.comment || '',
        }))
      : defaultReviews
    
    const updatedReviews = [...reviews]
    updatedReviews[index] = {
      name: defaultReviews[index].name, // Đảm bảo name luôn đúng
      rating: field === 'rating' ? (value as number) : updatedReviews[index].rating,
      comment: field === 'comment' ? (value as string) : updatedReviews[index].comment,
    }
    setScheduleReviews((prev) => ({
      ...prev,
      [scheduleId]: updatedReviews,
    }))
  }

  const getScheduleReport = (scheduleId: string): ScheduleReport | null => {
    return scheduleReports[scheduleId] || null
  }

  const fetchScheduleReport = async (scheduleId: string, openAfterFetch: boolean = false) => {
    setReportError(null)
    setReportLoadingScheduleId(scheduleId)
    try {
      const data = await apiCall<ScheduleReport>(`/reports/${scheduleId}`)
      setScheduleReports((prev) => ({
        ...prev,
        [scheduleId]: data,
      }))
      // Nếu có reportURL và cần mở sau khi fetch
      if (openAfterFetch && data?.reportURL) {
        window.open(data.reportURL, '_blank')
      }
    } catch (error) {
      console.error('Failed to fetch schedule report:', error)
      const message = error instanceof Error ? error.message : 'Không thể tải báo cáo. Vui lòng thử lại.'
      setReportError(message)
    } finally {
      setReportLoadingScheduleId(null)
    }
  }

  const handleGenerateReport = async (scheduleId: string) => {
    setReportError(null)
    setReportLoadingScheduleId(scheduleId)
    try {
      await apiCall(`/reports/generate/${scheduleId}`, {
        method: 'POST',
      })
      await fetchScheduleReport(scheduleId)
    } catch (error) {
      console.error('Failed to generate schedule report:', error)
      const message = error instanceof Error ? error.message : 'Không thể tạo báo cáo. Vui lòng thử lại.'
      setReportError(message)
      setReportLoadingScheduleId(null)
    }
  }

  const handleDownloadReport = async (scheduleId: string) => {
    const report = getScheduleReport(scheduleId)
    if (!report?.reportURL) {
      setReportError('Chưa có báo cáo để xuất. Vui lòng tạo hoặc xem báo cáo trước.')
      return
    }

    try {
      // Fetch file từ URL
      const response = await fetch(report.reportURL)
      if (!response.ok) {
        throw new Error('Không thể tải file báo cáo.')
      }
      
      // Chuyển đổi response sang blob
      const blob = await response.blob()
      
      // Tạo blob URL và tải về
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `Bao_cao_buoi_hoc_${scheduleId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Giải phóng blob URL sau khi tải
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Failed to download report:', error)
      const message = error instanceof Error ? error.message : 'Không thể tải báo cáo. Vui lòng thử lại.'
      setReportError(message)
    }
  }

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return renderHomeSection()
      case 'students':
        return renderStudentsSection()
      case 'schedule':
        return renderScheduleSection()
      case 'checklist':
        return renderChecklistSection()
      default:
        return renderHomeSection()
    }
  }

  const renderHomeSection = () => {
    return (
      <div className="h-full space-y-4">
        {assignmentsError && (
          <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            {assignmentsError}
          </div>
        )}
        {/* Main Layout - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)] gap-5 lg:items-start">
          {/* Left Column - Profile & Resources */}
          <div className="lg:col-auto lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-2 scrollbar-thin scrollbar-thumb-primary-300 scrollbar-track-gray-100">
            {/* Profile Card */}
            <div className="card-no-transition h-full flex flex-col px-2 lg:px-4">
              <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-4 shadow-xl overflow-hidden">
                  {tutorAvatar ? (
                    <img
                      src={tutorAvatar}
                      alt={tutorName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                  <UserCircle className="w-16 h-16 text-white" />
                  )}
                </div>
                <h3 className="text-3xl font-extrabold text-gray-900 mb-1">{tutorName}</h3>
                <p className="text-base text-gray-600">{tutorEmail}</p>
              </div>

              {/* Quick Stats */}
              <div className="flex-1 flex flex-col gap-4 py-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Tổng số học sinh đã dạy */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 text-center border border-blue-200 shadow-md min-h-[160px] flex flex-col justify-center">
                    <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <p className="text-base text-gray-600 mb-3 uppercase tracking-[0.35em] font-semibold">
                      Học sinh đã dạy
                    </p>
                    <p className="text-6xl font-black text-gray-900">{students.length}</p>
                  </div>
                  {/* Số ca dạy hôm nay */}
                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-md min-h-[160px] flex flex-col justify-center text-center">
                    <Calendar className="w-12 h-12 text-primary-500 mx-auto mb-3" />
                    <p className="text-base text-gray-500 mb-3 uppercase tracking-[0.35em] font-semibold">
                      Số ca dạy hôm nay
                    </p>
                    <p className="text-6xl font-black text-gray-900 mb-1">{todayTutorSchedules.length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Đồng hồ analog riêng */}
                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-md min-h-[220px] flex flex-col items-center justify-center">
                    <p className="text-base text-gray-600 uppercase tracking-[0.35em] mb-4 font-semibold text-center">
                      Đồng hồ hiện tại
                    </p>
                    <div className="flex flex-col items-center gap-4">
                      {/* Digital time (nổi bật) */}
                      <p className="text-4xl md:text-5xl font-black text-primary-700 tracking-[0.35em]">
                        {format(currentTime, 'HH:mm:ss')}
                      </p>
                      {/* Analog clock */}
                      <svg viewBox="0 0 100 100" className="w-36 h-36 text-primary-600 drop-shadow-sm bg-white rounded-full">
                        {/* Outer ring - nền trắng */}
                        <circle cx="50" cy="50" r="46" className="fill-white stroke-primary-200" strokeWidth="3" />
                        {/* Markers */}
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
                        {/* Hour hand */}
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
                        {/* Minute hand */}
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
                        {/* Second hand */}
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
                        {/* Center cap */}
                        <circle cx="50" cy="50" r="3" className="fill-white stroke-primary-600" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </div>

                  {/* Khung giờ sắp tới */}
                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-md min-h-[220px] flex flex-col justify-center">
                    <p className="text-base text-gray-600 uppercase tracking-[0.35em] mb-4 font-semibold text-center">
                      Khung giờ sắp tới dạy
                    </p>
                    {upcomingSchedule ? (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="text-center">
                          <p className="text-4xl font-black text-gray-900 mb-1">{upcomingSchedule.time}</p>
                          <button
                            type="button"
                            onClick={() => setShowUpcomingStudentList((prev) => !prev)}
                            className="text-sm font-semibold text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline"
                          >
                            {upcomingStudentCount} học sinh
                          </button>
                        </div>
                        {showUpcomingStudentList && upcomingStudents.length > 0 && (
                          <div className="w-full pt-3 border-t border-gray-100">
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-2 text-center">
                              Danh sách học sinh
                            </p>
                            <ul className="space-y-1 text-sm text-gray-800 text-left max-h-32 overflow-y-auto">
                              {upcomingStudents.map((name, idx) => (
                                <li key={`${name}-${idx}`} className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                                  <span>{name}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-400 mb-2">Không có lịch</p>
                        <p className="text-xs text-gray-500">Chưa có buổi học nào sắp tới</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

           

          </div>

        {/* Right Column - Main Actions */}
        <div className="lg:col-auto space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary-300 scrollbar-track-gray-100">
          {/* Combined Schedule + Students + Documents Box */}
          <div className="card-no-transition">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-200">
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-primary-600" />
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Lịch dạy hôm nay</h2>
                </div>
              </div>

            </div>

            {schedulesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-base font-semibold text-gray-600">Đang tải lịch học...</p>
              </div>
            ) : scheduleSlots.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-base font-semibold text-gray-600">Không có lịch dạy hôm nay</p>
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
                    {scheduleSlots.map((slot, index) => {
                      const isSelected = selectedScheduleSlotId === slot.id
                      const caLabel = `Ca ${index + 1}`
                      return (
                        <button
                          key={slot.id}
                          onClick={() => {
                            setSelectedScheduleSlotId(slot.id)
                          }}
                          className={`min-w-[220px] flex flex-col justify-between rounded-2xl px-6 py-5 text-left transition-all ${
                            isSelected
                              ? 'border-2 border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 shadow-xl text-primary-800 ring-2 ring-primary-200 ring-offset-2'
                              : 'border-2 border-gray-300 bg-white hover:border-primary-400 hover:bg-primary-50 hover:shadow-lg'
                          }`}
                          style={{
                            boxShadow: isSelected
                              ? '0 10px 25px -5px rgba(59, 130, 246, 0.3), 0 0 0 2px rgba(59, 130, 246, 0.1)'
                              : undefined,
                          }}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              <Clock className={`w-6 h-6 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                              <p
                                className={`text-2xl font-black ${
                                  isSelected ? 'text-primary-800' : 'text-gray-900'
                                }`}
                              >
                                {caLabel}: {slot.time}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <Users className={`w-5 h-5 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                              <p
                                className={`text-xl font-extrabold ${
                                  isSelected ? 'text-primary-800' : 'text-gray-800'
                                }`}
                              >
                                {slot.schedules.length} học sinh
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {selectedScheduleSlot && selectedScheduleSlot.schedules.length > 0 && (() => {
                  const slotSchedules = selectedScheduleSlot.schedules
                  const activeStudentId =
                    (quickViewStudentId &&
                      slotSchedules.some((schedule) => schedule.studentId === quickViewStudentId)
                      ? quickViewStudentId
                      : slotSchedules[0]?.studentId) || null
                  const activeSchedule =
                    slotSchedules.find((schedule) => schedule.studentId === activeStudentId) ||
                    slotSchedules[0]
                  if (!activeSchedule) return null
                  const activeStudentInfo = studentInfoMap[activeSchedule.studentId]
                  const materials = activeSchedule.materials || []
                  const quickViewAssignments = assignments
                    .filter((assignment) => {
                      const assignmentScheduleId = resolveAssignmentScheduleId(assignment.scheduleId)
                      const assignmentStudentId = resolveAssignmentStudentId(assignment.studentId)
                      if (assignmentScheduleId) {
                        return assignmentScheduleId === activeSchedule.id
                      }
                      return assignmentStudentId === activeSchedule.studentId
                    })
                    .sort((a, b) => {
                      const getTime = (value?: string) => (value ? new Date(value).getTime() : 0)
                      return getTime(b.updatedAt || b.createdAt) - getTime(a.updatedAt || a.createdAt)
                    })
                      return (
                    <div className="mt-2 flex flex-col gap-4">
                      <div className="rounded-2xl border-2 border-primary-100 bg-white p-6 space-y-4 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                  <div>
     
                            <h3 className="text-2xl font-bold text-gray-900">
                              {activeStudentInfo?.name || activeSchedule.student}
                            </h3>
                                    </div>
                          <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full sm:w-auto">
                            <div className="flex flex-col flex-1">
                              <select
                                value={activeStudentId || ''}
                                onChange={(e) => setQuickViewStudentId(e.target.value || null)}
                                className="px-5 py-3 rounded-2xl border-2 border-primary-200 bg-white text-base font-semibold text-gray-900 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all shadow-sm"
                              >
                                {slotSchedules.map((schedule) => (
                                  <option key={schedule.id} value={schedule.studentId}>
                                    {studentInfoMap[schedule.studentId]?.name || schedule.student}
                                  </option>
                                ))}
                              </select>
                                  </div>
                            {activeSchedule.meetLink && (
                              <div className="flex flex-col sm:flex-row gap-3">
                                      <button
                                  onClick={() => openChecklistForm(activeSchedule.studentId, activeSchedule.id)}
                                  className="btn-secondary px-5 py-2.5 text-sm font-bold border-2 border-primary-200 text-primary-600 bg-white hover:bg-primary-50 shadow-sm whitespace-nowrap"
                                >
                                  Tạo checklist
                                      </button>
                                    <button
                                  onClick={() => handleJoinSchedule(activeSchedule.id)}
                                  className="btn-primary px-8 py-3 text-base font-bold shadow-xl hover:shadow-2xl whitespace-nowrap"
                                    >
                                      Vào lớp
                                    </button>
                                  </div>
                                )}
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

                        {materials.length > 0 && (
                          <div className="pt-4 border-t border-gray-100">
                            <p className="text-sm font-semibold text-gray-900 mb-3">
                              Tài liệu phụ huynh đã gửi ({materials.length})
                            </p>
                            <div className="space-y-3">
                              {materials.map((file) => (
                                <div
                                  key={file.id}
                                  className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col gap-1"
                                >
                                  <p className="text-sm font-bold text-gray-900">{file.name}</p>
                                        {file.note && (
                                    <p className="text-xs text-gray-600">
                                            <span className="font-semibold">Ghi chú:</span> {file.note}
                                          </p>
                                        )}
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary-600 font-semibold hover:underline"
                                  >
                                    Mở tài liệu
                                  </a>
                                </div>
                              ))}
                            </div>
                            </div>
                          )}
                        </div>
                      <div className="rounded-2xl border-2 border-primary-50 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <button
                            type="button"
                            onClick={() => setIsHomeChecklistExpanded(prev => !prev)}
                            className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-gray-900 hover:text-primary-600 transition-colors"
                          >
                            <h4 className="text-inherit font-inherit">Checklist hôm nay</h4>
                            {isHomeChecklistExpanded ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {isHomeChecklistExpanded && (quickViewAssignments.length > 0 ? (
                          <div className="space-y-4">
                            {quickViewAssignments.map((assignment, index) => {
                              const assignmentKey =
                                assignment.id ||
                                `${assignment.subject || 'subject'}-${resolveAssignmentStudentId(assignment.studentId) || index}`
                              const isExpanded = expandedQuickViewAssignmentId === assignmentKey
                              const isEditing = editingQuickViewAssignmentId === assignmentKey
                              const assignmentTasks = assignment.tasks || []
                              const displayTasks =
                                isEditing && assignmentDrafts[assignmentKey]
                                  ? assignmentDrafts[assignmentKey]
                                  : assignmentTasks
                              const summaryRows =
                                displayTasks.length > 0
                                  ? displayTasks
                                  : [{ id: `${assignmentKey}-summary` } as AssignmentTaskApiItem]

                              return (
                                <div key={assignmentKey} className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50">
                                  <div className="flex items-center px-5 py-4 gap-4">
                                    <p className="text-2xl font-bold text-primary-600 uppercase tracking-wide whitespace-nowrap w-48 flex-shrink-0">
                                      {assignment.subject || 'Chung'}
                                    </p>
                                    <div className="h-12 w-px bg-gray-300 flex-shrink-0"></div>
                                    <div className="flex-1 space-y-1 min-w-0">
                                      <h5 className="text-base font-bold text-gray-900">{assignment.name || 'Checklist'}</h5>
                                      {assignment.description && (
                                        <p className="text-sm text-gray-600 italic line-clamp-1">{assignment.description}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {isExpanded ? (
                                        <>
                              <button
                                            type="button"
                                            onClick={() => handleCollapseQuickViewAssignment(assignmentKey)}
                                            className="px-4 py-1.5 rounded-full text-sm font-semibold text-primary-600 bg-white border border-primary-200 hover:bg-primary-50 transition"
                                          >
                                            Thu gọn
                              </button>
                              <button
                                            type="button"
                                            onClick={() => handleToggleEditAssignment(assignmentKey, assignment)}
                                            disabled={savingAssignmentId === assignmentKey}
                                            className="px-4 py-1.5 rounded-full text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
                                          >
                                            {isEditing
                                              ? savingAssignmentId === assignmentKey
                                                ? 'Đang lưu...'
                                                : 'Lưu'
                                              : 'Chỉnh sửa'}
                              </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteAssignment(assignment)}
                                            disabled={deletingAssignmentId === (assignment._id || assignment.id)}
                                            className="px-4 py-1.5 rounded-full text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
                                          >
                                            {deletingAssignmentId === (assignment._id || assignment.id) ? 'Đang xoá...' : 'Xoá'}
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setExpandedQuickViewAssignmentId(assignmentKey)
                                            setEditingQuickViewAssignmentId(null)
                                            clearAssignmentDraft(assignmentKey)
                                          }}
                                          className="px-4 py-1.5 rounded-full text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 transition"
                                        >
                                          Chi tiết
                                        </button>
                                      )}
                </div>
              </div>
                                  {isExpanded && (
                                    <div className="p-5 space-y-8 bg-white">
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">
                                          Bảng tóm tắt
                                        </p>
                                        {isEditing && (
            <button
                                            type="button"
                                            onClick={() => handleAddAssignmentTask(assignmentKey, assignment)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 transition"
            >
                                            <Plus className="w-4 h-4" />
                                            Thêm bài tập
            </button>
                        )}
                      </div>
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
                                            {summaryRows.map((task, taskIndex) => {
                                              const rowLesson = task.name || assignment.name || '—'
                                              const rowMission = task.description || assignment.description || '—'
                                              const rowStatus = (task.status as AssignmentTaskStatus) || 'pending'
                                              const rowChip =
                                                rowStatus === 'completed'
                                                  ? 'bg-green-100 text-green-700'
                                                  : rowStatus === 'in-progress'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-red-100 text-red-700'
                                              const rowNote = task.note || assignment.description || '—'
                                              const stableKey = task.id || `${assignmentKey}-summary-${taskIndex}`
                                              return (
                                                <tr key={stableKey}>
                                                  <td className="px-5 py-4 font-semibold text-gray-900 text-center">
                                                    {isEditing ? (
                                          <input
                                                        value={task.name || ''}
                                                        onChange={(e) =>
                                                          handleAssignmentTaskFieldChange(
                                                            assignmentKey,
                                                            taskIndex,
                                                            'name',
                                                            e.target.value
                                                          )
                                                        }
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                        placeholder="Nhập tên bài học"
                                          />
                                        ) : (
                                                      rowLesson
                                        )}
                                      </td>
                                                  <td className="px-5 py-4 text-gray-700 text-center">
                                                    {isEditing ? (
                                                      <textarea
                                                        value={task.description || ''}
                                                        onChange={(e) =>
                                                          handleAssignmentTaskFieldChange(
                                                            assignmentKey,
                                                            taskIndex,
                                                            'description',
                                                            e.target.value
                                                          )
                                                        }
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                        rows={2}
                                                        placeholder="Nhập nhiệm vụ"
                                          />
                                        ) : (
                                                      rowMission
                                        )}
                                      </td>
                                                  <td className="px-5 py-4 text-center">
                                                    {isEditing ? (
                                        <select
                                                        value={rowStatus}
                                          onChange={(e) =>
                                                          handleAssignmentTaskFieldChange(
                                                            assignmentKey,
                                                            taskIndex,
                                                            'status',
                                                            e.target.value as AssignmentTaskStatus
                                                          )
                                                        }
                                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                                      >
                                                        <option value="pending">Chưa xong</option>
                                                        <option value="in-progress">Đang làm</option>
                                                        <option value="completed">Đã xong</option>
                                        </select>
                                                    ) : (
                                                      <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${rowChip}`}>
                                                        {rowStatus === 'completed'
                                                          ? 'Đã xong'
                                                          : rowStatus === 'in-progress'
                                                            ? 'Đang làm'
                                                            : 'CHƯA XONG'}
                                                      </span>
                                                    )}
                                      </td>
                                                  <td className="px-5 py-4 text-gray-600 text-center">
                                                    <div className="flex items-start gap-2">
                                                      {isEditing ? (
                                                        <textarea
                                                          value={task.note || ''}
                                                          onChange={(e) =>
                                                            handleAssignmentTaskFieldChange(
                                                              assignmentKey,
                                                              taskIndex,
                                                              'note',
                                                              e.target.value
                                                            )
                                                          }
                                                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                          rows={2}
                                                          placeholder="Ghi chú"
                                          />
                                        ) : (
                                                        <span className="flex-1">{rowNote}</span>
                                                      )}
                                                      {isEditing && (
                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            handleRemoveAssignmentTask(
                                                              assignmentKey,
                                                              assignment,
                                                              taskIndex
                                                            )
                                                          }
                                                          className="mt-1 text-xs font-semibold text-red-500 hover:text-red-600 whitespace-nowrap"
                                                        >
                                                          Xoá
                                        </button>
                                                      )}
                                                    </div>
                                      </td>
                                    </tr>
                                              )
                                            })}
                                </tbody>
                              </table>
                            </div>

                                      <div className="rounded-2xl border border-gray-200 overflow-x-auto bg-white shadow-sm scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-gray-100">
                                        <table className="w-full text-base min-w-[900px]">
                                          <thead className="bg-gray-50 text-gray-600">
                                            <tr>
                                              <th className="px-4 py-3 text-left font-semibold uppercase text-xs tracking-[0.3em]">
                                                <div className="flex items-center gap-2">
                                                  <Layers className="w-4 h-4" />
                                                  Bài học
                                                </div>
                                              </th>
                                              <th className="px-4 py-3 text-center font-semibold uppercase text-xs tracking-[0.3em]">
                                                <div className="flex items-center justify-center gap-2">
                                                  <Clock className="w-4 h-4" />
                                                  Thời gian
                                                </div>
                                              </th>
                                              <th className="px-4 py-3 text-center font-semibold uppercase text-xs tracking-[0.3em]">
                                                <div className="flex items-center justify-center gap-2">
                                                  <Folder className="w-4 h-4" />
                                                  File bài tập
                                                </div>
                                              </th>
                                              <th className="px-4 py-3 text-center font-semibold uppercase text-xs tracking-[0.3em]">
                                                <div className="flex items-center justify-center gap-2">
                                                  <Folder className="w-4 h-4" />
                                                  Bài làm học sinh
                                                </div>
                                              </th>
                                              <th className="px-4 py-3 text-center font-semibold uppercase text-xs tracking-[0.3em]">
                                                <div className="flex items-center justify-center gap-2">
                                                  <Lightbulb className="w-4 h-4" />
                                                  File lời giải
                                                </div>
                                              </th>
                                              <th className="px-4 py-3 text-center font-semibold uppercase text-xs tracking-[0.3em]">
                                                <div className="flex items-center justify-center gap-2">
                                                  <div className="w-4 h-4 flex items-center justify-center">
                                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                  </div>
                                                  Trạng thái
                                                </div>
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100 bg-white">
                                            {displayTasks.length === 0 ? (
                                              <tr>
                                                <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                                                  Chưa có nhiệm vụ nào trong checklist này.
                                                </td>
                                              </tr>
                                            ) : (
                                              displayTasks.map((task, taskIndex) => {
                                                const taskStatus = (task.status as AssignmentTaskStatus) || 'pending'
                                                const taskChipClass =
                                                  taskStatus === 'completed'
                                                    ? 'bg-green-100 text-green-700'
                                                    : taskStatus === 'in-progress'
                                                      ? 'bg-yellow-100 text-yellow-700'
                                                      : 'bg-red-100 text-red-700'
                                                const stableKey = task.id || `${assignmentKey}-detail-${taskIndex}`
                    return (
                                                  <tr key={stableKey}>
                                                    <td className="px-4 py-3 font-semibold text-gray-900">
                                                      {isEditing ? (
                                                        <input
                                                          value={task.name || ''}
                                                          onChange={(e) =>
                                                            handleAssignmentTaskFieldChange(
                                                              assignmentKey,
                                                              taskIndex,
                                                              'name',
                                                              e.target.value
                                                            )
                                                          }
                                                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                          placeholder="Nhập tên bài học"
                                                        />
                                                      ) : (
                                                        task.name || '—'
                                                      )}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-700 text-center">
                                                      {isEditing ? (
                                                        <div className="flex items-center justify-center gap-1">
                                                          {renderTimeInput(
                                                            task.estimatedTime,
                                                            'Ước',
                                                            (value) =>
                                                              handleAssignmentTaskFieldChange(
                                                                assignmentKey,
                                                                taskIndex,
                                                                'estimatedTime',
                                                                value
                                                              ),
                                                            (delta) =>
                                                              adjustAssignmentTaskTime(
                                                                assignmentKey,
                                                                taskIndex,
                                                                'estimatedTime',
                                                                delta
                                                              )
                                                          )}
                                                          <span className="text-xs">/</span>
                                                          {renderTimeInput(
                                                            task.actualTime,
                                                            'Thực',
                                                            (value) =>
                                                              handleAssignmentTaskFieldChange(
                                                                assignmentKey,
                                                                taskIndex,
                                                                'actualTime',
                                                                value
                                                              ),
                                                            (delta) =>
                                                              adjustAssignmentTaskTime(
                                                                assignmentKey,
                                                                taskIndex,
                                                                'actualTime',
                                                                delta
                                                              )
                                                          )}
                                                        </div>
                                                      ) : (
                                                        <span className="whitespace-nowrap">
                                                          {task.estimatedTime ? `${task.estimatedTime}'` : '—'} /{' '}
                                                          {task.actualTime ? `${task.actualTime}'` : '—'}
                                                        </span>
                                                      )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                      {isEditing ? (
                                                        <div className="flex items-center justify-center gap-2 min-w-0">
                                                          <input
                                                            value={task.assignmentUrl || ''}
                                                            onChange={(e) =>
                                                              handleAssignmentTaskFieldChange(
                                                                assignmentKey,
                                                                taskIndex,
                                                                'assignmentUrl',
                                                                e.target.value
                                                              )
                                                            }
                                                            className="w-24 max-w-[140px] border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 truncate"
                                                            placeholder="Link file bài tập"
                                                            title={task.assignmentUrl || ''}
                                                          />
                                                          <label
                                                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 ${
                                                              taskFileUploadingKey === `${assignmentKey}-${taskIndex}-assignmentUrl`
                                                                ? 'cursor-wait opacity-60'
                                                                : 'cursor-pointer hover:bg-primary-50'
                                                            }`}
                                                            title={
                                                              taskFileUploadingKey === `${assignmentKey}-${taskIndex}-assignmentUrl`
                                                                ? 'Đang upload...'
                                                                : 'Upload tài liệu'
                                                            }
                                                          >
                                                            {taskFileUploadingKey === `${assignmentKey}-${taskIndex}-assignmentUrl` ? (
                                                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                              <Upload className="w-3.5 h-3.5" />
                                                            )}
                                                            <input
                                                              type="file"
                                                              className="hidden"
                                                              accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                                              onChange={(e) => {
                                                                handleAssignmentTaskFileUpload(
                                                                  assignmentKey,
                                                                  taskIndex,
                                                                  'assignmentUrl',
                                                                  e.target.files
                                                                )
                                                                e.target.value = ''
                                                              }}
                                                            />
                                                          </label>
                                                        </div>
                                                      ) : task.assignmentUrl ? (
                                                        <a href={task.assignmentUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-primary-600 hover:underline text-xs font-medium" title={task.assignmentUrl}>
                                                          Xem file
                                                        </a>
                                                      ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                      )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                      {task.answerURL ? (
                                                        <a href={task.answerURL} target="_blank" rel="noopener noreferrer" className="inline-block text-primary-600 hover:underline text-xs font-medium" title={task.answerURL}>
                                                          Bài làm học sinh
                                                        </a>
                                                      ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                      )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                      {isEditing ? (
                                                        <div className="flex items-center justify-center gap-2 min-w-0">
                                                          <input
                                                            value={task.solutionUrl || ''}
                                                            onChange={(e) =>
                                                              handleAssignmentTaskFieldChange(
                                                                assignmentKey,
                                                                taskIndex,
                                                                'solutionUrl',
                                                                e.target.value
                                                              )
                                                            }
                                                            className="w-24 max-w-[140px] border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 truncate"
                                                            placeholder="Link lời giải"
                                                            title={task.solutionUrl || ''}
                                                          />
                                                          <label
                                                            className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 ${
                                                              taskFileUploadingKey === `${assignmentKey}-${taskIndex}-solutionUrl`
                                                                ? 'cursor-wait opacity-60'
                                                                : 'cursor-pointer hover:bg-primary-50'
                                                            }`}
                                                            title={
                                                              taskFileUploadingKey === `${assignmentKey}-${taskIndex}-solutionUrl`
                                                                ? 'Đang upload...'
                                                                : 'Upload lời giải'
                                                            }
                                                          >
                                                            {taskFileUploadingKey === `${assignmentKey}-${taskIndex}-solutionUrl` ? (
                                                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                              <Upload className="w-3.5 h-3.5" />
                                                            )}
                                                            <input
                                                              type="file"
                                                              className="hidden"
                                                              accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                                              onChange={(e) => {
                                                                handleAssignmentTaskFileUpload(
                                                                  assignmentKey,
                                                                  taskIndex,
                                                                  'solutionUrl',
                                                                  e.target.files
                                                                )
                                                                e.target.value = ''
                                                              }}
                                                            />
                                                          </label>
                                                        </div>
                                                      ) : task.solutionUrl ? (
                                                        <a href={task.solutionUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-primary-600 hover:underline text-xs font-medium" title={task.solutionUrl}>
                                                          File lời giải
                                                        </a>
                                                      ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                      )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                      {isEditing ? (
                                                        <select
                                                          value={taskStatus}
                                                          onChange={(e) =>
                                                            handleAssignmentTaskFieldChange(
                                                              assignmentKey,
                                                              taskIndex,
                                                              'status',
                                                              e.target.value as AssignmentTaskStatus
                                                            )
                                                          }
                                                          className="mx-auto border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                                        >
                                                          <option value="pending">Chưa xong</option>
                                                          <option value="in-progress">Đang làm</option>
                                                          <option value="completed">Đã xong</option>
                                                        </select>
                                                      ) : (
                                                        <div className="flex justify-center">
                                                          <span className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap inline-block ${taskChipClass}`}>
                                                            {taskStatus === 'completed'
                                                              ? 'Đã xong'
                                                              : taskStatus === 'in-progress'
                                                                ? 'Đang làm'
                                                                : 'Chưa xong'}
                                                          </span>
                                                        </div>
                                                      )}
                                                    </td>
                            </tr>
                                                )
                                              })
                                            )}
                        </tbody>
                      </table>
                    </div>

                  </div>
                              )}
                </div>
              )
            })}
                      </div>
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm text-gray-500">
                            Chưa có checklist nào cho học sinh này trong hôm nay.
            </div>
                        ))}
                      </div>
                      
                      {activeSchedule &&
                        renderHomeworkSection(
                          activeSchedule.studentId,
                          activeSchedule.subject || 'Chung',
                          activeSchedule.id
                        )}

                      {quickViewAssignments.length > 0 && (
                        <SubjectReviewSection
                          title="Đánh giá chung cho từng môn"
                          assignments={quickViewAssignments}
                          scheduleSubject={activeSchedule.subject}
                          canEdit={true}
                          loading={assignmentReviewsLoading}
                          assignmentReviews={assignmentReviews}
                          assignmentReviewSaving={assignmentReviewSaving}
                          getAssignmentKey={(assignment, idx) => getAssignmentIdentifier(assignment, idx)}
                          onChangeField={handleAssignmentReviewFieldChange}
                          onSave={handleSaveAssignmentReview}
                          onDelete={handleDeleteAssignmentReview}
                        />
                      )}

                      {/* Phần đánh giá */}
                      {activeSchedule && (
                        <SessionEvaluationSection
                          scheduleId={activeSchedule.id}
                          canEdit={true}
                          reviews={scheduleReviews[activeSchedule.id]}
                          isExpanded={expandedEvaluations[activeSchedule.id] ?? false}
                          saving={savingReviews === activeSchedule.id}
                          scheduleStatus={getScheduleStatus(activeSchedule)}
                          onToggle={() =>
                            setExpandedEvaluations((prev) => ({
                              ...prev,
                              [activeSchedule.id]: !prev[activeSchedule.id],
                            }))
                          }
                          onSave={(currentReviews) => handleSaveReviews(activeSchedule.id, currentReviews)}
                          onChangeReview={(index, field, value) =>
                            handleReviewChange(activeSchedule.id, index, field, value)
                          }
                        />
                      )}

                      {/* Báo cáo buổi học - Home quick view */}
                      {activeSchedule && (
                        <div className="rounded-2xl border-2 border-primary-50 bg-white p-6 shadow-sm mt-4">
                          <div className="flex items-center justify-between mb-3 gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setIsHomeReportExpanded((prev) => !prev)
                              }
                              className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-gray-900 hover:text-primary-600 transition-colors"
                            >
                              <h4 className="text-inherit font-inherit">Báo cáo buổi học</h4>
                              {isHomeReportExpanded ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                            {isHomeReportExpanded && (
                              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleGenerateReport(activeSchedule.id)}
                                  disabled={reportLoadingScheduleId === activeSchedule.id}
                                  className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                                >
                                  {reportLoadingScheduleId === activeSchedule.id
                                    ? 'Đang tạo báo cáo...'
                                    : 'Tạo báo cáo'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const report = scheduleReports[activeSchedule.id]
                                    if (report?.reportURL) {
                                      // Nếu đã có báo cáo, mở link trực tiếp
                                      window.open(report.reportURL, '_blank')
                                    } else {
                                      // Nếu chưa có, fetch rồi tự động mở
                                      fetchScheduleReport(activeSchedule.id, true)
                                    }
                                  }}
                                  disabled={reportLoadingScheduleId === activeSchedule.id}
                                  className="px-4 py-2 rounded-xl border border-primary-300 text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  Xem báo cáo mẫu
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadReport(activeSchedule.id)}
                                  className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold text-gray-800 bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  Xuất báo cáo
                                </button>
                              </div>
                            )}
                          </div>
                          {isHomeReportExpanded && reportError && (
                            <p className="mt-1 text-sm text-red-600">{reportError}</p>
                          )}
                        </div>
                      )}
          </div>
                  )
                })()}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
    );
  }

const getStudentAvatar = (studentId: string) => {
  const numericId = parseInt(studentId, 10)
  const avatarIndex = isNaN(numericId) ? 1 : (numericId % 70) + 1
  return `https://i.pravatar.cc/150?img=${avatarIndex}`
}

// InfoCard and StatCard đã được tách ra thành component riêng trong components/tutor

const renderStudentsSection = () => {
    const selectedDetail = selectedStudentDetail
    const studentSchedules = selectedDetail
      ? tutorSchedules.filter((schedule) => schedule.studentId === selectedDetail.id)
      : []
    const upcomingSchedules = studentSchedules.filter((schedule) => schedule.date >= new Date())
    const nextSchedule = upcomingSchedules
      .slice()
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0]
    const selectedDetailInfo = selectedDetail ? studentInfoDetailsMap[selectedDetail.id] : undefined
    const nextScheduleInfo = nextSchedule
      ? {
          subject: nextSchedule.subject,
          dateLabel: format(nextSchedule.date, 'EEEE, dd/MM/yyyy'),
          timeLabel: nextSchedule.time,
        }
      : null

    return (
      <div className="h-full overflow-hidden">
        <div className="flex flex-col gap-2 mb-6">
          <h2 className="text-2xl font-bold text-gray-1200">Hồ sơ học sinh</h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[50%_50%] gap-6 h-full">
          {/* Left: Student List */}
          <div className="card h-full flex flex-col overflow-hidden max-h-[85vh]">
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Danh sách học sinh</p>
                <h3 className="text-lg font-semibold text-gray-900">Tổng quan lớp học · {students.length} học sinh</h3>
              </div>
            </div>

            <div className="mt-4 flex flex-col lg:flex-row gap-3">
              <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm flex-1">
                <Search className="w-4 h-4 text-gray-500 mr-2" />
                <input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Tìm kiếm học sinh theo tên..."
                  className="text-sm text-gray-700 outline-none bg-transparent flex-1"
                />
              </div>
            
            </div>

            <div className="flex-1 overflow-y-auto pr-1 mt-5">
              {paginatedStudents.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center text-sm text-gray-500">
                  Chưa có học sinh nào từ lịch dạy của bạn.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  {paginatedStudents.map((student) => {
                    const isSelected = selectedStudent === student.id
                    return (
                      <button
                        key={student.id}
                        onClick={() => setSelectedStudent(student.id)}
                        className={`text-left rounded-xl p-4 transition-all duration-200 ${
                          isSelected
                            ? 'bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-500 shadow-lg ring-2 ring-primary-100'
                            : 'bg-white border-2 border-gray-200 hover:border-primary-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                            <img
                              src={student.avatarUrl || getStudentAvatar(student.id)}
                              alt={student.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <h3
                              className={`text-lg font-bold truncate ${
                                isSelected ? 'text-primary-700' : 'text-gray-900'
                              }`}
                            >
                              {student.name}
                            </h3>
                            <p className="text-sm text-gray-500">{student.grade || 'Chưa cập nhật lớp'}</p>
                            <p className="text-xs text-gray-400 truncate">{student.address || 'Chưa có địa chỉ'}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center gap-3 justify-between pt-4 border-t border-gray-200 mt-4">
              <button
                onClick={() => setStudentPage((page) => Math.max(1, page - 1))}
                disabled={studentPage === 1}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1 sm:flex-auto"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Trang trước
              </button>
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 flex-none">
                <span>Trang</span>
                <span className="w-10 text-center bg-gray-100 rounded-lg py-1 text-gray-900">{studentPage}</span>
                <span>/ {studentPages}</span>
              </div>
              <button
                onClick={() => setStudentPage((page) => Math.min(studentPages, page + 1))}
                disabled={studentPage === studentPages}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1 sm:flex-auto"
              >
                Trang sau
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: Student Details */}
          <div className="card h-full flex flex-col overflow-hidden max-h-[85vh]">
            {selectedDetail ? (
              <>
                <div className="mb-6 pb-4 border-b border-gray-200">
                <p className="text-xl font-bold text-gray-700 uppercase tracking-[0.3em]">
  Thông tin chi tiết
</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {(selectedDetail.subjects || [])
                      .filter((subject) => subject?.toLowerCase() !== 'chung')
                      .map((subject) => (
                        <span key={subject} className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                          {subject}
                        </span>
                      ))}
                  </div>
                </div>

                <StudentInfoDetails
                  student={selectedDetail}
                  detail={selectedDetailInfo}
                  nextSchedule={nextScheduleInfo}
                  onJoinNextSchedule={nextSchedule ? () => handleJoinSchedule(nextSchedule.id) : undefined}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <UserCircle className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-sm font-medium text-gray-500">Chọn học sinh trong danh sách để xem chi tiết.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderScheduleSection = () => (
    <div className="h-full overflow-hidden">
      <div className="h-full flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
        {schedulesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-3"></div>
              <p className="text-gray-500 font-medium">Đang tải lịch học...</p>
            </div>
          </div>
        ) : (
          <MonthlyCalendar
            schedules={calendarSchedules}
            onJoinClass={handleJoinSchedule}
          />
        )}
      </div>
    </div>
  )

  // Tổ chức dữ liệu theo môn học cho checklist section (tất cả học sinh)
const checklistData = useMemo(() => {
  const selectedDateObj = checklistSelectedDate ? new Date(checklistSelectedDate) : new Date()
  selectedDateObj.setHours(0, 0, 0, 0)

  const schedulesForDate = tutorSchedules.filter((schedule) => {
    const scheduleDate = new Date(schedule.date)
    scheduleDate.setHours(0, 0, 0, 0)
    return scheduleDate.getTime() === selectedDateObj.getTime()
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const canEdit = selectedDateObj.getTime() >= today.getTime()

  const selectedSchedule = checklistSelectedScheduleId
    ? schedulesForDate.find((s) => s.id === checklistSelectedScheduleId)
    : null

  const selectedStudent =
    checklistSelectedStudentId && selectedSchedule
      ? students.find((s) => s.id === checklistSelectedStudentId)
      : null

  const studentAssignments =
    selectedStudent && selectedSchedule
      ? assignments
          .filter((assignment) => {
            const assignmentScheduleId = resolveAssignmentScheduleId(assignment.scheduleId)
            const assignmentStudentId = resolveAssignmentStudentId(assignment.studentId)
            return (
              assignmentScheduleId === selectedSchedule.id ||
              (assignmentStudentId === selectedStudent.id && assignmentScheduleId === undefined)
            )
          })
          .sort((a, b) => {
            const getTime = (value?: string) => (value ? new Date(value).getTime() : 0)
            return getTime(b.updatedAt || b.createdAt) - getTime(a.updatedAt || a.createdAt)
          })
      : []

  const materials = selectedSchedule?.materials || []

  return {
    selectedDateObj,
    schedulesForDate,
    canEdit,
    selectedSchedule,
    selectedStudent,
    studentAssignments,
    materials,
  }
}, [
  assignments,
  checklistSelectedDate,
  checklistSelectedScheduleId,
  checklistSelectedStudentId,
  students,
  tutorSchedules,
])

// Schedule slots cho checklist section (dựa trên ngày được chọn)
// Lấy danh sách ngày duy nhất từ các schedules
const checklistUniqueDates = useMemo(() => {
  const dates = new Set<string>()
  tutorSchedules.forEach((schedule) => {
    const dateKey = format(schedule.date, 'yyyy-MM-dd')
    dates.add(dateKey)
  })
  return Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
}, [tutorSchedules])

// Tự động chọn ngày đầu tiên nếu chưa chọn
useEffect(() => {
  if (checklistUniqueDates.length > 0 && !checklistUniqueDates.includes(checklistSelectedDate)) {
    setChecklistSelectedDate(checklistUniqueDates[0])
  }
}, [checklistUniqueDates, checklistSelectedDate])

// Lọc các buổi học theo ngày đã chọn
const checklistSchedulesForSelectedDate = useMemo(() => {
  if (!checklistSelectedDate) return []
  const selectedDateObj = new Date(checklistSelectedDate)
  selectedDateObj.setHours(0, 0, 0, 0)
  
  return tutorSchedules.filter((schedule) => {
    const scheduleDate = new Date(schedule.date)
    scheduleDate.setHours(0, 0, 0, 0)
    return scheduleDate.getTime() === selectedDateObj.getTime()
  }).sort((a, b) => {
    // Sort by time
    const timeA = a.time || ''
    const timeB = b.time || ''
    return timeA.localeCompare(timeB)
  })
}, [tutorSchedules, checklistSelectedDate])

// Tự động chọn buổi học đầu tiên trong ngày nếu chưa chọn hoặc buổi học hiện tại không thuộc ngày đã chọn
useEffect(() => {
  if (checklistSchedulesForSelectedDate.length > 0) {
    const currentScheduleInDate = checklistSchedulesForSelectedDate.find(
      (schedule) => schedule.id === checklistSelectedScheduleId
    )
    if (!currentScheduleInDate) {
      const firstSchedule = checklistSchedulesForSelectedDate[0]
      setChecklistSelectedScheduleId(firstSchedule.id)
      setChecklistSelectedStudentId(firstSchedule.studentId)
    }
  }
}, [checklistSchedulesForSelectedDate, checklistSelectedScheduleId])

const checklistScheduleSlots = useMemo<ScheduleSlotGroup[]>(() => {
  const selectedDateObj = checklistSelectedDate ? new Date(checklistSelectedDate) : new Date()
  selectedDateObj.setHours(0, 0, 0, 0)

  const schedulesForDate = tutorSchedules.filter((schedule) => {
    const scheduleDate = new Date(schedule.date)
    scheduleDate.setHours(0, 0, 0, 0)
    return scheduleDate.getTime() === selectedDateObj.getTime()
  })

  const slotMap: Record<string, { id: string; time: string; meetLink?: string; subjects: Set<string>; schedules: TutorSchedule[] }> = {}

  schedulesForDate.forEach((schedule) => {
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
    slotMap[slotId].subjects.add(schedule.subject)

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
}, [checklistSelectedDate, tutorSchedules])

const selectedChecklistScheduleSlot = useMemo(() => {
  return selectedChecklistScheduleSlotId
    ? checklistScheduleSlots.find((slot) => slot.id === selectedChecklistScheduleSlotId)
    : null
}, [selectedChecklistScheduleSlotId, checklistScheduleSlots])

// Auto-select first slot when slots change
useEffect(() => {
  if (checklistScheduleSlots.length === 0) {
    setSelectedChecklistScheduleSlotId(null)
    setChecklistSelectedScheduleId(null)
    setChecklistSelectedStudentId(null)
    return
  }
  setSelectedChecklistScheduleSlotId((prev) => {
    if (prev && checklistScheduleSlots.some((slot) => slot.id === prev)) {
      return prev
    }
    return checklistScheduleSlots[0]?.id || null
  })
}, [checklistScheduleSlots])

// Auto-select first schedule when slot changes
useEffect(() => {
  if (selectedChecklistScheduleSlot && selectedChecklistScheduleSlot.schedules.length > 0) {
    const firstSchedule = selectedChecklistScheduleSlot.schedules[0]
    setChecklistSelectedScheduleId(firstSchedule.id)
    setChecklistSelectedStudentId(firstSchedule.studentId)
  }
}, [selectedChecklistScheduleSlot])

// Fetch schedule details khi checklistSelectedScheduleId thay đổi (cho trang Checklist)
useEffect(() => {
  if (checklistSelectedScheduleId && !scheduleReviews[checklistSelectedScheduleId]) {
    fetchScheduleDetails(checklistSelectedScheduleId)
  }
}, [checklistSelectedScheduleId])

const studentAssignmentKeys = useMemo(() => {
  return checklistData.studentAssignments
    .map((assignment, index) => getAssignmentIdentifier(assignment, index))
    .join('|')
}, [checklistData.studentAssignments])

const quickViewAssignmentKeys = useMemo(() => {
  if (!quickViewData?.quickViewAssignments?.length) return ''
  return quickViewData.quickViewAssignments
    .map((assignment, index) => getAssignmentIdentifier(assignment, index))
    .join('|')
}, [quickViewData])

const assignmentReviewSources = useMemo(() => {
  const sources: Array<{ key: string; assignments: AssignmentApiItem[] }> = []
  if (checklistData.selectedSchedule && checklistData.studentAssignments.length > 0) {
    sources.push({
      key: `checklist-${checklistData.selectedSchedule.id}-${studentAssignmentKeys}`,
      assignments: checklistData.studentAssignments,
    })
  }
  if (quickViewData?.activeSchedule && quickViewData.quickViewAssignments.length > 0) {
    sources.push({
      key: `quickview-${quickViewData.activeSchedule.id}-${quickViewAssignmentKeys}`,
      assignments: quickViewData.quickViewAssignments,
    })
  }
  return sources
}, [
  checklistData.selectedSchedule?.id,
  studentAssignmentKeys,
  quickViewData?.activeSchedule?.id,
  quickViewAssignmentKeys,
])

useEffect(() => {
  let cancelled = false
  setAssignmentReviewsLoading(true)

  const loadReviews = async () => {
    try {
      const uniqueAssignments = new Map<string, AssignmentApiItem>()
      assignmentReviewSources.forEach((source) => {
        source.assignments.forEach((assignment, index) => {
          const stateKey = getAssignmentIdentifier(assignment, index)
          if (!uniqueAssignments.has(stateKey)) {
            uniqueAssignments.set(stateKey, assignment)
          }
        })
      })

      if (uniqueAssignments.size === 0) {
        setAssignmentReviews({})
        return
      }

      // Fetch reviews cho từng assignment bằng GET /reviews/assignment/{assignmentID}
      const reviewResults = await Promise.all(
        Array.from(uniqueAssignments.entries()).map(async ([stateKey, assignment]) => {
          const assignmentID = assignment.id || assignment._id
          if (!assignmentID) {
            return { stateKey }
          }
          
          try {
            const review = await apiCall<ReviewResponse>(`/reviews/assignment/${assignmentID}`)
            return { stateKey, review }
          } catch (error) {
            console.error(`Failed to fetch review for assignment ${assignmentID}:`, error)
            return { stateKey }
          }
        })
      )

      if (cancelled) return

      const next: Record<string, AssignmentReviewState> = {}
      Array.from(uniqueAssignments.keys()).forEach((stateKey) => {
        const assignment = getAssignmentByReviewKey(stateKey)
        const resultForAssignment = reviewResults.find((item) => item.stateKey === stateKey)
        const review = resultForAssignment?.review
        // Lấy comment từ top level của review response
        const comment = review?.comment || ''
        next[stateKey] = {
          reviewId: review?.id,
          taskId: assignment?.id || assignment?._id || '',
          result: 0, // Không cần result cho đánh giá chung cho từng môn
          comment: comment,
        }
      })
      setAssignmentReviews(next)
    } catch (error) {
      console.error('Failed to fetch assignment reviews:', error)
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
}, [assignmentReviewSources])

const getAssignmentByReviewKey = (assignmentKey: string) => {
  // Tìm trong checklist section
  const fromChecklist = checklistData.studentAssignments.find(
    (assignment, index) => getAssignmentIdentifier(assignment, index) === assignmentKey
  )
  if (fromChecklist) return fromChecklist

  // Tìm trong quick view (home section)
  if (quickViewData?.quickViewAssignments) {
    const fromQuickView = quickViewData.quickViewAssignments.find(
      (assignment, index) => getAssignmentIdentifier(assignment, index) === assignmentKey
    )
    if (fromQuickView) return fromQuickView
  }

  // Nếu không tìm thấy, thử tìm trong toàn bộ assignments
  return assignments.find(
    (assignment, index) => getAssignmentIdentifier(assignment, index) === assignmentKey
  )
}

const getDefaultReviewState = (assignmentKey: string): AssignmentReviewState => {
  const assignment = getAssignmentByReviewKey(assignmentKey)
  // taskId không cần thiết cho đánh giá chung cho từng môn, nhưng vẫn giữ để tương thích
  return {
    taskId: assignment?.id || assignment?._id || '',
    result: 0,
    comment: '',
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleAssignmentReviewFieldChange = (
  assignmentKey: string,
  field: 'comment' | 'result',
  value: string | number
) => {
  setAssignmentReviews((prev) => {
    const current = prev[assignmentKey] || getDefaultReviewState(assignmentKey)
    return {
      ...prev,
      [assignmentKey]: {
        ...current,
        [field]: field === 'result' ? Number(value) : (value as string),
      },
    }
  })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleSaveAssignmentReview = async (assignmentKey: string) => {
  const assignment = getAssignmentByReviewKey(assignmentKey)
  if (!assignment) {
    setAssignmentsError('Không tìm thấy checklist tương ứng với đánh giá.')
    return
  }
  
  // Lấy assignmentID từ assignment
  const assignmentID = assignment.id || assignment._id
  if (!assignmentID) {
    setAssignmentsError('Không tìm thấy mã checklist để lưu đánh giá.')
    return
  }
  
  const reviewState = assignmentReviews[assignmentKey] || getDefaultReviewState(assignmentKey)
  const comment = reviewState.comment || ''
  
  setAssignmentReviewSaving((prev) => ({ ...prev, [assignmentKey]: true }))
  try {
    if (reviewState.reviewId) {
      // Update existing review - PATCH /reviews/{reviewId}
      await apiCall(`/reviews/${reviewState.reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          comment: comment,
        }),
      })
    } else {
      // Create new review - POST /reviews với body có assignmentID, assignmentGrades (taskId = assignmentID), và comment
      const payload = {
        assignmentID: assignmentID,
        assignmentGrades: [
          {
            taskId: assignmentID, // taskId mặc định = assignmentID
          },
        ],
        comment: comment,
      }
      const response = await apiCall<{ id?: string; reviewId?: string }>(`/reviews`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setAssignmentReviews((prev) => ({
        ...prev,
        [assignmentKey]: {
          ...(prev[assignmentKey] || reviewState),
          reviewId: response.id || response.reviewId,
        },
      }))
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Không thể lưu đánh giá. Vui lòng thử lại.'
    setAssignmentsError(message)
  } finally {
    setAssignmentReviewSaving((prev) => {
      const next = { ...prev }
      delete next[assignmentKey]
      return next
    })
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleDeleteAssignmentReview = (assignmentKey: string) => {
  // Chỉ xóa dữ liệu hiển thị trong state, không gọi API
  setAssignmentReviews((prev) => ({
    ...prev,
    [assignmentKey]: {
      ...(prev[assignmentKey] || getDefaultReviewState(assignmentKey)),
      reviewId: undefined,
      comment: '',
      result: 0,
    },
  }))
}

const renderChecklistSection = () => {
    const {
      selectedDateObj,
      canEdit,
    } = checklistData

    // Check if selected date is in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isPastDate = selectedDateObj.getTime() < today.getTime()

    return (
      <div className="h-full space-y-4">
        {assignmentsError && (
          <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
            {assignmentsError}
          </div>
        )}
        {assignmentsLoading && (
          <div className="p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-600">
            Đang tải checklist từ máy chủ...
          </div>
        )}
        {/* Main Content - Full Width */}
        <div className="space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary-300 scrollbar-track-gray-100">
            {/* Chọn ngày và buổi học */}
            <div className="card-no-transition">
              <div className="mb-6 pb-4 border-b-2 border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className="w-6 h-6 text-primary-600" />
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Lịch dạy</h2>
                  </div>
                </div>
                {checklistUniqueDates.length > 0 && (
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Dropdown chọn ngày */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Chọn ngày:</label>
                      <select
                        value={checklistSelectedDate || ''}
                        onChange={(e) => {
                          const newDate = e.target.value || ''
                          setChecklistSelectedDate(newDate)
                          // Reset buổi học khi đổi ngày
                          setSelectedChecklistScheduleSlotId(null)
                          setChecklistSelectedScheduleId(null)
                          setChecklistSelectedStudentId(null)
                        }}
                        className="px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {checklistUniqueDates.map((dateKey) => (
                          <option key={dateKey} value={dateKey}>
                            {format(new Date(dateKey), 'dd/MM/yyyy')}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Dropdown chọn buổi học trong ngày */}
                    {checklistSelectedDate && checklistSchedulesForSelectedDate.length > 0 && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Chọn buổi học:</label>
                        <select
                          value={checklistSelectedScheduleId || ''}
                          onChange={(e) => {
                            const scheduleId = e.target.value || null
                            setChecklistSelectedScheduleId(scheduleId)
                            if (scheduleId) {
                              const selectedSchedule = checklistSchedulesForSelectedDate.find(
                                (s) => s.id === scheduleId
                              )
                              if (selectedSchedule) {
                                setChecklistSelectedStudentId(selectedSchedule.studentId)
                              }
                            }
                          }}
                          className="px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          {checklistSchedulesForSelectedDate.map((schedule) => {
                            const subjectPart = schedule.subject && schedule.subject !== 'Chung' ? ` · ${schedule.subject}` : ''
                            return (
                              <option key={schedule.id} value={schedule.id}>
                                {`${schedule.time}${subjectPart}${schedule.student ? ` · ${schedule.student}` : ''}`}
                              </option>
                            )
                          })}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {checklistSchedulesForSelectedDate.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-base font-semibold text-gray-600">
                    Không có lịch dạy cho ngày {checklistSelectedDate ? format(new Date(checklistSelectedDate), 'dd/MM/yyyy') : 'đã chọn'}
                  </p>
                </div>
              ) : !checklistSelectedScheduleId ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-base font-semibold text-gray-600">
                    Vui lòng chọn buổi học
                  </p>
                </div>
              ) : (() => {
                    const activeSchedule = checklistSchedulesForSelectedDate.find(
                      (schedule) => schedule.id === checklistSelectedScheduleId
                    )
                    if (!activeSchedule) return null
                    const activeStudentInfo = studentInfoMap[activeSchedule.studentId]
                    const materials = activeSchedule.materials || []
                    const quickViewAssignments = assignments
                      .filter((assignment) => {
                        const assignmentScheduleId = resolveAssignmentScheduleId(assignment.scheduleId)
                        const assignmentStudentId = resolveAssignmentStudentId(assignment.studentId)
                        if (assignmentScheduleId) {
                          return assignmentScheduleId === activeSchedule.id
                        }
                        return assignmentStudentId === activeSchedule.studentId
                      })
                      .sort((a, b) => {
                        const getTime = (value?: string) => (value ? new Date(value).getTime() : 0)
                        return getTime(b.updatedAt || b.createdAt) - getTime(a.updatedAt || a.createdAt)
                      })
                      return (
                    <div className="mt-2 flex flex-col gap-4">
                      <div className="rounded-2xl border-2 border-primary-100 bg-white p-6 space-y-4 shadow-sm">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                  <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                              {activeStudentInfo?.name || activeSchedule.student}
                            </h3>
                                    </div>
                          <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full sm:w-auto">
                            {!isPastDate && activeSchedule.meetLink && (
                              <div className="flex flex-col sm:flex-row gap-3">
                                      <button
                                  onClick={() => openChecklistForm(activeSchedule.studentId, activeSchedule.id)}
                                  className="btn-secondary px-5 py-2.5 text-sm font-bold border-2 border-primary-200 text-primary-600 bg-white hover:bg-primary-50 shadow-sm whitespace-nowrap"
                                >
                                  Tạo checklist
                                      </button>
                                    <button
                                  onClick={() => handleJoinSchedule(activeSchedule.id)}
                                  className="btn-primary px-8 py-3 text-base font-bold shadow-xl hover:shadow-2xl whitespace-nowrap"
                                    >
                                      Vào lớp
                                    </button>
                                  </div>
                                )}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <p className="text-4xl font-black text-primary-600 tracking-wide">
                              {activeSchedule.time}
                            </p>
                            {!isPastDate && activeSchedule.meetLink && (
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

                        {/* Tài liệu phụ huynh đã gửi */}
                        {materials.length > 0 && (
                          <div className="pt-4 border-t border-gray-100">
                            <p className="text-sm font-semibold text-gray-900 mb-3">
                              Tài liệu phụ huynh đã gửi ({materials.length})
                            </p>
                            <div className="space-y-3">
                              {materials.map((file) => (
                                <div
                                  key={file.id}
                                  className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col gap-1"
                                >
                                  <p className="text-sm font-bold text-gray-900">{file.name}</p>
                                  {file.note && (
                                    <p className="text-xs text-gray-600">
                                      <span className="font-semibold">Ghi chú:</span> {file.note}
                                    </p>
                                  )}
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary-600 font-semibold hover:underline"
                                  >
                                    Mở tài liệu
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Checklist */}
                      {quickViewAssignments.length > 0 && (
                        <TodayChecklistSection
                          title="Checklist"
                          assignments={quickViewAssignments}
                          canEdit={canEdit}
                          selectedStudentId={activeSchedule.studentId}
                          selectedScheduleSubject={activeSchedule.subject}
                          scheduleDate={activeSchedule.date}
                          expandedAssignmentId={expandedQuickViewAssignmentId}
                          editingAssignmentId={editingQuickViewAssignmentId}
                          assignmentDrafts={assignmentDrafts}
                          savingAssignmentId={savingAssignmentId}
                          deletingAssignmentId={deletingAssignmentId}
                          taskFileUploadingKey={taskFileUploadingKey}
                          onCollapseAssignment={handleCollapseQuickViewAssignment}
                          onToggleEditAssignment={handleToggleEditAssignment}
                          onDeleteAssignment={handleDeleteAssignment}
                          onClearDraft={clearAssignmentDraft}
                          onAddTask={handleAddAssignmentTask}
                          onChangeTaskField={handleAssignmentTaskFieldChange}
                          onAdjustTaskTime={adjustAssignmentTaskTime}
                          onUploadTaskFile={handleAssignmentTaskFileUpload}
                        />
                      )}

                      {/* Bài tập về nhà */}
                      {quickViewAssignments.length > 0 && activeSchedule && (() => {
                        const studentId = activeSchedule.studentId
                        const subjectMap = homeworkItemsByStudentAndSubject[studentId] || {}
                        
                        const handleToggleSection = (sectionKey: string, nextValue: boolean) => {
                          setExpandedHomeworkSections((prev) => ({
                            ...prev,
                            [sectionKey]: nextValue,
                          }))
                        }

                        const handleChangeField = (
                          subjectKey: string,
                          homeworkId: string,
                          field: keyof HomeworkItem,
                          value: string | HomeworkItem['difficulty']
                        ) => {
                          handleHomeworkChange(studentId, subjectKey, homeworkId, field, value as any)
                        }

                        const handleSaveHomeworkWrapper = (subjectKey: string, homeworkId: string) => {
                          handleSaveHomework(studentId, subjectKey, homeworkId)
                        }

                        const handleDeleteHomeworkWrapper = (subjectKey: string, homeworkId: string) => {
                          handleDeleteHomework(studentId, subjectKey, homeworkId)
                        }

                        const handleAddHomework = (subjectKey: string, targetScheduleId?: string) => {
                          if (targetScheduleId) {
                            openHomeworkForm(studentId, targetScheduleId, subjectKey)
                          }
                        }

                        const handleUploadFileWrapper = (
                          homeworkId: string,
                          field: 'assignmentUrl' | 'tutorSolution' | 'studentSolutionFile',
                          files: FileList | null
                        ) => {
                          handleHomeworkFileUpload(homeworkId, field, files)
                        }

                        return (
                          <HomeworkSection
                            studentId={studentId}
                            subject={activeSchedule.subject || 'Chung'}
                            scheduleId={activeSchedule.id}
                            homeworkMap={subjectMap}
                            expandedSections={expandedHomeworkSections}
                            onToggleSection={handleToggleSection}
                            onChangeField={handleChangeField}
                            onSaveHomework={handleSaveHomeworkWrapper}
                            onDeleteHomework={handleDeleteHomeworkWrapper}
                            onAddHomework={handleAddHomework}
                            onUploadFile={handleUploadFileWrapper}
                            taskFileUploadingKey={taskFileUploadingKey}
                            canEdit={canEdit}
                            resolveSubjectName={getSubjectDisplayName}
                          />
                        )
                      })()}

                      {/* Đánh giá chung cho từng môn */}
                      {quickViewAssignments.length > 0 && (
                        <SubjectReviewSection
                          title="Đánh giá chung cho từng môn"
                          assignments={quickViewAssignments}
                          scheduleSubject={activeSchedule?.subject}
                          canEdit={true}
                          loading={assignmentReviewsLoading}
                          assignmentReviews={assignmentReviews}
                          assignmentReviewSaving={assignmentReviewSaving}
                          getAssignmentKey={(assignment, index) => getAssignmentIdentifier(assignment, index)}
                          onChangeField={handleAssignmentReviewFieldChange}
                          onSave={handleSaveAssignmentReview}
                          onDelete={handleDeleteAssignmentReview}
                        />
                      )}

                      {/* Đánh giá buổi học */}
                      {activeSchedule && (
                        <SessionEvaluationSection
                          scheduleId={activeSchedule.id}
                          canEdit={true}
                          reviews={scheduleReviews[activeSchedule.id]}
                          isExpanded={expandedEvaluations[activeSchedule.id] ?? false}
                          saving={savingReviews === activeSchedule.id}
                          scheduleStatus={getScheduleStatus(activeSchedule)}
                          onToggle={() =>
                            setExpandedEvaluations((prev) => ({
                              ...prev,
                              [activeSchedule.id]: !prev[activeSchedule.id],
                            }))
                          }
                          onSave={(currentReviews) => handleSaveReviews(activeSchedule.id, currentReviews)}
                          onChangeReview={(index, field, value) =>
                            handleReviewChange(activeSchedule.id, index, field, value)
                          }
                        />
                      )}

                      {/* Báo cáo buổi học */}
                      {activeSchedule && (
                        <div className="rounded-2xl border-2 border-primary-50 bg-white p-6 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <button
                              type="button"
                              onClick={() =>
                                setIsChecklistReportExpanded((prev) => !prev)
                              }
                              className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-gray-900 hover:text-primary-600 transition-colors"
                            >
                              <h4 className="text-inherit font-inherit">Báo cáo buổi học</h4>
                              {isChecklistReportExpanded ? (
                                <ChevronUp className="w-5 h-5" />
                              ) : (
                                <ChevronDown className="w-5 h-5" />
                              )}
                            </button>
                            {isChecklistReportExpanded && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleGenerateReport(activeSchedule.id)}
                                  disabled={reportLoadingScheduleId === activeSchedule.id}
                                  className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition whitespace-nowrap shadow-sm"
                                >
                                  {reportLoadingScheduleId === activeSchedule.id ? 'Đang tạo...' : 'Tạo báo cáo'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const report = scheduleReports[activeSchedule.id]
                                    if (report?.reportURL) {
                                      // Nếu đã có báo cáo, mở link trực tiếp
                                      window.open(report.reportURL, '_blank')
                                    } else {
                                      // Nếu chưa có, fetch rồi tự động mở
                                      fetchScheduleReport(activeSchedule.id, true)
                                    }
                                  }}
                                  disabled={reportLoadingScheduleId === activeSchedule.id}
                                  className="px-4 py-2 rounded-full text-sm font-semibold text-primary-600 bg-white border-2 border-primary-200 hover:bg-primary-50 disabled:opacity-60 disabled:cursor-not-allowed transition whitespace-nowrap shadow-sm"
                                >
                                  Xem báo cáo mẫu
                                </button>
                                {scheduleReports[activeSchedule.id]?.reportURL && (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadReport(activeSchedule.id)}
                                    className="px-4 py-2 rounded-full text-sm font-semibold text-green-600 bg-white border-2 border-green-200 hover:bg-green-50 transition whitespace-nowrap shadow-sm"
                                  >
                                    Xuất báo cáo
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          {isChecklistReportExpanded && reportError && (
                            <div className="mt-4 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
                              {reportError}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                      )
                  })()
              }
            </div>
        </div>
      </div>
    )
  }


  const contextValue = {
    assignmentsError,
    students,
    selectedStudent,
    checklistItemsByStudent,
    todayTutorSchedules,
    tutorSchedules,
    pendingChecklistCount,
    averageStudentProgress,
    uniqueSubjectsCount,
    upcomingSchedule,
    handleSectionChange,
    openChecklistForm,
    scheduleSlots,
    selectedScheduleSlotId,
    setSelectedScheduleSlotId,
    selectedScheduleSlot,
    getScheduleStatus,
    copiedScheduleLink,
    setCopiedScheduleLink,
    handleJoinSchedule,
    checklistItemMeta,
    tutorDetailItemsByStudentAndSubject,
    editingField,
    setEditingField,
    handleLessonChange,
    handleTaskChange,
    handleStatusChange,
    handleNoteChange,
    handleDeleteChecklistItem,
    handleDetailChange,
    renderHomeworkSection,
    subjectEvaluations,
    handleEvaluationChange,
    renderSubjectEvaluation,
    assignmentsWithContext,
    studentsAt14h,
    homeworkItemsByStudentAndSubject,
  }

  return (
    <TutorDashboardContext.Provider value={contextValue}>
      <Layout 
        sidebar={
          <TutorSidebar 
            activeSection={activeSection} 
            onSectionChange={handleSectionChange}
            isMobileMenuOpen={isMobileMenuOpen}
            onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
          />
        }
      >
        <div className="h-full overflow-hidden lg:-ml-4">
          {renderContent()}
        </div>


        {showChecklistForm && (
          <ChecklistForm
            students={students.map(s => ({ id: s.id, name: s.name }))}
            schedulesByStudent={scheduleOptionsByStudent}
            formData={checklistForm}
            isSubmitting={isSubmittingChecklist}
            selectedStudentGrade={studentInfoDetailsMap[checklistForm.studentId]?.grade || students.find(s => s.id === checklistForm.studentId)?.grade}
            onFormChange={setChecklistForm}
            onSubmit={handleChecklistFormSubmit}
            onClose={() => setShowChecklistForm(false)}
          />
        )}

        {/* Form thêm bài tập về nhà */}
        {showHomeworkForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ zIndex: 10000 }}>
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Thêm bài tập về nhà</h3>
                <button
                  onClick={() => {
                    setShowHomeworkForm(false)
                    setHomeworkFormErrors({})
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="p-8 space-y-6">
                {/* Tên bài tập */}
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-3">
                    Tên bài tập <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={homeworkFormData.description}
                    onChange={(e) => {
                      setHomeworkFormData(prev => ({ ...prev, description: e.target.value }))
                      if (homeworkFormErrors.name) {
                        setHomeworkFormErrors(prev => ({ ...prev, name: undefined }))
                      }
                    }}
                    className={`w-full border-2 rounded-xl px-5 py-3 text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      homeworkFormErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    rows={4}
                    placeholder="Nhập tên bài tập về nhà"
                  />
                  {homeworkFormErrors.name && (
                    <p className="text-xs text-red-500 mt-1">{homeworkFormErrors.name}</p>
                  )}
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-3">
                    Deadline <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      ref={deadlineInputRef}
                      id="homework-deadline-input"
                      type="date"
                      value={homeworkFormData.deadline ? (() => {
                        // Chuyển đổi sang local date để tránh lỗi timezone
                        const date = new Date(homeworkFormData.deadline)
                        const year = date.getFullYear()
                        const month = String(date.getMonth() + 1).padStart(2, '0')
                        const day = String(date.getDate()).padStart(2, '0')
                        return `${year}-${month}-${day}`
                      })() : (() => {
                        const today = new Date()
                        const year = today.getFullYear()
                        const month = String(today.getMonth() + 1).padStart(2, '0')
                        const day = String(today.getDate()).padStart(2, '0')
                        return `${year}-${month}-${day}`
                      })()}
                      onChange={(e) => {
                        if (e.target.value) {
                          // Parse date string trực tiếp để tránh timezone issues
                          const [year, month, day] = e.target.value.split('-').map(Number)
                          const date = new Date(year, month - 1, day)
                          date.setHours(0, 0, 0, 0) // Set giờ mặc định 0h
                          setHomeworkFormData(prev => ({ ...prev, deadline: date.toISOString() }))
                          if (homeworkFormErrors.deadline) {
                            setHomeworkFormErrors(prev => ({ ...prev, deadline: undefined }))
                          }
                        } else {
                          // Nếu không chọn, mặc định là ngày hôm nay
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          setHomeworkFormData(prev => ({ ...prev, deadline: today.toISOString() }))
                        }
                      }}
                      onClick={(e) => {
                        // Đảm bảo click vào input sẽ mở date picker
                        const target = e.target as HTMLInputElement
                        if (target && 'showPicker' in target && typeof (target as any).showPicker === 'function') {
                          try {
                            (target as any).showPicker()
                          } catch (err) {
                            // Browser không hỗ trợ showPicker(), bỏ qua
                            console.log('showPicker not supported')
                          }
                        }
                      }}
                      className={`w-full border-2 rounded-xl px-5 py-3 pr-12 text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none ${
                        homeworkFormErrors.deadline ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{ 
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (deadlineInputRef.current) {
                          deadlineInputRef.current.focus()
                          // Thử nhiều cách để mở date picker
                          if ('showPicker' in deadlineInputRef.current && typeof (deadlineInputRef.current as any).showPicker === 'function') {
                            try {
                              (deadlineInputRef.current as any).showPicker()
                            } catch (err) {
                              // Fallback: trigger click event
                              deadlineInputRef.current.click()
                            }
                          } else {
                            // Fallback: trigger click event
                            deadlineInputRef.current.click()
                          }
                        }
                      }}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-500 cursor-pointer flex items-center justify-center bg-transparent border-none p-0"
                      style={{ pointerEvents: 'auto' }}
                      aria-label="Chọn ngày"
                    >
                      <Calendar className="w-5 h-5" />
                    </button>
                  </div>
                  {homeworkFormErrors.deadline && (
                    <p className="text-xs text-red-500 mt-1">{homeworkFormErrors.deadline}</p>
                  )}
                </div>

                {/* Danh sách tasks */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-base font-bold text-gray-700">
                      Nhiệm vụ <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddHomeworkTask}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm nhiệm vụ</span>
                    </button>
                  </div>
                  {homeworkFormErrors.tasks && homeworkFormData.tasks.length === 0 && (
                    <p className="text-xs text-red-500 mb-2">
                      {homeworkFormErrors.tasks[0]?.name || 'Vui lòng thêm ít nhất một nhiệm vụ'}
                    </p>
                  )}

                  <div className="space-y-5">
                    {homeworkFormData.tasks.map((task, index) => (
                      <div key={index} className="border-2 border-gray-200 rounded-xl p-6 space-y-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-base font-bold text-gray-700">Nhiệm vụ {index + 1}</span>
                          {homeworkFormData.tasks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveHomeworkTask(index)}
                              className="text-sm font-semibold text-red-500 hover:text-red-600"
                            >
                              Xóa
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-base font-bold text-gray-700 mb-2">
                            Tên bài tập <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={task.name}
                            onChange={(e) => {
                              handleHomeworkTaskChange(index, 'name', e.target.value)
                              if (homeworkFormErrors.tasks?.[index]?.name) {
                                setHomeworkFormErrors(prev => {
                                  const newTasks = [...(prev.tasks || [])]
                                  newTasks[index] = { ...newTasks[index], name: undefined }
                                  return { ...prev, tasks: newTasks }
                                })
                              }
                            }}
                            className={`w-full border-2 rounded-xl px-5 py-3 text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                              homeworkFormErrors.tasks?.[index]?.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Nhập tên bài tập"
                          />
                          {homeworkFormErrors.tasks?.[index]?.name && (
                            <p className="text-xs text-red-500 mt-1">{homeworkFormErrors.tasks[index].name}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-base font-bold text-gray-700 mb-2">File bài tập</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={task.assignmentUrl}
                              onChange={(e) => handleHomeworkTaskChange(index, 'assignmentUrl', e.target.value)}
                              className="flex-1 border-2 border-gray-300 rounded-xl px-5 py-3 text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Link file bài tập"
                            />
                            <label
                              className={`inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-primary-300 text-primary-600 flex-shrink-0 ${
                                taskFileUploadingKey === `homework-task-${index}-assignmentUrl`
                                  ? 'cursor-wait opacity-60'
                                  : 'cursor-pointer hover:bg-primary-50'
                              }`}
                              title={
                                taskFileUploadingKey === `homework-task-${index}-assignmentUrl`
                                  ? 'Đang upload...'
                                  : 'Upload file bài tập'
                              }
                            >
                              {taskFileUploadingKey === `homework-task-${index}-assignmentUrl` ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Upload className="w-5 h-5" />
                              )}
                              <input
                                type="file"
                                className="hidden"
                                accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                onChange={(e) => {
                                  handleHomeworkTaskFileUpload(index, 'assignmentUrl', e.target.files)
                                  e.target.value = ''
                                }}
                              />
                            </label>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

                {/* Nút submit */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t-2 border-gray-200">
                  <button
                    onClick={() => {
                      setShowHomeworkForm(false)
                      setHomeworkFormErrors({})
                    }}
                    className="px-6 py-3 rounded-xl border-2 border-gray-300 text-base font-bold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSubmitHomework}
                    disabled={submittingHomework}
                    className="px-8 py-3 rounded-xl bg-primary-500 text-white text-base font-bold hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-md"
                  >
                    {submittingHomework ? 'Đang tạo...' : 'Tạo bài tập'}
                  </button>
                </div>
              </div>
            </div>
          </div>
              )}
      </Layout>
    </TutorDashboardContext.Provider>
  )
}
