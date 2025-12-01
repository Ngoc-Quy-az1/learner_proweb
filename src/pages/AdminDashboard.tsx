import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Layout } from '../components/common'
import { apiCall, API_BASE_URL } from '../config/api'
import { getCookie } from '../utils/cookies'
import {
  Users,
  Calendar,
  GraduationCap,
  UserCog,
  Search,
  MapPin,
  BookOpenCheck,
  Heart,
  ClipboardList,
  Phone,
  FileText,
  Clock,
  X,
  Image as ImageIcon,
  Edit,
  Save,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, addMinutes } from 'date-fns'
import { vi } from 'date-fns/locale'
import { AdminSidebar, type AdminSection } from '../components/dashboard'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { UserManagementSection } from '../components/admin'

interface User {
  id: string
  name: string
  email: string
  role: 'student' | 'tutor' | 'parent' | 'admin' | 'teacher'
  phone?: string
  birthday?: string
  isEmailVerified?: boolean
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  avatarUrl?: string
  address?: string
  currentLevel?: string
  // For display purposes (not from API)
  password?: string
  joinDate?: string
  status?: 'active' | 'inactive'
}

type EditableArrayField = 'strengths' | 'improvements' | 'hobbies' | 'favoriteSubjects'

interface ParentInfo {
  fatherName: string
  fatherPhone: string
  fatherEmail?: string
  fatherRequest?: string
  motherName: string
  motherPhone: string
  motherEmail?: string
  motherRequest?: string
  email: string
}

const combineParentRequests = (
  fatherRequest?: string | null,
  motherRequest?: string | null,
  fallback?: string | null,
): string => {
  const normalized = [fatherRequest, motherRequest]
    .map((req) => req?.trim())
    .filter((req): req is string => Boolean(req))
  if (normalized.length > 0) {
    return normalized.join('\n')
  }
  const defaultValue = fallback?.trim()
  return defaultValue && defaultValue.length > 0 ? defaultValue : 'Chưa có yêu cầu cụ thể.'
}

interface StudentProfile {
  id: string
  name: string
  avatar: string
  dob: string
  address: string
  school: string
  grade: string
  subject: string
  subjectColor: string
  progress: number
  status: 'Đang học' | 'Tạm dừng'
  parentInfo: ParentInfo
  parentId?: string // Parent ID for API
  currentLevel: string
  parentRequest: string
  hobbies: string[]
  favoriteSubjects: string[]
  strengths: string[]
  improvements: string[]
  notes: string
}

interface StudentListItem {
  id: string
  name: string
  avatar: string
  grade: string
  address: string
  subject: string
  subjectColor: string
  progress: number
  hasProfile: boolean
}

interface StudentInfoFromAPI {
  id: string
  userId: {
    id: string
    name: string
    email: string
    role: string
  }
  school: string
  grade: string
  parentId?: {
    id: string
    name: string
  }
  // New format fields
  parentName?: string
  parentEmail?: string
  parentNumber?: string
  parent1Name?: string
  parent1Email?: string
  parent1Number?: string
  parent1Request?: string
  parent2Name?: string
  parent2Email?: string
  parent2Number?: string
  parent2Request?: string
  academicLevel?: string
  parentRequest?: string
  hobbies: string[]
  favoriteSubjects: string[]
  strengths: string[]
  improvements: string[]
  notes: string
}

interface TutorInfoFromAPI {
  id: string
  userId:
    | string
    | {
        id: string
        name: string
        email: string
        role: string
        phone?: string
        avatarUrl?: string
      }
  subjects: string[]
  experience: string
  qualification: string
  specialties: string[]
  bio: string
  cvUrl: string
  totalStudents: number
  createdAt: string
  updatedAt: string
}

interface TutorProfile {
  id: string
  name: string
  avatar: string
  subjects: string[]
  status: 'Đang dạy' | 'Tạm nghỉ'
  experience: string
  qualification: string
  email: string
  phone: string
  bio: string
  cvUrl: string
  specialties: string[]
  totalStudents: number
}

interface TutorListItem {
  id: string
  name: string
  avatar: string
  headline: string
  subjects: string[]
  status: 'Đang dạy' | 'Tạm nghỉ'
  hasProfile: boolean
}

interface ScheduleSession {
  id: string
  date: string
  startTime: string
  endTime: string
  subject: string
  studentId: string
  tutorId: string
  meetingLink: string
  status: 'Sắp diễn ra' | 'Đang diễn ra' | 'Đã kết thúc' | 'Đã hủy' | 'Đang cập nhật'
  note?: string
}


const STUDENT_CARD_COLORS = [
  { subject: 'Toán', color: 'bg-blue-100 text-blue-600' },
  { subject: 'Văn', color: 'bg-purple-100 text-purple-600' },
  { subject: 'Lý', color: 'bg-amber-100 text-amber-600' },
  { subject: 'Hóa', color: 'bg-emerald-100 text-emerald-600' },
  { subject: 'Sinh', color: 'bg-teal-100 text-teal-600' },
]

const buildPlaceholderProfile = (item: StudentListItem): StudentProfile => ({
  id: item.id,
  name: item.name,
  avatar: item.avatar,
  dob: '2011-01-15',
  address: 'Đang cập nhật',
  school: 'Đang cập nhật',
  grade: item.grade,
  subject: item.subject,
  subjectColor: item.subjectColor,
  progress: item.progress,
  status: 'Tạm dừng',
  parentInfo: {
    fatherName: 'Đang cập nhật',
    fatherPhone: '—',
    fatherEmail: '',
    fatherRequest: '',
    motherName: 'Đang cập nhật',
    motherPhone: '—',
    motherEmail: '',
    motherRequest: '',
    email: 'dangcapnhat@skillar.com',
  },
  currentLevel: 'Thông tin đang được bổ sung.',
  parentRequest: 'Chưa có yêu cầu cụ thể.',
  hobbies: ['Đang cập nhật'],
  favoriteSubjects: [],
  strengths: [],
  improvements: [],
  notes: 'Thông tin chi tiết sẽ được cập nhật sau.',
})

const cloneStudentProfile = (profile: StudentProfile): StudentProfile => ({
  ...profile,
  parentInfo: { ...profile.parentInfo },
  hobbies: [...profile.hobbies],
  favoriteSubjects: [...profile.favoriteSubjects],
  strengths: [...profile.strengths],
  improvements: [...profile.improvements],
})

const TUTOR_PROFILES: TutorProfile[] = [
  {
    id: 'tutor-1',
    name: 'Trần Minh Khoa',
    avatar: 'https://i.pravatar.cc/150?img=12',
    subjects: ['Toán', 'Vật lý'],
    status: 'Đang dạy',
    experience: '5 năm giảng dạy chương trình THCS & THPT tại Skillar',
    qualification: 'Cử nhân Sư phạm Toán – ĐH Sư phạm TP.HCM',
    email: 'khoa.tutor@skillar.com',
    phone: '0905 123 456',
    bio: 'Đam mê hướng dẫn học sinh luyện thi vào các lớp chuyên Toán, chú trọng phương pháp trực quan.',
    cvUrl: 'https://drive.google.com/file/d/1-tutor-khoa',
    specialties: ['Hình học', 'Đại số'],
    totalStudents: 120,
  },
  {
    id: 'tutor-2',
    name: 'Phạm Thu Hà',
    avatar: 'https://i.pravatar.cc/150?img=32',
    subjects: ['Ngữ văn', 'Tiếng Anh'],
    status: 'Đang dạy',
    experience: '7 năm kinh nghiệm luyện thi HSG cấp tỉnh, IELTS 8.0',
    qualification: 'Thạc sĩ Ngôn ngữ học – ĐH KHXH&NV',
    email: 'ha.tutor@skillar.com',
    phone: '0914 222 789',
    bio: 'Tập trung phát triển kỹ năng viết và hùng biện cho học sinh trung học.',
    cvUrl: 'https://drive.google.com/file/d/2-tutor-ha',
    specialties: ['Viết luận', 'IELTS'],
    totalStudents: 95,
  },
]

const TUTOR_LIST: TutorListItem[] = (() => {
  const base = TUTOR_PROFILES.map((profile) => ({
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    headline: profile.qualification,
    subjects: profile.subjects,
    status: profile.status,
    hasProfile: true,
  }))

  const placeholders = Array.from({ length: 10 }).map((_, idx) => ({
    id: `tutor-${idx + 3}`,
    name: `Tutor ${idx + 3}`,
    avatar: `https://i.pravatar.cc/150?img=${20 + idx}`,
    headline: 'Đang cập nhật',
    subjects: [STUDENT_CARD_COLORS[idx % STUDENT_CARD_COLORS.length].subject],
    status: (idx % 3 === 0 ? 'Tạm nghỉ' : 'Đang dạy') as 'Đang dạy' | 'Tạm nghỉ',
    hasProfile: false,
  }))

  return [...base, ...placeholders]
})()

const createInitialTutorProfiles = (list: TutorListItem[]): Record<string, TutorProfile> => {
  const map: Record<string, TutorProfile> = {}
  list.forEach((item) => {
    const base = TUTOR_PROFILES.find((profile) => profile.id === item.id)
    map[item.id] =
      base ??
      {
        id: item.id,
        name: item.name,
        avatar: item.avatar,
        subjects: item.subjects,
        status: item.status,
        experience: 'Đang cập nhật',
        qualification: item.headline,
        email: `${item.name.toLowerCase().replace(/\s/g, '')}@skillar.com`,
        phone: '—',
        bio: 'Thông tin đang được bổ sung.',
        cvUrl: '',
        specialties: [],
        totalStudents: 0,
      }
  })
  return map
}

const cloneTutorProfile = (profile: TutorProfile): TutorProfile => ({
  ...profile,
  subjects: [...profile.subjects],
  specialties: [...profile.specialties],
})

const mapScheduleStatus = (status?: string): ScheduleSession['status'] => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'done':
    case 'finished':
      return 'Đã kết thúc'
    case 'upcoming':
    case 'scheduled':
    case 'pending':
      return 'Sắp diễn ra'
    case 'ongoing':
    case 'inprogress':
      return 'Đang diễn ra'
    case 'cancelled':
    case 'canceled':
      return 'Đã hủy'
    default:
      return 'Đang cập nhật'
  }
}

const todayString = format(new Date(), 'yyyy-MM-dd')

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Get section from URL or default to 'user-management'
  const sectionFromUrl = searchParams.get('section') as AdminSection | null
  const validSections: AdminSection[] = ['user-management', 'student-management', 'tutor-management', 'schedule-management', 'analytics']
  const defaultSection: AdminSection = 'user-management'
  const initialSection = sectionFromUrl && validSections.includes(sectionFromUrl) ? sectionFromUrl : defaultSection
  
  const [activeSection, setActiveSection] = useState<AdminSection>(initialSection)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Sync URL when section changes
  const handleSectionChange = useCallback((section: AdminSection) => {
    setActiveSection(section)
    setSearchParams({ section }, { replace: false })
  }, [setSearchParams])
  
  // Sync section when URL changes (e.g., back button)
  useEffect(() => {
    const section = searchParams.get('section') as AdminSection | null
    if (section && validSections.includes(section)) {
      setActiveSection(section)
    } else if (!section) {
      // If no section in URL, set default and update URL
      setActiveSection(defaultSection)
      setSearchParams({ section: defaultSection }, { replace: true })
    }
  }, [searchParams, validSections, defaultSection, setSearchParams])
  const [users, setUsers] = useState<User[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'tutor' | 'admin'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<'name' | 'email' | 'createdAt'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 0,
  })
  const [studentAvatarUploading, setStudentAvatarUploading] = useState(false)
  const [studentList, setStudentList] = useState<StudentListItem[]>([])
  const [studentProfiles, setStudentProfiles] = useState<Record<string, StudentProfile>>({})
  const [scheduleStudentList, setScheduleStudentList] = useState<Array<{ id: string; name: string }>>([])
  const [editScheduleStudentList, setEditScheduleStudentList] = useState<Array<{ id: string; name: string }>>([])
  const [editScheduleTutorList, setEditScheduleTutorList] = useState<Array<{ id: string; name: string }>>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const [isStudentEditing, setIsStudentEditing] = useState(false)
  const [studentEditData, setStudentEditData] = useState<StudentProfile | null>(null)
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentCurrentPage, setStudentCurrentPage] = useState(1)
  const studentsPerPage = 10
  const [studentPagination, setStudentPagination] = useState<{
    page: number
    limit: number
    totalPages: number
    totalResults: number
  }>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 0,
  })
  const initialStudentArrayDrafts: Record<EditableArrayField, string> = {
    strengths: '',
    improvements: '',
    hobbies: '',
    favoriteSubjects: '',
  }
  const [studentArrayDrafts, setStudentArrayDrafts] = useState<Record<EditableArrayField, string>>(initialStudentArrayDrafts)
  const [tutorList, setTutorList] = useState<TutorListItem[]>(TUTOR_LIST)
  const [tutorProfiles, setTutorProfiles] = useState<Record<string, TutorProfile>>(() => createInitialTutorProfiles(TUTOR_LIST))
  const [selectedTutorId, setSelectedTutorId] = useState(TUTOR_LIST[0].id)
  const [tutorSearchTerm, setTutorSearchTerm] = useState('')
  const [isTutorEditing, setIsTutorEditing] = useState(false)
  const [tutorEditData, setTutorEditData] = useState<TutorProfile | null>(null)
  const [tutorSubjectsInput, setTutorSubjectsInput] = useState<string>('')
  const [tutorSpecialtiesInput, setTutorSpecialtiesInput] = useState<string>('')
  const [tutorsLoading, setTutorsLoading] = useState(true)
  const [tutorCurrentPage, setTutorCurrentPage] = useState(1)
  const tutorsPerPage = 10
  const [tutorPagination, setTutorPagination] = useState<{
    page: number
    limit: number
    totalPages: number
    totalResults: number
  }>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 0,
  })
  const [isSavingTutor, setIsSavingTutor] = useState(false)
  const [tutorAvatarUploading, setTutorAvatarUploading] = useState(false)
  const [tutorCvUploading, setTutorCvUploading] = useState(false)
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date())
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(todayString)
  const [scheduleSessions, setScheduleSessions] = useState<ScheduleSession[]>([])
  const [schedulesLoading, setSchedulesLoading] = useState(true)
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false)
  const [isGeneratingNewScheduleLink, setIsGeneratingNewScheduleLink] = useState(false)
  const [generatingMeetingLinkId, setGeneratingMeetingLinkId] = useState<string | null>(null)
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [editScheduleData, setEditScheduleData] = useState<{
    date: string
    startTime: string
    endTime: string
    studentId: string
    tutorId: string
    meetingLink: string
    note: string
    status: string
  } | null>(null)
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false)
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    date: todayString,
    startTime: '',
    endTime: '',
    studentId: '',
    tutorId: '',
    meetingLink: '',
    note: '',
  })
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    tutors: 0,
    lessonsToday: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState({
    totalSchedules: 0,
    totalStudents: 0,
    totalTutors: 0,
    studentsParticipated: 0,
  })
  const [dashboardStatsLoading, setDashboardStatsLoading] = useState(true)
  const [monthlyScheduleStats, setMonthlyScheduleStats] = useState<
    Array<{
      month: string
      monthStart: string
      monthEnd: string
      scheduleCount: number
    }>
  >([])
  const [monthlyStatsLoading, setMonthlyStatsLoading] = useState(true)
  const [selectedMonths, setSelectedMonths] = useState<number>(6)
  const [tutorsPerSubject, setTutorsPerSubject] = useState<
    Array<{
      subject: string
      tutorCount: number
    }>
  >([])
  const [tutorsPerSubjectLoading, setTutorsPerSubjectLoading] = useState(true)
  const [studentsPerGrade, setStudentsPerGrade] = useState<
    Array<{
      grade: string
      studentCount: number
    }>
  >([])
  const [studentsPerGradeLoading, setStudentsPerGradeLoading] = useState(true)

const usersPerPage = 10

const refreshUsersList = useCallback(async () => {
  const params = new URLSearchParams()
  if (searchTerm.trim()) {
    params.append('name', searchTerm.trim())
  }
  if (roleFilter !== 'all') {
    params.append('role', roleFilter)
  }
  params.append('page', currentPage.toString())
  params.append('limit', usersPerPage.toString())
  params.append('sortBy', `${sortField}:${sortOrder}`)

  const response = await apiCall<{
    results: User[]
    page: number
    limit: number
    totalPages: number
    totalResults: number
  }>(`/users?${params.toString()}`)

  const mappedUsers: User[] = response.results.map((user) => ({
    ...user,
    status: (user.isActive ? 'active' : 'inactive') as 'active' | 'inactive',
    joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '',
  }))

  setUsers(mappedUsers)
  setUsersPagination({
    page: response.page,
    limit: response.limit,
    totalPages: response.totalPages,
    totalResults: response.totalResults,
  })
}, [currentPage, roleFilter, searchTerm, sortField, sortOrder, usersPerPage])

// Fetch users from API
useEffect(() => {
  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      await refreshUsersList()
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  fetchUsers()
}, [refreshUsersList])


  const fetchStudents = useCallback(async () => {
    try {
      setStudentsLoading(true)

      // Fetch users with role=student with pagination
      const params = new URLSearchParams()
      params.append('role', 'student')
      params.append('page', studentCurrentPage.toString())
      params.append('limit', studentsPerPage.toString())
      
      // Add search term if exists (server-side search)
      if (studentSearchTerm.trim()) {
        params.append('name', studentSearchTerm.trim())
      }

      const usersResponse = await apiCall<{
        results: User[]
        page: number
        limit: number
        totalPages: number
        totalResults: number
      }>(`/users?${params.toString()}`)

      const students: StudentListItem[] = []
      const profiles: Record<string, StudentProfile> = {}

      // Fetch detailed info for each student
      for (const user of usersResponse.results) {
        try {
          // Fetch student info
          const studentInfo = await apiCall<StudentInfoFromAPI>(`/students/${user.id}/info`)

          // Get subject color (use first favorite subject or default)
          const firstSubject = studentInfo.favoriteSubjects[0] || 'Toán'
          const subjectColor = STUDENT_CARD_COLORS.find((c) => c.subject === firstSubject)?.color || STUDENT_CARD_COLORS[0].color

          // Create StudentListItem
          const listItem: StudentListItem = {
            id: user.id,
            name: user.name,
            avatar: user.avatarUrl || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
            grade: studentInfo.grade,
            address: user.address || 'Đang cập nhật',
            subject: firstSubject,
            subjectColor,
            progress: 50, // Default progress, can be calculated later
            hasProfile: true,
          }
          students.push(listItem)

          // Create StudentProfile
          // Use new format fields if available, otherwise fall back to old format
          const fatherName = studentInfo.parent1Name || studentInfo.parentName || studentInfo.parentId?.name || 'Đang cập nhật'
          const fatherEmail = studentInfo.parent1Email || studentInfo.parentEmail || user.email
          const fatherPhone = studentInfo.parent1Number || studentInfo.parentNumber || '—'
          const fatherRequest = studentInfo.parent1Request || ''
          const motherName = studentInfo.parent2Name || 'Đang cập nhật'
          const motherEmail = studentInfo.parent2Email || ''
          const motherPhone = studentInfo.parent2Number || '—'
          const motherRequest = studentInfo.parent2Request || ''
          const combinedParentRequest = combineParentRequests(fatherRequest, motherRequest, studentInfo.parentRequest)
          const academicLevel = studentInfo.academicLevel || user.currentLevel || 'Đang cập nhật'

          const profile: StudentProfile = {
            id: user.id,
            name: user.name,
            avatar: user.avatarUrl || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
            dob: user.birthday || '2010-01-01',
            address: user.address || 'Đang cập nhật',
            school: studentInfo.school,
            grade: studentInfo.grade,
            subject: firstSubject,
            subjectColor,
            progress: 50,
            status: user.isActive ? 'Đang học' : 'Tạm dừng',
            parentInfo: {
              fatherName,
              fatherPhone,
              fatherEmail,
              fatherRequest,
              motherName,
              motherPhone,
              motherEmail,
              motherRequest,
              email: fatherEmail || motherEmail || user.email,
            },
            parentId: studentInfo.parentId?.id,
            currentLevel: academicLevel,
            parentRequest: combinedParentRequest,
            hobbies: studentInfo.hobbies,
            favoriteSubjects: studentInfo.favoriteSubjects,
            strengths: studentInfo.strengths,
            improvements: studentInfo.improvements,
            notes: studentInfo.notes,
          }
          profiles[user.id] = profile
        } catch (error) {
          // If student info not found, create placeholder
          console.error(`Error fetching info for student ${user.id}:`, error)
          const listItem: StudentListItem = {
            id: user.id,
            name: user.name,
            avatar: user.avatarUrl || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
            grade: 'Đang cập nhật',
            address: user.address || 'Đang cập nhật',
            subject: 'Toán',
            subjectColor: STUDENT_CARD_COLORS[0].color,
            progress: 0,
            hasProfile: false,
          }
          students.push(listItem)

          const profile: StudentProfile = buildPlaceholderProfile(listItem)
          profile.id = user.id
          profile.name = user.name
          profiles[user.id] = profile
        }
      }

      setStudentList(students)
      setStudentProfiles(profiles)
      
      // Update pagination state
      setStudentPagination({
        page: usersResponse.page || studentCurrentPage,
        limit: usersResponse.limit || studentsPerPage,
        totalPages: usersResponse.totalPages || 1,
        totalResults: usersResponse.totalResults || 0,
      })

      // Set first student as selected if available
      if (students.length > 0) {
        setSelectedStudentId((prev) => prev || students[0].id)
      } else {
        // If no students on current page, clear selection
        setSelectedStudentId(null)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      setStudentList([])
      setStudentProfiles({})
      setStudentPagination({
        page: 1,
        limit: studentsPerPage,
        totalPages: 1,
        totalResults: 0,
      })
    } finally {
      setStudentsLoading(false)
    }
  }, [studentCurrentPage, studentSearchTerm, studentsPerPage])

  // Fetch student names for schedule creation using /users/names API
  const fetchScheduleStudents = useCallback(async () => {
    try {
      const response = await apiCall<Array<{ id: string; name: string }>>('/users/names?role=student')
      setScheduleStudentList(response || [])
    } catch (error) {
      console.error('Error fetching schedule students:', error)
      setScheduleStudentList([])
    }
  }, [])

  // Fetch student names for schedule editing using /users/names API
  const fetchEditScheduleStudents = useCallback(async () => {
    try {
      const response = await apiCall<Array<{ id: string; name: string }>>('/users/names?role=student')
      setEditScheduleStudentList(response || [])
    } catch (error) {
      console.error('Error fetching edit schedule students:', error)
      setEditScheduleStudentList([])
    }
  }, [])

  // Fetch tutor names for schedule editing using /users/names API
  const fetchEditScheduleTutors = useCallback(async () => {
    try {
      const response = await apiCall<Array<{ id: string; name: string }>>('/users/names?role=tutor')
      setEditScheduleTutorList(response || [])
    } catch (error) {
      console.error('Error fetching edit schedule tutors:', error)
      setEditScheduleTutorList([])
    }
  }, [])

  const fetchTutors = useCallback(async () => {
    try {
      setTutorsLoading(true)

      const params = new URLSearchParams()
      params.append('role', 'tutor')
      params.append('page', tutorCurrentPage.toString())
      params.append('limit', tutorsPerPage.toString())
      
      // Add search term if exists (server-side search)
      if (tutorSearchTerm.trim()) {
        params.append('name', tutorSearchTerm.trim())
      }

      const usersResponse = await apiCall<{
        results: User[]
        page: number
        limit: number
        totalPages: number
        totalResults: number
      }>(`/users?${params.toString()}`)

      const tutors: TutorListItem[] = []
      const profiles: Record<string, TutorProfile> = {}

      for (const user of usersResponse.results) {
        const avatar = user.avatarUrl || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
        const status: 'Đang dạy' | 'Tạm nghỉ' = user.isActive ? 'Đang dạy' : 'Tạm nghỉ'
        try {
          const tutorInfo = await apiCall<TutorInfoFromAPI>(`/tutors/${user.id}/info`)
          const subjects = Array.isArray(tutorInfo.subjects) ? tutorInfo.subjects : []
          const specialties = Array.isArray(tutorInfo.specialties) ? tutorInfo.specialties : []
          const displaySubjects = subjects.length > 0 ? subjects : ['Đang cập nhật']

          tutors.push({
            id: user.id,
            name: user.name,
            avatar,
            headline: tutorInfo.qualification || 'Đang cập nhật',
            subjects: displaySubjects,
            status,
            hasProfile: true,
          })

          profiles[user.id] = {
            id: user.id,
            name: user.name,
            avatar,
            subjects,
            status,
            experience: tutorInfo.experience || 'Đang cập nhật',
            qualification: tutorInfo.qualification || 'Đang cập nhật',
            email: user.email,
            phone: user.phone || 'Chưa cập nhật',
            bio: tutorInfo.bio || 'Chưa cập nhật',
            cvUrl: tutorInfo.cvUrl || '',
            specialties,
            totalStudents: typeof tutorInfo.totalStudents === 'number' ? tutorInfo.totalStudents : 0,
          }
        } catch (error) {
          console.error(`Error fetching info for tutor ${user.id}:`, error)
          tutors.push({
            id: user.id,
            name: user.name,
            avatar,
            headline: 'Đang cập nhật',
            subjects: ['Đang cập nhật'],
            status,
            hasProfile: false,
          })
          profiles[user.id] = {
            id: user.id,
            name: user.name,
            avatar,
            subjects: [],
            status,
            experience: 'Đang cập nhật',
            qualification: 'Đang cập nhật',
            email: user.email,
            phone: user.phone || 'Chưa cập nhật',
            bio: 'Thông tin đang được bổ sung.',
            cvUrl: '',
            specialties: [],
            totalStudents: 0,
          }
        }
      }

      setTutorList(tutors)
      setTutorProfiles(profiles)
      
      // Update pagination state
      setTutorPagination({
        page: usersResponse.page || tutorCurrentPage,
        limit: usersResponse.limit || tutorsPerPage,
        totalPages: usersResponse.totalPages || 1,
        totalResults: usersResponse.totalResults || 0,
      })
      
      setSelectedTutorId((prev) => {
        if (tutors.length === 0) {
          return ''
        }
        return tutors.some((tutor) => tutor.id === prev) ? prev : tutors[0].id
      })
      setNewSchedule((prev) => {
        if (tutors.length === 0) {
          return { ...prev, tutorId: '' }
        }
        if (tutors.some((tutor) => tutor.id === prev.tutorId)) {
          return prev
        }
        return { ...prev, tutorId: tutors[0].id }
      })
    } catch (error) {
      console.error('Error fetching tutors:', error)
      setTutorList([])
      setTutorProfiles({})
      setTutorPagination({
        page: 1,
        limit: tutorsPerPage,
        totalPages: 1,
        totalResults: 0,
      })
      setSelectedTutorId('')
      setNewSchedule((prev) => ({ ...prev, tutorId: '' }))
    } finally {
      setTutorsLoading(false)
    }
  }, [tutorCurrentPage, tutorSearchTerm, tutorsPerPage])

  const fetchSchedules = useCallback(async () => {
    try {
      setSchedulesLoading(true)
      const params = new URLSearchParams()
      params.append('limit', '200')
      params.append('sortBy', 'startTime:asc')

      const response = await apiCall<{
        results: Array<{
          id: string
          startTime: string
          duration: number
          subjectCode?: string
          studentId?: string
          tutorId?: string
          note?: string
          meetingURL?: string
          meetingLink?: string
          status?: string
        }>
      }>(`/schedules?${params.toString()}`)

      const mapped: ScheduleSession[] = response.results.map((session) => {
        const startDate = new Date(session.startTime)
        const endDate = addMinutes(startDate, session.duration ?? 0)
        return {
          id: session.id,
          date: format(startDate, 'yyyy-MM-dd'),
          startTime: format(startDate, 'HH:mm'),
          endTime: format(endDate, 'HH:mm'),
          subject: session.subjectCode || 'Chưa cập nhật',
          studentId: session.studentId || '',
          tutorId: session.tutorId || '',
          meetingLink: session.meetingURL || session.meetingLink || 'Chưa cập nhật',
          status: mapScheduleStatus(session.status),
          note: session.note,
        }
      })

      setScheduleSessions(mapped)
    } catch (error) {
      console.error('Error fetching schedules:', error)
      setScheduleSessions([])
    } finally {
      setSchedulesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  useEffect(() => {
    fetchTutors()
  }, [fetchTutors])

  useEffect(() => {
    fetchScheduleStudents()
  }, [fetchScheduleStudents])

  useEffect(() => {
    fetchEditScheduleStudents()
  }, [fetchEditScheduleStudents])

  useEffect(() => {
    fetchEditScheduleTutors()
  }, [fetchEditScheduleTutors])

  useEffect(() => {
    if (scheduleStudentList.length > 0 && !newSchedule.studentId) {
      setNewSchedule((prev) => ({ ...prev, studentId: prev.studentId || scheduleStudentList[0].id }))
    }
  }, [scheduleStudentList, newSchedule.studentId])

  useEffect(() => {
    if (tutorList.length > 0 && !newSchedule.tutorId) {
      setNewSchedule((prev) => ({ ...prev, tutorId: prev.tutorId || tutorList[0].id }))
    }
  }, [tutorList, newSchedule.tutorId])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  useEffect(() => {
    setIsStudentEditing(false)
    setStudentEditData(null)
  }, [selectedStudentId])

  useEffect(() => {
    setIsTutorEditing(false)
    setTutorEditData(null)
  }, [selectedTutorId])

  // Reset to page 1 when filter, search, or sort changes
  useEffect(() => {
    setCurrentPage(1)
  }, [roleFilter, searchTerm, sortField, sortOrder])

  const paginatedUsers = users

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      // Fetch user stats
      const userStats = await apiCall<{
        total: number
        student: number
        parent: number
        tutor: number
        admin: number
      }>('/users/stats')

      // Fetch today's schedule stats
      const scheduleStats = await apiCall<{ count: number }>('/schedules/stats/today')

      setStats({
        total: userStats.total,
        students: userStats.student || 0,
        tutors: userStats.tutor || 0,
        lessonsToday: scheduleStats.count || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Keep default values on error
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const fetchDashboardStats = useCallback(async () => {
    try {
      setDashboardStatsLoading(true)
      const response = await apiCall<{
        totalSchedules: number
        totalStudents: number
        totalTutors: number
        studentsParticipated: number
      }>('/schedules/stats/dashboard')

      setDashboardStats({
        totalSchedules: response.totalSchedules || 0,
        totalStudents: response.totalStudents || 0,
        totalTutors: response.totalTutors || 0,
        studentsParticipated: response.studentsParticipated || 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setDashboardStats({
        totalSchedules: 0,
        totalStudents: 0,
        totalTutors: 0,
        studentsParticipated: 0,
      })
    } finally {
      setDashboardStatsLoading(false)
    }
  }, [])

  const fetchMonthlyScheduleStats = useCallback(async () => {
    try {
      setMonthlyStatsLoading(true)
      const params = new URLSearchParams()
      params.append('months', selectedMonths.toString())
      
      const response = await apiCall<
        Array<{
          month: string
          monthStart: string
          monthEnd: string
          scheduleCount: number
        }>
      >(`/schedules/stats/schedules-per-month?${params.toString()}`)

      // Handle response - could be array directly or wrapped in object
      let allStats: Array<{
        month: string
        monthStart: string
        monthEnd: string
        scheduleCount: number
      }> = []
      
      if (Array.isArray(response)) {
        allStats = response
      } else if (response && typeof response === 'object' && 'results' in response) {
        allStats = (response as any).results || []
      } else if (response && typeof response === 'object' && 'data' in response) {
        allStats = (response as any).data || []
      }

      // API already returns data sorted and filtered by months parameter
      // Just ensure it's sorted by month
      const sortedStats = allStats.sort((a, b) => a.month.localeCompare(b.month))
      
      setMonthlyScheduleStats(sortedStats)
    } catch (error) {
      console.error('Error fetching monthly schedule stats:', error)
      setMonthlyScheduleStats([])
    } finally {
      setMonthlyStatsLoading(false)
    }
  }, [selectedMonths])

  const fetchTutorsPerSubject = useCallback(async () => {
    try {
      setTutorsPerSubjectLoading(true)
      const response = await apiCall<
        Array<{
          subject: string
          tutorCount: number
        }>
      >('/users/stats/tutors-per-subject')

      // Handle response - could be array directly or wrapped in object
      let data: Array<{
        subject: string
        tutorCount: number
      }> = []
      
      if (Array.isArray(response)) {
        data = response
      } else if (response && typeof response === 'object' && 'results' in response) {
        data = (response as any).results || []
      } else if (response && typeof response === 'object' && 'data' in response) {
        data = (response as any).data || []
      }

      setTutorsPerSubject(data)
    } catch (error) {
      console.error('Error fetching tutors per subject:', error)
      setTutorsPerSubject([])
    } finally {
      setTutorsPerSubjectLoading(false)
    }
  }, [])

  const fetchStudentsPerGrade = useCallback(async () => {
    try {
      setStudentsPerGradeLoading(true)
      const response = await apiCall<
        Array<{
          grade: string
          studentCount: number
        }>
      >('/users/stats/students-per-grade')

      // Handle response - could be array directly or wrapped in object
      let data: Array<{
        grade: string
        studentCount: number
      }> = []
      
      if (Array.isArray(response)) {
        data = response
      } else if (response && typeof response === 'object' && 'results' in response) {
        data = (response as any).results || []
      } else if (response && typeof response === 'object' && 'data' in response) {
        data = (response as any).data || []
      }

      setStudentsPerGrade(data)
    } catch (error) {
      console.error('Error fetching students per grade:', error)
      setStudentsPerGrade([])
    } finally {
      setStudentsPerGradeLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  useEffect(() => {
    switch (activeSection) {
      case 'user-management':
        refreshUsersList()
        break
      case 'student-management':
        fetchStudents()
        break
      case 'analytics':
        fetchStats()
        fetchDashboardStats()
        fetchMonthlyScheduleStats()
        fetchTutorsPerSubject()
        fetchStudentsPerGrade()
        break
      case 'schedule-management':
        fetchSchedules()
        break
      case 'tutor-management':
        fetchTutors()
        break
      default:
        break
    }
  }, [activeSection, refreshUsersList, fetchStudents, fetchTutors, fetchStats, fetchDashboardStats, fetchMonthlyScheduleStats, fetchTutorsPerSubject, fetchStudentsPerGrade])

  useEffect(() => {
    if (activeSection === 'analytics') {
      fetchMonthlyScheduleStats()
    }
  }, [selectedMonths, activeSection, fetchMonthlyScheduleStats])

  const totalStudents = stats.students
  const totalTutors = stats.tutors
  const lessonsToday = stats.lessonsToday

  const handleFilterChange = (value: 'all' | 'student' | 'tutor' | 'admin') => {
    setRoleFilter(value)
    setCurrentPage(1)
  }



  const handleStudentSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStudentSearchTerm(event.target.value)
    // Reset to page 1 when search changes
    setStudentCurrentPage(1)
  }
  
  const handleStudentPageChange = (page: number) => {
    setStudentCurrentPage(page)
  }

  const startStudentEditing = () => {
    if (!selectedStudentId) return
    const listItem = studentList.find((item) => item.id === selectedStudentId) ?? studentList[0]
    if (!listItem) return
    const baseProfile = studentProfiles[selectedStudentId] ?? buildPlaceholderProfile(listItem)
    setStudentEditData(cloneStudentProfile(baseProfile))
    setStudentArrayDrafts({
      strengths: (baseProfile.strengths ?? []).join('\n'),
      improvements: (baseProfile.improvements ?? []).join('\n'),
      hobbies: (baseProfile.hobbies ?? []).join('\n'),
      favoriteSubjects: (baseProfile.favoriteSubjects ?? []).join('\n'),
    })
    setIsStudentEditing(true)
  }

  const cancelStudentEditing = () => {
    setIsStudentEditing(false)
    setStudentEditData(null)
    setStudentArrayDrafts(initialStudentArrayDrafts)
  }

  const handleStudentEditFieldChange = (field: keyof StudentProfile, value: string) => {
    setStudentEditData((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleParentInfoChange = (field: keyof ParentInfo, value: string) => {
    setStudentEditData((prev) => {
      if (!prev) return prev
      const updatedParentInfo: ParentInfo = { ...prev.parentInfo, [field]: value }
      return {
        ...prev,
        parentInfo: updatedParentInfo,
        parentRequest: combineParentRequests(
          updatedParentInfo.fatherRequest,
          updatedParentInfo.motherRequest,
          prev.parentRequest,
        ),
      }
    })
  }

  const handleStudentArrayFieldChange = (field: EditableArrayField, value: string) => {
    setStudentArrayDrafts((prev) => ({
      ...prev,
      [field]: value,
    }))
    const items = value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
    setStudentEditData((prev) => (prev ? { ...prev, [field]: items } : prev))
  }

  const handleStudentAvatarUpload = async (file: File | null) => {
    if (!file) return
    try {
      setStudentAvatarUploading(true)
      const url = await uploadFile(file)
      setStudentEditData((prev) => (prev ? { ...prev, avatar: url } : prev))
    } catch (error) {
      console.error('Error uploading student avatar:', error)
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi upload ảnh học sinh')
    } finally {
      setStudentAvatarUploading(false)
    }
  }

  const handleStudentSave = async () => {
    if (!studentEditData || !selectedStudentId) return

    try {
      // Prepare request body according to API format
      const updateBody: any = {
        school: studentEditData.school,
        grade: studentEditData.grade,
        academicLevel: studentEditData.currentLevel, // Map currentLevel to academicLevel
        hobbies: studentEditData.hobbies,
        favoriteSubjects: studentEditData.favoriteSubjects,
        strengths: studentEditData.strengths,
        improvements: studentEditData.improvements,
        notes: studentEditData.notes,
      }

      // Add parent information (father/mother) – only include non-empty fields
      if (studentEditData.parentInfo) {
        const assignIfFilled = (key: string, value?: string | null) => {
          const trimmed = value?.trim()
          if (trimmed) {
            updateBody[key] = trimmed
          }
        }

        assignIfFilled('parent1Name', studentEditData.parentInfo.fatherName)
        assignIfFilled('parent1Number', studentEditData.parentInfo.fatherPhone)
        assignIfFilled(
          'parent1Email',
          studentEditData.parentInfo.fatherEmail || studentEditData.parentInfo.email,
        )
        assignIfFilled('parent1Request', studentEditData.parentInfo.fatherRequest)
        assignIfFilled('parent2Name', studentEditData.parentInfo.motherName)
        assignIfFilled('parent2Number', studentEditData.parentInfo.motherPhone)
        assignIfFilled('parent2Email', studentEditData.parentInfo.motherEmail)
        assignIfFilled('parent2Request', studentEditData.parentInfo.motherRequest)
      }

      // Call API to update student info
      const saveStudentInfo = async () => {
        try {
          await apiCall(`/students/${selectedStudentId}/info`, {
            method: 'PATCH',
            body: JSON.stringify(updateBody),
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
          if (errorMessage.includes('not found')) {
            await apiCall(`/students/${selectedStudentId}/info`, {
              method: 'POST',
              body: JSON.stringify(updateBody),
            })
          } else {
            throw error
          }
        }
      }

      await saveStudentInfo()

      const existingProfile = studentProfiles[selectedStudentId]
      const userUpdateBody: Record<string, string> = {}
      if (studentEditData.name?.trim() && (!existingProfile || studentEditData.name !== existingProfile.name)) {
        userUpdateBody.name = studentEditData.name.trim()
      }
      if (studentEditData.avatar && (!existingProfile || studentEditData.avatar !== existingProfile.avatar)) {
        userUpdateBody.avatarUrl = studentEditData.avatar
      }
      if (Object.keys(userUpdateBody).length > 0) {
        await apiCall(`/users/${selectedStudentId}`, {
          method: 'PATCH',
          body: JSON.stringify(userUpdateBody),
        })
      }

      // Update local state after successful API call
    setStudentProfiles((prev) => ({
      ...prev,
      [studentEditData.id]: cloneStudentProfile(studentEditData),
    }))
    setStudentList((prev) =>
      prev.map((student) =>
        student.id === studentEditData.id
          ? {
              ...student,
              name: studentEditData.name,
              grade: studentEditData.grade,
              address: studentEditData.address,
              avatar: studentEditData.avatar,
            }
          : student,
      ),
    )
    cancelStudentEditing()
      alert('Đã cập nhật thông tin học sinh thành công!')
    } catch (error) {
      console.error('Error updating student info:', error)
      let errorMessage = 'Có lỗi xảy ra khi cập nhật thông tin học sinh'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      alert(errorMessage)
    }
  }

  const handleTutorSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTutorSearchTerm(event.target.value)
    setTutorCurrentPage(1) // Reset to first page when search changes
  }


  const startTutorEditing = () => {
    if (tutorList.length === 0) return
    const listItem = tutorList.find((item) => item.id === selectedTutorId) ?? tutorList[0]
    if (!listItem) return
    const fallbackProfile = createInitialTutorProfiles([listItem])[listItem.id]
    const baseProfile = (selectedTutorId && tutorProfiles[selectedTutorId]) || fallbackProfile
    if (!baseProfile) return
    setTutorEditData(cloneTutorProfile(baseProfile))
    setTutorSubjectsInput(baseProfile.subjects.join(', '))
    setTutorSpecialtiesInput(baseProfile.specialties.join(', '))
    setIsTutorEditing(true)
  }

  const cancelTutorEditing = () => {
    setIsTutorEditing(false)
    setTutorEditData(null)
    setTutorSubjectsInput('')
    setTutorSpecialtiesInput('')
  }

  const handleTutorFieldChange = (field: keyof TutorProfile, value: string) => {
    setTutorEditData((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleTutorSubjectsChange = (value: string) => {
    setTutorSubjectsInput(value)
  }

  const handleTutorSubjectsBlur = () => {
    if (tutorEditData) {
      const subjects = tutorSubjectsInput.split(',').map((subject) => subject.trim()).filter(Boolean)
      setTutorEditData((prev) => (prev ? { ...prev, subjects } : prev))
      setTutorSubjectsInput(subjects.join(', '))
    }
  }

  const handleTutorSpecialtiesChange = (value: string) => {
    setTutorSpecialtiesInput(value)
  }

  const handleTutorSpecialtiesBlur = () => {
    if (tutorEditData) {
      const specialties = tutorSpecialtiesInput.split(',').map((specialty) => specialty.trim()).filter(Boolean)
      setTutorEditData((prev) => (prev ? { ...prev, specialties } : prev))
      setTutorSpecialtiesInput(specialties.join(', '))
    }
  }

  const handleTutorAvatarUpload = async (file: File | null) => {
    if (!file) return
    try {
      setTutorAvatarUploading(true)
      const url = await uploadFile(file)
      setTutorEditData((prev) => (prev ? { ...prev, avatar: url } : prev))
    } catch (error) {
      console.error('Error uploading tutor avatar:', error)
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi upload ảnh đại diện')
    } finally {
      setTutorAvatarUploading(false)
    }
  }

  const handleTutorCvUpload = async (file: File | null) => {
    if (!file) return
    try {
      setTutorCvUploading(true)
      const url = await uploadFile(file)
      setTutorEditData((prev) => (prev ? { ...prev, cvUrl: url } : prev))
    } catch (error) {
      console.error('Error uploading tutor CV:', error)
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi upload CV')
    } finally {
      setTutorCvUploading(false)
    }
  }

  const handleTutorSave = async () => {
    if (!tutorEditData) return
    try {
      setIsSavingTutor(true)

      // Parse subjects and specialties from input raw values before saving
      const subjects = tutorSubjectsInput.split(',').map((subject) => subject.trim()).filter(Boolean)
      const specialties = tutorSpecialtiesInput.split(',').map((specialty) => specialty.trim()).filter(Boolean)

      const tutorPayload = {
        subjects: subjects,
        experience: tutorEditData.experience ?? '',
        qualification: tutorEditData.qualification ?? '',
        specialties: specialties,
        bio: tutorEditData.bio ?? '',
        cvUrl: tutorEditData.cvUrl ?? '',
        totalStudents: typeof tutorEditData.totalStudents === 'number' ? tutorEditData.totalStudents : 0,
      }

      const saveTutorInfo = async () => {
        try {
          await apiCall(`/tutors/${tutorEditData.id}/info`, {
            method: 'PATCH',
            body: JSON.stringify(tutorPayload),
          })
        } catch (error) {
          const message = error instanceof Error ? error.message.toLowerCase() : ''
          if (message.includes('not found')) {
            await apiCall(`/tutors/${tutorEditData.id}/info`, {
              method: 'POST',
              body: JSON.stringify(tutorPayload),
            })
          } else {
            throw error
          }
        }
      }

      await saveTutorInfo()

      const userUpdateBody: Record<string, string> = {}
      if (tutorEditData.name?.trim()) {
        userUpdateBody.name = tutorEditData.name.trim()
      }
      if (tutorEditData.email?.trim()) {
        userUpdateBody.email = tutorEditData.email.trim()
      }
      if (tutorEditData.phone?.trim()) {
        userUpdateBody.phone = tutorEditData.phone.trim()
      }
      if (tutorEditData.avatar?.trim()) {
        userUpdateBody.avatarUrl = tutorEditData.avatar.trim()
      }

      if (Object.keys(userUpdateBody).length > 0) {
        await apiCall(`/users/${tutorEditData.id}`, {
          method: 'PATCH',
          body: JSON.stringify(userUpdateBody),
        })
      }

      // Update tutorEditData with parsed values
      const updatedTutorData = {
        ...tutorEditData,
        subjects,
        specialties,
      }

      setTutorProfiles((prev) => ({
        ...prev,
        [tutorEditData.id]: cloneTutorProfile(updatedTutorData),
      }))
      setTutorList((prev) =>
        prev.map((tutor) =>
          tutor.id === tutorEditData.id
            ? {
                ...tutor,
                name: tutorEditData.name,
                headline: tutorEditData.qualification,
                subjects: subjects.length > 0 ? subjects : ['Đang cập nhật'],
                status: tutorEditData.status,
              }
            : tutor,
        ),
      )

      await fetchTutors()
      cancelTutorEditing()
      alert('Đã cập nhật thông tin tutor.')
    } catch (error) {
      console.error('Error updating tutor info:', error)
      let errorMessage = 'Có lỗi xảy ra khi cập nhật thông tin tutor'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      alert(errorMessage)
    } finally {
      setIsSavingTutor(false)
    }
  }

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentCalendarMonth((prev) => (direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)))
  }

  const openScheduleModal = () => {
    setNewSchedule((prev) => ({ ...prev, date: selectedScheduleDate }))
    setShowScheduleModal(true)
  }

  const closeScheduleModal = () => {
    setShowScheduleModal(false)
  }

  const handleScheduleFieldChange = (field: keyof typeof newSchedule, value: string) => {
    setNewSchedule((prev) => ({ ...prev, [field]: value }))
  }

  const handleScheduleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newSchedule.date || !newSchedule.startTime || !newSchedule.endTime) {
      alert('Vui lòng nhập đầy đủ thông tin lịch dạy.')
      return
    }
    if (!newSchedule.studentId || !newSchedule.tutorId) {
      alert('Vui lòng chọn học sinh và tutor.')
      return
    }
    const startDateTime = new Date(`${newSchedule.date}T${newSchedule.startTime}`)
    const endDateTime = new Date(`${newSchedule.date}T${newSchedule.endTime}`)
    if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
      alert('Thời gian không hợp lệ. Vui lòng kiểm tra lại.')
      return
    }
    const duration = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60))
    if (duration <= 0) {
      alert('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.')
      return
    }

    const payload: Record<string, any> = {
      startTime: startDateTime.toISOString(),
      duration,
      subjectCode: 'GENERAL',
      studentId: newSchedule.studentId,
      tutorId: newSchedule.tutorId,
      meetingURL: newSchedule.meetingLink.trim() ? newSchedule.meetingLink.trim() : undefined,
      note: newSchedule.note?.trim() || undefined,
      status: 'upcoming',
    }

    if (!payload.subjectCode) {
      delete payload.subjectCode
    }

    if (newSchedule.meetingLink.trim() === '') {
      delete payload.meetingURL
    }

    try {
      setIsCreatingSchedule(true)
      await apiCall('/schedules', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      await fetchSchedules()
      setShowScheduleModal(false)
      setNewSchedule({
        date: todayString,
        startTime: '',
        endTime: '',
        studentId: studentList[0]?.id || '',
        tutorId: tutorList[0]?.id || '',
        meetingLink: '',
        note: '',
      })
      alert('Đã tạo lịch dạy mới!')
    } catch (error) {
      console.error('Error creating schedule:', error)
      let errorMessage = 'Có lỗi xảy ra khi tạo lịch. Vui lòng thử lại.'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      alert(errorMessage)
    } finally {
      setIsCreatingSchedule(false)
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    // Get access token from cookie
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
      throw new Error(errorData.message || 'Failed to upload file')
    }

    const data = await response.json()
    return data.file.url
  }

  const handleGenerateNewScheduleLink = async () => {
    try {
      setIsGeneratingNewScheduleLink(true)
      const response = await apiCall<{ meetingURL: string }>('/schedules/generate-meeting-link', {
        method: 'POST',
      })
      setNewSchedule((prev) => ({
        ...prev,
        meetingLink: response.meetingURL || prev.meetingLink,
      }))
    } catch (error) {
      console.error('Error generating meeting link:', error)
      let errorMessage = 'Không thể tạo link Meet. Vui lòng thử lại.'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      alert(errorMessage)
    } finally {
      setIsGeneratingNewScheduleLink(false)
    }
  }

  const handleGenerateMeetingLink = async (scheduleId: string) => {
    try {
      setGeneratingMeetingLinkId(scheduleId)
      const response = await apiCall<{ id: string; meetingURL: string }>(`/schedules/${scheduleId}/generate-meeting-link`, {
        method: 'POST',
      })
      setScheduleSessions((prev) =>
        prev.map((session) => (session.id === scheduleId ? { ...session, meetingLink: response.meetingURL || 'Chưa cập nhật' } : session)),
      )
      alert('Đã tạo link Meet thành công!')
    } catch (error) {
      console.error('Error generating meeting link:', error)
      let errorMessage = 'Không thể tạo link Meet. Vui lòng thử lại.'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      alert(errorMessage)
    } finally {
      setGeneratingMeetingLinkId(null)
    }
  }

  const startEditSchedule = (session: ScheduleSession) => {
    setEditScheduleData({
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      studentId: session.studentId,
      tutorId: session.tutorId,
      meetingLink: session.meetingLink || '',
      note: session.note || '',
      status: session.status,
    })
    setEditingScheduleId(session.id)
  }

  const cancelEditSchedule = () => {
    setEditingScheduleId(null)
    setEditScheduleData(null)
  }

  const handleEditScheduleFieldChange = (field: string, value: string) => {
    if (!editScheduleData) return
    setEditScheduleData((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  const handleUpdateSchedule = async (scheduleId: string) => {
    if (!editScheduleData) return

    if (!editScheduleData.date || !editScheduleData.startTime || !editScheduleData.endTime) {
      alert('Vui lòng nhập đầy đủ thông tin lịch dạy.')
      return
    }
    if (!editScheduleData.studentId || !editScheduleData.tutorId) {
      alert('Vui lòng chọn học sinh và tutor.')
      return
    }

    try {
      setIsUpdatingSchedule(true)
      const startDateTime = new Date(`${editScheduleData.date}T${editScheduleData.startTime}`)
      const endDateTime = new Date(`${editScheduleData.date}T${editScheduleData.endTime}`)
      if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
        alert('Thời gian không hợp lệ. Vui lòng kiểm tra lại.')
        return
      }
      const duration = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60))
      if (duration <= 0) {
        alert('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.')
        return
      }

      // Map status từ tiếng Việt về backend enum
      const statusMap: Record<string, string> = {
        'Sắp diễn ra': 'upcoming',
        'Đang diễn ra': 'ongoing',
        'Đã kết thúc': 'completed',
        'Đã hủy': 'cancelled',
      }
      const backendStatus = statusMap[editScheduleData.status] || editScheduleData.status

      const payload: Record<string, any> = {
        startTime: startDateTime.toISOString(),
        duration,
        studentId: editScheduleData.studentId,
        tutorId: editScheduleData.tutorId,
        meetingURL: editScheduleData.meetingLink.trim() ? editScheduleData.meetingLink.trim() : undefined,
        note: editScheduleData.note?.trim() || undefined,
        status: backendStatus,
      }

      await apiCall(`/schedules/${scheduleId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      await fetchSchedules()
      cancelEditSchedule()
      alert('Đã cập nhật lịch học thành công!')
    } catch (error) {
      console.error('Error updating schedule:', error)
      let errorMessage = 'Có lỗi xảy ra khi cập nhật lịch. Vui lòng thử lại.'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      alert(errorMessage)
    } finally {
      setIsUpdatingSchedule(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch học này?')) return

    try {
      setDeletingScheduleId(scheduleId)
      await apiCall(`/schedules/${scheduleId}`, {
        method: 'DELETE',
      })
      await fetchSchedules()
      alert('Đã xóa lịch học thành công!')
    } catch (error) {
      console.error('Error deleting schedule:', error)
      let errorMessage = 'Có lỗi xảy ra khi xóa lịch học. Vui lòng thử lại.'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      alert(errorMessage)
    } finally {
      setDeletingScheduleId(null)
    }
  }


  // Since search is server-side, display all students from current page
  const displayedStudents = studentList

  const selectedListItem = selectedStudentId 
    ? studentList.find((item) => item.id === selectedStudentId) ?? studentList[0]
    : studentList[0]
  const baseStudentProfile = selectedStudentId && studentProfiles[selectedStudentId]
    ? studentProfiles[selectedStudentId]
    : selectedListItem
      ? buildPlaceholderProfile(selectedListItem)
      : null
  const selectedStudent = isStudentEditing && studentEditData 
    ? studentEditData 
    : baseStudentProfile

  // Since search is server-side, display all tutors from current page
  const displayedTutors = tutorList

  const selectedTutorListItem = tutorList.length > 0 ? tutorList.find((item) => item.id === selectedTutorId) ?? tutorList[0] : null
  const baseTutorProfile =
    selectedTutorId && tutorProfiles[selectedTutorId]
      ? tutorProfiles[selectedTutorId]
      : selectedTutorListItem
      ? createInitialTutorProfiles([selectedTutorListItem])[selectedTutorListItem.id]
      : null
  const selectedTutor: TutorProfile | null = isTutorEditing && tutorEditData ? tutorEditData : baseTutorProfile

  const studentDetailSections: Array<{
    title: string
    field: EditableArrayField
    icon: JSX.Element
    placeholder: string
  }> = [
    {
      title: 'Điểm mạnh',
      field: 'strengths',
      icon: <Heart className="w-4 h-4 text-pink-500" />,
      placeholder: 'Mỗi dòng một điểm mạnh (nhấn Enter để xuống dòng)',
    },
    {
      title: 'Cần cải thiện',
      field: 'improvements',
      icon: <ClipboardList className="w-4 h-4 text-amber-500" />,
      placeholder: 'Mỗi dòng một mục cần cải thiện',
    },
    {
      title: 'Sở thích',
      field: 'hobbies',
      icon: <Heart className="w-4 h-4 text-rose-500" />,
      placeholder: 'Mỗi dòng một sở thích',
    },
    {
      title: 'Môn học yêu thích',
      field: 'favoriteSubjects',
      icon: <BookOpenCheck className="w-4 h-4 text-blue-500" />,
      placeholder: 'Mỗi dòng một môn học yêu thích',
    },
  ]

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentCalendarMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentCalendarMonth])

  const sessionsForSelectedDate = useMemo(
    () => scheduleSessions.filter((session) => session.date === selectedScheduleDate),
    [scheduleSessions, selectedScheduleDate],
  )



  const renderUserManagementSection = () => {
    return (
      <UserManagementSection
        stats={{
          total: stats.total,
          students: totalStudents,
          tutors: totalTutors,
          lessonsToday: lessonsToday,
        }}
        statsLoading={statsLoading}
        users={paginatedUsers}
        usersLoading={usersLoading}
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value)
          setCurrentPage(1)
        }}
        roleFilter={roleFilter}
        onRoleFilterChange={handleFilterChange}
        sortField={sortField}
        onSortFieldChange={setSortField}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        pagination={usersPagination}
        onPageChange={setCurrentPage}
        onRefresh={refreshUsersList}
      />
    )
  }

  const renderStudentManagementSection = () => (
    <div className="h-full overflow-hidden">
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Hồ sơ học sinh</h2>
        <p className="text-sm text-gray-600">Theo dõi thông tin chung và chi tiết theo yêu cầu phụ huynh</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
        <div className="card h-full flex flex-col overflow-hidden max-h-[85vh]">
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-gray-200 pb-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Danh sách học sinh</p>
              <h3 className="text-lg font-semibold text-gray-900">
                Tổng quan lớp học · {studentPagination.totalResults} học sinh
              </h3>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm">
              <Search className="w-4 h-4 text-gray-500 mr-2" />
              <input
                value={studentSearchTerm}
                onChange={handleStudentSearchChange}
                placeholder="Tìm kiếm học sinh theo tên..."
                className="text-sm text-gray-700 outline-none bg-transparent flex-1"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 mt-5">
            {studentsLoading ? (
              <div className="py-6 text-center text-sm text-gray-500">Đang tải dữ liệu...</div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {displayedStudents.map((student) => {
                const isActive = student.id === selectedStudentId
                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`text-left rounded-xl p-4 transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-500 shadow-lg ring-2 ring-primary-100'
                        : 'bg-white border-2 border-gray-200 hover:border-primary-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                        <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-bold truncate ${isActive ? 'text-primary-700' : 'text-gray-900'}`}>
                          {student.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {student.grade && !isNaN(Number(student.grade)) 
                            ? `Lớp ${student.grade}` 
                            : (student.grade || 'Chưa cập nhật lớp')}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 truncate">{student.address}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            )}
            {!studentsLoading && displayedStudents.length === 0 && <div className="py-6 text-center text-sm text-gray-500">Không tìm thấy học sinh phù hợp.</div>}
          </div>

          {/* Pagination Controls */}
          {!studentsLoading && studentPagination.totalPages > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-gray-600 font-semibold">
                {studentPagination.totalResults === 0 ? (
                  'Không có học sinh'
                ) : (
                  `Hiển thị ${(studentPagination.page - 1) * studentPagination.limit + 1}-${Math.min(
                    studentPagination.page * studentPagination.limit,
                    studentPagination.totalResults
                  )} trong tổng ${studentPagination.totalResults} học sinh`
                )}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  disabled={studentPagination.page === 1 || studentsLoading}
                  onClick={() => handleStudentPageChange(Math.max(1, studentPagination.page - 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: studentPagination.totalPages }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleStudentPageChange(idx + 1)}
                      disabled={studentsLoading}
                      className={`w-8 h-8 rounded-lg text-sm font-semibold ${
                        studentPagination.page === idx + 1
                          ? 'bg-primary-500 text-white'
                          : 'border border-gray-200 text-gray-600 hover:border-primary-200'
                      } disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={studentPagination.page === studentPagination.totalPages || studentsLoading}
                  onClick={() => handleStudentPageChange(Math.min(studentPagination.totalPages, studentPagination.page + 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  Sau
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card h-full flex flex-col overflow-hidden max-h-[85vh]">
          {!selectedStudent ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-sm">Vui lòng chọn học sinh để xem thông tin chi tiết</p>
              </div>
            </div>
          ) : (
            <>
          <div>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-6 pb-4 border-b border-gray-200">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Thông tin chi tiết</p>
                <h3 className="text-xl font-semibold text-gray-900">{selectedStudent.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{selectedStudent.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isStudentEditing ? (
                  <>
                    <button onClick={handleStudentSave} className="btn-primary text-sm px-4 py-2">
                      Lưu
                    </button>
                    <button onClick={cancelStudentEditing} className="btn-secondary text-sm px-4 py-2">
                      Hủy
                    </button>
                  </>
                ) : (
                  <button onClick={startStudentEditing} className="btn-primary text-sm px-4 py-2">
                    Chỉnh sửa
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            <div className="w-full rounded-2xl border border-gray-100 bg-gray-50/70 p-4 flex flex-col gap-3 md:flex-row md:items-center md:gap-4 shadow-inner">
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                  <img src={studentEditData?.avatar ?? selectedStudent.avatar} alt={selectedStudent.name} className="w-full h-full object-cover" />
                </div>
                {isStudentEditing && (
                  <label className="text-xs font-semibold text-primary-600 cursor-pointer flex items-center gap-1">
                    {studentAvatarUploading ? 'Đang upload...' : 'Đổi ảnh'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
                        const maxSize = 5 * 1024 * 1024
                        if (!validTypes.includes(file.type)) {
                          alert('Vui lòng chọn file ảnh (jpg, png, gif, webp)')
                          e.target.value = ''
                          return
                        }
                        if (file.size > maxSize) {
                          alert('Kích thước ảnh không được vượt quá 5MB')
                          e.target.value = ''
                          return
                        }
                        handleStudentAvatarUpload(file)
                      }}
                    />
                  </label>
                )}
              </div>
              <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Học sinh</p>
              {isStudentEditing ? (
                <div className="space-y-3">
                  <input
                    className="w-full px-4 py-3 text-base font-semibold bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                    value={studentEditData?.name ?? ''}
                    onChange={(e) => handleStudentEditFieldChange('name', e.target.value)}
                    placeholder="Nhập tên học sinh"
                  />
                  <input
                    className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                    value={studentEditData?.school ?? ''}
                    onChange={(e) => handleStudentEditFieldChange('school', e.target.value)}
                    placeholder="Nhập trường học"
                  />
                  <select
                    className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                    value={studentEditData?.status ?? 'Đang học'}
                    onChange={(e) => handleStudentEditFieldChange('status', e.target.value as StudentProfile['status'])}
                  >
                    <option value="Đang học">Đang học</option>
                    <option value="Tạm dừng">Tạm dừng</option>
                  </select>
                </div>
              ) : (
                <>
                  <h4 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h4>
                  <p className="text-sm text-gray-500">
                    {selectedStudent.grade && !isNaN(Number(selectedStudent.grade)) 
                      ? `Lớp ${selectedStudent.grade}` 
                      : (selectedStudent.grade || 'Chưa cập nhật lớp')} • {selectedStudent.school || 'Đang cập nhật'}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-2xl border border-gray-100 bg-gray-50/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-inner flex-shrink-0">
                <Calendar className="w-4 h-4 text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-[0.2em] mb-0.5">Ngày sinh</p>
                {isStudentEditing ? (
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                    value={studentEditData?.dob ?? ''}
                    onChange={(e) => handleStudentEditFieldChange('dob', e.target.value)}
                    placeholder="Chọn ngày sinh"
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900 truncate">{new Date(selectedStudent.dob).toLocaleDateString('vi-VN')}</p>
                )}
              </div>
            </div>

            <div className="p-3 rounded-2xl border border-gray-100 bg-gray-50/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-inner flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-[0.2em] mb-0.5">Địa chỉ</p>
                {isStudentEditing ? (
                  <input
                    className="w-full px-4 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                    value={studentEditData?.address ?? ''}
                    onChange={(e) => handleStudentEditFieldChange('address', e.target.value)}
                    placeholder="Nhập địa chỉ"
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900 truncate">{selectedStudent.address}</p>
                )}
              </div>
            </div>

            <div className="p-3 rounded-2xl border border-gray-100 bg-gray-50/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-inner flex-shrink-0">
                <BookOpenCheck className="w-4 h-4 text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-[0.2em] mb-0.5">Trường học</p>
                {isStudentEditing ? (
                  <input
                    className="w-full px-4 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                    value={studentEditData?.school ?? ''}
                    onChange={(e) => handleStudentEditFieldChange('school', e.target.value)}
                    placeholder="Nhập tên trường học"
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900 truncate">{selectedStudent.school}</p>
                )}
              </div>
            </div>

            <div className="p-3 rounded-2xl border border-gray-100 bg-gray-50/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-inner flex-shrink-0">
                <BookOpenCheck className="w-4 h-4 text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-[0.2em] mb-0.5">Lớp</p>
                {isStudentEditing ? (
                  <select
                    className="w-full px-4 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all cursor-pointer"
                    value={studentEditData?.grade ?? ''}
                    onChange={(e) => handleStudentEditFieldChange('grade', e.target.value)}
                  >
                    <option value="">Chọn lớp</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                      <option key={grade} value={grade.toString()}>
                        {grade}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {selectedStudent.grade || 'Chưa cập nhật'}
                  </p>
                )}
              </div>
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-3">
              <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-inner">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em] mb-2">Trình độ hiện tại</p>
                {isStudentEditing ? (
                  <textarea
                    className="w-full px-4 py-3 text-sm min-h-[100px] bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all resize-y"
                    value={studentEditData?.currentLevel ?? ''}
                    onChange={(e) => handleStudentEditFieldChange('currentLevel', e.target.value)}
                    placeholder="Nhập trình độ hiện tại"
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedStudent.currentLevel}</p>
                )}
              </div>
              <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-inner">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em] mb-2">Email liên hệ</p>
                {isStudentEditing ? (
                  <input
                    type="email"
                    className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                    value={studentEditData?.parentInfo.email ?? ''}
                    onChange={(e) => handleParentInfoChange('email', e.target.value)}
                    placeholder="Nhập email liên hệ"
                  />
                ) : (
                  <p className="text-sm font-semibold text-primary-600">{selectedStudent.parentInfo.email}</p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em] mb-2">Phụ huynh</p>
                <div className="space-y-2">
                  {[
                    {
                      title: 'Bố',
                      nameKey: 'fatherName' as const,
                      phoneKey: 'fatherPhone' as const,
                      emailKey: 'fatherEmail' as const,
                      requestKey: 'fatherRequest' as const,
                      namePlaceholder: 'Họ và tên bố',
                      phonePlaceholder: 'Số điện thoại bố',
                    },
                    {
                      title: 'Mẹ',
                      nameKey: 'motherName' as const,
                      phoneKey: 'motherPhone' as const,
                      emailKey: 'motherEmail' as const,
                      requestKey: 'motherRequest' as const,
                      namePlaceholder: 'Họ và tên mẹ',
                      phonePlaceholder: 'Số điện thoại mẹ',
                    },
                  ].map((parent) => (
                    <div key={parent.title} className="flex flex-col gap-1.5">
                      <p className="text-xs text-gray-500 uppercase tracking-[0.2em]">{parent.title}</p>
                      {isStudentEditing ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              className="w-full px-4 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                              value={studentEditData?.parentInfo[parent.nameKey] ?? ''}
                              onChange={(e) => handleParentInfoChange(parent.nameKey, e.target.value)}
                              placeholder={parent.namePlaceholder}
                            />
                            <input
                              className="w-full px-4 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                              value={studentEditData?.parentInfo[parent.phoneKey] ?? ''}
                              onChange={(e) => handleParentInfoChange(parent.phoneKey, e.target.value)}
                              placeholder={parent.phonePlaceholder}
                            />
                          </div>
                          <input
                            className="w-full px-4 py-2.5 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                            type="email"
                            value={studentEditData?.parentInfo[parent.emailKey] ?? ''}
                            onChange={(e) => handleParentInfoChange(parent.emailKey, e.target.value)}
                            placeholder="Email liên hệ"
                          />
                          <textarea
                            className="w-full px-4 py-2.5 text-sm min-h-[80px] bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all resize-y"
                            value={studentEditData?.parentInfo[parent.requestKey] ?? ''}
                            onChange={(e) => handleParentInfoChange(parent.requestKey, e.target.value)}
                            placeholder="Yêu cầu/phản hồi"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-900">{selectedStudent.parentInfo[parent.nameKey]}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4 text-primary-500" />
                              {selectedStudent.parentInfo[parent.phoneKey]}
                            </div>
                          </div>
                          {selectedStudent.parentInfo[parent.emailKey] && (
                            <p className="text-xs text-gray-600">{selectedStudent.parentInfo[parent.emailKey]}</p>
                          )}
                          {selectedStudent.parentInfo[parent.requestKey] && (
                            <p className="text-xs italic text-gray-500">{selectedStudent.parentInfo[parent.requestKey]}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3">
              {studentDetailSections.map((section) => {
                const currentItems = (selectedStudent[section.field] as string[]) ?? []
                const editingValue = ((studentEditData?.[section.field] as string[]) ?? []).join('\n')
                return (
                  <div key={section.title} className="p-3 rounded-2xl border border-gray-100 bg-gray-50/60">
                    <div className="flex items-center gap-2 mb-2">
                      {section.icon}
                      <p className="text-sm font-semibold text-gray-900">{section.title}</p>
                    </div>
                    {isStudentEditing ? (
                  <textarea
                        className="w-full px-4 py-2.5 text-sm min-h-[100px] bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all resize-y whitespace-pre-wrap"
                        value={studentArrayDrafts[section.field] ?? editingValue}
                    onChange={(e) => handleStudentArrayFieldChange(section.field, e.target.value)}
                    placeholder={section.placeholder}
                  />
                ) : section.field === 'favoriteSubjects' ? (
                      <div className="flex flex-wrap gap-1.5">
                        {currentItems.length > 0 ? (
                          currentItems.map((item: string) => (
                            <span key={item} className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary-50 text-primary-600">
                              {item}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">Chưa có môn học yêu thích</p>
                        )}
                      </div>
                    ) : (
                      <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
                        {currentItems.length > 0 ? (
                          currentItems.map((item: string) => (
                            <li key={item}>{item}</li>
                          ))
                        ) : (
                          <li className="text-gray-500">Chưa có thông tin</li>
                        )}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-inner">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em] mb-2">Ghi chú tổng quan</p>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedStudent.notes || 'Chưa có ghi chú'}</p>
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  const renderTutorManagementSection = () => {
    if (tutorsLoading) {
      return (
        <div className="flex items-center justify-center h-full py-10">
          <div className="card max-w-md text-center text-gray-600">Đang tải dữ liệu tutor...</div>
        </div>
      )
    }

    if (!selectedTutor) {
      return (
        <div className="card text-center text-gray-500">
          Chưa có dữ liệu tutor. Vui lòng tạo tài khoản tutor hoặc cập nhật thông tin.
        </div>
      )
    }

    return (
      <div className="h-full overflow-hidden">
        <div className="flex flex-col gap-2 mb-6">
          <h2 className="text-4xl font-extrabold text-gray-900">Quản lý tutor</h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
          <div className="card h-full flex flex-col overflow-hidden max-h-[85vh]">
            <div className="border-b border-gray-200 pb-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Danh sách tutor</p>
                <h3 className="text-lg font-semibold text-gray-900">
                  Tổng quan · {tutorPagination.totalResults} tutor
                </h3>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm">
                <Search className="w-4 h-4 text-gray-500 mr-2" />
                <input
                  value={tutorSearchTerm}
                  onChange={handleTutorSearchChange}
                  placeholder="Tìm kiếm tutor theo tên..."
                  className="text-sm text-gray-700 outline-none bg-transparent flex-1"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 mt-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {displayedTutors.map((tutor) => {
                  const isActive = tutor.id === selectedTutorId
                  return (
                    <button
                      key={tutor.id}
                      onClick={() => setSelectedTutorId(tutor.id)}
                      className={`text-left rounded-xl p-4 transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-500 shadow-lg ring-2 ring-purple-100'
                          : 'bg-white border-2 border-gray-200 hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                          <img src={tutor.avatar} alt={tutor.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-lg font-bold truncate ${isActive ? 'text-purple-700' : 'text-gray-900'}`}>
                            {tutor.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1 truncate">{tutor.headline}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tutor.subjects.slice(0, 2).map((subject) => (
                              <span key={subject} className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-600">
                                {subject}
                              </span>
                            ))}
                            {tutor.subjects.length > 2 && (
                              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-600">
                                +{tutor.subjects.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              {!tutorsLoading && displayedTutors.length === 0 && <div className="py-6 text-center text-sm text-gray-500">Không tìm thấy tutor phù hợp.</div>}
            </div>
            
            {/* Pagination Controls */}
            {!tutorsLoading && tutorPagination.totalPages > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Trang {tutorPagination.page} / {tutorPagination.totalPages} · Tổng {tutorPagination.totalResults} tutor
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTutorCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={tutorPagination.page === 1 || tutorsLoading}
                    className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Trước
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, tutorPagination.totalPages) }, (_, i) => {
                      let pageNum: number
                      if (tutorPagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (tutorPagination.page <= 3) {
                        pageNum = i + 1
                      } else if (tutorPagination.page >= tutorPagination.totalPages - 2) {
                        pageNum = tutorPagination.totalPages - 4 + i
                      } else {
                        pageNum = tutorPagination.page - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setTutorCurrentPage(pageNum)}
                          disabled={tutorsLoading}
                          className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                            tutorPagination.page === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setTutorCurrentPage((prev) => Math.min(tutorPagination.totalPages, prev + 1))}
                    disabled={tutorPagination.page === tutorPagination.totalPages || tutorsLoading}
                    className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card h-full flex flex-col overflow-hidden max-h-[85vh]">
            <div>
              <div className="flex items-center justify-between gap-3 flex-wrap mb-6 pb-4 border-b border-gray-200">
                <div>
                <p className="text-sm font-bold text-gray-600 uppercase tracking-[0.3em]">Hồ sơ tutor</p>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedTutor.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-3 py-0.5 text-xs font-semibold rounded-full bg-white border border-gray-200 text-gray-700">{selectedTutor.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isTutorEditing ? (
                    <>
                      <button
                        onClick={handleTutorSave}
                        className={`btn-primary text-sm px-4 py-2 ${isSavingTutor ? 'opacity-60 cursor-not-allowed' : ''}`}
                        disabled={isSavingTutor}
                      >
                        {isSavingTutor ? 'Đang lưu...' : 'Lưu'}
                      </button>
                      <button onClick={cancelTutorEditing} className="btn-secondary text-sm px-4 py-2">
                        Hủy
                      </button>
                    </>
                  ) : (
                    <button onClick={startTutorEditing} className="btn-primary text-sm px-4 py-2">
                      Chỉnh sửa
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-5">
              <div className="w-full rounded-3xl border border-gray-100 bg-gray-50/70 p-5 flex flex-col gap-4 md:flex-row md:items-center md:gap-5 shadow-inner">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                    <img src={tutorEditData?.avatar ?? selectedTutor.avatar} alt={selectedTutor.name} className="w-full h-full object-cover" />
                  </div>
                  {isTutorEditing && (
                    <label className="text-xs font-semibold text-primary-600 cursor-pointer flex items-center gap-1 hover:text-primary-700">
                      {tutorAvatarUploading ? (
                        <>
                          <Clock className="w-3 h-3 animate-spin" />
                          Đang upload...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3 h-3" />
                          Đổi ảnh
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={tutorAvatarUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
                          const maxSize = 5 * 1024 * 1024
                          if (!validTypes.includes(file.type)) {
                            alert('Vui lòng chọn file ảnh (jpg, png, gif, webp)')
                            e.target.value = ''
                            return
                          }
                          if (file.size > maxSize) {
                            alert('Kích thước ảnh không được vượt quá 5MB')
                            e.target.value = ''
                            return
                          }
                          handleTutorAvatarUpload(file)
                        }}
                      />
                    </label>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Tutor</p>
                  {isTutorEditing ? (
                    <div className="space-y-3">
                      <input 
                        className="w-full px-4 py-3 text-base font-semibold bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all" 
                        value={tutorEditData?.name ?? ''} 
                        onChange={(e) => handleTutorFieldChange('name', e.target.value)} 
                      />
                      <input
                        className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                        value={tutorEditData?.qualification ?? ''}
                        onChange={(e) => handleTutorFieldChange('qualification', e.target.value)}
                        placeholder="Nhập học vị/chuyên môn (ví dụ: Thạc sĩ Toán ứng dụng)"
                      />
                      <select 
                        className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all" 
                        value={tutorEditData?.status ?? 'Đang dạy'} 
                        onChange={(e) => handleTutorFieldChange('status', e.target.value)}
                      >
                        <option value="Đang dạy">Đang dạy</option>
                        <option value="Tạm nghỉ">Tạm nghỉ</option>
                      </select>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-2xl font-bold text-gray-900">{selectedTutor.name}</h4>
                      <p className="text-sm text-gray-500">{selectedTutor.qualification?.trim() || 'Chưa cập nhật'}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60">
                  <p className="text-xs font-semibold uppercase text-gray-500 tracking-[0.2em] mb-2">Kinh nghiệm</p>
                  {isTutorEditing ? (
                    <textarea 
                      className="w-full px-4 py-3 text-sm min-h-[100px] bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all resize-y" 
                      value={tutorEditData?.experience ?? ''} 
                      onChange={(e) => handleTutorFieldChange('experience', e.target.value)} 
                    />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 leading-relaxed mt-2">{selectedTutor.experience}</p>
                  )}
                </div>
                <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60">
                  <p className="text-xs font-semibold uppercase text-gray-500 tracking-[0.2em] mb-2">Liên hệ</p>
                  {isTutorEditing ? (
                    <div className="space-y-3 mt-2">
                      <input 
                        className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all" 
                        value={tutorEditData?.email ?? ''} 
                        onChange={(e) => handleTutorFieldChange('email', e.target.value)} 
                        placeholder="Email" 
                      />
                      <input 
                        className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all" 
                        value={tutorEditData?.phone ?? ''} 
                        onChange={(e) => handleTutorFieldChange('phone', e.target.value)} 
                        placeholder="Số điện thoại" 
                      />
                    </div>
                  ) : (
                    <div className="space-y-2 mt-2">
                      <p className="text-sm font-semibold text-gray-900">{selectedTutor.email}</p>
                      <p className="text-sm text-gray-600">{selectedTutor.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-2xl border border-gray-100 bg-gray-50/60">
                  <p className="text-xs font-semibold uppercase text-gray-500 tracking-[0.2em] mb-2">Môn phụ trách</p>
                  {isTutorEditing ? (
                    <input
                      className="w-full px-3 py-2.5 text-sm mt-2 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                      value={tutorSubjectsInput}
                      onChange={(e) => handleTutorSubjectsChange(e.target.value)}
                      onBlur={handleTutorSubjectsBlur}
                      placeholder="Ngăn cách bằng dấu phẩy"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedTutor.subjects.length > 0 ? (
                        selectedTutor.subjects.map((subject) => (
                          <span key={subject} className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-600">
                            {subject}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">Chưa cập nhật</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60">
                  <p className="text-xs font-semibold uppercase text-gray-500 tracking-[0.2em] mb-2">Chuyên môn</p>
                  {isTutorEditing ? (
                    <input
                      className="w-full px-4 py-3 text-sm mt-2 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all"
                      value={tutorSpecialtiesInput}
                      onChange={(e) => handleTutorSpecialtiesChange(e.target.value)}
                      onBlur={handleTutorSpecialtiesBlur}
                      placeholder="Ngăn cách bằng dấu phẩy"
                    />
                  ) : selectedTutor.specialties.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedTutor.specialties.map((specialty) => (
                        <span key={specialty} className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">Chưa cập nhật</p>
                  )}
                </div>
              </div>

              <div>
                <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-inner">
                  <p className="text-xs font-semibold uppercase text-gray-500 tracking-[0.2em] mb-2">Hồ sơ & CV</p>
                  {isTutorEditing ? (
                    <div className="space-y-3 mt-2">
                      <div className="flex items-center gap-2">
                        <label className={`flex-1 px-3 py-2.5 text-sm font-semibold rounded-lg border-2 border-gray-300 cursor-pointer text-center transition-all flex items-center justify-center gap-2 ${
                          tutorCvUploading 
                            ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                            : 'bg-white hover:border-primary-500 hover:bg-primary-50 text-gray-700'
                        }`}>
                          {tutorCvUploading ? (
                            <>
                              <Clock className="w-4 h-4 animate-spin" />
                              Đang upload...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4" />
                              Upload CV
                            </>
                          )}
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            disabled={tutorCvUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
                              const maxSize = 10 * 1024 * 1024 // 10MB
                              if (!validTypes.includes(file.type)) {
                                alert('Vui lòng chọn file PDF hoặc Word (.pdf, .doc, .docx)')
                                e.target.value = ''
                                return
                              }
                              if (file.size > maxSize) {
                                alert('Kích thước file không được vượt quá 10MB')
                                e.target.value = ''
                                return
                              }
                              handleTutorCvUpload(file)
                            }}
                          />
                        </label>
                      </div>
                      <div className="text-xs text-gray-500">Hoặc nhập link CV:</div>
                      <input 
                        className="w-full px-4 py-3 text-sm bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all" 
                        value={tutorEditData?.cvUrl ?? ''} 
                        onChange={(e) => handleTutorFieldChange('cvUrl', e.target.value)} 
                        placeholder="Link CV (Drive, PDF...)" 
                      />
                      {tutorEditData?.cvUrl && (
                        <a href={tutorEditData.cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary-600 text-xs font-semibold hover:underline">
                          <FileText className="w-3 h-3 mr-1" />
                          Xem CV hiện tại
                        </a>
                      )}
                    </div>
                  ) : selectedTutor.cvUrl ? (
                    <a href={selectedTutor.cvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-primary-600 text-sm font-semibold hover:underline">
                      <FileText className="w-4 h-4 mr-2" />
                      Xem CV
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500">Chưa cập nhật CV</p>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-inner">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em] mb-2">Giới thiệu</p>
                {isTutorEditing ? (
                  <textarea 
                    className="w-full px-4 py-3 text-sm min-h-[120px] mt-2 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition-all resize-y" 
                    value={tutorEditData?.bio ?? ''} 
                    onChange={(e) => handleTutorFieldChange('bio', e.target.value)} 
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed mt-2">{selectedTutor.bio}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderScheduleManagementSection = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
      <h2 className="text-4xl font-extrabold text-gray-900">
  Quản lý lịch dạy
</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card p-0 overflow-hidden xl:col-span-1">
          <div className="bg-primary-500 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em]">Lịch học</p>
              <h3 className="text-xl font-semibold">{format(currentCalendarMonth, 'MMMM yyyy', { locale: vi })}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleMonthChange('prev')} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-lg">
                ‹
              </button>
              <button onClick={() => handleMonthChange('next')} className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-lg">
                ›
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 text-center text-xs text-gray-500 font-semibold uppercase tracking-wide">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 mt-2">
              {calendarDays.map((day) => {
                const dayKey = format(day, 'yyyy-MM-dd')
                const hasSession = scheduleSessions.some((session) => session.date === dayKey)
                const isSelected = selectedScheduleDate === dayKey
                return (
                  <button
                    key={dayKey}
                    onClick={() => setSelectedScheduleDate(dayKey)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-semibold transition-all ${
                      !isSameMonth(day, currentCalendarMonth) ? 'text-gray-300' : isSelected ? 'bg-primary-500 text-white shadow' : 'text-gray-700 hover:bg-primary-50'
                    }`}
                  >
                    <span>{day.getDate()}</span>
                    {hasSession && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary-500'} mt-1`} />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="card xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Ngày {format(new Date(selectedScheduleDate), "d 'tháng' M", { locale: vi })}</p>
              <h3 className="text-xl font-semibold text-gray-900">Lịch trong ngày</h3>
            </div>
            <button onClick={openScheduleModal} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
              <Calendar className="w-4 h-4" />
              Tạo lịch mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Khung giờ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Học sinh</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tutor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Link Meet</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ghi chú</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedulesLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                      Đang tải dữ liệu lịch học...
                    </td>
                  </tr>
                ) : sessionsForSelectedDate.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                      Chưa có lịch học nào trong ngày.
                    </td>
                  </tr>
                ) : (
                  sessionsForSelectedDate.map((session) => {
                    // Tìm từ danh sách đầy đủ trước, nếu không có thì tìm từ danh sách phân trang
                    const student = editScheduleStudentList.find((s) => s.id === session.studentId) 
                      || studentList.find((s) => s.id === session.studentId)
                    const tutor = editScheduleTutorList.find((t) => t.id === session.tutorId)
                      || tutorList.find((t) => t.id === session.tutorId)
                    const isEditing = editingScheduleId === session.id
                    return (
                      <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {isEditing && editScheduleData ? (
                            <div className="space-y-2">
                              <input
                                type="date"
                                className="input text-xs w-full"
                                value={editScheduleData.date}
                                onChange={(e) => handleEditScheduleFieldChange('date', e.target.value)}
                              />
                              <div className="flex gap-2">
                                <input
                                  type="time"
                                  className="input text-xs flex-1"
                                  value={editScheduleData.startTime}
                                  onChange={(e) => handleEditScheduleFieldChange('startTime', e.target.value)}
                                />
                                <span className="self-center text-gray-400">-</span>
                                <input
                                  type="time"
                                  className="input text-xs flex-1"
                                  value={editScheduleData.endTime}
                                  onChange={(e) => handleEditScheduleFieldChange('endTime', e.target.value)}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">
                                {session.startTime} - {session.endTime}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {isEditing && editScheduleData ? (
                            <select
                              className="input text-xs w-full"
                              value={editScheduleData.studentId}
                              onChange={(e) => handleEditScheduleFieldChange('studentId', e.target.value)}
                            >
                              <option value="">-- Chọn học sinh --</option>
                              {editScheduleStudentList.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            student?.name || '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {isEditing && editScheduleData ? (
                            <select
                              className="input text-xs w-full"
                              value={editScheduleData.tutorId}
                              onChange={(e) => handleEditScheduleFieldChange('tutorId', e.target.value)}
                            >
                              <option value="">-- Chọn tutor --</option>
                              {editScheduleTutorList.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            tutor?.name || '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isEditing && editScheduleData ? (
                            <input
                              type="text"
                              className="input text-xs w-full"
                              value={editScheduleData.meetingLink}
                              onChange={(e) => handleEditScheduleFieldChange('meetingLink', e.target.value)}
                              placeholder="https://meet.google.com/..."
                            />
                          ) : session.meetingLink && session.meetingLink !== 'Chưa cập nhật' ? (
                            <a href={session.meetingLink} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline truncate block max-w-xs">
                              {session.meetingLink}
                            </a>
                          ) : (
                            <button
                              onClick={() => handleGenerateMeetingLink(session.id)}
                              disabled={generatingMeetingLinkId === session.id}
                              className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                                generatingMeetingLinkId === session.id
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                  : 'bg-white text-primary-600 border-primary-200 hover:bg-primary-50'
                              }`}
                            >
                              {generatingMeetingLinkId === session.id ? 'Đang tạo...' : 'Tạo link'}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isEditing && editScheduleData ? (
                            <select
                              className="input text-xs w-full"
                              value={editScheduleData.status}
                              onChange={(e) => handleEditScheduleFieldChange('status', e.target.value)}
                            >
                              <option value="Sắp diễn ra">Sắp diễn ra</option>
                              <option value="Đang diễn ra">Đang diễn ra</option>
                              <option value="Đã kết thúc">Đã kết thúc</option>
                              <option value="Đã hủy">Đã hủy</option>
                            </select>
                          ) : (
                            <span
                              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                session.status === 'Đã kết thúc'
                                  ? 'bg-gray-200 text-gray-600'
                                  : session.status === 'Sắp diễn ra'
                                  ? 'bg-green-100 text-green-600'
                                  : session.status === 'Đang diễn ra'
                                  ? 'bg-blue-100 text-blue-600'
                                  : session.status === 'Đã hủy'
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {session.status}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs">
                          {isEditing && editScheduleData ? (
                            <input
                              type="text"
                              className="input text-xs w-full"
                              value={editScheduleData.note}
                              onChange={(e) => handleEditScheduleFieldChange('note', e.target.value)}
                              placeholder="Ghi chú..."
                            />
                          ) : (
                            <span className="truncate block">{session.note || '—'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateSchedule(session.id)}
                                disabled={isUpdatingSchedule}
                                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                {isUpdatingSchedule ? 'Đang lưu...' : 'Lưu'}
                              </button>
                              <button
                                onClick={cancelEditSchedule}
                                disabled={isUpdatingSchedule}
                                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" />
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => startEditSchedule(session)}
                                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(session.id)}
                                disabled={deletingScheduleId === session.id}
                                className={`text-xs px-3 py-1.5 flex items-center gap-1 rounded-lg border transition-colors ${
                                  deletingScheduleId === session.id
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                                }`}
                              >
                                <Trash2 className="w-3 h-3" />
                                {deletingScheduleId === session.id ? 'Đang xóa...' : 'Xóa'}
                              </button>
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
      </div>
    </div>
  )

  // Tính toán dữ liệu thống kê cho analytics
  const sessionDataByMonth = useMemo(() => {
    // Convert API data format (YYYY-MM) to display format (MM/yyyy)
    if (!monthlyScheduleStats || monthlyScheduleStats.length === 0) {
      return []
    }
    return monthlyScheduleStats
      .filter((stat) => stat && stat.month)
      .map((stat) => {
        const [year, month] = stat.month.split('-')
        if (!year || !month) return null
        return {
          month: `${month}/${year}`,
          sessions: stat.scheduleCount || 0,
        }
      })
      .filter((item) => item !== null) as Array<{ month: string; sessions: number }>
  }, [monthlyScheduleStats])

  const studentsByGrade = useMemo(() => {
    // Use data from API
    if (!studentsPerGrade || studentsPerGrade.length === 0) {
      return []
    }
    return studentsPerGrade
      .filter((item) => item && item.grade)
      .map((item) => ({ name: item.grade, value: item.studentCount || 0 }))
      .sort((a, b) => b.value - a.value)
  }, [studentsPerGrade])

  const tutorsBySubject = useMemo(() => {
    // Use data from API
    if (!tutorsPerSubject || tutorsPerSubject.length === 0) {
      return []
    }
    return tutorsPerSubject
      .filter((item) => item && item.subject)
      .map((item) => ({ subject: item.subject, count: item.tutorCount || 0 }))
      .sort((a, b) => b.count - a.count)
  }, [tutorsPerSubject])

  const renderAnalyticsSection = () => {
    // Tính toán dữ liệu thống kê
    const lessonsTodayCount = stats.lessonsToday
    const totalStudents = dashboardStats.totalStudents
    const totalTutors = dashboardStats.totalTutors
    const activeStudents = dashboardStats.studentsParticipated

    const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-gray-900">Thống kê hệ thống</h2>
          <p className="text-sm text-gray-600">Theo dõi các chỉ số quan trọng về hoạt động giảng dạy</p>
        </div>

        {/* Thẻ thống kê tổng quan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Tổng số ca dạy trong hôm nay</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{statsLoading ? '...' : lessonsTodayCount}</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="card p-5 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Tổng số học sinh</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{dashboardStatsLoading ? '...' : totalStudents}</p>
              </div>
              <GraduationCap className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="card p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Tổng số tutor</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">{dashboardStatsLoading ? '...' : totalTutors}</p>
              </div>
              <UserCog className="w-12 h-12 text-purple-500 opacity-50" />
            </div>
          </div>
          <div className="card p-5 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Học sinh tham gia</p>
                <p className="text-3xl font-bold text-amber-900 mt-2">{dashboardStatsLoading ? '...' : activeStudents}</p>
              </div>
              <Users className="w-12 h-12 text-amber-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Biểu đồ số ca dạy theo tháng */}
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Số ca dạy theo tháng</h3>
              <p className="text-sm text-gray-500">Thống kê số lượng buổi học trong {selectedMonths} tháng gần nhất</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Hiển thị:</label>
              <select
                value={selectedMonths}
                onChange={(e) => setSelectedMonths(Number(e.target.value))}
                className="input text-sm w-24"
                disabled={monthlyStatsLoading}
              >
                <option value={3}>3 tháng</option>
                <option value={6}>6 tháng</option>
                <option value={12}>12 tháng</option>
              </select>
            </div>
          </div>
          {monthlyStatsLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
            </div>
          ) : sessionDataByMonth.length === 0 ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-sm text-gray-500">Chưa có dữ liệu</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sessionDataByMonth} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="sessions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Biểu đồ phân bố học sinh theo lớp */}
          <div className="card p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Phân bố học sinh theo lớp</h3>
              <p className="text-sm text-gray-500">Số lượng học sinh trong từng lớp</p>
            </div>
            {studentsPerGradeLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
              </div>
            ) : studentsByGrade.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-sm text-gray-500">Chưa có dữ liệu</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={studentsByGrade}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {studentsByGrade.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Biểu đồ số tutor theo môn */}
          <div className="card p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Số tutor theo môn học</h3>
              <p className="text-sm text-gray-500">Phân bố tutor theo từng môn học</p>
            </div>
            {tutorsPerSubjectLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
              </div>
            ) : tutorsBySubject.length === 0 ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-sm text-gray-500">Chưa có dữ liệu</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tutorsBySubject} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="subject" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    )
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'user-management':
        return renderUserManagementSection()
      case 'student-management':
        return renderStudentManagementSection()
      case 'tutor-management':
        return renderTutorManagementSection()
      case 'schedule-management':
        return renderScheduleManagementSection()
      case 'analytics':
        return renderAnalyticsSection()
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="card max-w-lg text-center text-sm text-gray-600">
              Mục này đang được cập nhật. Vui lòng quay lại sau.
            </div>
          </div>
        )
    }
  }

  return (
    <Layout 
      sidebar={
        <AdminSidebar 
          activeSection={activeSection} 
          onSectionChange={handleSectionChange}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />
      }
    >
      <div className="h-full overflow-hidden">
        <div className="h-full overflow-y-auto px-2 sm:px-3 lg:px-6 py-2">{renderSection()}</div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeScheduleModal}>
          <form
            onSubmit={handleScheduleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-xs font-semibold text-primary-500 uppercase tracking-[0.4em]">TẠO LỊCH DẠY</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">Lịch mới</h3>
              </div>
              <button
                type="button"
                onClick={closeScheduleModal}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2 text-primary-500" />
                    Ngày
                  </label>
                  <input
                    type="date"
                    className="input w-full"
                    value={newSchedule.date}
                    onChange={(e) => handleScheduleFieldChange('date', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-2 text-primary-500" />
                      Bắt đầu
                    </label>
                    <input
                      type="time"
                      className="input w-full"
                      value={newSchedule.startTime}
                      onChange={(e) => handleScheduleFieldChange('startTime', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-2 text-primary-500" />
                      Kết thúc
                    </label>
                    <input
                      type="time"
                      className="input w-full"
                      value={newSchedule.endTime}
                      onChange={(e) => handleScheduleFieldChange('endTime', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <GraduationCap className="w-4 h-4 inline mr-2 text-primary-500" />
                    Học sinh
                  </label>
                  <select
                    className="input w-full"
                    value={newSchedule.studentId}
                    onChange={(e) => handleScheduleFieldChange('studentId', e.target.value)}
                  >
                    <option value="">-- Chọn học sinh --</option>
                    {scheduleStudentList.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <UserCog className="w-4 h-4 inline mr-2 text-primary-500" />
                    Tutor
                  </label>
                  <select
                    className="input w-full"
                    value={newSchedule.tutorId}
                    onChange={(e) => handleScheduleFieldChange('tutorId', e.target.value)}
                  >
                    {tutorList.map((tutor) => (
                      <option key={tutor.id} value={tutor.id}>
                        {tutor.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center justify-between">
                  <span>
                    <FileText className="w-4 h-4 inline mr-2 text-primary-500" />
                    Link Meet
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateNewScheduleLink}
                    disabled={isGeneratingNewScheduleLink}
                    className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-colors ${
                      isGeneratingNewScheduleLink
                        ? 'text-gray-400 border-gray-200 bg-gray-100 cursor-not-allowed'
                        : 'text-primary-600 border-primary-200 hover:bg-primary-50'
                    }`}
                  >
                    {isGeneratingNewScheduleLink ? 'Đang tạo...' : 'Tạo link'}
                  </button>
                </label>
                <input
                  className="input w-full"
                  value={newSchedule.meetingLink}
                  onChange={(e) => handleScheduleFieldChange('meetingLink', e.target.value)}
                  placeholder="https://meet.google.com/..."
                  readOnly={isGeneratingNewScheduleLink}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <ClipboardList className="w-4 h-4 inline mr-2 text-primary-500" />
                  Ghi chú (không bắt buộc)
                </label>
                <textarea
                  className="input w-full min-h-[100px] resize-none"
                  value={newSchedule.note ?? ''}
                  onChange={(e) => handleScheduleFieldChange('note', e.target.value)}
                  placeholder="Nhập ghi chú thêm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={closeScheduleModal} className="btn-secondary px-6 py-2">
                Hủy
              </button>
              <button type="submit" className={`btn-primary px-6 py-2 ${isCreatingSchedule ? 'opacity-60 cursor-not-allowed' : ''}`} disabled={isCreatingSchedule}>
                {isCreatingSchedule ? 'Đang lưu...' : 'Lưu lịch'}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  )
}

