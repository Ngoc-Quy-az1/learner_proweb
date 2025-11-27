import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layout } from '../components/common'
import { TutorSidebar, ChecklistItem, MonthlyCalendar, ScheduleItem } from '../components/dashboard'
import { Users, Calendar, Plus, Clock, UserCircle, Copy, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Upload, BookOpen, Search, Filter } from 'lucide-react'
import { format, isToday, differenceInYears } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { apiCall, API_BASE_URL } from '../config/api'
import { ChecklistForm, HomeworkTable, DetailTable, SubjectEvaluation, StudentInfoDetails, type ChecklistFormData, type TutorChecklistDetail } from '../components/tutor'
import StarRating from '../components/tutor/StarRating'
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

interface AssignmentApiItem {
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

interface HomeworkItem {
  id: string
  task: string // BÀI TẬP
  deadline: string // DEADLINE (format: YYYY-MM-DDTHH:mm hoặc YYYY-MM-DD)
  studentSolutionFile?: string // FILE LỜI GIẢI HỌC SINH (file học sinh nộp)
  tutorSolution?: string // LỜI GIẢI CỦA TUTOR (filename hoặc text, có thể upload file)
  difficulty: 'easy' | 'medium' | 'hard' // MỨC ĐỘ: Dễ, Trung bình, Khó
  result: 'completed' | 'in_progress' | 'not_done' | 'incorrect' // KẾT QUẢ
  note: string // NHẬN XÉT
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

interface SubjectData {
  subject: string
  students: Array<{
    studentId: string
    checklistItems: ChecklistItem[]
    detailItems: TutorChecklistDetail[]
    homeworkItems: HomeworkItem[] // Bài tập về nhà
    evaluation: SubjectEvaluation
  }>
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
  const [subjectFilter, setSubjectFilter] = useState<'all' | string>('all')
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
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({})
  const [selectedSubjectStudents, setSelectedSubjectStudents] = useState<Record<string, string[]>>({}) // subject -> studentIds
  
  // State cho đánh giá
  interface ScheduleReview {
    name: string
    rating: number
    comment: string
  }
  const [scheduleReviews, setScheduleReviews] = useState<Record<string, ScheduleReview[]>>({}) // scheduleId -> reviews
  const [savingReviews, setSavingReviews] = useState<string | null>(null) // scheduleId đang lưu
  
  // Refs và state cho scroll khung giờ
  const scheduleSlotsScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

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
  // Bộ lọc cho checklist
  const [checklistSearchQuery, setChecklistSearchQuery] = useState<string>('')
  const [checklistDateRange, setChecklistDateRange] = useState<'all' | 'week' | 'month' | 'custom'>('all')
  const [checklistCustomStartDate, setChecklistCustomStartDate] = useState<string>('')
  const [checklistCustomEndDate, setChecklistCustomEndDate] = useState<string>('')
  const [checklistSelectedStudent, setChecklistSelectedStudent] = useState<string>('all') // 'all' hoặc studentId
  const [checklistSelectedTimeSlot, setChecklistSelectedTimeSlot] = useState<string>('all') // 'all' hoặc time slot
  
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
        const fallbackStudentInfoMap: Record<string, StudentInfo> = {}
        response.results.forEach((schedule) => {
          const studentRef = schedule.studentId
          const studentId = resolveUserId(studentRef)
          if (!studentId) return
          studentIds.add(studentId)
          if (studentRef && typeof studentRef === 'object') {
            const studentRefData = studentRef as any
            fallbackStudentInfoMap[studentId] = {
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
        const mergedStudentInfoMap: Record<string, StudentInfo> = { ...fallbackStudentInfoMap }
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
            student: studentInfo?.name || fallbackStudentInfoMap[studentId]?.name || 'Chưa có tên',
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
          setAssignments(response.results || [])
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
  const subjectOptions = useMemo(
    () =>
      Array.from(
        new Set(
          students
            .map((student) => student.subject)
            .filter((subject): subject is string => Boolean(subject))
        )
      ).sort(),
    [students]
  )
  const filteredStudents = useMemo(() => {
    const normalizedQuery = studentSearch.trim().toLowerCase()
    return students.filter((student) => {
      const matchesName = student.name.toLowerCase().includes(normalizedQuery)
      const matchesSubject =
        subjectFilter === 'all' ? true : student.subject === subjectFilter
      return matchesName && matchesSubject
    })
  }, [students, studentSearch, subjectFilter])
  useEffect(() => {
    setStudentPage(1)
  }, [studentSearch, subjectFilter])
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

  const handleFileUpload = (id: string, file: File) => {
    console.log('Upload file for item:', id, file.name)
  }

  // Lấy danh sách học sinh khung giờ 14h
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
  const [homeworkItemsByStudentAndSubject, setHomeworkItemsByStudentAndSubject] = useState<Record<string, Record<string, HomeworkItem[]>>>({
    '1': {
      Toán: [
        {
          id: 'hw1-1',
          task: 'Làm bài tập Toán chương 2',
          deadline: '2025-11-20T23:59',
          studentSolutionFile: 'bai_tap_toan_chuong_2.pdf',
          tutorSolution: 'loi_giai_toan_chuong_2.pdf',
          difficulty: 'medium',
          result: 'completed',
          note: 'Hoàn thành tốt'
        }
      ],
      Hóa: [
        {
          id: 'hw1-h1',
          task: 'Ôn tập Hóa chương 1',
          deadline: '2025-11-18T23:59',
          studentSolutionFile: 'on_tap_hoa_chuong_1.pdf',
          tutorSolution: undefined,
          difficulty: 'easy',
          result: 'completed',
          note: 'Đã nộp đúng hạn'
        }
      ]
    },
    '4': {
      Toán: [
        {
          id: 'hw4-1',
          task: 'Giải bài tập SGK trang 45-47',
          deadline: '2025-11-22T23:59',
          studentSolutionFile: 'bai_tap_sgk_trang_45_47.pdf',
          tutorSolution: 'loi_giai_bai_tap_sgk.pdf',
          difficulty: 'hard',
          result: 'completed',
          note: 'Làm tốt, cần kiểm tra lại bài 5'
        }
      ]
    },
    '8': {
      Toán: [
        {
          id: 'hw8-1',
          task: 'Làm đề kiểm tra chương 3',
          deadline: '2025-11-25T23:59',
          studentSolutionFile: 'de_kiem_tra_chuong_3.pdf',
          tutorSolution: 'loi_giai_de_kiem_tra.pdf',
          difficulty: 'hard',
          result: 'completed',
          note: 'Đạt điểm cao'
        }
      ]
    },
    '11': {
      Toán: [
        {
          id: 'hw11-1',
          task: 'Làm bài tập về nhà tuần này',
          deadline: '2025-11-24T23:59',
          studentSolutionFile: undefined,
          tutorSolution: undefined,
          difficulty: 'medium',
          result: 'not_done',
          note: 'Chưa nộp'
        }
      ]
    }
  })

  const handleHomeworkChange = (studentId: string, subject: string, homeworkId: string, field: keyof HomeworkItem, value: string | 'easy' | 'medium' | 'hard' | 'completed' | 'in_progress' | 'not_done' | 'incorrect') => {
    setHomeworkItemsByStudentAndSubject(prev => {
      const newData = { ...prev }
      if (!newData[studentId]) newData[studentId] = {}
      if (!newData[studentId][subject]) newData[studentId][subject] = []
      newData[studentId][subject] = newData[studentId][subject].map(item =>
        item.id === homeworkId ? { ...item, [field]: value } : item
      )
      return newData
    })
  }

  const handleAddHomework = (studentId: string, subject: string) => {
    setHomeworkItemsByStudentAndSubject(prev => {
      const newData = { ...prev }
      if (!newData[studentId]) newData[studentId] = {}
      if (!newData[studentId][subject]) newData[studentId][subject] = []
      // Tạo deadline mặc định là 7 ngày từ hôm nay
      const defaultDeadline = new Date()
      defaultDeadline.setDate(defaultDeadline.getDate() + 7)
      const deadlineString = defaultDeadline.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:mm
      const newHomework: HomeworkItem = {
        id: `hw-${Date.now()}`,
        task: '',
        deadline: deadlineString,
        difficulty: 'medium',
        result: 'not_done',
        note: ''
      }
      newData[studentId][subject] = [...newData[studentId][subject], newHomework]
      return newData
    })
  }

  const handleDeleteHomework = (studentId: string, subject: string, homeworkId: string) => {
    setHomeworkItemsByStudentAndSubject(prev => {
      const newData = { ...prev }
      if (!newData[studentId]) newData[studentId] = {}
      if (!newData[studentId][subject]) newData[studentId][subject] = []
      newData[studentId][subject] = newData[studentId][subject].filter(item => item.id !== homeworkId)
      return newData
    })
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

  // Render component giao bài tập về nhà - sử dụng component mới
  const renderHomeworkSection = (studentId: string, subject: string) => {
    const homeworkItems = homeworkItemsByStudentAndSubject[studentId]?.[subject] || []

    return (
      <HomeworkTable
        items={homeworkItems}
        onAdd={() => handleAddHomework(studentId, subject)}
        onChange={(id, field, value) => handleHomeworkChange(studentId, subject, id, field, value)}
        onDelete={(id) => handleDeleteHomework(studentId, subject, id)}
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
    setExpandedQuickViewAssignmentId((prev) => (prev === assignmentKey ? null : prev))
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
      await apiCall(`/assignments/${assignmentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: assignment.name,
          description: assignment.description,
          subject: assignment.subject,
          status: assignment.status,
          tasks: draftTasks.map((task) => ({
            id: task.id,
            name: task.name,
            description: task.description,
            status: task.status,
            note: task.note,
            estimatedTime: task.estimatedTime,
            actualTime: task.actualTime,
            assignmentUrl: task.assignmentUrl,
            answerURL: task.answerURL,
            solutionUrl: task.solutionUrl,
          })),
        }),
      })

      setAssignments((prev) =>
        prev.map((item) => {
          const itemId = item._id || item.id
          return itemId === assignmentId ? { ...item, tasks: draftTasks } : item
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
        className="w-20 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder={placeholder}
      />
      <div className="flex flex-col border-l border-gray-200">
        <button
          type="button"
          onClick={() => onAdjust(1)}
          className="px-1 py-0.5 hover:bg-gray-100"
        >
          <ChevronUp className="w-3.5 h-3.5 text-gray-600" />
        </button>
        <button
          type="button"
          onClick={() => onAdjust(-1)}
          className="px-1 py-0.5 hover:bg-gray-100"
        >
          <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
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
        const normalizedReviews = defaultReviews.map((defaultReview, index) => {
          const savedReview = schedule.reviews?.[index]
          return savedReview
            ? {
                ...savedReview,
                name: defaultReview.name, // Đảm bảo name luôn đúng từ default
              }
            : defaultReview
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
      const normalizedReviews = defaultReviews.map((defaultReview, index) => {
        const review = reviews[index]
        return review
          ? {
              ...review,
              name: defaultReview.name, // Đảm bảo name luôn đúng từ default
            }
          : defaultReview
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
    const reviews = currentReviews.length === 5 
      ? currentReviews.map((review, idx) => ({
          ...review,
          name: defaultReviews[idx].name, // Đảm bảo name luôn đúng
        }))
      : defaultReviews
    
    const updatedReviews = [...reviews]
    updatedReviews[index] = {
      ...updatedReviews[index],
      name: defaultReviews[index].name, // Đảm bảo name luôn đúng
      [field]: value,
    }
    setScheduleReviews((prev) => ({
      ...prev,
      [scheduleId]: updatedReviews,
    }))
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
          <div className="lg:col-auto lg:sticky lg:top-4 self-start">
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
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 text-center border border-blue-200 shadow-md min-h-[160px] flex flex-col justify-center">
                    <Users className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-3 uppercase tracking-[0.3em] font-semibold">Học sinh</p>
                    <p className="text-5xl font-black text-gray-900">{students.length}</p>
                </div>
                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-md min-h-[160px] flex flex-col justify-center text-center">
                    <p className="text-sm text-gray-500 uppercase tracking-[0.3em] mb-3 font-semibold">Buổi hôm nay</p>
                    <p className="text-5xl font-black text-gray-900 mb-2">{todayTutorSchedules.length}</p>
                    <p className="text-sm text-gray-500">Tổng {tutorSchedules.length} buổi được lên lịch</p>
                    </div>
              </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-md min-h-[160px] flex flex-col justify-center text-center">
                    <p className="text-sm text-gray-500 uppercase tracking-[0.3em] mb-3 font-semibold">Môn đang dạy</p>
                    <p className="text-5xl font-black text-gray-900 mb-2">{uniqueSubjectsCount}</p>
                </div>
              </div>

                <div className="border-2 border-dashed border-primary-200 rounded-2xl p-6 bg-gradient-to-br from-primary-50 to-blue-50 text-left shadow-sm">
                  <p className="text-sm font-semibold text-primary-600 mb-3 uppercase tracking-[0.3em]">
                    Buổi dạy sắp tới
                  </p>
                {upcomingSchedule ? (
                  <div className="flex items-center justify-between text-lg text-gray-700 font-bold">
                      <span>{format(upcomingSchedule.date, 'dd/MM/yyyy')}</span>
                    <span>{upcomingSchedule.time}</span>
                    </div>
                ) : (
                  <p className="text-base text-gray-600">Không có buổi nào sắp tới</p>
                )}
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
                  <h2 className="text-2xl font-bold text-gray-900">Lịch dạy hôm nay</h2>
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
                    {scheduleSlots.map((slot) => {
                      const isSelected = selectedScheduleSlotId === slot.id
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
                            boxShadow: isSelected ? '0 10px 25px -5px rgba(59, 130, 246, 0.3), 0 0 0 2px rgba(59, 130, 246, 0.1)' : undefined
                          }}
                    >
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className={`w-5 h-5 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                              <p className="text-lg font-extrabold">{slot.time}</p>
                            </div>
                            <p className="text-sm text-gray-600 truncate mb-3 font-medium">
                        {slot.subjects.length > 0 ? slot.subjects.join(', ') : 'Khác'}
                      </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className={`w-4 h-4 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                            <p className="text-base text-gray-700 font-bold">{slot.schedules.length} học sinh</p>
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
                            <p className="text-xs font-semibold text-primary-600 uppercase tracking-[0.3em]">
                              Thông tin nhanh
                            </p>
                            <h3 className="text-2xl font-bold text-gray-900">
                              {activeStudentInfo?.name || activeSchedule.student}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {activeStudentInfo?.grade || activeStudentInfo?.currentLevel || 'Chưa rõ lớp'} ·{' '}
                              {activeStudentInfo?.address || 'Chưa có thông tin'}
                            </p>
                                    </div>
                          <div className="flex flex-col sm:flex-row sm:items-end gap-3 w-full sm:w-auto">
                            <div className="flex flex-col flex-1">
                              <label className="text-xs font-semibold text-gray-600 mb-1">Chọn học sinh</label>
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
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Khung giờ</p>
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
                          <h4 className="text-lg font-bold text-gray-900">Checklist gần nhất</h4>
                          <span className="text-xs text-gray-500">
                            {quickViewAssignments.length} checklist cho buổi {format(activeSchedule.date, 'dd/MM')}
                          </span>
                        </div>
                        {quickViewAssignments.length > 0 ? (
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
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between px-5 py-4 gap-3">
                                    <div className="flex-1">
                                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em] mb-1">
                                        {assignment.subject || 'Chung'}
                                      </p>
                                      <h5 className="text-lg font-bold text-gray-900">{assignment.name || 'Checklist'}</h5>
                                      {assignment.description && (
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{assignment.description}</p>
                                      )}
                                    </div>
                                    <div className="mt-1 md:mt-0 flex items-center justify-end gap-2">
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
                                    <div className="p-5 space-y-4 bg-white">
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
                                          <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-[0.3em]">
                                            <tr>
                                              <th className="px-5 py-3 text-center font-semibold border-b-2 border-gray-200">Bài học</th>
                                              <th className="px-5 py-3 text-center font-semibold border-b-2 border-gray-200">Nhiệm vụ</th>
                                              <th className="px-5 py-3 text-center font-semibold border-b-2 border-gray-200">Trạng thái</th>
                                              <th className="px-5 py-3 text-center font-semibold border-b-2 border-gray-200">Ghi chú</th>
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
                                                    : 'bg-gray-100 text-gray-600'
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
                                                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${rowChip}`}>
                                                        {rowStatus === 'completed'
                                                          ? 'Đã xong'
                                                          : rowStatus === 'in-progress'
                                                            ? 'Đang làm'
                                                            : 'Chưa xong'}
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
                                        <table className="w-full text-sm min-w-[1200px]">
                                          <thead className="bg-gray-50 text-gray-600">
                                            <tr>
                                              <th className="px-4 py-2 text-left font-semibold uppercase text-xs tracking-[0.3em] w-[12%]">Bài học</th>
                                              <th className="px-4 py-2 text-left font-semibold uppercase text-xs tracking-[0.3em] w-[10%]">
                                                Thời gian (ước/thực)
                                              </th>
                                              <th className="px-4 py-2 text-left font-semibold uppercase text-xs tracking-[0.3em] w-[10%]">
                                                File bài tập
                                              </th>
                                              <th className="px-4 py-2 text-left font-semibold uppercase text-xs tracking-[0.3em] w-[10%]">
                                                Bài làm học sinh
                                              </th>
                                              <th className="px-4 py-2 text-left font-semibold uppercase text-xs tracking-[0.3em] w-[10%]">Lời giải</th>
                                              <th className="px-4 py-2 text-left font-semibold uppercase text-xs tracking-[0.3em] w-[8%]">Trạng thái</th>
                                              <th className="px-4 py-2 text-left font-semibold uppercase text-xs tracking-[0.3em] w-[20%]">Nhận xét</th>
                                              <th className="px-4 py-2 text-left font-semibold uppercase text-xs tracking-[0.3em] w-[20%]">Ghi chú</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100 bg-white">
                                            {displayTasks.length === 0 ? (
                                              <tr>
                                                <td colSpan={8} className="px-4 py-4 text-center text-sm text-gray-500">
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
                                                      : 'bg-gray-100 text-gray-600'
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
                                                    <td className="px-4 py-3 text-gray-700">
                                                      {isEditing ? (
                                                        <div className="flex items-center gap-2">
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
                                                          <span>/</span>
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
                                                        <>
                                                          {task.estimatedTime ? `${task.estimatedTime}’` : '—'} /{' '}
                                                          {task.actualTime ? `${task.actualTime}’` : '—'}
                                                        </>
                                                      )}
                                                    </td>
                                                    <td className="px-4 py-3 overflow-hidden">
                                                      {isEditing ? (
                                                        <div className="flex items-center gap-2 min-w-0">
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
                                                            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 truncate"
                                                            placeholder="Link file bài tập"
                                                            title={task.assignmentUrl || ''}
                                                          />
                                                          <label
                                                            className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 cursor-pointer hover:bg-primary-50 flex-shrink-0"
                                                            title={
                                                              taskFileUploadingKey === `${assignmentKey}-${taskIndex}-assignmentUrl`
                                                                ? 'Đang upload...'
                                                                : 'Upload tài liệu'
                                                            }
                                                          >
                                                            <Upload className="w-3.5 h-3.5" />
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
                                                        <a href={task.assignmentUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate block max-w-full text-xs" title={task.assignmentUrl}>
                                                          Xem file
                                                        </a>
                                                      ) : (
                                                        <span className="text-xs">—</span>
                                )}
                              </td>
                                                    <td className="px-4 py-3 overflow-hidden">
                                                      {task.answerURL ? (
                                                        <a href={task.answerURL} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate block max-w-full text-xs" title={task.answerURL}>
                                                          Bài làm học sinh
                                                        </a>
                                                      ) : (
                                                        <span className="text-xs">—</span>
                                                      )}
                                                    </td>
                                                    <td className="px-4 py-3 overflow-hidden">
                                                      {isEditing ? (
                                                        <div className="flex items-center gap-2 min-w-0">
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
                                                            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 truncate"
                                                            placeholder="Link lời giải"
                                                            title={task.solutionUrl || ''}
                                                          />
                                                          <label
                                                            className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 cursor-pointer hover:bg-primary-50 flex-shrink-0"
                                                            title={
                                                              taskFileUploadingKey === `${assignmentKey}-${taskIndex}-solutionUrl`
                                                                ? 'Đang upload...'
                                                                : 'Upload lời giải'
                                                            }
                                                          >
                                                            <Upload className="w-3.5 h-3.5" />
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
                                                        <a href={task.solutionUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate block max-w-full text-xs" title={task.solutionUrl}>
                                                          File lời giải
                                                        </a>
                                                      ) : (
                                                        <span className="text-xs">—</span>
                                )}
                              </td>
                                                    <td className="px-4 py-3">
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
                                                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                                        >
                                                          <option value="pending">Chưa xong</option>
                                                          <option value="in-progress">Đang làm</option>
                                                          <option value="completed">Đã xong</option>
                                </select>
                                                      ) : (
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${taskChipClass}`}>
                                                          {taskStatus === 'completed'
                                                            ? 'Đã xong'
                                                            : taskStatus === 'in-progress'
                                                              ? 'Đang làm'
                                                              : 'Chưa xong'}
                                                        </span>
                                                      )}
                              </td>
                                                    <td className="px-4 py-3 text-gray-700 whitespace-normal break-words">
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
                                                          placeholder="Nhận xét"
                                  />
                                ) : (
                                                        <span className="block">{task.description || '—'}</span>
                                )}
                              </td>
                                                    <td className="px-4 py-3 text-gray-600 whitespace-normal break-words">
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
                                                          <span className="flex-1 block">{task.note || '—'}</span>
                                                        )}
                                                      </div>
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
            )}
                      </div>

                      {/* Phần đánh giá */}
                      {activeSchedule && (() => {
                        const scheduleId = activeSchedule.id
                        const defaultReviews = getDefaultReviews()
                        const savedReviews = scheduleReviews[scheduleId]
                        
                        // Đảm bảo reviews có đủ 5 mục và name đúng
                        const currentReviews = savedReviews && savedReviews.length === 5
                          ? savedReviews.map((review, idx) => ({
              ...review,
              name: defaultReviews[idx].name, // Đảm bảo name luôn đúng
            }))
                          : defaultReviews

                        const evaluationCriteria = [
                          {
                            name: 'Mức độ tập trung',
                            description: 'Học sinh có duy trì sự chú ý suốt buổi học.',
                            defaultComment: 'Cần tập trung hơn trong giờ học.',
                          },
                          {
                            name: 'Hiểu nội dung bài học',
                            description: 'Hiểu khái niệm, nắm được cách làm bài.',
                            defaultComment: 'Cần củng cố lại kiến thức cơ bản.',
                          },
                          {
                            name: 'Hoàn thành nhiệm vụ',
                            description: 'Làm đủ, đúng thời gian và yêu cầu.',
                            defaultComment: 'Cần hoàn thành đầy đủ bài tập.',
                          },
                          {
                            name: 'Thái độ & tinh thần học',
                            description: 'Chủ động hỏi, hợp tác, tôn trọng giờ học.',
                            defaultComment: 'Cần tích cực hơn trong học tập.',
                          },
                          {
                            name: 'Kỹ năng trình bày & tư duy',
                            description: 'Trình bày rõ ràng, biết giải thích lại bài.',
                            defaultComment: 'Cần rèn luyện thêm kỹ năng trình bày.',
                          },
                        ]
              
              return (
                          <div className="rounded-2xl border-2 border-primary-50 bg-white p-8 shadow-sm mt-4">
                            <div className="flex items-center justify-between mb-6">
                              <h4 className="text-2xl font-bold text-gray-900">Đánh giá chi tiết môn học</h4>
                              <button
                                onClick={() => handleSaveReviews(scheduleId, currentReviews)}
                                disabled={savingReviews === scheduleId}
                                className="px-6 py-3 rounded-xl text-base font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-md"
                              >
                                {savingReviews === scheduleId ? 'Đang lưu...' : 'Lưu đánh giá'}
                              </button>
                    </div>
                            <div className="space-y-6">
                              {evaluationCriteria.map((criterion, index) => {
                                const review = currentReviews[index] || { name: criterion.name, rating: 0, comment: '' }
                                // Đảm bảo name luôn đúng từ criterion
                                const normalizedReview = {
                                  ...review,
                                  name: criterion.name,
                                }
                                return (
                                  <div key={criterion.name} className="border-b-2 border-gray-200 pb-6 last:border-b-0">
                                    <div className="flex items-start gap-6">
                                      <div className="flex-1">
                                        <h5 className="text-lg font-bold text-gray-900 mb-2">{criterion.name}</h5>
                                        <p className="text-sm text-gray-600 mb-4">{criterion.description}</p>
                                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-3">
                                          <textarea
                                            value={normalizedReview.comment || ''}
                                            onChange={(e) => handleReviewChange(scheduleId, index, 'comment', e.target.value)}
                                            className="w-full bg-transparent border-none outline-none text-sm text-gray-700 resize-none"
                                            rows={3}
                                            placeholder={criterion.defaultComment}
                                          />
                      </div>
                    </div>
                                      <div className="flex-shrink-0 pt-1">
                                        <StarRating
                                          value={normalizedReview.rating || 0}
                                          onChange={(val) => handleReviewChange(scheduleId, index, 'rating', val)}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                  </div>
                </div>
              )
            })()}
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
    const selectedChecklist = selectedDetail ? checklistItemsByStudent[selectedDetail.id] || [] : []
    const totalChecklist = selectedChecklist.length
    const completedChecklist = selectedChecklist.filter((item) => item.status === 'done').length
    const checklistProgress = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0
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
          <h2 className="text-2xl font-bold text-gray-900">Hồ sơ học sinh</h2>
          <p className="text-sm text-gray-600">Danh sách học sinh được lấy trực tiếp từ lịch dạy của bạn</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[50%_50%] gap-6 h-full">
          {/* Left: Student List */}
          <div className="card h-full flex flex-col overflow-hidden max-h-[85vh]">
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-gray-200 pb-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Danh sách học sinh</p>
                <h3 className="text-lg font-semibold text-gray-900">Tổng quan lớp học · {students.length} học sinh</h3>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-1 text-xs text-gray-600 font-semibold">
                <div className="w-2 h-2 rounded-full bg-primary-500" /> Đang hoạt động
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
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value as typeof subjectFilter)}
                className="px-3 py-2 border border-gray-200 rounded-2xl text-sm text-gray-700 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              >
                <option value="all">Tất cả môn học</option>
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 mt-5">
              {paginatedStudents.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center text-sm text-gray-500">
                  Chưa có học sinh nào từ lịch dạy của bạn.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                <div className="flex items-center justify-between gap-3 flex-wrap mb-6 pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Thông tin chi tiết</p>
                    <h3 className="text-xl font-bold text-gray-900">{selectedDetail.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(selectedDetail.subjects || []).map((subject) => (
                        <span key={subject} className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
                      Tiến độ {checklistProgress}%
                    </span>
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                      {upcomingSchedules.length} buổi sắp tới
                    </span>
                  </div>
                </div>

                <StudentInfoDetails
                  student={selectedDetail}
                  detail={selectedDetailInfo}
                  checklistStats={{ completed: completedChecklist, total: totalChecklist }}
                  upcomingCount={upcomingSchedules.length}
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
  const subjectsData = useMemo(() => {
    const subjectsMap: Record<string, SubjectData> = {}

    students.forEach((student) => {
      if (!student) return
      const studentChecklistItems = checklistItemsByStudent[student.id] || []

      // Nhóm checklist items theo môn học
      const itemsBySubject = studentChecklistItems.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
        if (!acc[item.subject]) acc[item.subject] = []
        acc[item.subject].push(item)
        return acc
      }, {})

      // Thêm dữ liệu vào mỗi môn học
      Object.entries(itemsBySubject).forEach(([subject, items]) => {
        if (!subjectsMap[subject]) {
          subjectsMap[subject] = {
            subject,
            students: [],
          }
        }

        const detailItems = tutorDetailItemsByStudentAndSubject[student.id]?.[subject] || []
        const homeworkItems = homeworkItemsByStudentAndSubject[student.id]?.[subject] || []
        const evaluation = subjectEvaluations[student.id]?.[subject] || {
          concentration: 0,
          understanding: 0,
          taskCompletion: 0,
          attitude: 0,
          presentation: 0,
          generalComment: '',
        }

        subjectsMap[subject].students.push({
          studentId: student.id,
          checklistItems: items,
          detailItems,
          homeworkItems,
          evaluation,
        })
      })
    })

    return Object.values(subjectsMap)
  }, [students, checklistItemsByStudent, tutorDetailItemsByStudentAndSubject, homeworkItemsByStudentAndSubject, subjectEvaluations])

  const renderChecklistSection = () => {
    // Lọc subjectsData dựa trên bộ lọc
    const getFilteredSubjectsData = () => {
      let filtered = [...subjectsData]
      
      // Lọc theo học sinh
      if (checklistSelectedStudent !== 'all') {
        filtered = filtered.map(subjectData => ({
          ...subjectData,
          students: subjectData.students.filter(s => s.studentId === checklistSelectedStudent)
        })).filter(subjectData => subjectData.students.length > 0)
      }
      
      // Lọc theo tìm kiếm
      if (checklistSearchQuery.trim()) {
        const query = checklistSearchQuery.toLowerCase()
        filtered = filtered.map(subjectData => ({
          ...subjectData,
          students: subjectData.students.map(studentData => ({
            ...studentData,
            checklistItems: studentData.checklistItems.filter(item =>
              item.lesson.toLowerCase().includes(query) ||
              item.task.toLowerCase().includes(query) ||
              (item.note && item.note.toLowerCase().includes(query))
            )
          })).filter(studentData => studentData.checklistItems.length > 0)
        })).filter(subjectData => subjectData.students.length > 0)
      }
      
      return filtered
    }
    
    const filteredSubjectsData = getFilteredSubjectsData()
    
    // Lấy danh sách học sinh và khung giờ cho dropdown
    const allStudents = students
    const allTimeSlots = Array.from(new Set(scheduleSlots.map(slot => slot.time))).sort()
    
    return (
      <div className="h-full overflow-y-auto space-y-4">
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
        <div className="card-no-transition space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Checklist bài học</h2>
              <p className="text-sm text-gray-600">Lịch sử checklist</p>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => openChecklistForm()} className="btn-secondary flex items-center space-x-2 text-sm">
                <Plus className="w-4 h-4" />
                <span>Thêm bài mới</span>
              </button>
            </div>
          </div>

          {/* Bộ lọc */}
          <div className="mb-4 space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            {/* Tìm kiếm */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo bài học, nhiệm vụ, ghi chú..."
                value={checklistSearchQuery}
                onChange={(e) => setChecklistSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            
            {/* Các bộ lọc khác */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Mốc thời gian */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center space-x-1">
                  <Filter className="w-3 h-3" />
                  <span>Mốc thời gian</span>
                </label>
                <select
                  value={checklistDateRange}
                  onChange={(e) => setChecklistDateRange(e.target.value as 'all' | 'week' | 'month' | 'custom')}
                  className="px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="all">Tất cả</option>
                  <option value="week">7 ngày qua</option>
                  <option value="month">30 ngày qua</option>
                  <option value="custom">Tùy chọn</option>
                </select>
                {checklistDateRange === 'custom' && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="date"
                      value={checklistCustomStartDate}
                      onChange={(e) => setChecklistCustomStartDate(e.target.value)}
                      className="w-full px-2 py-1 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-xs"
                      placeholder="Từ ngày"
                    />
                    <input
                      type="date"
                      value={checklistCustomEndDate}
                      onChange={(e) => setChecklistCustomEndDate(e.target.value)}
                      className="w-full px-2 py-1 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-xs"
                      placeholder="Đến ngày"
                    />
                  </div>
                )}
              </div>
              
              {/* Chọn học sinh */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center space-x-1">
                  <UserCircle className="w-3 h-3" />
                  <span>Học sinh</span>
                </label>
                <select
                  value={checklistSelectedStudent}
                  onChange={(e) => setChecklistSelectedStudent(e.target.value)}
                  className="px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="all">Tất cả học sinh</option>
                  {allStudents.map(student => (
                    <option key={student.id} value={student.id}>{student.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Chọn khung giờ */}
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Khung giờ</span>
                </label>
                <select
                  value={checklistSelectedTimeSlot}
                  onChange={(e) => setChecklistSelectedTimeSlot(e.target.value)}
                  className="px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="all">Tất cả khung giờ</option>
                  {allTimeSlots.map(timeSlot => (
                    <option key={timeSlot} value={timeSlot}>{timeSlot}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

        <div className="space-y-4">
          {filteredSubjectsData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Không tìm thấy checklist nào phù hợp với bộ lọc.</p>
          ) : (
            filteredSubjectsData.map((subjectData) => {
            const { subject, students: subjectStudents } = subjectData
            const isExpanded = expandedSubjects[subject] ?? false
            
            // Tính tổng số checklist items và completed cho môn học
            const totalItems = subjectStudents.reduce((sum, s) => sum + s.checklistItems.length, 0)
            const completedItems = subjectStudents.reduce((sum, s) => 
              sum + s.checklistItems.filter(item => item.status === 'done').length, 0)
            
            // Lấy danh sách học sinh đã chọn cho môn học này (mặc định 1 học sinh đầu)
            const selectedStudentsForSubject = selectedSubjectStudents[subject] || (subjectStudents.length > 0 ? [subjectStudents[0].studentId] : [])

            return (
              <div
                key={subject}
                className={`border-2 rounded-2xl p-4 transition-all ${
                  isExpanded
                    ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-primary-300 hover:shadow-md bg-gradient-to-br from-white to-gray-50'
                }`}
              >
                <button
                  className="w-full flex items-center justify-between text-left"
                  onClick={() =>
                    setExpandedSubjects(prev => ({ ...prev, [subject]: !prev[subject] }))
                  }
                >
                  <div>
                    <p className="text-lg font-bold text-gray-900">{subject}</p>
                    <p className="text-xs text-gray-600">
                      {completedItems}/{totalItems} nhiệm vụ hoàn thành - {subjectStudents.length} học sinh
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 transition-transform ${
                      isExpanded ? 'rotate-90 text-primary-600' : 'text-gray-400'
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="mt-4 space-y-4">
                    {/* Subject Header */}
                    <div className="flex items-center space-x-2 mb-4">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                      <p className="text-sm font-bold text-gray-900">{subject} học</p>
                    </div>

                    {/* Chọn học sinh - Hiển thị 3 học sinh một khung với scroll */}
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Chọn học sinh:</h3>
                      <div className="border-2 border-gray-200 rounded-xl p-3 bg-white max-h-[280px] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {subjectStudents.map((studentData) => {
                            const student = students.find(s => s.id === studentData.studentId)
                if (!student) return null
                            const isSelected = selectedStudentsForSubject.includes(studentData.studentId)
                            const studentCompleted = studentData.checklistItems.filter(item => item.status === 'done').length
                            const studentTotal = studentData.checklistItems.length
                const studentProgress = studentTotal > 0 ? Math.round((studentCompleted / studentTotal) * 100) : 0
                
                return (
                  <button
                                key={studentData.studentId}
                                onClick={() => {
                                  setSelectedSubjectStudents(prev => {
                                    // Chỉ chọn 1 học sinh một lần - nếu click vào học sinh khác thì thay thế
                                    return {
                                      ...prev,
                                      [subject]: [studentData.studentId]
                                    }
                                  })
                                }}
                                className={`p-3 rounded-xl border-2 text-left transition-all ${
                                  isSelected
                                    ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                                    <p className={`font-bold text-sm ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                          {student.name}
                        </p>
                      </div>
                                  {isSelected && (
                        <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Tiến độ</span>
                        <span className="font-semibold">{studentProgress}%</span>
                      </div>
                                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
                          style={{ width: `${studentProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </button>
                )
              })}
                        </div>
            </div>
          </div>

                    {/* Hiển thị chi tiết cho từng học sinh đã chọn */}
                    {selectedStudentsForSubject.map((studentId) => {
                      const studentData = subjectStudents.find(s => s.studentId === studentId)
                      if (!studentData) return null
                      const student = students.find(s => s.id === studentId)
                      if (!student) return null
                      
                      const items = studentData.checklistItems
                      const detailItems = studentData.detailItems

            return (
                        <div key={studentId} className="bg-white rounded-xl border-2 border-gray-200 p-4 space-y-4">
                          {/* Student Header */}
                          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div>
                              <h4 className="text-base font-bold text-gray-900">{student.name}</h4>
                              <p className="text-xs text-gray-600">{subject}</p>
                  </div>
                            <button
                              onClick={() => openChecklistForm(studentId)}
                              className="btn-secondary flex items-center space-x-1 text-xs px-3 py-1.5"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Thêm bài</span>
                </button>
                    </div>

                    {/* Checklist Table */}
                          {items.length > 0 && (
                            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                                  <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Bài học</th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Nhiệm vụ</th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Trạng thái</th>
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Ghi chú</th>
                            </tr>
                          </thead>
                                  <tbody className="divide-y divide-gray-100 bg-white">
                            {items.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                  {editingField?.type === 'lesson' && editingField.itemId === item.id ? (
                                    <input
                                      type="text"
                                      value={item.lesson}
                                      onChange={(e) => handleLessonChange(item.id, e.target.value)}
                                      onBlur={() => setEditingField(null)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          setEditingField(null)
                                        }
                                      }}
                                      autoFocus
                                              className="text-xs font-semibold text-gray-900 w-full px-2 py-1 border-2 border-primary-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                      placeholder="Tên bài học"
                                    />
                                  ) : (
                                    <div
                                      onClick={() => setEditingField({ type: 'lesson', itemId: item.id })}
                                              className="text-xs font-semibold text-gray-900 px-2 py-1 rounded-lg cursor-pointer hover:bg-gray-100 min-h-[28px] flex items-center"
                                    >
                                      {item.lesson || <span className="text-gray-400">Tên bài học</span>}
                                    </div>
                                  )}
                                </td>
                                        <td className="px-4 py-2">
                                  {editingField?.type === 'task' && editingField.itemId === item.id ? (
                                    <input
                                      type="text"
                                      value={item.task}
                                      onChange={(e) => handleTaskChange(item.id, e.target.value)}
                                      onBlur={() => setEditingField(null)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          setEditingField(null)
                                        }
                                      }}
                                      autoFocus
                                              className="text-xs text-gray-600 w-full px-2 py-1 border-2 border-primary-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                      placeholder="Nhiệm vụ"
                                    />
                                  ) : (
                                    <div
                                      onClick={() => setEditingField({ type: 'task', itemId: item.id })}
                                              className="text-xs text-gray-600 px-2 py-1 rounded-lg cursor-pointer hover:bg-gray-100 min-h-[28px] flex items-center"
                                    >
                                      {item.task || <span className="text-gray-400">Nhiệm vụ</span>}
                                    </div>
                                  )}
                                </td>
                                        <td className="px-4 py-2">
                                  <select
                                    value={item.status}
                                    onChange={(e) =>
                                      handleStatusChange(item.id, e.target.value as ChecklistItem['status'])
                                    }
                                            className={`text-xs px-2 py-1 rounded-lg border-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all cursor-pointer ${
                                      item.status === 'done'
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : item.status === 'in_progress'
                                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                          : 'bg-gray-50 text-gray-600 border-gray-200'
                                    }`}
                                  >
                                    <option value="not_done">Chưa xong</option>
                                    <option value="in_progress">Đang làm</option>
                                    <option value="done">Đã xong</option>
                                  </select>
                                </td>
                                        <td className="px-4 py-2">
                                  {editingField?.type === 'note' && editingField.itemId === item.id ? (
                                    <input
                                      type="text"
                                      value={item.note || ''}
                                      onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                      onBlur={() => setEditingField(null)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          setEditingField(null)
                                        }
                                      }}
                                      autoFocus
                                              className="text-xs text-gray-600 w-full px-2 py-1 border-2 border-primary-500 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                      placeholder="—"
                                    />
                                  ) : (
                                    <div
                                      onClick={() => setEditingField({ type: 'note', itemId: item.id })}
                                              className="text-xs text-gray-600 px-2 py-1 rounded-lg cursor-pointer hover:bg-gray-100 min-h-[28px] flex items-center"
                                    >
                                      {item.note || <span className="text-gray-400">—</span>}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                          )}

                    {/* Upload Buttons */}
                          {items.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {items.map((item) => (
                        <button
                          key={`upload-${item.id}`}
                                  className="btn-primary flex items-center space-x-2 text-xs py-1.5 px-3"
                          onClick={() => handleFileUpload(item.id, new File([], 'upload'))}
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload {item.lesson}</span>
                        </button>
                      ))}
                    </div>
                          )}

                    <DetailTable
                      items={detailItems}
                      onChange={(id, field, value) => handleDetailChange(studentId, subject, id, field, value)}
                    />

                              {/* Giao bài tập về nhà */}
                              {renderHomeworkSection(studentId, subject)}

                              {/* Đánh giá môn học */}
                              {renderSubjectEvaluation(studentId, subject)}
                            </div>
                          )
                        })}
                  </div>
                )}
              </div>
            )
          }))}
        </div>

        {/* Tổng kết tiến độ cho tất cả môn học */}
        {(() => {
          const allItems = subjectsData.reduce((sum, subj) => 
            sum + subj.students.reduce((s, stu) => s + stu.checklistItems.length, 0), 0)
          const allCompleted = subjectsData.reduce((sum, subj) => 
            sum + subj.students.reduce((s, stu) => 
              s + stu.checklistItems.filter(item => item.status === 'done').length, 0), 0)
          const overallProgress = allItems > 0 ? Math.round((allCompleted / allItems) * 100) : 0
          
          return (
        <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border-2 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
                  <p className="text-sm text-gray-600 mb-1">Tổng kết tiến độ tất cả môn học</p>
              <p className="text-lg font-bold text-gray-900">
                    {allCompleted}/{allItems} bài đã hoàn thành
              </p>
            </div>
            <div className="text-right">
                  <div className="text-3xl font-extrabold gradient-text mb-1">{overallProgress}%</div>
              <div className="w-24 h-2 bg-white rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                      style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
          )
        })()}
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
        <div className="h-full overflow-hidden">
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
      </Layout>
    </TutorDashboardContext.Provider>
  )
}
