import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { apiCall, API_BASE_URL } from '../config/api'
import { getCookie } from '../utils/cookies'
import {
  Users,
  UserPlus,
  Calendar,
  GraduationCap,
  UserCog,
  Eye,
  EyeOff,
  Search,
  MapPin,
  BookOpenCheck,
  Heart,
  ClipboardList,
  Phone,
  FileText,
  Clock,
  X,
} from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth } from 'date-fns'
import { vi } from 'date-fns/locale'
import AdminSidebar, { AdminSection } from '../components/AdminSidebar'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

interface User {
  id: string
  name: string
  email: string
  role: 'student' | 'tutor' | 'parent' | 'admin' | 'teacher'
  phone?: string
  birthday?: string
  isEmailVerified?: boolean
  isActive?: boolean
  // For display purposes (not from API)
  password?: string
  joinDate?: string
  status?: 'active' | 'inactive'
}

interface ParentInfo {
  fatherName: string
  fatherPhone: string
  motherName: string
  motherPhone: string
  email: string
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
  status: 'Đã kết thúc' | 'Sắp diễn ra'
  note?: string
}

const ROLE_LABELS: Record<User['role'], string> = {
  student: 'Học sinh / Phụ huynh',
  tutor: 'Tutor',
  parent: 'Phụ huynh',
  admin: 'Admin',
  teacher: 'Giáo viên',
}

const INITIAL_USERS: User[] = [
  { id: '1', name: 'Nguyễn Văn A', email: 'student@skillar.com', role: 'student', status: 'active', password: 'Stud@123', joinDate: '2025-01-10' },
  { id: '2', name: 'Tutor B', email: 'tutor@skillar.com', role: 'tutor', status: 'active', password: 'Tutor@456', joinDate: '2024-11-18' },
  { id: '3', name: 'GV Toán C', email: 'teacher@skillar.com', role: 'tutor', status: 'active', password: 'Teacher@2024', joinDate: '2024-09-05' },
  { id: '4', name: 'Trần Thị D', email: 'student2@skillar.com', role: 'student', status: 'active', password: 'TranD@778', joinDate: '2025-02-01' },
  { id: '5', name: 'Lê Minh E', email: 'parent@skillar.com', role: 'student', status: 'active', password: 'LeMinh@222', joinDate: '2025-02-14' },
  { id: '6', name: 'Nguyễn Tuấn F', email: 'student3@skillar.com', role: 'student', status: 'inactive', password: 'TuanF@999', joinDate: '2024-12-06' },
  { id: '7', name: 'Tutor C', email: 'tutor2@skillar.com', role: 'tutor', status: 'active', password: 'TutorC@111', joinDate: '2024-10-28' },
  { id: '8', name: 'Trần Văn G', email: 'student4@skillar.com', role: 'student', status: 'active', password: 'TranG@321', joinDate: '2025-03-01' },
  { id: '9', name: 'Tutor D', email: 'tutor3@skillar.com', role: 'tutor', status: 'inactive', password: 'TutorD@753', joinDate: '2023-08-17' },
  { id: '10', name: 'Phạm Thị H', email: 'student5@skillar.com', role: 'student', status: 'active', password: 'PhamH@555', joinDate: '2025-01-26' },
  { id: '11', name: 'Đỗ Thành I', email: 'student6@skillar.com', role: 'student', status: 'active', password: 'DoI@678', joinDate: '2025-02-23' },
  { id: '12', name: 'Tutor E', email: 'tutor4@skillar.com', role: 'tutor', status: 'active', password: 'TutorE@909', joinDate: '2025-02-08' },
  { id: '13', name: 'Võ Hữu L', email: 'student7@skillar.com', role: 'student', status: 'inactive', password: 'VoL@128', joinDate: '2024-11-02' },
  { id: '14', name: 'Parent M', email: 'parent2@skillar.com', role: 'student', status: 'active', password: 'ParentM@001', joinDate: '2025-01-03' },
  { id: '15', name: 'Nguyễn An N', email: 'student8@skillar.com', role: 'student', status: 'active', password: 'AnN@314', joinDate: '2025-03-16' },
  { id: '16', name: 'Tutor F', email: 'tutor5@skillar.com', role: 'tutor', status: 'active', password: 'TutorF@515', joinDate: '2024-12-21' },
  { id: '17', name: 'Phạm Văn O', email: 'student9@skillar.com', role: 'student', status: 'active', password: 'PhamO@951', joinDate: '2025-02-27' },
  { id: '18', name: 'Trần Quốc P', email: 'student10@skillar.com', role: 'student', status: 'inactive', password: 'QuocP@741', joinDate: '2024-10-09' },
  { id: '19', name: 'Tutor G', email: 'tutor6@skillar.com', role: 'tutor', status: 'active', password: 'TutorG@852', joinDate: '2025-01-19' },
  { id: '20', name: 'Tutor H', email: 'tutor7@skillar.com', role: 'tutor', status: 'active', password: 'TutorH@963', joinDate: '2025-03-06' },
]

const studentFields = [
  { name: 'dob', label: 'Ngày sinh', type: 'date' },
  { name: 'school', label: 'Trường học', type: 'text' },
  { name: 'className', label: 'Lớp', type: 'text' },
  { name: 'parentName', label: 'Tên phụ huynh', type: 'text' },
  { name: 'parentPhone', label: 'SĐT phụ huynh', type: 'tel' },
  { name: 'parentEmail', label: 'Email phụ huynh', type: 'email' },
  { name: 'address', label: 'Địa chỉ', type: 'text' },
  { name: 'channel', label: 'Kênh biết đến Skillar', type: 'text' },
] as const

const tutorFields = [
  { name: 'phone', label: 'Số điện thoại', type: 'tel', colSpan: false },
  { name: 'experience', label: 'Kinh nghiệm giảng dạy', type: 'text', colSpan: false },
  { name: 'specialization', label: 'Chuyên môn chính', type: 'text', colSpan: false },
  { name: 'introduction', label: 'Giới thiệu ngắn', type: 'text', colSpan: true },
] as const

type StudentField = (typeof studentFields)[number]
type TutorField = (typeof tutorFields)[number]

type StudentFieldName = StudentField['name']
type TutorFieldName = TutorField['name']

const FIELD_LABEL_CLASS = 'label block text-sm font-semibold text-gray-700 mb-1'

const STUDENT_PROFILES: StudentProfile[] = [
  {
    id: 'stu-1',
    name: 'Nguyễn Văn A',
    avatar: 'https://bizweb.dktcdn.net/thumb/grande/100/175/849/files/z4714806852848-5747eea23be9ffed784d5383079af3bc-e015f7eb-ec6b-4ea3-a0f9-89e4ae8b522c.jpg?v=1695374152280',
    dob: '2012-09-15',
    address: '123 Nguyễn Trãi, Quận 5, TP.HCM',
    school: 'THCS Nguyễn Du',
    grade: 'Lớp 7A1',
    subject: 'Toán',
    subjectColor: 'bg-blue-100 text-blue-600',
    progress: 67,
    status: 'Đang học',
    parentInfo: {
      fatherName: 'Nguyễn Văn Bình',
      fatherPhone: '0901 234 567',
      motherName: 'Trần Thị Hoa',
      motherPhone: '0902 345 678',
      email: 'phuhuynh.avan@skillar.com',
    },
    currentLevel: 'Hoàn thành chương trình Toán lớp 6, đang ôn luyện chuyên đề hình học nâng cao.',
    parentRequest: 'Cải thiện khả năng trình bày lời giải, mở rộng kỹ năng thuyết trình và làm việc nhóm.',
    hobbies: ['Bóng đá', 'Âm nhạc', 'Chụp ảnh'],
    favoriteSubjects: ['Toán', 'Vật lý', 'Tin học'],
    strengths: ['Tư duy logic tốt', 'Chủ động hỏi bài', 'Tinh thần hợp tác cao'],
    improvements: ['Cần cải thiện kỹ năng quản lý thời gian', 'Đôi khi mất tập trung ở cuối buổi học'],
    notes: 'Học sinh có tinh thần học hỏi, thích các hoạt động thực tế và dự án nhóm.',
  },
  {
    id: 'stu-2',
    name: 'Trần Bảo Ngọc',
    avatar: 'https://inanhtuankhanh.vn/wp-content/uploads/2020/11/ok-1--scaled.jpg',
    dob: '2010-04-22',
    address: '45 Nguyễn Văn Linh, Đà Nẵng',
    school: 'THCS Lê Quý Đôn',
    grade: 'Lớp 9B',
    subject: 'Văn',
    subjectColor: 'bg-purple-100 text-purple-600',
    progress: 85,
    status: 'Đang học',
    parentInfo: {
      fatherName: 'Trần Quốc Huy',
      fatherPhone: '0911 654 321',
      motherName: 'Lê Minh Thư',
      motherPhone: '0935 222 111',
      email: 'parent.ngoc@skillar.com',
    },
    currentLevel: 'Đang luyện thi vào chuyên Anh, đạt IELTS 6.5, cần nâng điểm viết.',
    parentRequest: 'Muốn tăng cường khả năng viết luận, chuẩn bị cho kỳ thi học sinh giỏi quốc gia.',
    hobbies: ['Đọc sách', 'Vẽ', 'Du lịch'],
    favoriteSubjects: ['Ngữ văn', 'Tiếng Anh', 'Địa lý'],
    strengths: ['Ghi nhớ tốt', 'Kỹ năng viết sáng tạo', 'Tự học cao'],
    improvements: ['Thiếu tự tin khi thuyết trình', 'Cần cải thiện phát âm tiếng Anh'],
    notes: 'Ngọc thích tham gia các câu lạc bộ ngoại ngữ và văn học, cần thêm hoạt động tương tác.',
  },
]

const createEmptyStudentInfo = (): Record<StudentFieldName, string> =>
  studentFields.reduce(
    (acc, field) => ({
      ...acc,
      [field.name]: '',
    }),
    {} as Record<StudentFieldName, string>,
  )

const createEmptyTutorInfo = (): Record<TutorFieldName, string> =>
  tutorFields.reduce(
    (acc, field) => ({
      ...acc,
      [field.name]: '',
    }),
    {} as Record<TutorFieldName, string>,
  )

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
    motherName: 'Đang cập nhật',
    motherPhone: '—',
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

const STUDENT_LIST: StudentListItem[] = (() => {
  const base = STUDENT_PROFILES.map((profile) => ({
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    grade: profile.grade,
    address: profile.address,
    subject: profile.subject,
    subjectColor: profile.subjectColor,
    progress: profile.progress,
    hasProfile: true,
  }))

  const placeholders = Array.from({ length: 18 }).map((_, idx) => {
    const color = STUDENT_CARD_COLORS[idx % STUDENT_CARD_COLORS.length]
    const index = idx + 3
    return {
      id: `stu-${index}`,
      name: `Học sinh ${index.toString().padStart(2, '0')}`,
      avatar: `https://i.pravatar.cc/150?img=${60 + idx}`,
      grade: `Lớp ${7 + (idx % 3)}0${(idx % 2) + 1}`,
      address: `Khu vực Quận ${idx % 10 + 1}, TP.HCM`,
      subject: color.subject,
      subjectColor: color.color,
      progress: 30 + ((idx * 7) % 60),
      hasProfile: false,
    }
  })

  return [...base, ...placeholders]
})()

const cloneStudentProfile = (profile: StudentProfile): StudentProfile => ({
  ...profile,
  parentInfo: { ...profile.parentInfo },
  hobbies: [...profile.hobbies],
  favoriteSubjects: [...profile.favoriteSubjects],
  strengths: [...profile.strengths],
  improvements: [...profile.improvements],
})

const createInitialStudentProfiles = (list: StudentListItem[]): Record<string, StudentProfile> => {
  const map: Record<string, StudentProfile> = {}
  list.forEach((item) => {
    const base = STUDENT_PROFILES.find((profile) => profile.id === item.id)
    map[item.id] = base ? cloneStudentProfile(base) : buildPlaceholderProfile(item)
  })
  return map
}

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
      }
  })
  return map
}

const cloneTutorProfile = (profile: TutorProfile): TutorProfile => ({
  ...profile,
  subjects: [...profile.subjects],
})

const todayString = format(new Date(), 'yyyy-MM-dd')

const INITIAL_SCHEDULE_SESSIONS: ScheduleSession[] = [
  {
    id: 'ses-1',
    date: todayString,
    startTime: '08:00',
    endTime: '09:30',
    subject: 'Toán - Chuyên đề hình học',
    studentId: 'stu-1',
    tutorId: 'tutor-1',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    status: 'Đã kết thúc',
  },
  {
    id: 'ses-2',
    date: todayString,
    startTime: '10:30',
    endTime: '12:00',
    subject: 'Ngữ văn - Luyện viết nghị luận',
    studentId: 'stu-2',
    tutorId: 'tutor-2',
    meetingLink: 'https://meet.google.com/xyz-klmn-opq',
    status: 'Đã kết thúc',
  },
  {
    id: 'ses-3',
    date: format(addMonths(new Date(), 0), 'yyyy-MM-dd'),
    startTime: '14:00',
    endTime: '15:30',
    subject: 'Toán nâng cao',
    studentId: 'stu-1',
    tutorId: 'tutor-1',
    meetingLink: 'https://meet.google.com/toan-nc',
    status: 'Sắp diễn ra',
  },
]

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>('user-management')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'tutor'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalResults: 0,
  })
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'student' as User['role'],
    password: '',
    joinDate: '',
    studentInfo: createEmptyStudentInfo(),
    tutorInfo: createEmptyTutorInfo(),
    avatar: null as File | null,
    cvFile: null as File | null,
    avatarUrl: '' as string,
    cvFileUrl: '' as string,
  })
  const [uploadingFile, setUploadingFile] = useState(false)
  const [editUserId, setEditUserId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<User>>({})
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [studentList, setStudentList] = useState<StudentListItem[]>(STUDENT_LIST)
  const [studentProfiles, setStudentProfiles] = useState<Record<string, StudentProfile>>(() => createInitialStudentProfiles(STUDENT_LIST))
  const [selectedStudentId, setSelectedStudentId] = useState(STUDENT_LIST[0].id)
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const [isStudentEditing, setIsStudentEditing] = useState(false)
  const [studentEditData, setStudentEditData] = useState<StudentProfile | null>(null)
  const [tutorList, setTutorList] = useState<TutorListItem[]>(TUTOR_LIST)
  const [tutorProfiles, setTutorProfiles] = useState<Record<string, TutorProfile>>(() => createInitialTutorProfiles(TUTOR_LIST))
  const [selectedTutorId, setSelectedTutorId] = useState(TUTOR_LIST[0].id)
  const [tutorSearchTerm, setTutorSearchTerm] = useState('')
  const [isTutorEditing, setIsTutorEditing] = useState(false)
  const [tutorEditData, setTutorEditData] = useState<TutorProfile | null>(null)
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date())
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(todayString)
  const [scheduleSessions, setScheduleSessions] = useState<ScheduleSession[]>(INITIAL_SCHEDULE_SESSIONS)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    date: todayString,
    startTime: '',
    endTime: '',
    studentId: STUDENT_LIST[0].id,
    tutorId: TUTOR_LIST[0].id,
    subject: '',
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

  const usersPerPage = 10

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true)
        
        // Build query parameters
        const params = new URLSearchParams()
        if (searchTerm.trim()) {
          params.append('name', searchTerm.trim())
        }
        if (roleFilter !== 'all') {
          params.append('role', roleFilter)
        }
        params.append('page', currentPage.toString())
        params.append('limit', usersPerPage.toString())
        params.append('sortBy', 'name:asc')

        const response = await apiCall<{
          results: User[]
          page: number
          limit: number
          totalPages: number
          totalResults: number
        }>(`/users?${params.toString()}`)

        // Map API users to display format
        const mappedUsers: User[] = response.results.map((user) => ({
          ...user,
          status: (user.isActive ? 'active' : 'inactive') as 'active' | 'inactive',
          joinDate: user.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : '',
        }))

        setUsers(mappedUsers)
        setUsersPagination({
          page: response.page,
          limit: response.limit,
          totalPages: response.totalPages,
          totalResults: response.totalResults,
        })
      } catch (error) {
        console.error('Error fetching users:', error)
        setUsers([])
      } finally {
        setUsersLoading(false)
      }
    }

    fetchUsers()
  }, [currentPage, roleFilter, searchTerm])

  useEffect(() => {
    setIsStudentEditing(false)
    setStudentEditData(null)
  }, [selectedStudentId])

  useEffect(() => {
    setIsTutorEditing(false)
    setTutorEditData(null)
  }, [selectedTutorId])

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [roleFilter, searchTerm])

  const paginatedUsers = users

  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
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
    }

    fetchStats()
  }, [])

  const totalStudents = stats.students
  const totalTutors = stats.tutors
  const lessonsToday = stats.lessonsToday

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [userId]: !prev[userId] }))
  }

  const handleFilterChange = (value: 'all' | 'student' | 'tutor') => {
    setRoleFilter(value)
    setCurrentPage(1)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
    setCurrentPage(1)
  }

  const startEditUser = (user: User) => {
    setEditUserId(user.id)
    setEditData({ ...user })
  }

  const cancelEditUser = () => {
    setEditUserId(null)
    setEditData({})
  }

  const updateEditField = (field: keyof User, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleResetPassword = async (userId: string) => {
    setResetPasswordUserId(userId)
    setNewPassword('')
    setShowResetPasswordModal(true)
  }

  const confirmResetPassword = async () => {
    if (!resetPasswordUserId || !newPassword.trim()) {
      alert('Vui lòng nhập mật khẩu mới')
      return
    }

    try {
      // Use PATCH /users/:userId to update password (admin can update any user)
      await apiCall(`/users/${resetPasswordUserId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          password: newPassword.trim(),
        }),
      })
      alert('Đã reset mật khẩu thành công')
      setShowResetPasswordModal(false)
      setResetPasswordUserId(null)
      setNewPassword('')
      // Refresh users list
      const params = new URLSearchParams()
      if (searchTerm.trim()) {
        params.append('name', searchTerm.trim())
      }
      if (roleFilter !== 'all') {
        params.append('role', roleFilter)
      }
      params.append('page', currentPage.toString())
      params.append('limit', usersPerPage.toString())
      params.append('sortBy', 'name:asc')

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
        joinDate: user.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : '',
      }))

      setUsers(mappedUsers)
    } catch (error) {
      console.error('Error resetting password:', error)
      let errorMessage = 'Có lỗi xảy ra khi reset mật khẩu'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      alert(errorMessage)
    }
  }

  const saveEditUser = async () => {
    if (!editUserId) return
    const requiredFields: Array<keyof User> = ['name', 'email', 'role']
    const missing = requiredFields.some((field) => !editData[field])
    if (missing) {
      alert('Vui lòng điền đầy đủ thông tin trước khi lưu.')
      return
    }

    try {
      // Prepare update body
      const updateBody: any = {
        name: editData.name,
        email: editData.email,
      }
      
      // If password is provided, add it to update body
      if (editData.password && editData.password.trim()) {
        updateBody.password = editData.password.trim()
      }

      // Call API to update user
      await apiCall(`/users/${editUserId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      })

      // Refresh users list to get updated data
      const params = new URLSearchParams()
      if (searchTerm.trim()) {
        params.append('name', searchTerm.trim())
      }
      if (roleFilter !== 'all') {
        params.append('role', roleFilter)
      }
      params.append('page', currentPage.toString())
      params.append('limit', usersPerPage.toString())
      params.append('sortBy', 'name:asc')

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
        joinDate: user.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : '',
      }))

      setUsers(mappedUsers)
      setUsersPagination({
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        totalResults: response.totalResults,
      })

      cancelEditUser()
      alert('Đã cập nhật thông tin thành công')
    } catch (error) {
      console.error('Error saving user:', error)
      let errorMessage = 'Có lỗi xảy ra khi cập nhật thông tin'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      alert(errorMessage)
    }
  }

  const handleStudentSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStudentSearchTerm(event.target.value)
  }

  const startStudentEditing = () => {
    const listItem = studentList.find((item) => item.id === selectedStudentId) ?? studentList[0]
    const baseProfile = studentProfiles[selectedStudentId] ?? buildPlaceholderProfile(listItem)
    setStudentEditData(cloneStudentProfile(baseProfile))
    setIsStudentEditing(true)
  }

  const cancelStudentEditing = () => {
    setIsStudentEditing(false)
    setStudentEditData(null)
  }

  const handleStudentEditFieldChange = (field: keyof StudentProfile, value: string) => {
    setStudentEditData((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleParentInfoChange = (field: keyof ParentInfo, value: string) => {
    setStudentEditData((prev) =>
      prev
        ? {
            ...prev,
            parentInfo: { ...prev.parentInfo, [field]: value },
          }
        : prev,
    )
  }

  const handleStudentSave = () => {
    if (!studentEditData) return
    setStudentProfiles((prev) => ({
      ...prev,
      [studentEditData.id]: cloneStudentProfile(studentEditData),
    }))
    setStudentList((prev) =>
      prev.map((student) =>
        student.id === studentEditData.id
          ? { ...student, name: studentEditData.name, grade: studentEditData.grade, address: studentEditData.address }
          : student,
      ),
    )
    cancelStudentEditing()
    alert('Đã cập nhật thông tin học sinh.')
  }

  const handleTutorSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTutorSearchTerm(event.target.value)
  }

  const startTutorEditing = () => {
    const listItem = tutorList.find((item) => item.id === selectedTutorId) ?? tutorList[0]
    const baseProfile = tutorProfiles[selectedTutorId] ?? createInitialTutorProfiles([listItem])[listItem.id]
    setTutorEditData(cloneTutorProfile(baseProfile))
    setIsTutorEditing(true)
  }

  const cancelTutorEditing = () => {
    setIsTutorEditing(false)
    setTutorEditData(null)
  }

  const handleTutorFieldChange = (field: keyof TutorProfile, value: string) => {
    setTutorEditData((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleTutorSubjectsChange = (value: string) => {
    const subjects = value.split(',').map((subject) => subject.trim()).filter(Boolean)
    setTutorEditData((prev) => (prev ? { ...prev, subjects } : prev))
  }

  const handleTutorSave = () => {
    if (!tutorEditData) return
    setTutorProfiles((prev) => ({
      ...prev,
      [tutorEditData.id]: cloneTutorProfile(tutorEditData),
    }))
    setTutorList((prev) =>
      prev.map((tutor) =>
        tutor.id === tutorEditData.id ? { ...tutor, name: tutorEditData.name, headline: tutorEditData.qualification, subjects: tutorEditData.subjects, status: tutorEditData.status } : tutor,
      ),
    )
    cancelTutorEditing()
    alert('Đã cập nhật thông tin tutor.')
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

  const handleScheduleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newSchedule.startTime || !newSchedule.endTime || !newSchedule.subject) {
      alert('Vui lòng nhập đầy đủ thông tin lịch dạy.')
      return
    }
    const newSession: ScheduleSession = {
      id: `ses-${scheduleSessions.length + 1}`,
      date: newSchedule.date,
      startTime: newSchedule.startTime,
      endTime: newSchedule.endTime,
      subject: newSchedule.subject,
      studentId: newSchedule.studentId,
      tutorId: newSchedule.tutorId,
      meetingLink: newSchedule.meetingLink || 'Chưa cập nhật',
      status: 'Sắp diễn ra',
      note: newSchedule.note,
    }
    setScheduleSessions((prev) => [...prev, newSession])
    setShowScheduleModal(false)
    alert('Đã tạo lịch dạy mới!')
    setNewSchedule((prev) => ({ ...prev, startTime: '', endTime: '', subject: '', meetingLink: '', note: '' }))
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

  const handleFileChange = async (file: File | null, type: 'avatar' | 'cvFile') => {
    if (!file) {
      setNewUser((prev) => ({
        ...prev,
        [type]: null,
        [type === 'avatar' ? 'avatarUrl' : 'cvFileUrl']: '',
      }))
      return
    }

    try {
      setUploadingFile(true)
      const url = await uploadFile(file)
      setNewUser((prev) => ({
        ...prev,
        [type]: file,
        [type === 'avatar' ? 'avatarUrl' : 'cvFileUrl']: url,
      }))
    } catch (error) {
      console.error('Error uploading file:', error)
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi upload file')
      setNewUser((prev) => ({
        ...prev,
        [type]: null,
        [type === 'avatar' ? 'avatarUrl' : 'cvFileUrl']: '',
      }))
    } finally {
      setUploadingFile(false)
    }
  }

  const resetNewUser = () =>
    setNewUser({
      name: '',
      email: '',
      role: 'student',
      password: '',
      joinDate: '',
      studentInfo: createEmptyStudentInfo(),
      tutorInfo: createEmptyTutorInfo(),
      avatar: null,
      cvFile: null,
      avatarUrl: '',
      cvFileUrl: '',
    })

  const handleAddUser = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    
    // Validate required fields
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc (Tên, Email, Mật khẩu)')
      return
    }

    try {
      // Prepare user data
      const userData: any = {
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        password: newUser.password.trim(),
        role: newUser.role,
      }

      // Add avatar URL if available
      if (newUser.avatarUrl) {
        userData.avatar = newUser.avatarUrl
      }

      // Call API to create user
      await apiCall('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      })

      // Refresh users list
      const params = new URLSearchParams()
      if (searchTerm.trim()) {
        params.append('name', searchTerm.trim())
      }
      if (roleFilter !== 'all') {
        params.append('role', roleFilter)
      }
      params.append('page', currentPage.toString())
      params.append('limit', usersPerPage.toString())
      params.append('sortBy', 'name:asc')

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
        joinDate: user.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : '',
      }))

      setUsers(mappedUsers)
      setUsersPagination({
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        totalResults: response.totalResults,
      })

      setShowAddUserModal(false)
      resetNewUser()
      alert('Đã tạo tài khoản thành công!')
    } catch (error) {
      console.error('Error creating user:', error)
      // Extract error message from API response
      let errorMessage = 'Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại.'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      alert(errorMessage)
    }
  }

  const displayedStudents = useMemo(() => {
    const keyword = studentSearchTerm.trim().toLowerCase()
    return studentList.filter((student) => student.name.toLowerCase().includes(keyword))
  }, [studentList, studentSearchTerm])

  const selectedListItem = studentList.find((item) => item.id === selectedStudentId) ?? studentList[0]
  const baseStudentProfile = studentProfiles[selectedStudentId] ?? buildPlaceholderProfile(selectedListItem)
  const selectedStudent = isStudentEditing && studentEditData ? studentEditData : baseStudentProfile

  const displayedTutors = useMemo(() => {
    const keyword = tutorSearchTerm.trim().toLowerCase()
    return tutorList.filter((tutor) => tutor.name.toLowerCase().includes(keyword))
  }, [tutorList, tutorSearchTerm])

  const selectedTutorListItem = tutorList.find((item) => item.id === selectedTutorId) ?? tutorList[0]
  const baseTutorProfile = tutorProfiles[selectedTutorId] ?? createInitialTutorProfiles([selectedTutorListItem])[selectedTutorListItem.id]
  const selectedTutor = isTutorEditing && tutorEditData ? tutorEditData : baseTutorProfile

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

  const renderUserManagementSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng số người dùng', value: statsLoading ? '...' : stats.total, icon: <Users className="w-7 h-7 text-white" />, gradient: 'from-blue-500 to-blue-600' },
          { label: 'Số lượng học sinh', value: statsLoading ? '...' : totalStudents, icon: <GraduationCap className="w-7 h-7 text-white" />, gradient: 'from-green-500 to-green-600' },
          { label: 'Số lượng tutor', value: statsLoading ? '...' : totalTutors, icon: <UserCog className="w-7 h-7 text-white" />, gradient: 'from-purple-500 to-purple-600' },
          { label: 'Ca học hôm nay', value: statsLoading ? '...' : lessonsToday, icon: <Calendar className="w-7 h-7 text-white" />, gradient: 'from-yellow-500 to-yellow-600' },
        ].map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex flex-col items-center text-center">
              <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center shadow-lg mb-3`}>{card.icon}</div>
              <p className="text-xs text-gray-600 font-medium mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Quản lý tài khoản người dùng</h2>
            <p className="text-sm text-gray-600">Danh sách tài khoản hiện có trên hệ thống</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
              <Search className="w-4 h-4 text-gray-500 mr-2" />
              <input
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm tên hoặc email"
                className="text-sm text-gray-700 outline-none bg-transparent w-48"
              />
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1">
              {[
                { label: 'Tất cả', value: 'all' as const },
                { label: 'Học sinh / PH', value: 'student' as const },
                { label: 'Tutor', value: 'tutor' as const },
              ].map((button) => (
                <button
                  key={button.value}
                  onClick={() => handleFilterChange(button.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                    roleFilter === button.value ? 'bg-white shadow text-primary-600' : 'text-gray-500'
                  }`}
                >
                  {button.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAddUserModal(true)} className="btn-primary flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span>Thêm tài khoản</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tên người dùng</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Mật khẩu</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Vai trò</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ngày tham gia</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usersLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                const isVisible = visiblePasswords[user.id]
                const isEditing = editUserId === user.id
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {isEditing ? (
                        <input className="input h-9 min-w-[180px]" value={editData.email ?? ''} onChange={(e) => updateEditField('email', e.target.value)} />
                      ) : (
                        user.email
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {isEditing ? (
                        <input className="input h-9" value={editData.name ?? ''} onChange={(e) => updateEditField('name', e.target.value)} />
                      ) : (
                        user.name
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {isEditing ? (
                        <input className="input h-9" value={editData.password ?? ''} onChange={(e) => updateEditField('password', e.target.value)} />
                      ) : (
                        <div className="inline-flex items-center space-x-2">
                          <span className="font-semibold tracking-wider text-gray-800">{isVisible ? user.password : '********'}</span>
                          <button
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="text-gray-500 hover:text-primary-600"
                            title={isVisible ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                          >
                            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => handleResetPassword(user.id)}
                            className="text-xs text-primary-600 font-semibold hover:text-primary-700"
                          >
                            Reset
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {isEditing ? (
                        <select className="input h-9" value={editData.role ?? 'student'} onChange={(e) => updateEditField('role', e.target.value as User['role'])}>
                          <option value="student">Học sinh / Phụ huynh</option>
                          <option value="tutor">Tutor</option>
                        </select>
                      ) : (
                        ROLE_LABELS[user.role]
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {isEditing ? (
                        <input className="input h-9" type="date" value={editData.joinDate ?? ''} onChange={(e) => updateEditField('joinDate', e.target.value)} />
                      ) : (
                        user.joinDate ? new Date(user.joinDate).toLocaleDateString('vi-VN') : (user.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : 'N/A')
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center space-x-3">
                          <button onClick={saveEditUser} className="text-primary-600 hover:text-primary-700 text-sm font-semibold">
                            Lưu
                          </button>
                          <button onClick={cancelEditUser} className="text-gray-500 hover:text-gray-700 text-sm font-semibold">
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <button onClick={() => startEditUser(user)} className="text-primary-600 hover:text-primary-700 text-sm font-semibold">
                            Sửa
                          </button>
                          <button className="text-red-600 hover:text-red-700 text-sm font-semibold">Xóa</button>
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 text-sm text-gray-600">
          <p>
            {usersLoading ? (
              'Đang tải...'
            ) : (
              `Hiển thị ${usersPagination.totalResults === 0 ? 0 : (usersPagination.page - 1) * usersPagination.limit + 1}-${Math.min(usersPagination.page * usersPagination.limit, usersPagination.totalResults)} trong tổng ${usersPagination.totalResults} tài khoản`
            )}
          </p>
          <div className="flex items-center space-x-2 mt-3 sm:mt-0">
            <button
              disabled={usersPagination.page === 1 || usersLoading}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold disabled:opacity-40"
            >
              Trước
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: usersPagination.totalPages }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  disabled={usersLoading}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold ${
                    usersPagination.page === idx + 1 ? 'bg-primary-500 text-white' : 'border border-gray-200 text-gray-600 hover:border-primary-200'
                  } disabled:opacity-40`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <button
              disabled={usersPagination.page === usersPagination.totalPages || usersLoading}
              onClick={() => setCurrentPage((prev) => Math.min(usersPagination.totalPages, prev + 1))}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reset mật khẩu</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowResetPasswordModal(false)
                  setResetPasswordUserId(null)
                  setNewPassword('')
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={confirmResetPassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

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
              <h3 className="text-lg font-semibold text-gray-900">Tổng quan lớp học · {studentList.length} học sinh</h3>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-1 text-xs text-gray-600 font-semibold">
              <div className="w-2 h-2 rounded-full bg-primary-500" /> Đang hoạt động
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
                        <p className="text-sm text-gray-500 mt-1">{student.grade}</p>
                        <p className="text-xs text-gray-400 mt-1 truncate">{student.address}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            {displayedStudents.length === 0 && <div className="py-6 text-center text-sm text-gray-500">Không tìm thấy học sinh phù hợp.</div>}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 font-semibold">Danh sách hiển thị toàn bộ học sinh</div>
        </div>

        <div className="card h-full flex flex-col overflow-hidden max-h-[85vh]">
          <div>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-6 pb-4 border-b border-gray-200">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Thông tin chi tiết</p>
                <h3 className="text-xl font-semibold text-gray-900">{selectedStudent.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-0.5 text-xs font-semibold rounded-full ${selectedStudent.subjectColor}`}>{selectedStudent.subject}</span>
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

          <div className="flex-1 overflow-y-auto pr-1 space-y-5">
            <div className="w-full rounded-3xl border border-gray-100 bg-gray-50/70 p-5 flex flex-col gap-4 md:flex-row md:items-center md:gap-5 shadow-inner">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Học sinh</p>
              {isStudentEditing ? (
                <div className="space-y-2">
                  <input
                    className="input text-base font-semibold"
                    value={studentEditData?.name ?? ''}
                    onChange={(e) => handleStudentEditFieldChange('name', e.target.value)}
                  />
                  <input
                    className="input text-sm"
                    value={studentEditData?.grade ?? ''}
                    onChange={(e) => handleStudentEditFieldChange('grade', e.target.value)}
                  />
                  <input
                    className="input text-sm"
                    value={studentEditData?.school ?? ''}
                    onChange={(e) => handleStudentEditFieldChange('school', e.target.value)}
                  />
                  <select
                    className="input text-sm"
                    value={studentEditData?.status ?? 'Đang học'}
                    onChange={(e) => handleStudentEditFieldChange('status', e.target.value as StudentProfile['status'])}
                  >
                    <option value="Đang học">Đang học</option>
                    <option value="Tạm dừng">Tạm dừng</option>
                  </select>
                </div>
              ) : (
                <>
                  <h4 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h4>
                  <p className="text-sm text-gray-500">
                    {selectedStudent.grade} • {selectedStudent.school || 'Đang cập nhật'}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-inner">
                <Calendar className="w-4 h-4 text-primary-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-[0.2em]">Ngày sinh</p>
                {isStudentEditing ? (
                  <input
                    type="date"
                    className="input text-sm"
                    value={studentEditData?.dob ?? ''}
                    onChange={(e) => handleStudentEditFieldChange('dob', e.target.value)}
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900">{new Date(selectedStudent.dob).toLocaleDateString('vi-VN')}</p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-inner">
                <MapPin className="w-4 h-4 text-primary-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-[0.2em]">Địa chỉ</p>
                {isStudentEditing ? (
                  <input
                    className="input text-sm"
                    value={studentEditData?.address ?? ''}
                    onChange={(e) => handleStudentEditFieldChange('address', e.target.value)}
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900">{selectedStudent.address}</p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-inner">
                <BookOpenCheck className="w-4 h-4 text-primary-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-[0.2em]">Trường học</p>
                {isStudentEditing ? (
                  <input
                    className="input text-sm"
                    value={studentEditData?.school ?? ''}
                    onChange={(e) => handleStudentEditFieldChange('school', e.target.value)}
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900">{selectedStudent.school}</p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-inner">
                <BookOpenCheck className="w-4 h-4 text-primary-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-[0.2em]">Lớp</p>
                {isStudentEditing ? (
                  <input
                    className="input text-sm"
                    value={studentEditData?.grade ?? ''}
                    onChange={(e) => handleStudentEditFieldChange('grade', e.target.value)}
                  />
                ) : (
                  <p className="text-sm font-semibold text-gray-900">{selectedStudent.grade}</p>
                )}
              </div>
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-inner space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Trình độ hiện tại</p>
                {isStudentEditing ? (
                  <textarea
                    className="input text-sm"
                    value={studentEditData?.currentLevel ?? ''}
                    onChange={(e) => handleStudentEditFieldChange('currentLevel', e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedStudent.currentLevel}</p>
                )}
              </div>
              <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-inner space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Yêu cầu từ phụ huynh</p>
                {isStudentEditing ? (
                  <textarea
                    className="input text-sm"
                    value={studentEditData?.parentRequest ?? ''}
                    onChange={(e) => handleStudentEditFieldChange('parentRequest', e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedStudent.parentRequest}</p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Phụ huynh</p>
                <div className="mt-3 space-y-3">
                  {[
                    { title: 'Bố', nameKey: 'fatherName' as const, phoneKey: 'fatherPhone' as const },
                    { title: 'Mẹ', nameKey: 'motherName' as const, phoneKey: 'motherPhone' as const },
                  ].map((parent) => (
                    <div key={parent.title} className="flex flex-col gap-2">
                      <p className="text-xs text-gray-500 uppercase tracking-[0.2em]">{parent.title}</p>
                      {isStudentEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            className="input text-sm"
                            value={studentEditData?.parentInfo[parent.nameKey] ?? ''}
                            onChange={(e) => handleParentInfoChange(parent.nameKey, e.target.value)}
                            placeholder="Họ và tên"
                          />
                          <input
                            className="input text-sm"
                            value={studentEditData?.parentInfo[parent.phoneKey] ?? ''}
                            onChange={(e) => handleParentInfoChange(parent.phoneKey, e.target.value)}
                            placeholder="Số điện thoại"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">{selectedStudent.parentInfo[parent.nameKey]}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4 text-primary-500" />
                            {selectedStudent.parentInfo[parent.phoneKey]}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-inner">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Email liên hệ</p>
                {isStudentEditing ? (
                  <input
                    type="email"
                    className="input text-sm"
                    value={studentEditData?.parentInfo.email ?? ''}
                    onChange={(e) => handleParentInfoChange('email', e.target.value)}
                  />
                ) : (
                  <p className="text-sm font-semibold text-primary-600">{selectedStudent.parentInfo.email}</p>
                )}
              </div>
            </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { title: 'Điểm mạnh', items: selectedStudent.strengths, icon: <Heart className="w-4 h-4 text-pink-500" /> },
              { title: 'Cần cải thiện', items: selectedStudent.improvements, icon: <ClipboardList className="w-4 h-4 text-amber-500" /> },
              { title: 'Sở thích', items: selectedStudent.hobbies, icon: <Heart className="w-4 h-4 text-rose-500" /> },
            ].map((section) => (
              <div key={section.title} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60 space-y-3">
                <div className="flex items-center gap-2">
                  {section.icon}
                  <p className="text-sm font-semibold text-gray-900">{section.title}</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
            </div>

            <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-inner space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Ghi chú tổng quan</p>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedStudent.notes}</p>
              <div className="flex flex-wrap gap-2">
                {selectedStudent.favoriteSubjects.map((subject) => (
                  <span key={subject} className="px-3 py-1 text-xs font-semibold rounded-full bg-primary-50 text-primary-600">
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTutorManagementSection = () => (
    <div className="h-full overflow-hidden">
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý tutor</h2>
        <p className="text-sm text-gray-600">Theo dõi hồ sơ tutor và cập nhật nhanh CV, thông tin liên hệ</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
        <div className="card h-full flex flex-col overflow-hidden max-h-[85vh]">
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-gray-200 pb-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Danh sách tutor</p>
              <h3 className="text-lg font-semibold text-gray-900">{displayedTutors.length} tutor đang hiển thị</h3>
            </div>
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
            {displayedTutors.length === 0 && <div className="py-6 text-center text-sm text-gray-500">Không tìm thấy tutor phù hợp.</div>}
          </div>
        </div>

        <div className="card h-full flex flex-col overflow-hidden max-h-[85vh]">
          <div>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-6 pb-4 border-b border-gray-200">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Hồ sơ tutor</p>
                <h3 className="text-xl font-semibold text-gray-900">{selectedTutor.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-3 py-0.5 text-xs font-semibold rounded-full bg-white border border-gray-200 text-gray-700">{selectedTutor.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isTutorEditing ? (
                  <>
                    <button onClick={handleTutorSave} className="btn-primary text-sm px-4 py-2">
                      Lưu
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
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                <img src={selectedTutor.avatar} alt={selectedTutor.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Tutor</p>
              {isTutorEditing ? (
                <>
                  <input className="input text-base font-semibold mb-2" value={tutorEditData?.name ?? ''} onChange={(e) => handleTutorFieldChange('name', e.target.value)} />
                  <input className="input text-sm mb-2" value={tutorEditData?.qualification ?? ''} onChange={(e) => handleTutorFieldChange('qualification', e.target.value)} />
                  <select className="input text-sm" value={tutorEditData?.status ?? 'Đang dạy'} onChange={(e) => handleTutorFieldChange('status', e.target.value)}>
                    <option value="Đang dạy">Đang dạy</option>
                    <option value="Tạm nghỉ">Tạm nghỉ</option>
                  </select>
                </>
              ) : (
                <>
                  <h4 className="text-2xl font-bold text-gray-900">{selectedTutor.name}</h4>
                  <p className="text-sm text-gray-500">{selectedTutor.qualification}</p>
                </>
              )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60">
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-[0.2em]">Kinh nghiệm</p>
              {isTutorEditing ? (
                <textarea className="input text-sm" value={tutorEditData?.experience ?? ''} onChange={(e) => handleTutorFieldChange('experience', e.target.value)} />
              ) : (
                <p className="text-sm font-semibold text-gray-900 leading-relaxed">{selectedTutor.experience}</p>
              )}
              </div>
              <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60 space-y-2">
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-[0.2em]">Liên hệ</p>
              {isTutorEditing ? (
                <div className="space-y-2">
                  <input className="input text-sm" value={tutorEditData?.email ?? ''} onChange={(e) => handleTutorFieldChange('email', e.target.value)} placeholder="Email" />
                  <input className="input text-sm" value={tutorEditData?.phone ?? ''} onChange={(e) => handleTutorFieldChange('phone', e.target.value)} placeholder="Số điện thoại" />
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-900">{selectedTutor.email}</p>
                  <p className="text-sm text-gray-600">{selectedTutor.phone}</p>
                </>
              )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60">
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-[0.2em]">Môn phụ trách</p>
              {isTutorEditing ? (
                <input
                  className="input text-sm"
                  value={(tutorEditData?.subjects ?? []).join(', ')}
                  onChange={(e) => handleTutorSubjectsChange(e.target.value)}
                  placeholder="Ngăn cách bằng dấu phẩy"
                />
              ) : (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTutor.subjects.map((subject) => (
                    <span key={subject} className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-600">
                      {subject}
                    </span>
                  ))}
                </div>
              )}
              </div>
              <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-inner space-y-3">
                <p className="text-xs font-semibold uppercase text-gray-500 tracking-[0.2em]">Hồ sơ & CV</p>
              {isTutorEditing ? (
                <input className="input text-sm" value={tutorEditData?.cvUrl ?? ''} onChange={(e) => handleTutorFieldChange('cvUrl', e.target.value)} placeholder="Link CV (Drive, PDF...)" />
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

            <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-inner space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Giới thiệu</p>
              {isTutorEditing ? (
                <textarea className="input text-sm" value={tutorEditData?.bio ?? ''} onChange={(e) => handleTutorFieldChange('bio', e.target.value)} />
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed">{selectedTutor.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderScheduleManagementSection = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý lịch dạy</h2>
        <p className="text-sm text-gray-600">Chọn ngày để xem lịch học và tạo mới buổi dạy với học sinh, tutor tương ứng</p>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Môn học</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Học sinh</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tutor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Link Meet</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessionsForSelectedDate.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                      Chưa có lịch học nào trong ngày.
                    </td>
                  </tr>
                ) : (
                  sessionsForSelectedDate.map((session) => {
                    const student = studentList.find((s) => s.id === session.studentId)
                    const tutor = tutorList.find((t) => t.id === session.tutorId)
                    return (
                      <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {session.startTime} - {session.endTime}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{session.subject}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student?.name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{tutor?.name || '—'}</td>
                        <td className="px-4 py-3 text-sm">
                          {session.meetingLink && session.meetingLink !== 'Chưa cập nhật' ? (
                            <a href={session.meetingLink} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline truncate block max-w-xs">
                              {session.meetingLink}
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${session.status === 'Đã kết thúc' ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-600'}`}>
                            {session.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{session.note || '—'}</td>
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
    const months: Record<string, number> = {}
    scheduleSessions.forEach((session) => {
      const monthKey = format(new Date(session.date), 'MM/yyyy')
      months[monthKey] = (months[monthKey] || 0) + 1
    })
    const last7Months = Array.from({ length: 7 }, (_, i) => {
      const date = subMonths(new Date(), 6 - i)
      return format(date, 'MM/yyyy')
    })
    return last7Months.map((month) => ({
      month: format(new Date(parseInt(month.split('/')[1]), parseInt(month.split('/')[0]) - 1), 'MM/yyyy'),
      sessions: months[month] || 0,
    }))
  }, [scheduleSessions])

  const studentsByGrade = useMemo(() => {
    const gradeCount: Record<string, number> = {}
    studentList.forEach((student) => {
      const grade = student.grade.split(' ')[1] || 'Khác'
      gradeCount[grade] = (gradeCount[grade] || 0) + 1
    })
    return Object.entries(gradeCount)
      .map(([grade, count]) => ({ name: grade, value: count }))
      .sort((a, b) => b.value - a.value)
  }, [studentList])

  const tutorsBySubject = useMemo(() => {
    const subjectCount: Record<string, number> = {}
    tutorList.forEach((tutor) => {
      tutor.subjects.forEach((subject) => {
        subjectCount[subject] = (subjectCount[subject] || 0) + 1
      })
    })
    return Object.entries(subjectCount)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count)
  }, [tutorList])

  const studentsParticipationByWeek = useMemo(() => {
    const weeks: Record<string, Set<string>> = {}
    scheduleSessions.forEach((session) => {
      const weekStart = startOfWeek(new Date(session.date), { weekStartsOn: 1 })
      const weekKey = format(weekStart, 'dd/MM/yyyy')
      if (!weeks[weekKey]) weeks[weekKey] = new Set()
      weeks[weekKey].add(session.studentId)
    })
    const last8Weeks = Array.from({ length: 8 }, (_, i) => {
      const date = startOfWeek(subMonths(new Date(), 0), { weekStartsOn: 1 })
      return format(addMonths(date, -Math.floor(i / 4)), 'dd/MM/yyyy')
    })
    return last8Weeks
      .map((week) => ({
        week: format(new Date(week.split('/').reverse().join('-')), 'dd/MM'),
        students: weeks[week]?.size || 0,
      }))
      .reverse()
  }, [scheduleSessions])

  const renderAnalyticsSection = () => {
    // Tính toán dữ liệu thống kê
    const totalSessions = scheduleSessions.length
    const totalStudents = users.filter((u) => u.role === 'student').length
    const totalTutors = users.filter((u) => u.role === 'tutor').length
    const activeStudents = scheduleSessions.reduce((acc, session) => {
      if (!acc.includes(session.studentId)) acc.push(session.studentId)
      return acc
    }, [] as string[]).length

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
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Tổng số ca dạy</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{totalSessions}</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="card p-5 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Tổng số học sinh</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{totalStudents}</p>
              </div>
              <GraduationCap className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="card p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Tổng số tutor</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">{totalTutors}</p>
              </div>
              <UserCog className="w-12 h-12 text-purple-500 opacity-50" />
            </div>
          </div>
          <div className="card p-5 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Học sinh tham gia</p>
                <p className="text-3xl font-bold text-amber-900 mt-2">{activeStudents}</p>
              </div>
              <Users className="w-12 h-12 text-amber-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Biểu đồ số ca dạy theo tháng */}
        <div className="card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Số ca dạy theo tháng</h3>
            <p className="text-sm text-gray-500">Thống kê số lượng buổi học trong 7 tháng gần nhất</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sessionDataByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sessions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Biểu đồ phân bố học sinh theo lớp */}
          <div className="card p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Phân bố học sinh theo lớp</h3>
              <p className="text-sm text-gray-500">Số lượng học sinh trong từng lớp</p>
            </div>
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
          </div>

          {/* Biểu đồ số tutor theo môn */}
          <div className="card p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Số tutor theo môn học</h3>
              <p className="text-sm text-gray-500">Phân bố tutor theo từng môn học</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tutorsBySubject} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="subject" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu đồ số lượng học sinh tham gia học theo tuần */}
        <div className="card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Số lượng học sinh tham gia học theo tuần</h3>
            <p className="text-sm text-gray-500">Thống kê số học sinh tham gia học trong 8 tuần gần nhất</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={studentsParticipationByWeek}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="students" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
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
          onSectionChange={setActiveSection}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />
      }
    >
      <div className="h-full overflow-hidden">
        <div className="h-full overflow-y-auto px-2 sm:px-3 lg:px-6 py-2">{renderSection()}</div>
      </div>

      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-semibold text-primary-500 uppercase tracking-[0.4em]">Admin</p>
                <h3 className="text-2xl font-bold text-gray-900">Thêm người dùng mới</h3>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                Đóng
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-6">
              <section className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5 sm:p-6 shadow-inner">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Thông tin đăng nhập</p>
                    <h4 className="text-lg font-semibold text-gray-900">Tài khoản & phân quyền</h4>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white text-primary-600 border border-primary-100">
                    {newUser.role === 'student' ? 'Học sinh / Phụ huynh' : 'Tutor'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={FIELD_LABEL_CLASS}>Tên người dùng</label>
                    <input value={newUser.name} onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))} className="input" placeholder="Nhập tên" />
                  </div>
                  <div>
                    <label className={FIELD_LABEL_CLASS}>Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                      className="input"
                      placeholder="example@skillar.com"
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL_CLASS}>Mật khẩu</label>
                    <input
                      type="text"
                      value={newUser.password}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                      className="input"
                      placeholder="Nhập mật khẩu"
                    />
                  </div>
                  <div>
                    <label className={FIELD_LABEL_CLASS}>Ngày tham gia</label>
                    <input type="date" value={newUser.joinDate} onChange={(e) => setNewUser((prev) => ({ ...prev, joinDate: e.target.value }))} className="input" />
                  </div>
                  <div>
                    <label className={FIELD_LABEL_CLASS}>Vai trò</label>
                    <select
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          role: e.target.value as User['role'],
                        }))
                      }
                      className="input"
                    >
                      <option value="student">Học sinh / Phụ huynh</option>
                      <option value="tutor">Tutor</option>
                    </select>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">Hồ sơ chi tiết</p>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {newUser.role === 'student' ? 'Thông tin học sinh' : 'Thông tin tutor'}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500">
                    {newUser.role === 'student' ? 'Điền thông tin phụ huynh & lớp học' : 'Cập nhật kinh nghiệm giảng dạy'}
                  </p>
                </div>

                {newUser.role === 'student' && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-4 flex flex-col gap-3 md:flex-row md:items-center">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">Ảnh đại diện</p>
                        <p className="text-xs text-gray-500">Tải ảnh học sinh (PNG, JPG, tối đa 5MB)</p>
                        {uploadingFile && newUser.avatar && (
                          <p className="mt-2 text-xs font-medium text-gray-500">Đang upload...</p>
                        )}
                        {!uploadingFile && newUser.avatar && (
                          <p className="mt-2 text-xs font-medium text-primary-600">{newUser.avatar.name}</p>
                        )}
                        {newUser.avatarUrl && (
                          <p className="mt-1 text-xs font-medium text-green-600">✓ Đã upload thành công</p>
                        )}
                      </div>
                      <label className={`btn-secondary cursor-pointer text-center ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {uploadingFile ? 'Đang upload...' : 'Chọn ảnh'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingFile}
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            if (file) {
                              handleFileChange(file, 'avatar')
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studentFields.map((field) => (
                        <div key={field.name}>
                          <label className={FIELD_LABEL_CLASS}>{field.label}</label>
                          <input
                            type={field.type}
                            value={newUser.studentInfo[field.name]}
                            onChange={(e) =>
                              setNewUser((prev) => ({
                                ...prev,
                                studentInfo: { ...prev.studentInfo, [field.name]: e.target.value },
                              }))
                            }
                            className="input"
                            placeholder={field.label}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {newUser.role === 'tutor' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-4 flex flex-col gap-3">
                        <p className="text-sm font-semibold text-gray-800">Ảnh đại diện</p>
                        <p className="text-xs text-gray-500">Tải ảnh tutor (PNG, JPG, tối đa 5MB)</p>
                        {uploadingFile && newUser.avatar && (
                          <p className="text-xs font-medium text-gray-500">Đang upload...</p>
                        )}
                        {!uploadingFile && newUser.avatar && (
                          <p className="text-xs font-medium text-primary-600">{newUser.avatar.name}</p>
                        )}
                        {newUser.avatarUrl && (
                          <p className="text-xs font-medium text-green-600">✓ Đã upload thành công</p>
                        )}
                        <label className={`btn-secondary cursor-pointer text-center ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          {uploadingFile ? 'Đang upload...' : 'Chọn ảnh'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingFile}
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null
                              if (file) {
                                handleFileChange(file, 'avatar')
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-4 flex flex-col gap-3">
                        <p className="text-sm font-semibold text-gray-800">Hồ sơ CV</p>
                        <p className="text-xs text-gray-500">Tải CV (PDF, DOC, tối đa 10MB)</p>
                        {uploadingFile && newUser.cvFile && (
                          <p className="text-xs font-medium text-gray-500">Đang upload...</p>
                        )}
                        {!uploadingFile && newUser.cvFile && (
                          <p className="text-xs font-medium text-primary-600">{newUser.cvFile.name}</p>
                        )}
                        {newUser.cvFileUrl && (
                          <p className="text-xs font-medium text-green-600">✓ Đã upload thành công</p>
                        )}
                        <label className={`btn-secondary cursor-pointer text-center ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          {uploadingFile ? 'Đang upload...' : 'Chọn file'}
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="hidden"
                            disabled={uploadingFile}
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null
                              if (file) {
                                handleFileChange(file, 'cvFile')
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tutorFields.map((field) => (
                        <div key={field.name} className={field.colSpan ? 'md:col-span-2' : ''}>
                          <label className={FIELD_LABEL_CLASS}>{field.label}</label>
                          <input
                            type={field.type}
                            value={newUser.tutorInfo[field.name]}
                            onChange={(e) =>
                              setNewUser((prev) => ({
                                ...prev,
                                tutorInfo: { ...prev.tutorInfo, [field.name]: e.target.value },
                              }))
                            }
                            className="input"
                            placeholder={field.label}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                <button type="button" onClick={() => setShowAddUserModal(false)} className="btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Lưu tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    {studentList.map((student) => (
                      <option key={student.id} value={student.id}>
                        Học sinh {student.name}
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
                        Tutor {tutor.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <BookOpenCheck className="w-4 h-4 inline mr-2 text-primary-500" />
                  Môn học / Nội dung
                </label>
                <input
                  className="input w-full"
                  value={newSchedule.subject}
                  onChange={(e) => handleScheduleFieldChange('subject', e.target.value)}
                  placeholder="Ví dụ: Toán - Ôn hình học"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2 text-primary-500" />
                  Link Meet
                </label>
                <input
                  className="input w-full"
                  value={newSchedule.meetingLink}
                  onChange={(e) => handleScheduleFieldChange('meetingLink', e.target.value)}
                  placeholder="https://meet.google.com/..."
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
              <button type="submit" className="btn-primary px-6 py-2">
                Lưu lịch
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  )
}

