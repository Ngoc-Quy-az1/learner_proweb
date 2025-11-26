import { ReactNode, useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import TutorSidebar from '../components/TutorSidebar'
import { ChecklistItem } from '../components/ChecklistTable'
import MonthlyCalendar from '../components/MonthlyCalendar'
import { ScheduleItem } from '../components/ScheduleWidget'
import { Users, Calendar, FileText, Plus, Clock, TrendingUp, UserCircle, Download, Award, Copy, ChevronRight, Upload, BookOpen, ChevronUp, ChevronDown, Star, Phone, MapPin, MessageSquare, School, GraduationCap, Cake, Search, Filter, Trash2 } from 'lucide-react'
import { format, isToday, differenceInYears } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { apiCall } from '../config/api'

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
}

interface AssignmentApiItem {
  id: string
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

interface TutorChecklistDetail {
  id: string
  lesson: string
  estimatedTime: string
  actualTime: string
  result: 'completed' | 'in_progress' | 'not_done' | 'incorrect'
  solution: string
  note: string
  uploadedFile?: string
  assignmentFileName?: string // File bài tập
}

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

interface TutorChecklistExercise {
  id: string
  title: string
  requirement: string
  estimatedTime: string
  attachment?: File | null
}

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

const SCHEDULE_STUDENTS_PER_PAGE = 5

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
  if (!code) return fallback || 'Chung'
  const normalized = code.toUpperCase()
  return SUBJECT_LABELS[normalized] || fallback || code
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
  name: string
  email: string
  phone?: string
  avatarUrl?: string
  address?: string
  birthday?: string
  currentLevel?: string
  moreInfo?: string
  isEmailVerified?: boolean
  isActive?: boolean
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
}

export default function TutorDashboard() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState('home')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<string>('1')
  const [studentSearch, setStudentSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<'all' | string>('all')
  const [tutorSchedules, setTutorSchedules] = useState<TutorSchedule[]>([])
  const [schedulesLoading, setSchedulesLoading] = useState(true)
  const [studentInfoMap, setStudentInfoMap] = useState<Record<string, StudentInfo>>({})
  const [showChecklistForm, setShowChecklistForm] = useState(false)
  const [isSubmittingChecklist, setIsSubmittingChecklist] = useState(false)
  const [checklistForm, setChecklistForm] = useState({
    studentId: '1',
    lesson: '',
    tasks: '',
    note: '',
    dueDate: '',
    exercises: [
      {
        id: 'exercise-1',
        title: '',
        requirement: '',
        estimatedTime: '',
        attachment: null,
      } as TutorChecklistExercise,
    ],
  })
  const [copiedScheduleLink, setCopiedScheduleLink] = useState<string | null>(null)
  const [selectedScheduleSlotId, setSelectedScheduleSlotId] = useState<string | null>(null)
  const [scheduleStudentPage, setScheduleStudentPage] = useState<Record<string, number>>({})
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<{ type: 'lesson' | 'task' | 'note'; itemId: string } | null>(null)
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({})
  const [selectedSubjectStudents, setSelectedSubjectStudents] = useState<Record<string, string[]>>({}) // subject -> studentIds
  // State riêng cho home section (chỉ hiển thị hôm nay)
  const [expandedSubjectsHome, setExpandedSubjectsHome] = useState<Record<string, boolean>>({})
  const [selectedSubjectStudentsHome, setSelectedSubjectStudentsHome] = useState<Record<string, string[]>>({}) // subject -> studentIds
  const [selectedPreviousTimeSlot, setSelectedPreviousTimeSlot] = useState<string | null>(null)
  const [showTimeSlotDropdown, setShowTimeSlotDropdown] = useState(false)
  const [selectedPreviousStudent, setSelectedPreviousStudent] = useState<string | null>(null)
  const [expandedChecklistSubjects, setExpandedChecklistSubjects] = useState<Record<string, boolean>>({}) // subject -> expanded
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
      const subjects = Array.from(subjectsByStudent[studentId] || [])
      const checklistItems = checklistItemsByStudent[studentId] || []
      const completedItems = checklistItems.filter((item) => item.status === 'done').length
      const progress =
        checklistItems.length > 0 ? Math.round((completedItems / checklistItems.length) * 100) : undefined
      const birthday = info.birthday ? new Date(info.birthday) : null
      const hasValidBirthday = birthday && !isNaN(birthday.getTime())
      const age = hasValidBirthday ? differenceInYears(new Date(), birthday) : undefined

      return {
        id: studentId,
        name: info.name || 'Chưa có tên',
        email: info.email,
        phone: info.phone,
        avatarUrl: info.avatarUrl,
        address: info.address,
        subject: subjects[0],
        subjects,
        progress,
        parent: info.moreInfo || 'Chưa cập nhật',
        contact: info.phone || info.email || 'Chưa cập nhật',
        preferredChannel: info.moreInfo ? 'Ghi chú' : 'Chưa cập nhật',
        moreInfo: info.moreInfo,
        age,
        dateOfBirth: hasValidBirthday ? format(birthday as Date, 'dd/MM/yyyy') : undefined,
        school: info.currentLevel || 'Chưa cập nhật',
        grade: info.currentLevel || 'Chưa cập nhật',
      }
    })
  }, [studentInfoMap, tutorSchedules, checklistItemsByStudent])

  const scheduleInfoById = useMemo(() => {
    const map: Record<string, { studentId: string; subject: string }> = {}
    tutorSchedules.forEach((schedule) => {
      map[schedule.id] = { studentId: schedule.studentId, subject: schedule.subject }
    })
    return map
  }, [tutorSchedules])

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

      if (assignment.tasks && assignment.tasks.length > 0) {
        assignment.tasks.forEach((task, index) => {
          const itemId = task.id || `${assignment.id}-task-${index}`
          nextByStudent[studentId].push({
            id: itemId,
            subject,
            lesson: assignment.name || 'Bài học',
            task: task.name || assignment.description || 'Nhiệm vụ',
            status: mapAssignmentStatusToChecklist(task.status),
            note: task.description || assignment.description,
            attachment: task.assignmentUrl || task.solutionUrl,
          })
          nextMeta[itemId] = { assignmentId: assignment.id, taskId: task.id }
        })
      } else {
        const itemId = assignment.id
        nextByStudent[studentId].push({
          id: itemId,
          subject,
          lesson: assignment.name || 'Bài học',
          task: assignment.description || 'Nhiệm vụ',
          status: mapAssignmentStatusToChecklist(assignment.status),
          note: assignment.description,
        })
        nextMeta[itemId] = { assignmentId: assignment.id }
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
        
        // Fetch student info for each schedule
        const studentIds = new Set<string>()
        response.results.forEach((schedule) => {
          const studentId = typeof schedule.studentId === 'string' 
            ? schedule.studentId 
            : schedule.studentId.id
          studentIds.add(studentId)
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
        const newStudentInfoMap: Record<string, StudentInfo> = {}
        studentInfoResults.forEach((result) => {
          if (result) {
            newStudentInfoMap[result.studentId] = result.studentInfo
          }
        })
        setStudentInfoMap(newStudentInfoMap)
        
        // Map API response to TutorSchedule format
        const mappedSchedules: TutorSchedule[] = response.results.map((schedule) => {
          const studentId = typeof schedule.studentId === 'string' 
            ? schedule.studentId 
            : schedule.studentId.id
          const studentInfo = newStudentInfoMap[studentId]
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
            student: studentInfo?.name || 'Chưa có tên',
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
  const selectedStudentDetail = students.find(student => student.id === selectedStudent)

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
    const slotMap: Record<string, { id: string; time: string; meetLink?: string; subjects: Set<string>; schedules: TutorSchedule[] }> = {}
    todayTutorSchedules.forEach((schedule) => {
      const slotId = `${schedule.time}-${schedule.meetLink || schedule.subject}`
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
  }, [todayTutorSchedules])

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.time-slot-dropdown')) {
        setShowTimeSlotDropdown(false)
      }
    }
    if (showTimeSlotDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTimeSlotDropdown])

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

  useEffect(() => {
    if (!selectedScheduleSlot) return
    setScheduleStudentPage((prev) => {
      const totalPages = Math.max(
        1,
        Math.ceil(selectedScheduleSlot.schedules.length / SCHEDULE_STUDENTS_PER_PAGE)
      )
      const current = prev[selectedScheduleSlot.id] || 1
      const next = Math.min(current, totalPages)
      if (current === next) return prev
      return { ...prev, [selectedScheduleSlot.id]: next }
    })
  }, [selectedScheduleSlot])

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

  // Render component giao bài tập về nhà
  const renderHomeworkSection = (studentId: string, subject: string) => {
    const homeworkItems = homeworkItemsByStudentAndSubject[studentId]?.[subject] || []

    return (
      <div className="mt-4 bg-white rounded-xl border-2 border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">Giao bài tập về nhà</h3>
          <button
            onClick={() => handleAddHomework(studentId, subject)}
            className="btn-primary flex items-center space-x-1 text-xs px-3 py-1.5"
          >
            <Plus className="w-3 h-3" />
            <span>Thêm bài tập</span>
          </button>
        </div>

        {homeworkItems.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Chưa có bài tập về nhà</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1400px] w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-semibold min-w-[200px]">Bài tập</th>
                  <th className="px-4 py-2 font-semibold min-w-[180px] whitespace-nowrap">Deadline</th>
                  <th className="px-4 py-2 font-semibold min-w-[200px]">File lời giải học sinh</th>
                  <th className="px-4 py-2 font-semibold min-w-[200px]">Lời giải của tutor</th>
                  <th className="px-4 py-2 font-semibold min-w-[120px]">Mức độ</th>
                  <th className="px-4 py-2 font-semibold min-w-[130px]">Kết quả</th>
                  <th className="px-4 py-2 font-semibold min-w-[180px]">Nhận xét</th>
                  <th className="px-4 py-2 font-semibold min-w-[80px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {homeworkItems.map((homework) => (
                  <tr key={homework.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 min-w-[200px]">
                      <input
                        type="text"
                        value={homework.task}
                        onChange={(e) => handleHomeworkChange(studentId, subject, homework.id, 'task', e.target.value)}
                        className="font-semibold text-gray-900 w-full min-w-[180px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
                        placeholder="Nhập tên bài tập"
                      />
                    </td>
                    <td className="px-4 py-3 min-w-[180px] whitespace-nowrap">
                      <input
                        type="datetime-local"
                        value={homework.deadline || ''}
                        onChange={(e) => handleHomeworkChange(studentId, subject, homework.id, 'deadline', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm text-gray-700"
                      />
                    </td>
                    <td className="px-4 py-3 min-w-[200px]">
                      {homework.studentSolutionFile ? (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary-600 flex-shrink-0" />
                          <span className="text-xs text-gray-700 break-all whitespace-normal flex-1">{homework.studentSolutionFile}</span>
                          <Download className="w-4 h-4 text-gray-500 hover:text-primary-600 cursor-pointer flex-shrink-0" />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Chưa có file</span>
                      )}
                    </td>
                    <td className="px-4 py-3 min-w-[200px]">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={homework.tutorSolution || ''}
                          onChange={(e) => handleHomeworkChange(studentId, subject, homework.id, 'tutorSolution', e.target.value)}
                          className="text-sm text-gray-700 w-full min-w-[180px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                          placeholder="Nhập tên file hoặc text"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const input = document.createElement('input')
                              input.type = 'file'
                              input.accept = '.pdf,.doc,.docx,.txt'
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0]
                                if (file) {
                                  handleHomeworkChange(studentId, subject, homework.id, 'tutorSolution', file.name)
                                }
                              }
                              input.click()
                            }}
                            className="text-xs px-3 py-1.5 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 whitespace-nowrap flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload file</span>
                          </button>
                          {homework.tutorSolution && (
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <Download className="w-4 h-4 text-gray-500 hover:text-primary-600 cursor-pointer flex-shrink-0" />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 min-w-[120px]">
                      <select
                        value={homework.difficulty}
                        onChange={(e) => handleHomeworkChange(studentId, subject, homework.id, 'difficulty', e.target.value as 'easy' | 'medium' | 'hard')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 cursor-pointer w-full ${
                          homework.difficulty === 'easy'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : homework.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                              : 'bg-red-100 text-red-700 border-red-300'
                        } focus:ring-2 focus:ring-primary-500`}
                      >
                        <option value="easy">Dễ</option>
                        <option value="medium">Trung bình</option>
                        <option value="hard">Khó</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 min-w-[130px]">
                      <select
                        value={homework.result}
                        onChange={(e) => handleHomeworkChange(studentId, subject, homework.id, 'result', e.target.value as 'completed' | 'in_progress' | 'not_done' | 'incorrect')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 cursor-pointer w-full ${
                          homework.result === 'completed'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : homework.result === 'incorrect'
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                              : homework.result === 'in_progress'
                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                : 'bg-red-100 text-red-600 border-red-300'
                        } focus:ring-2 focus:ring-primary-500`}
                      >
                        <option value="completed">Hoàn thành</option>
                        <option value="incorrect">Chưa chính xác</option>
                        <option value="in_progress">Đang làm</option>
                        <option value="not_done">Chưa xong</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 min-w-[180px]">
                      <input
                        type="text"
                        value={homework.note}
                        onChange={(e) => handleHomeworkChange(studentId, subject, homework.id, 'note', e.target.value)}
                        className="text-sm text-gray-700 w-full min-w-[160px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                        placeholder="Nhập nhận xét"
                      />
                    </td>
                    <td className="px-4 py-3 min-w-[80px]">
                      <button
                        onClick={() => handleDeleteHomework(studentId, subject, homework.id)}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // Render component đánh giá môn học
  const renderSubjectEvaluation = (studentId: string, subject: string) => {
    const evaluation = subjectEvaluations[studentId]?.[subject] || {
      concentration: 0,
      understanding: 0,
      taskCompletion: 0,
      attitude: 0,
      presentation: 0,
      generalComment: ''
    }

    const evaluationCriteria = [
      {
        key: 'concentration' as const,
        title: 'Mức độ tập trung',
        description: 'Học sinh có duy trì sự chú ý suốt buổi học.',
        feedback: evaluation.concentration < 3 ? 'Cần tập trung hơn trong giờ học.' : evaluation.concentration < 4 ? 'Tập trung tốt, đôi khi mất tập trung.' : 'Tập trung rất tốt trong suốt buổi học.'
      },
      {
        key: 'understanding' as const,
        title: 'Hiểu nội dung bài học',
        description: 'Hiểu khái niệm, nắm được cách làm bài.',
        feedback: evaluation.understanding < 3 ? 'Cần củng cố lại kiến thức cơ bản.' : evaluation.understanding < 4 ? 'Hiểu phần cơ bản, cần thực hành thêm.' : 'Hiểu rõ và vận dụng tốt kiến thức.'
      },
      {
        key: 'taskCompletion' as const,
        title: 'Hoàn thành nhiệm vụ',
        description: 'Làm đủ, đúng thời gian và yêu cầu.',
        feedback: evaluation.taskCompletion < 3 ? 'Cần hoàn thành đầy đủ bài tập.' : evaluation.taskCompletion < 4 ? 'Hoàn thành phần lớn bài tập.' : 'Hoàn thành xuất sắc mọi nhiệm vụ.'
      },
      {
        key: 'attitude' as const,
        title: 'Thái độ & tinh thần học',
        description: 'Chủ động hỏi, hợp tác, tôn trọng giờ học.',
        feedback: evaluation.attitude < 3 ? 'Cần tích cực hơn trong học tập.' : evaluation.attitude < 4 ? 'Thái độ tích cực, cần chủ động hơn.' : 'Thái độ rất tích cực và chủ động.'
      },
      {
        key: 'presentation' as const,
        title: 'Kỹ năng trình bày & tư duy',
        description: 'Trình bày rõ ràng, biết giải thích lại bài.',
        feedback: evaluation.presentation < 3 ? 'Cần rèn luyện thêm kỹ năng trình bày.' : evaluation.presentation < 4 ? 'Trình bày tốt, cần cải thiện phần giải thích.' : 'Trình bày rõ ràng và logic.'
      }
    ]

    const StarRating = ({ value, onChange }: { value: number; onChange: (val: number) => void }) => (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                star <= value
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 fill-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
      </div>
    )

    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">{subject === 'general' ? 'Đánh giá chi tiết' : 'Đánh giá chi tiết môn học'}</h3>
        {evaluationCriteria.map((criterion) => (
          <div key={criterion.key} className="border-b border-gray-100 pb-4 last:border-b-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">{criterion.title}</h4>
                <p className="text-xs text-gray-600 mb-2">{criterion.description}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-2">
                  <p className="text-xs text-gray-700">{criterion.feedback}</p>
                </div>
              </div>
              <div className="ml-4">
                <StarRating
                  value={evaluation[criterion.key]}
                  onChange={(val) => handleEvaluationChange(studentId, subject, criterion.key, val)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const openChecklistForm = (studentId?: string) => {
    const defaultStudentId = studentId || todayStudentsForHome[0]?.id || students[0]?.id || '1'
    setChecklistForm({
      studentId: defaultStudentId,
      lesson: '',
      tasks: '',
      note: '',
      dueDate: '',
      exercises: [
        { id: `exercise-${Date.now()}`, title: '', requirement: '', estimatedTime: '', attachment: null },
      ],
    })
    setShowChecklistForm(true)
  }

  const handleChecklistExerciseChange = (index: number, field: keyof TutorChecklistExercise, value: string | File | null) => {
    setChecklistForm((prev) => {
      const nextExercises = [...prev.exercises]
      nextExercises[index] = { ...nextExercises[index], [field]: value }
      return { ...prev, exercises: nextExercises }
    })
  }

  const adjustEstimatedTime = (index: number, delta: number) => {
    setChecklistForm((prev) => {
      const nextExercises = [...prev.exercises]
      const currentValue = parseInt(nextExercises[index]?.estimatedTime?.toString() || '0', 10) || 0
      const updatedValue = Math.max(0, currentValue + delta)
      nextExercises[index] = {
        ...nextExercises[index],
        estimatedTime: updatedValue === 0 ? '' : `${updatedValue}`,
      }
      return { ...prev, exercises: nextExercises }
    })
  }

  const addChecklistExercise = () => {
    setChecklistForm((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        { id: `exercise-${Date.now()}`, title: '', requirement: '', estimatedTime: '', attachment: null },
      ],
    }))
  }

  const removeChecklistExercise = (index: number) => {
    setChecklistForm((prev) => {
      if (prev.exercises.length === 1) return prev
      const nextExercises = prev.exercises.filter((_, idx) => idx !== index)
      return { ...prev, exercises: nextExercises }
    })
  }

  const handleChecklistFormSubmit = async () => {
    if (!checklistForm.studentId) {
      setAssignmentsError('Vui lòng chọn học sinh để tạo checklist.')
      return
    }

    const relatedSchedule =
      tutorSchedules.find((schedule) => schedule.studentId === checklistForm.studentId) ||
      tutorSchedules[0]

    if (!relatedSchedule) {
      setAssignmentsError('Không tìm thấy buổi học phù hợp để gắn checklist.')
      return
    }

    const tasksPayload =
      checklistForm.exercises.map((exercise, index) => ({
        name: exercise.title || `Bài ${index + 1}`,
        description: exercise.requirement || checklistForm.tasks || undefined,
        estimatedTime: exercise.estimatedTime ? Number(exercise.estimatedTime) : undefined,
        status: 'pending' as AssignmentTaskStatus,
      })) || []

    const payload = {
      scheduleId: relatedSchedule.id,
      subject: checklistForm.lesson || relatedSchedule.subject,
      name: checklistForm.tasks || 'Checklist mới',
      description: checklistForm.tasks || undefined,
      status: 'pending',
      tasks: tasksPayload,
    }

    try {
      setIsSubmittingChecklist(true)
      await apiCall('/assignments', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setShowChecklistForm(false)
      setAssignmentFetchTrigger((prev) => prev + 1)
    } catch (error) {
      console.error('Failed to create checklist:', error)
      setAssignmentsError('Không thể tạo checklist mới. Vui lòng thử lại.')
    } finally {
      setIsSubmittingChecklist(false)
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
      <div className="h-full overflow-y-auto space-y-4">
        {/* Main Layout - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Profile & Resources */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-1 self-start">
            {/* Profile Card */}
            <div className="card-no-transition">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">XIN CHÀO</h2>
                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <UserCircle className="w-16 h-16 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Tutor B</h3>
                <p className="text-sm text-gray-600">tutor@skillar.com</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center border border-blue-200">
                  <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600 mb-1">Học sinh</p>
                  <p className="text-xl font-bold text-gray-900">{students.length}</p>
                </div>
                {(() => {
                  const homeChecklistItems = checklistItemsByStudent[selectedStudent] || []
                  const homeCompleted = homeChecklistItems.filter(item => item.status === 'done').length
                  const homeTotal = homeChecklistItems.length
                  const homeProgress = homeTotal > 0 ? Math.round((homeCompleted / homeTotal) * 100) : 0
                  
                  return (
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center border border-blue-200">
                      <TrendingUp className="w-6 h-6 text-primary-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-600 mb-1">Tiến độ</p>
                      <p className="text-xl font-bold text-gray-900">{homeProgress}%</p>
                    </div>
                  )
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-xl border border-gray-100 bg-white/60 p-3 text-left shadow-sm">
                  <p className="text-xs text-gray-500 mb-1 font-semibold">Buổi hôm nay</p>
                  <p className="text-2xl font-extrabold text-gray-900">{todayTutorSchedules.length}</p>
                  <p className="text-[11px] text-gray-500 mt-1">Tổng {tutorSchedules.length} buổi được lên lịch</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white/60 p-3 text-left shadow-sm">
                  <p className="text-xs text-gray-500 mb-1 font-semibold">Nhiệm vụ đang mở</p>
                  <p className="text-2xl font-extrabold text-gray-900">{pendingChecklistCount}</p>
                  <p className="text-[11px] text-gray-500 mt-1">Checklist chưa hoàn thành</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-blue-50 p-3">
                  <p className="text-xs text-gray-500 mb-1 font-semibold">Tiến độ trung bình</p>
                  <p className="text-2xl font-extrabold text-primary-600">{averageStudentProgress}%</p>
                  <p className="text-[11px] text-gray-500 mt-1">Trên toàn bộ học sinh</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-white to-blue-50 p-3">
                  <p className="text-xs text-gray-500 mb-1 font-semibold">Môn đang dạy</p>
                  <p className="text-2xl font-extrabold text-primary-600">{uniqueSubjectsCount}</p>
                  <p className="text-[11px] text-gray-500 mt-1">Theo lịch hiện tại</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-primary-200 rounded-2xl p-4 bg-gradient-to-br from-primary-50 to-blue-50 text-left">
                <p className="text-xs font-semibold text-primary-600 mb-2">Buổi dạy sắp tới</p>
                {upcomingSchedule ? (
                  <>
                    <p className="text-base font-bold text-gray-900">{upcomingSchedule.student}</p>
                    <p className="text-sm text-gray-600 mb-2">{upcomingSchedule.subject}</p>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{format(upcomingSchedule.date, 'dd/MM/yyyy')}</span>
                      <span className="font-semibold">{upcomingSchedule.time}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">Không có buổi nào sắp tới</p>
                )}
              </div>
            </div>

           

          </div>

        {/* Right Column - Main Actions */}
        <div className="lg:col-span-2 space-y-4 h-full overflow-y-auto">
          {/* Combined Schedule + Students + Documents Box */}
          <div className="card-no-transition">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Lịch dạy hôm nay</h2>
                  <p className="text-sm text-gray-500">Chọn khung giờ để xem học sinh cùng lớp meet</p>
                </div>
              </div>
              <button className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center space-x-1">
                <span>Xem toàn bộ lịch</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {schedulesLoading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-3"></div>
                <p className="text-gray-500 font-medium">Đang tải lịch học...</p>
              </div>
            ) : scheduleSlots.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Không có lịch dạy hôm nay</p>
              </div>
            ) : (
              <>
                {/* Time slots */}
                <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
                  {scheduleSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => {
                        setSelectedScheduleSlotId(slot.id)
                        setExpandedStudentId(null) // Reset expanded student when changing slot
                      }}
                      className={`min-w-[180px] border-2 rounded-2xl px-4 py-3 text-left ${
                        selectedScheduleSlotId === slot.id
                          ? 'border-primary-500 bg-primary-50 shadow-lg text-primary-700'
                          : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-sm font-bold">{slot.time}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {slot.subjects.length > 0 ? slot.subjects.join(', ') : 'Khác'}
                      </p>
                      <p className="text-xs text-gray-600 mt-2 font-semibold">{slot.schedules.length} học sinh</p>
                    </button>
                  ))}
                </div>

                {/* Students list for selected slot */}
                {selectedScheduleSlot && (
                  <div className="mt-6 max-h-[450px] overflow-y-auto space-y-3">
                    {(() => {
                      const totalSlotPages = Math.max(
                        1,
                        Math.ceil(selectedScheduleSlot.schedules.length / SCHEDULE_STUDENTS_PER_PAGE)
                      )
                      const currentSlotPage = Math.min(
                        scheduleStudentPage[selectedScheduleSlot.id] || 1,
                        totalSlotPages
                      )
                      const startIndex = (currentSlotPage - 1) * SCHEDULE_STUDENTS_PER_PAGE
                      const paginatedSchedules = selectedScheduleSlot.schedules.slice(
                        startIndex,
                        startIndex + SCHEDULE_STUDENTS_PER_PAGE
                      )

                      const handleScheduleSlotPageChange = (newPage: number) => {
                        setScheduleStudentPage((prev) => ({
                          ...prev,
                          [selectedScheduleSlot.id]: Math.max(1, Math.min(totalSlotPages, newPage)),
                        }))
                      }

                      return (
                        <>
                          {paginatedSchedules.map((schedule) => {
                      const status = getScheduleStatus(schedule)
                      const statusConfig = {
                        in_progress: { label: 'Đang dạy', className: 'bg-green-100 text-green-700' },
                        upcoming: { label: 'Sắp dạy', className: 'bg-yellow-100 text-yellow-700' },
                        completed: { label: 'Đã xong', className: 'bg-gray-100 text-gray-600' },
                      }[status]
                      const isExpanded = expandedStudentId === schedule.studentId
                      const scheduleMaterialsList = schedule.materials || []

                      return (
                        <div
                          key={schedule.id}
                          className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50"
                        >
                          {/* Student card header */}
                          <div className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{schedule.student}</p>
                                    <p className="text-xs text-gray-500">{schedule.subject}</p>
                                  </div>
                                  {statusConfig && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.className}`}>
                                      {statusConfig.label}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Meet link for this student */}
                                {schedule.meetLink && (
                                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                                    <div className="flex-1 flex items-center border-2 border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
                                      <input
                                        type="text"
                                        value={schedule.meetLink}
                                        readOnly
                                        className="flex-1 bg-transparent text-xs text-gray-700 outline-none"
                                      />
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          navigator.clipboard.writeText(schedule.meetLink || '')
                                          setCopiedScheduleLink(schedule.id)
                                          setTimeout(() => setCopiedScheduleLink(null), 2000)
                                        }}
                                        className="text-gray-500 hover:text-primary-600 transition-colors ml-2"
                                        title="Copy link"
                                      >
                                        {copiedScheduleLink === schedule.id ? (
                                          <Clock className="w-4 h-4 text-green-500" />
                                        ) : (
                                          <Copy className="w-4 h-4" />
                                        )}
                                      </button>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleJoinSchedule(schedule.id)
                                      }}
                                      className="btn-primary text-xs px-4 py-2 whitespace-nowrap"
                                    >
                                      Vào lớp
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Expand button to show documents */}
                            {scheduleMaterialsList.length > 0 && (
                              <button
                                onClick={() => setExpandedStudentId(isExpanded ? null : schedule.studentId)}
                                className="mt-3 w-full flex items-center justify-between text-left text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                              >
                                <span>Tài liệu phụ huynh đã gửi ({scheduleMaterialsList.length})</span>
                                <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </button>
                            )}
                          </div>

                          {/* Expanded documents section */}
                          {isExpanded && scheduleMaterialsList.length > 0 && (
                            <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-2">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Tài liệu phụ huynh đã gửi</p>
                              {scheduleMaterialsList.map((file) => (
                                <div key={file.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-3 bg-white rounded-xl border border-gray-200 gap-3">
                                  <div className="text-sm text-gray-700">
                                    <p className="font-semibold text-gray-900 break-all">{file.name}</p>
                                    {file.note && <p className="text-xs text-gray-500 mt-0.5">Ghi chú: {file.note}</p>}
                                    {file.uploadedAt && (
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        Gửi: {format(new Date(file.uploadedAt), 'dd/MM/yyyy HH:mm')}
                                      </p>
                                    )}
                                  </div>
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                                  >
                                    Xem tài liệu
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                          })}

                          {selectedScheduleSlot.schedules.length > SCHEDULE_STUDENTS_PER_PAGE && (
                            <div className="sticky bottom-0 bg-white py-3 border-t border-gray-200 flex items-center justify-between">
                              <button
                                onClick={() => handleScheduleSlotPageChange(currentSlotPage - 1)}
                                disabled={currentSlotPage === 1}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronRight className="w-4 h-4 rotate-180" />
                                Trước
                              </button>
                              <div className="text-xs font-semibold text-gray-700">
                                Trang {currentSlotPage}/{totalSlotPages}
                              </div>
                              <button
                                onClick={() => handleScheduleSlotPageChange(currentSlotPage + 1)}
                                disabled={currentSlotPage === totalSlotPages}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                Sau
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick Actions - Large Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="card-no-transition border-2 border-gray-200 hover:border-primary-400 hover:shadow-xl cursor-pointer group"
              onClick={() => setActiveSection('students')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveSection('students')
                }
              }}
            >
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Quản lý học sinh</h3>
                <p className="text-sm text-gray-600">Xem và quản lý danh sách học sinh</p>
              </div>
            </div>

            <div
              className="card-no-transition border-2 border-gray-200 hover:border-primary-400 hover:shadow-xl cursor-pointer group"
              onClick={() => openChecklistForm()}
            >
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Plus className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Tạo checklist mới</h3>
                <p className="text-sm text-gray-600">Thêm bài học và nhiệm vụ mới</p>
              </div>
            </div>
          </div>

          {/* Khung giờ học trước - Checklist Section */}
          <div className="card-no-transition">
            <div className="mb-6 pb-4 border-b-2 border-primary-200">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Khung giờ học trước</h2>
              <p className="text-sm text-gray-600">Quản lý checklist bài học cho các buổi học trước</p>
            </div>
            
            {/* Khung chọn khung giờ học */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn khung giờ học:</label>
              <div className="relative time-slot-dropdown">
                <button
                  onClick={() => setShowTimeSlotDropdown(!showTimeSlotDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-200 rounded-xl bg-white hover:border-primary-300 hover:bg-gray-50 transition-all text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-primary-600" />
                    <span className="text-base font-semibold text-gray-900">
                      {selectedPreviousTimeSlot || 'Chọn khung giờ học'}
                    </span>
                  </div>
                  {showTimeSlotDropdown ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                
                {showTimeSlotDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {scheduleSlots.length > 0 ? (
                      scheduleSlots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => {
                            setSelectedPreviousTimeSlot(slot.time)
                            setShowTimeSlotDropdown(false)
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                            selectedPreviousTimeSlot === slot.time
                              ? 'bg-primary-50 border-l-4 border-l-primary-500'
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{slot.time}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                {slot.subjects.join(', ')} · {slot.schedules.length} học sinh
                              </p>
                            </div>
                            {selectedPreviousTimeSlot === slot.time && (
                              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        Không có khung giờ học nào
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {selectedPreviousTimeSlot && (
              <div className="space-y-4">
                {/* Chọn học sinh */}
                {!selectedPreviousStudent && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn học sinh:</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(() => {
                        const selectedSlot = scheduleSlots.find(slot => slot.time === selectedPreviousTimeSlot)
                        if (!selectedSlot) return null
                        return selectedSlot.schedules.map((schedule) => {
                          const student = students.find(s => s.id === schedule.studentId)
                          if (!student) return null
                          return (
                            <button
                              key={schedule.studentId}
                              onClick={() => setSelectedPreviousStudent(schedule.studentId)}
                              className="p-4 border-2 border-gray-200 rounded-xl bg-white hover:border-primary-300 hover:bg-gray-50 transition-all text-left"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-bold text-sm text-gray-900">{student.name}</p>
                                <UserCircle className="w-5 h-5 text-primary-600" />
                              </div>
                              <p className="text-xs text-gray-600">{schedule.subject}</p>
                            </button>
                          )
                        })
                      })()}
                    </div>
                  </div>
                )}

                {/* Hiển thị 3 phần khi đã chọn học sinh */}
                {selectedPreviousStudent && (() => {
                  const selectedSlot = scheduleSlots.find(slot => slot.time === selectedPreviousTimeSlot)
                  if (!selectedSlot) return null
                  const studentSchedules = selectedSlot.schedules.filter(s => s.studentId === selectedPreviousStudent)
                  const student = students.find(s => s.id === selectedPreviousStudent)
                  if (!student) return null

                  return (
                    <div className="space-y-6">
                      {/* Header với nút quay lại */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <button
                            onClick={() => setSelectedPreviousStudent(null)}
                            className="text-sm text-primary-600 hover:text-primary-700 mb-2 flex items-center space-x-1"
                          >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                            <span>Chọn lại học sinh</span>
                          </button>
                          <h3 className="text-lg font-bold text-gray-900">{student.name}</h3>
                          <p className="text-sm text-gray-600">Khung giờ: {selectedPreviousTimeSlot}</p>
                        </div>
                        <button onClick={() => openChecklistForm(selectedPreviousStudent)} className="btn-secondary flex items-center space-x-2 text-sm">
                          <Plus className="w-4 h-4" />
                          <span>Thêm bài mới</span>
                        </button>
                      </div>

                      {/* PHẦN 1: CHECKLIST - Theo từng môn */}
                      <div className="space-y-6">
                        <h4 className="text-xl font-bold text-gray-900 mb-4">Checklist</h4>
                        {studentSchedules.map((schedule) => {
                          const subject = schedule.subject
                          const studentData = subjectsDataToday
                            .find(sd => sd.subject === subject)
                            ?.students.find(s => s.studentId === selectedPreviousStudent)
                          if (!studentData) return null

                          const items = studentData.checklistItems
                          const detailItems = studentData.detailItems
                          const isExpanded = expandedChecklistSubjects[subject] ?? true

                          return (
                            <div key={subject} className="bg-white rounded-xl border-2 border-gray-200 p-6 space-y-6">
                              {/* Subject Header với nút thu gọn/mở rộng */}
                              <button
                                onClick={() => setExpandedChecklistSubjects(prev => ({ ...prev, [subject]: !prev[subject] }))}
                                className="w-full flex items-center justify-between pb-4 border-b border-gray-200"
                              >
                                <div className="flex items-center space-x-2">
                                  <BookOpen className="w-5 h-5 text-primary-600" />
                                  <h5 className="text-lg font-bold text-gray-900">{subject}</h5>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-gray-500" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-500" />
                                )}
                              </button>

                              {/* Checklist Table */}
                              {isExpanded && items.length > 0 ? (
                                <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                      <thead className="bg-gray-100 border-b border-gray-200">
                                        <tr>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Bài học</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Nhiệm vụ</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Trạng thái</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Ghi chú</th>
                                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Thao tác</th>
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
                                            <td className="px-4 py-2">
                                              <button
                                                onClick={() => handleDeleteChecklistItem(item.id)}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                                Xóa
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ) : isExpanded ? (
                                <p className="text-sm text-gray-500 italic">Chưa có checklist cho môn này.</p>
                              ) : null}

                              {/* Chi tiết bài tập */}
                              {isExpanded && detailItems.length > 0 && (
                                <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
                                    <p className="text-sm font-semibold text-gray-900">Chi tiết bài tập</p>
                                    <div className="flex items-center space-x-2">
                                      <button className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                                        Upload bài làm
                                      </button>
                                      <button className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                                        Thêm bài tập
                                      </button>
                                    </div>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-[1000px] w-full text-sm text-left">
                                      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                        <tr>
                                          <th className="px-4 py-2 font-semibold min-w-[200px]">Bài tập</th>
                                          <th className="px-4 py-2 font-semibold min-w-[150px] whitespace-nowrap">Thời gian (ước/thực)</th>
                                          <th className="px-4 py-2 font-semibold min-w-[200px]">File bài tập</th>
                                          <th className="px-4 py-2 font-semibold min-w-[250px]">Upload bài làm</th>
                                          <th className="px-4 py-2 font-semibold min-w-[250px]">Lời giải</th>
                                          <th className="px-4 py-2 font-semibold min-w-[150px]">Kết quả</th>
                                          <th className="px-4 py-2 font-semibold min-w-[200px]">Nhận xét</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100 bg-white">
                                        {detailItems.map((detail) => (
                                          <tr key={detail.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 min-w-[200px]">
                                              <input
                                                type="text"
                                                value={detail.lesson}
                                                onChange={(e) => handleDetailChange(selectedPreviousStudent, subject, detail.id, 'lesson', e.target.value)}
                                                className="font-semibold text-gray-900 w-full min-w-[180px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                                placeholder="Nhập tên bài tập"
                                              />
                                            </td>
                                            <td className="px-4 py-3 min-w-[150px] whitespace-nowrap">
                                              <div className="flex items-center gap-1.5">
                                                {/* Ước tính */}
                                                <div className="flex flex-col items-center border border-gray-300 rounded bg-white">
                                                  <button
                                                    onClick={() => {
                                                      const current = parseInt(detail.estimatedTime.replace(/\D/g, '')) || 0
                                                      const newValue = current + 1
                                                      handleDetailChange(selectedPreviousStudent, subject, detail.id, 'estimatedTime', `${newValue} phút`)
                                                    }}
                                                    className="w-full px-1.5 py-0.5 hover:bg-gray-100 rounded-t border-b border-gray-200 transition-colors"
                                                  >
                                                    <ChevronUp className="w-3 h-3 text-gray-600 mx-auto" />
                                                  </button>
                                                  <div className="px-2 py-0.5 bg-white w-full text-center border-y border-gray-200 min-w-[24px]">
                                                    <span className="text-xs font-semibold text-gray-900">
                                                      {parseInt(detail.estimatedTime.replace(/\D/g, '')) || 0}
                                                    </span>
                                                  </div>
                                                  <button
                                                    onClick={() => {
                                                      const current = parseInt(detail.estimatedTime.replace(/\D/g, '')) || 0
                                                      const newValue = Math.max(0, current - 1)
                                                      handleDetailChange(selectedPreviousStudent, subject, detail.id, 'estimatedTime', `${newValue} phút`)
                                                    }}
                                                    className="w-full px-1.5 py-0.5 hover:bg-gray-100 rounded-b border-t border-gray-200 transition-colors"
                                                  >
                                                    <ChevronDown className="w-3 h-3 text-gray-600 mx-auto" />
                                                  </button>
                                                </div>
                                                <span className="text-xs text-gray-400 font-medium">/</span>
                                                {/* Thực tế */}
                                                <div className="flex flex-col items-center border border-gray-300 rounded bg-white">
                                                  <button
                                                    onClick={() => {
                                                      const current = parseInt(detail.actualTime.replace(/\D/g, '')) || 0
                                                      const newValue = current + 1
                                                      handleDetailChange(selectedPreviousStudent, subject, detail.id, 'actualTime', `${newValue} phút`)
                                                    }}
                                                    className="w-full px-1.5 py-0.5 hover:bg-gray-100 rounded-t border-b border-gray-200 transition-colors"
                                                  >
                                                    <ChevronUp className="w-3 h-3 text-gray-600 mx-auto" />
                                                  </button>
                                                  <div className="px-2 py-0.5 bg-white w-full text-center border-y border-gray-200 min-w-[24px]">
                                                    <span className="text-xs font-semibold text-gray-900">
                                                      {parseInt(detail.actualTime.replace(/\D/g, '')) || 0}
                                                    </span>
                                                  </div>
                                                  <button
                                                    onClick={() => {
                                                      const current = parseInt(detail.actualTime.replace(/\D/g, '')) || 0
                                                      const newValue = Math.max(0, current - 1)
                                                      handleDetailChange(selectedPreviousStudent, subject, detail.id, 'actualTime', `${newValue} phút`)
                                                    }}
                                                    className="w-full px-1.5 py-0.5 hover:bg-gray-100 rounded-b border-t border-gray-200 transition-colors"
                                                  >
                                                    <ChevronDown className="w-3 h-3 text-gray-600 mx-auto" />
                                                  </button>
                                                </div>
                                                <span className="text-xs text-gray-500 font-medium ml-0.5">phút</span>
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 min-w-[200px]">
                                              {detail.assignmentFileName ? (
                                                <div className="flex items-center gap-2 text-blue-600">
                                                  <FileText className="w-4 h-4 flex-shrink-0" />
                                                  <span className="text-xs font-semibold truncate max-w-[150px]">{detail.assignmentFileName}</span>
                                                  <Download className="w-4 h-4 cursor-pointer hover:text-blue-700 flex-shrink-0" />
                                                </div>
                                              ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                              )}
                                            </td>
                                            <td className="px-4 py-3 min-w-[250px]">
                                              {detail.uploadedFile ? (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <FileText className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                                  <span className="text-xs text-gray-700 break-all whitespace-normal">{detail.uploadedFile}</span>
                                                  <Download className="w-4 h-4 text-gray-500 hover:text-primary-600 cursor-pointer flex-shrink-0" />
                                                  <button className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 whitespace-nowrap flex-shrink-0">
                                                    Cập nhật
                                                  </button>
                                                </div>
                                              ) : (
                                                <button className="text-primary-600 hover:text-primary-700 text-xs font-semibold flex items-center space-x-1 whitespace-nowrap">
                                                  <Upload className="w-3 h-3" />
                                                  <span>Tải bài làm</span>
                                                </button>
                                              )}
                                            </td>
                                            <td className="px-4 py-3 min-w-[250px]">
                                              <div className="space-y-2">
                                                <textarea
                                                  value={detail.solution}
                                                  onChange={(e) => handleDetailChange(selectedPreviousStudent, subject, detail.id, 'solution', e.target.value)}
                                                  className="text-sm text-gray-700 w-full min-w-[220px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-white"
                                                  rows={2}
                                                  placeholder="Nhập lời giải"
                                                />
                                                {detail.solution ? (
                                                  <button className="text-primary-600 hover:text-primary-700 text-xs font-semibold flex items-center space-x-1 whitespace-nowrap">
                                                    <Upload className="w-3 h-3" />
                                                    <span>Cập nhật</span>
                                                  </button>
                                                ) : (
                                                  <button className="text-primary-600 hover:text-primary-700 text-xs font-semibold flex items-center space-x-1 whitespace-nowrap">
                                                    <Upload className="w-3 h-3" />
                                                    <span>Thêm lời giải</span>
                                                  </button>
                                                )}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 min-w-[150px]">
                                              <select
                                                value={detail.result}
                                                onChange={(e) => handleDetailChange(selectedPreviousStudent, subject, detail.id, 'result', e.target.value)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 cursor-pointer w-full ${
                                                  detail.result === 'completed'
                                                    ? 'bg-green-100 text-green-700 border-green-300'
                                                    : detail.result === 'incorrect'
                                                      ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                                      : detail.result === 'in_progress'
                                                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                                                        : 'bg-red-100 text-red-600 border-red-300'
                                                } focus:ring-2 focus:ring-primary-500`}
                                              >
                                                <option value="completed">Hoàn thành</option>
                                                <option value="incorrect">Chưa chính xác</option>
                                                <option value="in_progress">Đang làm</option>
                                                <option value="not_done">Chưa xong</option>
                                              </select>
                                            </td>
                                            <td className="px-4 py-3 min-w-[200px]">
                                              <input
                                                type="text"
                                                value={detail.note}
                                                onChange={(e) => handleDetailChange(selectedPreviousStudent, subject, detail.id, 'note', e.target.value)}
                                                className="text-sm text-gray-700 w-full min-w-[180px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                                placeholder="Nhập nhận xét"
                                              />
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* Giao bài tập về nhà */}
                              {isExpanded && renderHomeworkSection(selectedPreviousStudent, subject)}
                            </div>
                          )
                        })}
                      </div>

                      {/* PHẦN 2: ĐÁNH GIÁ CHI TIẾT - 1 phần chung cho học sinh */}
                      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <h4 className="text-xl font-bold text-gray-900 mb-4">Đánh giá chi tiết</h4>
                        {renderSubjectEvaluation(selectedPreviousStudent, 'general')}
                      </div>

                      {/* PHẦN 3: ĐÁNH GIÁ CHUNG - Theo từng môn */}
                      <div className="space-y-6">
                        <h4 className="text-xl font-bold text-gray-900 mb-4">Đánh giá chung</h4>
                        {studentSchedules.map((schedule) => {
                          const subject = schedule.subject
                          const evaluation = subjectEvaluations[selectedPreviousStudent]?.[subject] || {
                            generalComment: ''
                          }

                          return (
                            <div key={subject} className="bg-white rounded-xl border-2 border-gray-200 p-6">
                              <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-gray-200">
                                <BookOpen className="w-5 h-5 text-primary-600" />
                                <h5 className="text-lg font-bold text-gray-900">{subject}</h5>
                              </div>
                              <textarea
                                value={evaluation.generalComment || ''}
                                onChange={(e) => handleEvaluationChange(selectedPreviousStudent, subject, 'generalComment', e.target.value)}
                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-white text-sm text-gray-700"
                                rows={4}
                                placeholder="Nhập đánh giá chung về học sinh trong môn học này..."
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Phần cũ - ẩn đi */}
            {false && (
            <div className="space-y-4">
              {subjectsDataToday.map((subjectData) => {
                const { subject, students: subjectStudents } = subjectData
                const isExpanded = expandedSubjectsHome[subject] ?? false
                
                // Tính tổng số checklist items và completed cho môn học
                const totalItems = subjectStudents.reduce((sum, s) => sum + s.checklistItems.length, 0)
                const completedItems = subjectStudents.reduce((sum, s) => 
                  sum + s.checklistItems.filter(item => item.status === 'done').length, 0)
                
                // Lấy danh sách học sinh đã chọn cho môn học này (mặc định 1 học sinh đầu)
                const selectedStudentsForSubject = selectedSubjectStudentsHome[subject] || (subjectStudents.length > 0 ? [subjectStudents[0].studentId] : [])

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
                        setExpandedSubjectsHome(prev => ({ ...prev, [subject]: !prev[subject] }))
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

                        {/* Chọn học sinh - Chỉ chọn 1 học sinh */}
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
                                      setSelectedSubjectStudentsHome(prev => {
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

                        {/* Hiển thị chi tiết cho học sinh đã chọn */}
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
                                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Thao tác</th>
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
                                    <td className="px-4 py-2">
                                      <button
                                        onClick={() => handleDeleteChecklistItem(item.id)}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Xóa
                                      </button>
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

                  <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
                      <p className="text-sm font-semibold text-gray-900">Chi tiết bài tập</p>
                      <div className="flex items-center space-x-2">
                        <button className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                          Upload bài làm
                        </button>
                        <button className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                          Thêm bài tập
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-[1000px] w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                          <tr>
                            <th className="px-4 py-2 font-semibold min-w-[200px]">Bài tập</th>
                            <th className="px-4 py-2 font-semibold min-w-[150px] whitespace-nowrap">
                              Thời gian (ước/thực)
                            </th>
                            <th className="px-4 py-2 font-semibold min-w-[250px]">Upload bài làm</th>
                            <th className="px-4 py-2 font-semibold min-w-[250px]">Lời giải</th>
                            <th className="px-4 py-2 font-semibold min-w-[150px]">Kết quả</th>
                            <th className="px-4 py-2 font-semibold min-w-[200px]">Nhận xét</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {detailItems.length === 0 && (
                            <tr>
                              <td className="px-4 py-4 text-sm text-gray-500 text-center" colSpan={6}>
                                Chưa có chi tiết bài tập.
                              </td>
                            </tr>
                          )}
                          {detailItems.map((detail) => (
                              <tr key={detail.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 min-w-[200px]">
                                  <input
                                    type="text"
                                    value={detail.lesson}
                                                onChange={(e) => handleDetailChange(studentId, subject, detail.id, 'lesson', e.target.value)}
                                                className="font-semibold text-gray-900 w-full min-w-[180px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                                placeholder="Nhập tên bài tập"
                                  />
                                </td>
                                            <td className="px-4 py-3 min-w-[150px] whitespace-nowrap">
                                              <div className="flex items-center gap-1.5">
                                                {/* Ước tính */}
                                                <div className="flex flex-col items-center border border-gray-300 rounded bg-white">
                                      <button
                                        onClick={() => {
                                          const current = parseInt(detail.estimatedTime.replace(/\D/g, '')) || 0
                                          const newValue = current + 1
                                                      handleDetailChange(studentId, subject, detail.id, 'estimatedTime', `${newValue} phút`)
                                        }}
                                                    className="w-full px-1.5 py-0.5 hover:bg-gray-100 rounded-t border-b border-gray-200 transition-colors"
                                      >
                                                    <ChevronUp className="w-3 h-3 text-gray-600 mx-auto" />
                                      </button>
                                                  <div className="px-2 py-0.5 bg-white w-full text-center border-y border-gray-200 min-w-[24px]">
                                                    <span className="text-xs font-semibold text-gray-900">
                                        {parseInt(detail.estimatedTime.replace(/\D/g, '')) || 0}
                                      </span>
                                                  </div>
                                      <button
                                        onClick={() => {
                                          const current = parseInt(detail.estimatedTime.replace(/\D/g, '')) || 0
                                          const newValue = Math.max(0, current - 1)
                                                      handleDetailChange(studentId, subject, detail.id, 'estimatedTime', `${newValue} phút`)
                                        }}
                                                    className="w-full px-1.5 py-0.5 hover:bg-gray-100 rounded-b border-t border-gray-200 transition-colors"
                                      >
                                                    <ChevronDown className="w-3 h-3 text-gray-600 mx-auto" />
                                      </button>
                                    </div>
                                                <span className="text-xs text-gray-400 font-medium">/</span>
                                                {/* Thực tế */}
                                                <div className="flex flex-col items-center border border-gray-300 rounded bg-white">
                                      <button
                                        onClick={() => {
                                          const current = parseInt(detail.actualTime.replace(/\D/g, '')) || 0
                                          const newValue = current + 1
                                                      handleDetailChange(studentId, subject, detail.id, 'actualTime', `${newValue} phút`)
                                        }}
                                                    className="w-full px-1.5 py-0.5 hover:bg-gray-100 rounded-t border-b border-gray-200 transition-colors"
                                      >
                                                    <ChevronUp className="w-3 h-3 text-gray-600 mx-auto" />
                                      </button>
                                                  <div className="px-2 py-0.5 bg-white w-full text-center border-y border-gray-200 min-w-[24px]">
                                                    <span className="text-xs font-semibold text-gray-900">
                                        {parseInt(detail.actualTime.replace(/\D/g, '')) || 0}
                                      </span>
                                                  </div>
                                      <button
                                        onClick={() => {
                                          const current = parseInt(detail.actualTime.replace(/\D/g, '')) || 0
                                          const newValue = Math.max(0, current - 1)
                                                      handleDetailChange(studentId, subject, detail.id, 'actualTime', `${newValue} phút`)
                                        }}
                                                    className="w-full px-1.5 py-0.5 hover:bg-gray-100 rounded-b border-t border-gray-200 transition-colors"
                                      >
                                                    <ChevronDown className="w-3 h-3 text-gray-600 mx-auto" />
                                      </button>
                                    </div>
                                                <span className="text-xs text-gray-500 font-medium ml-0.5">phút</span>
                                  </div>
                                </td>
                                            <td className="px-4 py-3 min-w-[250px]">
                                  {detail.uploadedFile ? (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <FileText className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                                  <span className="text-xs text-gray-700 break-all whitespace-normal">{detail.uploadedFile}</span>
                                                  <Download className="w-4 h-4 text-gray-500 hover:text-primary-600 cursor-pointer flex-shrink-0" />
                                                  <button className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 whitespace-nowrap flex-shrink-0">
                                        Cập nhật
                                      </button>
                                    </div>
                                  ) : (
                                                <button className="text-primary-600 hover:text-primary-700 text-xs font-semibold flex items-center space-x-1 whitespace-nowrap">
                                      <Upload className="w-3 h-3" />
                                      <span>Tải bài làm</span>
                                    </button>
                                  )}
                                </td>
                                            <td className="px-4 py-3 min-w-[250px]">
                                  <div className="space-y-2">
                                    <textarea
                                      value={detail.solution}
                                                  onChange={(e) => handleDetailChange(studentId, subject, detail.id, 'solution', e.target.value)}
                                                  className="text-sm text-gray-700 w-full min-w-[220px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-white"
                                      rows={2}
                                                  placeholder="Nhập lời giải"
                                    />
                                    {detail.solution ? (
                                                  <button className="text-primary-600 hover:text-primary-700 text-xs font-semibold flex items-center space-x-1 whitespace-nowrap">
                                        <Upload className="w-3 h-3" />
                                        <span>Cập nhật</span>
                                      </button>
                                    ) : (
                                                  <button className="text-primary-600 hover:text-primary-700 text-xs font-semibold flex items-center space-x-1 whitespace-nowrap">
                                        <Upload className="w-3 h-3" />
                                        <span>Thêm lời giải</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                                            <td className="px-4 py-3 min-w-[150px]">
                                  <select
                                    value={detail.result}
                                                onChange={(e) => handleDetailChange(studentId, subject, detail.id, 'result', e.target.value)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 cursor-pointer w-full ${
                                      detail.result === 'completed'
                                        ? 'bg-green-100 text-green-700 border-green-300'
                                        : detail.result === 'incorrect'
                                          ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                          : detail.result === 'in_progress'
                                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                                            : 'bg-red-100 text-red-600 border-red-300'
                                    } focus:ring-2 focus:ring-primary-500`}
                                  >
                                    <option value="completed">Hoàn thành</option>
                                    <option value="incorrect">Chưa chính xác</option>
                                    <option value="in_progress">Đang làm</option>
                                    <option value="not_done">Chưa xong</option>
                                  </select>
                                </td>
                                            <td className="px-4 py-3 min-w-[200px]">
                                  <input
                                    type="text"
                                    value={detail.note}
                                                onChange={(e) => handleDetailChange(studentId, subject, detail.id, 'note', e.target.value)}
                                                className="text-sm text-gray-700 w-full min-w-[180px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                                placeholder="Nhập nhận xét"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  {/* Giao bài tập về nhà */}
                          {renderHomeworkSection(studentId, subject)}
                </div>
              )
            })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            )}

            {/* Tổng kết tiến độ cho tất cả môn học hôm nay */}
            {(() => {
              const allItems = subjectsDataToday.reduce((sum, subj) => 
                sum + subj.students.reduce((s, stu) => s + stu.checklistItems.length, 0), 0)
              const allCompleted = subjectsDataToday.reduce((sum, subj) => 
                sum + subj.students.reduce((s, stu) => 
                  s + stu.checklistItems.filter(item => item.status === 'done').length, 0), 0)
              const overallProgress = allItems > 0 ? Math.round((allCompleted / allItems) * 100) : 0
              
              return (
                <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border-2 border-primary-200">
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
      </div>
    </div>
    );
  }

const getStudentAvatar = (studentId: string) => {
  const numericId = parseInt(studentId, 10)
  const avatarIndex = isNaN(numericId) ? 1 : (numericId % 70) + 1
  return `https://i.pravatar.cc/150?img=${avatarIndex}`
}

const InfoCard = ({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode
  label: string
  value: string | number
  helper?: string | null
}) => {
  const displayValue =
    value === undefined || value === null || value === '' ? 'Chưa cập nhật' : value
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</p>
        <p className="text-sm font-semibold text-gray-900 break-words">{displayValue}</p>
        {helper && <p className="text-xs text-gray-500 break-all">{helper}</p>}
      </div>
    </div>
  )
}

const StatCard = ({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode
  label: string
  value: string | number
  helper?: string
}) => (
  <div className="p-4 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 shadow-sm">
    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-inner mb-2">
      {icon}
    </div>
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-1">{label}</p>
    <p className="text-xl font-extrabold text-gray-900">{value}</p>
    {helper && <p className="text-xs text-gray-500 mt-1">{helper}</p>}
  </div>
)

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
                              src={getStudentAvatar(student.id)}
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

                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                  <div className="w-full rounded-2xl border border-gray-100 bg-gray-50/70 p-4 flex flex-col gap-3 md:flex-row md:items-center md:gap-4 shadow-inner">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md flex-shrink-0 bg-white">
                      <img
                        src={getStudentAvatar(selectedDetail.id)}
                        alt={selectedDetail.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Học sinh</p>
                      <h4 className="text-2xl font-bold text-gray-900">{selectedDetail.name}</h4>
                      <p className="text-sm text-gray-500">
                        {selectedDetail.grade || 'Đang cập nhật'} · {selectedDetail.school || 'Chưa có thông tin trường'}
                      </p>
                      {(selectedDetail.subjects || []).length === 0 && (
                        <p className="text-xs text-gray-400 mt-1">Chưa có môn học cụ thể</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InfoCard icon={<Cake className="w-4 h-4 text-primary-600" />} label="Tuổi" value={(selectedDetail as any).age || 'Chưa cập nhật'} />
                    <InfoCard icon={<Calendar className="w-4 h-4 text-primary-600" />} label="Ngày sinh" value={(selectedDetail as any).dateOfBirth || 'Chưa cập nhật'} />
                    <InfoCard icon={<School className="w-4 h-4 text-primary-600" />} label="Trường học" value={(selectedDetail as any).school || 'Chưa cập nhật'} />
                    <InfoCard icon={<GraduationCap className="w-4 h-4 text-primary-600" />} label="Lớp học" value={(selectedDetail as any).grade || 'Chưa cập nhật'} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <InfoCard icon={<UserCircle className="w-4 h-4 text-primary-600" />} label="Phụ huynh" value={selectedDetail.parent || 'Chưa cập nhật'} />
                    <InfoCard icon={<Phone className="w-4 h-4 text-primary-600" />} label="Liên hệ" value={selectedDetail.contact || 'Chưa có'} helper={selectedDetail.email} />
                    <InfoCard icon={<MapPin className="w-4 h-4 text-primary-600" />} label="Địa chỉ" value={selectedDetail.address || 'Chưa cập nhật'} />
                    <InfoCard icon={<MessageSquare className="w-4 h-4 text-primary-600" />} label="Kênh ưu tiên" value={selectedDetail.preferredChannel || 'Chưa cập nhật'} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <StatCard icon={<Award className="w-4 h-4 text-amber-600" />} label="Checklist" value={`${completedChecklist}/${totalChecklist}`} helper="Nhiệm vụ đã xong" />
                    <StatCard icon={<Clock className="w-4 h-4 text-blue-600" />} label="Buổi sắp tới" value={upcomingSchedules.length} helper="Trong lịch hôm nay" />
                    <StatCard icon={<BookOpen className="w-4 h-4 text-emerald-600" />} label="Môn học" value={selectedDetail.subjects?.length || 1} helper="Đang theo học" />
                  </div>

                  {nextSchedule && (
                    <div className="p-4 border border-gray-200 rounded-2xl bg-gradient-to-br from-white to-gray-50 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em] mb-1">Buổi học sắp tới</p>
                      <p className="text-base font-bold text-gray-900">{nextSchedule.subject}</p>
                      <p className="text-sm text-gray-600">{format(nextSchedule.date, 'EEEE, dd/MM/yyyy')} · {nextSchedule.time}</p>
                      {nextSchedule.meetLink && (
                        <button
                          onClick={() => handleJoinSchedule(nextSchedule.id)}
                          className="btn-primary text-xs px-4 py-2 mt-2"
                        >
                          Vào lớp
                        </button>
                      )}
                    </div>
                  )}

                  <div className="p-4 border border-dashed border-gray-300 rounded-2xl bg-white shadow-inner">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em] mb-2">Ghi chú thêm</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedDetail.moreInfo || 'Chưa có ghi chú nào từ phụ huynh.'}
                    </p>
                  </div>
                </div>
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

  // Tổ chức dữ liệu theo môn học cho home section (chỉ hôm nay)
  const subjectsDataToday = useMemo(() => {
    const subjectsMap: Record<string, SubjectData> = {}
    
    todayStudentsForHome.forEach(student => {
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
            students: []
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
          generalComment: ''
        }
        
        subjectsMap[subject].students.push({
          studentId: student.id,
          checklistItems: items,
          detailItems,
          homeworkItems,
          evaluation
        })
      })
    })
    
    return Object.values(subjectsMap)
  }, [todayStudentsForHome, checklistItemsByStudent, tutorDetailItemsByStudentAndSubject, homeworkItemsByStudentAndSubject, subjectEvaluations])

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

                    {detailItems.length > 0 && (
                            <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
                          <p className="text-sm font-semibold text-gray-900">Chi tiết bài tập</p>
                          <div className="flex items-center space-x-2">
                            <button className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                              Upload bài làm
                            </button>
                            <button className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                              Thêm lời giải
                            </button>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                                <table className="min-w-[1000px] w-full text-sm text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                              <tr>
                                      <th className="px-4 py-2 font-semibold min-w-[200px]">Bài tập</th>
                                      <th className="px-4 py-2 font-semibold min-w-[150px] whitespace-nowrap">Thời gian (ước/thực)</th>
                                      <th className="px-4 py-2 font-semibold min-w-[250px]">Upload bài làm</th>
                                      <th className="px-4 py-2 font-semibold min-w-[250px]">Lời giải</th>
                                      <th className="px-4 py-2 font-semibold min-w-[150px]">Kết quả</th>
                                      <th className="px-4 py-2 font-semibold min-w-[200px]">Nhận xét</th>
                              </tr>
                            </thead>
                                  <tbody className="divide-y divide-gray-100 bg-white">
                              {detailItems.map((detail) => (
                                <tr key={detail.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 min-w-[200px]">
                                    <input
                                      type="text"
                                      value={detail.lesson}
                                            onChange={(e) => handleDetailChange(studentId, subject, detail.id, 'lesson', e.target.value)}
                                            className="font-semibold text-gray-900 w-full min-w-[180px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                            placeholder="Nhập tên bài tập"
                                    />
                                  </td>
                                        <td className="px-4 py-3 min-w-[150px] whitespace-nowrap">
                                          <div className="flex items-center gap-1.5">
                                            {/* Ước tính */}
                                            <div className="flex flex-col items-center border border-gray-300 rounded bg-white">
                                        <button
                                          onClick={() => {
                                            const current = parseInt(detail.estimatedTime.replace(/\D/g, '')) || 0
                                            const newValue = current + 1
                                                  handleDetailChange(studentId, subject, detail.id, 'estimatedTime', `${newValue} phút`)
                                          }}
                                                className="w-full px-1.5 py-0.5 hover:bg-gray-100 rounded-t border-b border-gray-200 transition-colors"
                                        >
                                                <ChevronUp className="w-3 h-3 text-gray-600 mx-auto" />
                                        </button>
                                              <div className="px-2 py-0.5 bg-white w-full text-center border-y border-gray-200 min-w-[24px]">
                                                <span className="text-xs font-semibold text-gray-900">
                                          {parseInt(detail.estimatedTime.replace(/\D/g, '')) || 0}
                                        </span>
                                              </div>
                                        <button
                                          onClick={() => {
                                            const current = parseInt(detail.estimatedTime.replace(/\D/g, '')) || 0
                                            const newValue = Math.max(0, current - 1)
                                                  handleDetailChange(studentId, subject, detail.id, 'estimatedTime', `${newValue} phút`)
                                          }}
                                                className="w-full px-1.5 py-0.5 hover:bg-gray-100 rounded-b border-t border-gray-200 transition-colors"
                                        >
                                                <ChevronDown className="w-3 h-3 text-gray-600 mx-auto" />
                                        </button>
                                      </div>
                                            <span className="text-xs text-gray-400 font-medium">/</span>
                                            {/* Thực tế */}
                                            <div className="flex flex-col items-center border border-gray-300 rounded bg-white">
                                        <button
                                          onClick={() => {
                                            const current = parseInt(detail.actualTime.replace(/\D/g, '')) || 0
                                            const newValue = current + 1
                                                  handleDetailChange(studentId, subject, detail.id, 'actualTime', `${newValue} phút`)
                                          }}
                                                className="w-full px-1.5 py-0.5 hover:bg-gray-100 rounded-t border-b border-gray-200 transition-colors"
                                        >
                                                <ChevronUp className="w-3 h-3 text-gray-600 mx-auto" />
                                        </button>
                                              <div className="px-2 py-0.5 bg-white w-full text-center border-y border-gray-200 min-w-[24px]">
                                                <span className="text-xs font-semibold text-gray-900">
                                          {parseInt(detail.actualTime.replace(/\D/g, '')) || 0}
                                        </span>
                                              </div>
                                        <button
                                          onClick={() => {
                                            const current = parseInt(detail.actualTime.replace(/\D/g, '')) || 0
                                            const newValue = Math.max(0, current - 1)
                                                  handleDetailChange(studentId, subject, detail.id, 'actualTime', `${newValue} phút`)
                                          }}
                                                className="w-full px-1.5 py-0.5 hover:bg-gray-100 rounded-b border-t border-gray-200 transition-colors"
                                        >
                                                <ChevronDown className="w-3 h-3 text-gray-600 mx-auto" />
                                        </button>
                                      </div>
                                            <span className="text-xs text-gray-500 font-medium ml-0.5">phút</span>
                                    </div>
                                  </td>
                                        <td className="px-4 py-3 min-w-[250px]">
                                    {detail.uploadedFile ? (
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                                              <span className="text-xs text-gray-700 break-all whitespace-normal">{detail.uploadedFile}</span>
                                              <Download className="w-4 h-4 text-gray-500 hover:text-primary-600 cursor-pointer flex-shrink-0" />
                                              <button className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 whitespace-nowrap flex-shrink-0">
                                          Cập nhật
                                        </button>
                                      </div>
                                    ) : (
                                            <button className="text-primary-600 hover:text-primary-700 text-xs font-semibold flex items-center space-x-1 whitespace-nowrap">
                                        <Upload className="w-3 h-3" />
                                        <span>Tải bài làm</span>
                                      </button>
                                    )}
                                  </td>
                                        <td className="px-4 py-3 min-w-[250px]">
                                    <div className="space-y-2">
                                      <textarea
                                        value={detail.solution}
                                              onChange={(e) => handleDetailChange(studentId, subject, detail.id, 'solution', e.target.value)}
                                              className="text-sm text-gray-700 w-full min-w-[220px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-white"
                                        rows={2}
                                              placeholder="Nhập lời giải"
                                      />
                                      {detail.solution ? (
                                              <button className="text-primary-600 hover:text-primary-700 text-xs font-semibold flex items-center space-x-1 whitespace-nowrap">
                                          <Upload className="w-3 h-3" />
                                          <span>Cập nhật</span>
                                        </button>
                                      ) : (
                                              <button className="text-primary-600 hover:text-primary-700 text-xs font-semibold flex items-center space-x-1 whitespace-nowrap">
                                          <Upload className="w-3 h-3" />
                                          <span>Thêm lời giải</span>
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                        <td className="px-4 py-3 min-w-[150px]">
                                    <select
                                      value={detail.result}
                                            onChange={(e) => handleDetailChange(studentId, subject, detail.id, 'result', e.target.value)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 cursor-pointer w-full ${
                                        detail.result === 'completed'
                                          ? 'bg-green-100 text-green-700 border-green-300'
                                          : detail.result === 'incorrect'
                                            ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                            : detail.result === 'in_progress'
                                              ? 'bg-blue-100 text-blue-700 border-blue-300'
                                              : 'bg-red-100 text-red-600 border-red-300'
                                      } focus:ring-2 focus:ring-primary-500`}
                                    >
                                      <option value="completed">Hoàn thành</option>
                                      <option value="incorrect">Chưa chính xác</option>
                                      <option value="in_progress">Đang làm</option>
                                      <option value="not_done">Chưa xong</option>
                                    </select>
                                  </td>
                                        <td className="px-4 py-3 min-w-[200px]">
                                    <input
                                      type="text"
                                      value={detail.note}
                                            onChange={(e) => handleDetailChange(studentId, subject, detail.id, 'note', e.target.value)}
                                            className="text-sm text-gray-700 w-full min-w-[180px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                            placeholder="Nhập nhận xét"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

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


  return (
    <Layout 
      sidebar={
        <TutorSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />
      }
    >
      <div className="h-full overflow-hidden">
        {renderContent()}
      </div>


      {showChecklistForm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowChecklistForm(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Tạo checklist mới</h3>
                <p className="text-sm text-gray-500">Chỉ định nhiệm vụ cụ thể cho học sinh</p>
              </div>
              <button
                onClick={() => setShowChecklistForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn học sinh</label>
                <select
                  value={checklistForm.studentId}
                  onChange={(e) => setChecklistForm((prev) => ({ ...prev, studentId: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Môn học </label>
                  {(() => {
                    const subjects = ["Toán", "Lý", "Hóa", "Sinh", "Anh"];
                    return (
                      <select
                    value={checklistForm.lesson}
                        onChange={(e) => setChecklistForm(prev => ({ ...prev, lesson: e.target.value }))}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      >
                        <option value="">-- Chọn môn học --</option>
                        {subjects.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày tháng</label>
                  <input
                    type="date"
                    value={checklistForm.dueDate}
                    onChange={(e) => setChecklistForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nội dung checklist</label>
                <textarea
                  value={checklistForm.tasks}
                  onChange={(e) => setChecklistForm((prev) => ({ ...prev, tasks: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  rows={4}
                  placeholder="Nhập nhiệm vụ cụ thể..."
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Danh sách bài tập</p>
                    <p className="text-xs text-gray-500">Tạo từng bài kèm thời gian và tài liệu</p>
                  </div>
                  <button
                    onClick={addChecklistExercise}
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    + Thêm bài tập
                  </button>
                </div>

                <div className="space-y-3">
                  {checklistForm.exercises.map((exercise, idx) => (
                    <div key={exercise.id} className="border border-gray-200 rounded-2xl p-4 bg-gray-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Bài {idx + 1}</p>
                        {checklistForm.exercises.length > 1 && (
                          <button
                            onClick={() => removeChecklistExercise(idx)}
                            className="text-xs text-red-500 hover:text-red-600 font-semibold"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Tên bài tập</label>
                          <input
                            value={exercise.title}
                            onChange={(e) => handleChecklistExerciseChange(idx, 'title', e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Ví dụ: Giải hệ phương trình nâng cao"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Thời gian dự kiến</label>
                          <div className="flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
                            <input
                              type="number"
                              min={0}
                              value={exercise.estimatedTime || ''}
                              onChange={(e) => handleChecklistExerciseChange(idx, 'estimatedTime', e.target.value)}
                              className="flex-1 px-3 py-2 text-sm outline-none"
                              placeholder="20"
                            />
                            <div className="flex flex-col border-l border-gray-200">
                              <button
                                type="button"
                                onClick={() => adjustEstimatedTime(idx, 1)}
                                className="px-2 py-1 hover:bg-gray-100 focus:outline-none"
                              >
                                <ChevronUp className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                type="button"
                                onClick={() => adjustEstimatedTime(idx, -1)}
                                className="px-2 py-1 hover:bg-gray-100 focus:outline-none"
                              >
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                            <div className="px-3 text-xs font-semibold text-gray-500 border-l border-gray-200 h-full flex items-center">
                              phút
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Yêu cầu chi tiết</label>
                        <textarea
                          value={exercise.requirement}
                          onChange={(e) => handleChecklistExerciseChange(idx, 'requirement', e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          rows={2}
                          placeholder="Mô tả nhiệm vụ cho học sinh..."
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <label className="text-xs font-semibold text-gray-600">
                          File bài tập
                        </label>
                        <div>
                          <input
                            type="file"
                            id={`exercise-upload-${exercise.id}`}
                            className="hidden"
                            onChange={(e) =>
                              handleChecklistExerciseChange(
                                idx,
                                'attachment',
                                e.target.files && e.target.files.length > 0 ? e.target.files[0] : null
                              )
                            }
                          />
                          <label
                            htmlFor={`exercise-upload-${exercise.id}`}
                            className="inline-flex items-center space-x-2 text-sm font-semibold text-primary-600 cursor-pointer"
                          >
                            <Upload className="w-4 h-4" />
                            <span>{exercise.attachment ? exercise.attachment.name : 'Tải bài tập'}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-4 text-center hover:border-primary-400 transition-colors">
                <input type="file" id="checklist-upload" className="hidden" multiple />
                <label htmlFor="checklist-upload" className="cursor-pointer text-sm font-semibold text-primary-600">
                  + Đính kèm tài liệu bổ sung
                </label>
                <p className="text-xs text-gray-500 mt-1">PDF, DOC, JPG (tối đa 10MB/tệp)</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowChecklistForm(false)}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleChecklistFormSubmit}
                disabled={isSubmittingChecklist}
                className="btn-primary text-sm px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingChecklist ? 'Đang gửi...' : 'Gửi checklist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
