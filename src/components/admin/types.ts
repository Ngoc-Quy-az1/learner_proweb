export interface User {
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

export type EditableArrayField = 'strengths' | 'improvements' | 'hobbies' | 'favoriteSubjects'

export interface ParentInfo {
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

export interface StudentProfile {
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
  parentId?: string
  currentLevel: string
  parentRequest: string
  hobbies: string[]
  favoriteSubjects: string[]
  strengths: string[]
  improvements: string[]
  notes: string
}

export interface StudentListItem {
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

export interface TutorProfile {
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

export interface TutorListItem {
  id: string
  name: string
  avatar: string
  headline: string
  subjects: string[]
  status: 'Đang dạy' | 'Tạm nghỉ'
  hasProfile: boolean
}

export interface ScheduleSession {
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

export const ROLE_LABELS: Record<User['role'], string> = {
  student: 'Học sinh / Phụ huynh',
  tutor: 'Tutor',
  parent: 'Phụ huynh',
  admin: 'Admin',
  teacher: 'Giáo viên',
}

