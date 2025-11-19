import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import TutorSidebar from '../components/TutorSidebar'
import ChecklistTable, { ChecklistItem } from '../components/ChecklistTable'
import { Users, Calendar, FileText, Plus, Clock, TrendingUp, UserCircle, Download, Award, Copy, ChevronRight, Upload, BookOpen, ChevronUp, ChevronDown, Star } from 'lucide-react'
import { format, isToday } from 'date-fns'

interface TutorSchedule {
  id: string
  studentId: string
  subject: string
  student: string
  time: string
  date: Date
  meetLink?: string
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

export default function TutorDashboard() {
  const [activeSection, setActiveSection] = useState('home')
  const [selectedStudent, setSelectedStudent] = useState<string>('1')
  const [showChecklistForm, setShowChecklistForm] = useState(false)
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
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(true)
  const [copiedScheduleLink, setCopiedScheduleLink] = useState<string | null>(null)
  const [expandedChecklistSubject, setExpandedChecklistSubject] = useState<string | null>(null)
  const [showStudentAttachmentCard, setShowStudentAttachmentCard] = useState(true)
  const [selectedScheduleSlotId, setSelectedScheduleSlotId] = useState<string | null>(null)
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<{ type: 'lesson' | 'task' | 'note'; itemId: string } | null>(null)
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({})
  const [selectedSubjectStudents, setSelectedSubjectStudents] = useState<Record<string, string[]>>({}) // subject -> studentIds
  // State riêng cho home section (chỉ hiển thị hôm nay)
  const [expandedSubjectsHome, setExpandedSubjectsHome] = useState<Record<string, boolean>>({})
  const [selectedSubjectStudentsHome, setSelectedSubjectStudentsHome] = useState<Record<string, string[]>>({}) // subject -> studentIds
  
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

  const students = [
    { id: '1', name: 'Nguyễn Văn A', subject: 'Toán', progress: 67, parent: 'Phạm Văn X', contact: '0123 456 789', email: 'phu_huynh_a@example.com', address: 'Hà Nội', preferredChannel: 'Zalo', age: 16, dateOfBirth: '15/03/2009', school: 'THPT Chuyên Hà Nội - Amsterdam', grade: 'Lớp 10A1' },
    { id: '2', name: 'Trần Thị B', subject: 'Lý', progress: 85, parent: 'Trần Văn C', contact: '0987 654 321', email: 'phu_huynh_b@example.com', address: 'Đà Nẵng', preferredChannel: 'Email', age: 17, dateOfBirth: '22/07/2008', school: 'THPT Nguyễn Hiền', grade: 'Lớp 11B2' },
    { id: '3', name: 'Lê Văn C', subject: 'Hóa', progress: 45, parent: 'Lê Minh D', contact: '0909 888 777', email: 'phu_huynh_c@example.com', address: 'TP. HCM', preferredChannel: 'Điện thoại', age: 15, dateOfBirth: '08/11/2009', school: 'THPT Lê Hồng Phong', grade: 'Lớp 10A3' },
    { id: '4', name: 'Phạm Thị D', subject: 'Toán', progress: 72, parent: 'Phạm Văn E', contact: '0911 223 344', email: 'phuhuynh_d@example.com', address: 'Hà Nội', preferredChannel: 'Zalo', age: 16, dateOfBirth: '30/01/2009', school: 'THPT Chu Văn An', grade: 'Lớp 10A5' },
    { id: '5', name: 'Ngô Văn E', subject: 'Lý', progress: 58, parent: 'Ngô Minh F', contact: '0905 112 113', email: 'phuhuynh_e@example.com', address: 'Buôn Ma Thuột', preferredChannel: 'SMS', age: 18, dateOfBirth: '14/05/2007', school: 'THPT Buôn Ma Thuột', grade: 'Lớp 12A2' },
    { id: '6', name: 'Đinh Thị F', subject: 'Hóa', progress: 91, parent: 'Đinh Văn G', contact: '0988 123 456', email: 'phuhuynh_f@example.com', address: 'Hải Phòng', preferredChannel: 'Email', age: 17, dateOfBirth: '19/09/2008', school: 'THPT Trần Phú', grade: 'Lớp 11A1' },
    { id: '7', name: 'Trịnh Văn G', subject: 'Sinh', progress: 63, parent: 'Trịnh Thị H', contact: '0933 456 789', email: 'phuhuynh_g@example.com', address: 'Bắc Ninh', preferredChannel: 'Zalo', age: 16, dateOfBirth: '03/12/2009', school: 'THPT Hàn Thuyên', grade: 'Lớp 10B1' },
    { id: '8', name: 'Bùi Thị H', subject: 'Toán', progress: 76, parent: 'Bùi Văn I', contact: '0977 888 666', email: 'phuhuynh_h@example.com', address: 'Nha Trang', preferredChannel: 'Điện thoại', age: 17, dateOfBirth: '25/06/2008', school: 'THPT Nguyễn Văn Trỗi', grade: 'Lớp 11A4' },
    { id: '9', name: 'Hà Văn I', subject: 'Lý', progress: 54, parent: 'Hà Thị K', contact: '0912 334 556', email: 'phuhuynh_i@example.com', address: 'Huế', preferredChannel: 'Zalo', age: 15, dateOfBirth: '11/04/2010', school: 'THPT Quốc Học', grade: 'Lớp 10A6' },
    { id: '10', name: 'Nguyễn Thị J', subject: 'Hóa', progress: 82, parent: 'Nguyễn Văn L', contact: '0922 556 778', email: 'phuhuynh_j@example.com', address: 'Quảng Ninh', preferredChannel: 'Email', age: 16, dateOfBirth: '28/08/2009', school: 'THPT Hòn Gai', grade: 'Lớp 10B3' },
    { id: '11', name: 'Mai Văn K', subject: 'Toán', progress: 61, parent: 'Mai Thị M', contact: '0901 223 334', email: 'phuhuynh_k@example.com', address: 'Đà Lạt', preferredChannel: 'Zalo', age: 17, dateOfBirth: '07/02/2008', school: 'THPT Chuyên Thăng Long', grade: 'Lớp 11B1' },
    { id: '12', name: 'Phan Thị L', subject: 'Lý', progress: 88, parent: 'Phan Văn N', contact: '0944 667 778', email: 'phuhuynh_l@example.com', address: 'Vũng Tàu', preferredChannel: 'Điện thoại' },
    { id: '13', name: 'Vũ Văn M', subject: 'Hóa', progress: 47, parent: 'Vũ Thị O', contact: '0938 998 887', email: 'phuhuynh_m@example.com', address: 'Cần Thơ', preferredChannel: 'Zalo' },
    { id: '14', name: 'Đỗ Thị N', subject: 'Toán', progress: 79, parent: 'Đỗ Văn P', contact: '0966 774 441', email: 'phuhuynh_n@example.com', address: 'Hà Nam', preferredChannel: 'Email' },
    { id: '15', name: 'Lâm Văn O', subject: 'Lý', progress: 69, parent: 'Lâm Thị Q', contact: '0955 332 211', email: 'phuhuynh_o@example.com', address: 'Thanh Hóa', preferredChannel: 'Điện thoại' },
    { id: '16', name: 'Hoàng Thị P', subject: 'Hóa', progress: 93, parent: 'Hoàng Văn R', contact: '0949 443 332', email: 'phuhuynh_p@example.com', address: 'Hà Giang', preferredChannel: 'Zalo' },
    { id: '17', name: 'Cao Văn Q', subject: 'Toán', progress: 52, parent: 'Cao Thị S', contact: '0902 556 223', email: 'phuhuynh_q@example.com', address: 'Nam Định', preferredChannel: 'Email' },
    { id: '18', name: 'Lý Thị R', subject: 'Lý', progress: 74, parent: 'Lý Văn T', contact: '0935 663 447', email: 'phuhuynh_r@example.com', address: 'Phú Quốc', preferredChannel: 'Zalo' },
    { id: '19', name: 'Trương Văn S', subject: 'Hóa', progress: 66, parent: 'Trương Thị U', contact: '0919 884 552', email: 'phuhuynh_s@example.com', address: 'Cà Mau', preferredChannel: 'Điện thoại' },
    { id: '20', name: 'Đào Thị T', subject: 'Toán', progress: 57, parent: 'Đào Văn V', contact: '0981 234 567', email: 'phuhuynh_t@example.com', address: 'Bình Dương', preferredChannel: 'Zalo' },
    { id: '21', name: 'Trần Văn U', subject: 'Anh', progress: 83, parent: 'Trần Thị W', contact: '0907 556 778', email: 'phuhuynh_u@example.com', address: 'Long An', preferredChannel: 'Email' },
    { id: '22', name: 'Nguyễn Thị V', subject: 'Sinh', progress: 71, parent: 'Nguyễn Văn X', contact: '0913 224 466', email: 'phuhuynh_v@example.com', address: 'Hưng Yên', preferredChannel: 'Zalo' },
    { id: '23', name: 'Đinh Văn W', subject: 'Sử', progress: 64, parent: 'Đinh Thị Y', contact: '0931 443 556', email: 'phuhuynh_w@example.com', address: 'Nghệ An', preferredChannel: 'Điện thoại' },
    { id: '24', name: 'Võ Thị X', subject: 'Địa', progress: 58, parent: 'Võ Văn Z', contact: '0925 889 001', email: 'phuhuynh_x@example.com', address: 'Quảng Bình', preferredChannel: 'Zalo' },
    { id: '25', name: 'Ngô Văn Y', subject: 'Toán', progress: 82, parent: 'Ngô Thị A1', contact: '0968 776 554', email: 'phuhuynh_y@example.com', address: 'Gia Lai', preferredChannel: 'Email' },
    { id: '26', name: 'Phạm Thị Z', subject: 'Lý', progress: 49, parent: 'Phạm Văn B1', contact: '0958 332 110', email: 'phuhuynh_z@example.com', address: 'Quảng Trị', preferredChannel: 'Điện thoại' },
    { id: '27', name: 'Hoàng Văn A1', subject: 'Hóa', progress: 77, parent: 'Hoàng Thi B1', contact: '0970 112 114', email: 'phuhuynh_aa@example.com', address: 'Kon Tum', preferredChannel: 'Zalo' },
    { id: '28', name: 'Lê Thị B1', subject: 'Toán', progress: 65, parent: 'Lê Văn C1', contact: '0904 889 992', email: 'phuhuynh_bb@example.com', address: 'Bình Định', preferredChannel: 'Email' },
    { id: '29', name: 'Đỗ Văn C1', subject: 'Lý', progress: 73, parent: 'Đỗ Thị D1', contact: '0916 223 667', email: 'phuhuynh_cc@example.com', address: 'Tuyên Quang', preferredChannel: 'Điện thoại' },
    { id: '30', name: 'Nguyễn Thị D1', subject: 'Hóa', progress: 88, parent: 'Nguyễn Văn E1', contact: '0940 112 330', email: 'phuhuynh_dd@example.com', address: 'Lạng Sơn', preferredChannel: 'Zalo' },

  ]

  const [tutorSchedules] = useState<TutorSchedule[]>([
    // Khung giờ 14:00 - 15:30: 4 học sinh
    {
      id: 'ts-1',
      studentId: '1',
      subject: 'Toán',
      student: 'Nguyễn Văn A',
      time: '14:00 - 15:30',
      date: new Date(),
      meetLink: 'https://meet.google.com/abc-defg-hij',
    },
    {
      id: 'ts-1b',
      studentId: '4',
      subject: 'Toán',
      student: 'Phạm Thị D',
      time: '14:00 - 15:30',
      date: new Date(),
      meetLink: 'https://meet.google.com/abc-defg-hij',
    },
    {
      id: 'ts-1c',
      studentId: '8',
      subject: 'Toán',
      student: 'Bùi Thị H',
      time: '14:00 - 15:30',
      date: new Date(),
      meetLink: 'https://meet.google.com/abc-defg-hij',
    },
    {
      id: 'ts-1d',
      studentId: '11',
      subject: 'Toán',
      student: 'Mai Văn K',
      time: '14:00 - 15:30',
      date: new Date(),
      meetLink: 'https://meet.google.com/abc-defg-hij',
    },
    // Khung giờ 16:00 - 17:30: 4 học sinh
    {
      id: 'ts-2',
      studentId: '2',
      subject: 'Lý',
      student: 'Trần Thị B',
      time: '16:00 - 17:30',
      date: new Date(),
      meetLink: 'https://meet.google.com/xyz-uvw-rst',
    },
    {
      id: 'ts-2b',
      studentId: '5',
      subject: 'Lý',
      student: 'Ngô Văn E',
      time: '16:00 - 17:30',
      date: new Date(),
      meetLink: 'https://meet.google.com/xyz-uvw-rst',
    },
    {
      id: 'ts-2c',
      studentId: '9',
      subject: 'Lý',
      student: 'Hà Văn I',
      time: '16:00 - 17:30',
      date: new Date(),
      meetLink: 'https://meet.google.com/xyz-uvw-rst',
    },
    {
      id: 'ts-2d',
      studentId: '12',
      subject: 'Lý',
      student: 'Phan Thị L',
      time: '16:00 - 17:30',
      date: new Date(),
      meetLink: 'https://meet.google.com/xyz-uvw-rst',
    },
    // Khung giờ 18:00 - 19:30: 3 học sinh
    {
      id: 'ts-3',
      studentId: '3',
      subject: 'Hóa',
      student: 'Lê Văn C',
      time: '18:00 - 19:30',
      date: new Date(),
      meetLink: 'https://meet.google.com/hij-klm-nop',
    },
    {
      id: 'ts-3b',
      studentId: '6',
      subject: 'Hóa',
      student: 'Đinh Thị F',
      time: '18:00 - 19:30',
      date: new Date(),
      meetLink: 'https://meet.google.com/hij-klm-nop',
    },
    {
      id: 'ts-3c',
      studentId: '10',
      subject: 'Hóa',
      student: 'Nguyễn Thị J',
      time: '18:00 - 19:30',
      date: new Date(),
      meetLink: 'https://meet.google.com/hij-klm-nop',
    },
    // Ngày mai
    {
      id: 'ts-4',
      studentId: '4',
      subject: 'Toán',
      student: 'Phạm Hoàng D',
      time: '09:00 - 10:30',
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      meetLink: 'https://meet.google.com/abc-123',
    },
    {
      id: 'ts-5',
      studentId: '3',
      subject: 'Hóa',
      student: 'Lê Văn C',
      time: '13:00 - 14:30',
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      meetLink: 'https://meet.google.com/xyz-456',
    },
  ])

  const [studentPage, setStudentPage] = useState(1)
  const studentsPerPage = 20
  const studentPages = Math.ceil(students.length / studentsPerPage)
  const paginatedStudents = students.slice(
    (studentPage - 1) * studentsPerPage,
    studentPage * studentsPerPage
  )
  const selectedStudentDetail = students.find(student => student.id === selectedStudent)

  // Checklist data theo studentId
  const [checklistItemsByStudent, setChecklistItemsByStudent] = useState<Record<string, ChecklistItem[]>>({
    '1': [ // Nguyễn Văn A
      {
        id: '1-1',
        subject: 'Toán',
        lesson: 'Giải hệ phương trình',
        task: 'Bài tập SGK 2,3,5',
        status: 'not_done',
      },
      {
        id: '1-2',
        subject: 'Toán',
        lesson: 'Ôn lý thuyết chương 2',
        task: 'Đọc lại trang 34-36',
        status: 'done',
        note: 'Hiểu 80%',
      },
      {
        id: '1-3',
        subject: 'Toán',
        lesson: 'Luyện đề 1',
        task: 'Làm phần A',
        status: 'in_progress',
        note: 'Cần hỗ trợ',
      },
      {
        id: '1-4',
        subject: 'Hóa',
        lesson: 'Cân bằng phương trình hóa học',
        task: 'Bài tập SGK 1,2,3',
        status: 'done',
        note: 'Làm tốt',
      },
      {
        id: '1-5',
        subject: 'Hóa',
        lesson: 'Tính toán mol',
        task: 'Bài tập nâng cao trang 45',
        status: 'in_progress',
        note: 'Cần kiểm tra lại',
      },
    ],
    '4': [ // Phạm Thị D
      {
        id: '4-1',
        subject: 'Toán',
        lesson: 'Phương trình bậc hai',
        task: 'Bài tập SGK 1,2,3',
        status: 'done',
        note: 'Làm tốt',
      },
      {
        id: '4-2',
        subject: 'Toán',
        lesson: 'Hệ phương trình bậc nhất',
        task: 'Bài tập nâng cao trang 45',
        status: 'in_progress',
        note: 'Cần kiểm tra lại',
      },
    ],
    '8': [ // Bùi Thị H
      {
        id: '8-1',
        subject: 'Toán',
        lesson: 'Bất phương trình',
        task: 'Bài tập SGK 4,5,6',
        status: 'not_done',
      },
      {
        id: '8-2',
        subject: 'Toán',
        lesson: 'Ôn tập chương 3',
        task: 'Làm đề kiểm tra',
        status: 'done',
        note: 'Đạt 85 điểm',
      },
      {
        id: '8-3',
        subject: 'Toán',
        lesson: 'Luyện đề 2',
        task: 'Làm phần B và C',
        status: 'in_progress',
        note: 'Đang làm',
      },
    ],
    '11': [ // Mai Văn K
      {
        id: '11-1',
        subject: 'Toán',
        lesson: 'Hàm số bậc nhất',
        task: 'Bài tập SGK 7,8,9',
        status: 'done',
        note: 'Hoàn thành tốt',
      },
      {
        id: '11-2',
        subject: 'Toán',
        lesson: 'Đồ thị hàm số',
        task: 'Vẽ đồ thị các hàm số',
        status: 'not_done',
      },
      {
        id: '11-3',
        subject: 'Toán',
        lesson: 'Bài toán thực tế',
        task: 'Giải 3 bài toán ứng dụng',
        status: 'in_progress',
        note: 'Cần hướng dẫn thêm',
      },
    ],
  })

  // Lấy checklist items của học sinh được chọn
  const checklistItems = checklistItemsByStudent[selectedStudent] || []

  const handleStatusChange = (id: string, status: ChecklistItem['status']) => {
    setChecklistItemsByStudent(prev => {
      const newData = { ...prev }
      if (newData[selectedStudent]) {
        newData[selectedStudent] = newData[selectedStudent].map(item =>
          item.id === id ? { ...item, status } : item
        )
      }
      return newData
    })
  }

  const handleNoteChange = (id: string, note: string) => {
    setChecklistItemsByStudent(prev => {
      const newData = { ...prev }
      if (newData[selectedStudent]) {
        newData[selectedStudent] = newData[selectedStudent].map(item =>
          item.id === id ? { ...item, note } : item
        )
      }
      return newData
    })
  }

  const handleLessonChange = (id: string, lesson: string) => {
    setChecklistItemsByStudent(prev => {
      const newData = { ...prev }
      if (newData[selectedStudent]) {
        newData[selectedStudent] = newData[selectedStudent].map(item =>
          item.id === id ? { ...item, lesson } : item
        )
      }
      return newData
    })
  }

  const handleTaskChange = (id: string, task: string) => {
    setChecklistItemsByStudent(prev => {
      const newData = { ...prev }
      if (newData[selectedStudent]) {
        newData[selectedStudent] = newData[selectedStudent].map(item =>
          item.id === id ? { ...item, task } : item
        )
      }
      return newData
    })
  }

  const handleFileUpload = (id: string, file: File) => {
    console.log('Upload file for item:', id, file.name)
  }


  const selectedStudentData = students.find(s => s.id === selectedStudent)

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

  const schedulesByDate = useMemo(() => {
    return tutorSchedules.reduce<Record<string, TutorSchedule[]>>((acc, schedule) => {
      const key = format(schedule.date, 'yyyy-MM-dd')
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(schedule)
      return acc
    }, {})
  }, [tutorSchedules])

  const scheduleDates = useMemo(
    () =>
      Object.keys(schedulesByDate).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      ),
    [schedulesByDate]
  )

  const todayTutorSchedules = useMemo(
    () => tutorSchedules.filter(schedule => isToday(schedule.date)),
    [tutorSchedules]
  )
  const todayStudentIds = useMemo(() => new Set(todayTutorSchedules.map((schedule) => schedule.studentId)), [todayTutorSchedules])
  const todayStudentsForHome = useMemo(
    () => students.filter((student) => todayStudentIds.has(student.id)),
    [students, todayStudentIds]
  )

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

  const studentAttachments: Record<string, { id: string; name: string; uploadedAt: string }[]> = useMemo(() => ({
    '1': [
      { id: 'att-1', name: 'Bai_tap_Toan_15_11.pdf', uploadedAt: '15/11/2025 08:30' },
      { id: 'att-2', name: 'Ghi_chu_phu_huynh.txt', uploadedAt: '15/11/2025 09:00' },
    ],
    '2': [
      { id: 'att-3', name: 'De_cuong_Ly.pdf', uploadedAt: '14/11/2025 19:40' },
    ],
    '3': [
      { id: 'att-4', name: 'Bai_tap_hoa.docx', uploadedAt: '13/11/2025 20:10' },
    ],
    '4': [
      { id: 'att-5', name: 'Bai_tap_Toan_chuong_2.pdf', uploadedAt: '16/11/2025 10:15' },
      { id: 'att-6', name: 'Ghi_chu_phu_huynh_D.txt', uploadedAt: '16/11/2025 11:00' },
    ],
    '5': [
      { id: 'att-7', name: 'De_kiem_tra_Ly.pdf', uploadedAt: '15/11/2025 14:20' },
    ],
    '8': [
      { id: 'att-8', name: 'Bai_tap_Toan_nang_cao.pdf', uploadedAt: '17/11/2025 08:45' },
    ],
    '9': [
      { id: 'att-9', name: 'On_tap_Ly_chuong_3.pdf', uploadedAt: '16/11/2025 15:30' },
    ],
    '11': [
      { id: 'att-10', name: 'Bai_tap_Toan_ve_nha.pdf', uploadedAt: '17/11/2025 09:20' },
      { id: 'att-11', name: 'Ghi_chu_phu_huynh_K.txt', uploadedAt: '17/11/2025 10:00' },
    ],
    '12': [
      { id: 'att-12', name: 'De_kiem_tra_Ly_chuong_4.pdf', uploadedAt: '16/11/2025 13:45' },
      { id: 'att-13', name: 'Ghi_chu_phu_huynh_L.txt', uploadedAt: '16/11/2025 14:20' },
    ],
    '6': [
      { id: 'att-14', name: 'Bai_tap_Hoa_nang_cao.pdf', uploadedAt: '15/11/2025 16:30' },
    ],
    '10': [
      { id: 'att-15', name: 'On_tap_Hoa_chuong_2.pdf', uploadedAt: '17/11/2025 11:15' },
      { id: 'att-16', name: 'Ghi_chu_phu_huynh_J.txt', uploadedAt: '17/11/2025 12:00' },
    ],
  }), [])

  // Detail items theo studentId và subject
  const [tutorDetailItemsByStudentAndSubject, setTutorDetailItemsByStudentAndSubject] = useState<Record<string, Record<string, TutorChecklistDetail[]>>>({
    '1': {
      Toán: [
        {
          id: 'd1-1',
          lesson: 'Bài 3 – Giải hệ bằng phương pháp thế',
          estimatedTime: '10 phút',
          actualTime: '12 phút',
          result: 'completed',
          solution: 'Áp dụng phương pháp thế, trình bày từng bước.',
          note: 'Làm đúng, trình bày rõ.',
          uploadedFile: 'bai_3_giai_he_phuong_trinh.pdf',
        },
        {
          id: 'd1-2',
          lesson: 'Bài 4 – Giải hệ bằng cộng đại số',
          estimatedTime: '15 phút',
          actualTime: '20 phút',
          result: 'incorrect',
          solution: 'Nhắc lại quy tắc cộng đại số và kiểm tra dấu.',
          note: 'Sai bước chuyển vế, cần sửa.',
          uploadedFile: 'bai_4_cong_dai_so.pdf',
        },
        {
          id: 'd1-3',
          lesson: 'Bài 5 – Bài nâng cao',
          estimatedTime: '20 phút',
          actualTime: '25 phút',
          result: 'not_done',
          solution: 'Đề xuất luyện thêm 3 bài tương tự với tutor.',
          note: 'Cần luyện thêm phần rút gọn.',
        },
      ],
      Hóa: [
        {
          id: 'd1-h1',
          lesson: 'Bài 1 – Cân bằng phương trình',
          estimatedTime: '10 phút',
          actualTime: '8 phút',
          result: 'completed',
          solution: 'Cân bằng đúng, hiểu rõ phương pháp.',
          note: 'Làm tốt',
        },
        {
          id: 'd1-h2',
          lesson: 'Bài 2 – Tính toán mol',
          estimatedTime: '15 phút',
          actualTime: '18 phút',
          result: 'in_progress',
          solution: 'Cần kiểm tra lại công thức tính mol.',
          note: 'Cần kiểm tra lại',
        },
      ],
    },
    '4': {
      Toán: [
        {
          id: 'd4-1',
          lesson: 'Bài 1 – Phương trình bậc hai',
          estimatedTime: '12 phút',
          actualTime: '10 phút',
          result: 'completed',
          solution: 'Giải đúng, trình bày rõ ràng.',
          note: 'Làm tốt',
        },
        {
          id: 'd4-2',
          lesson: 'Bài 2 – Hệ phương trình',
          estimatedTime: '15 phút',
          actualTime: '18 phút',
          result: 'in_progress',
          solution: 'Cần kiểm tra lại các bước giải.',
          note: 'Cần kiểm tra lại',
        },
      ],
    },
    '8': {
      Toán: [
        {
          id: 'd8-1',
          lesson: 'Bài 4 – Bất phương trình',
          estimatedTime: '15 phút',
          actualTime: '20 phút',
          result: 'not_done',
          solution: 'Cần ôn lại kiến thức về bất phương trình.',
          note: 'Chưa làm',
        },
        {
          id: 'd8-2',
          lesson: 'Đề kiểm tra chương 3',
          estimatedTime: '45 phút',
          actualTime: '50 phút',
          result: 'completed',
          solution: 'Làm tốt, đạt 85 điểm.',
          note: 'Đạt 85 điểm',
        },
      ],
    },
    '11': {
      Toán: [
        {
          id: 'd11-1',
          lesson: 'Bài 7 – Hàm số bậc nhất',
          estimatedTime: '12 phút',
          actualTime: '11 phút',
          result: 'completed',
          solution: 'Hoàn thành tốt, hiểu rõ khái niệm.',
          note: 'Hoàn thành tốt',
        },
        {
          id: 'd11-2',
          lesson: 'Vẽ đồ thị hàm số',
          estimatedTime: '20 phút',
          actualTime: '0 phút',
          result: 'not_done',
          solution: 'Chưa làm',
          note: 'Chưa làm',
        },
      ],
    },
  })

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
                          <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
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
      <div className="mt-4 bg-white rounded-xl border-2 border-gray-200 p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Đánh giá chi tiết môn học</h3>
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
        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Đánh giá chung</label>
          <textarea
            value={evaluation.generalComment}
            onChange={(e) => handleEvaluationChange(studentId, subject, 'generalComment', e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-white text-sm text-gray-700"
            rows={3}
            placeholder="Nhập đánh giá chung về học sinh trong môn học này..."
          />
        </div>
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

  const handleChecklistFormSubmit = () => {
    console.log('Checklist form data:', checklistForm)
    setShowChecklistForm(false)
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
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6 self-start">
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
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center border border-green-200">
                      <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <p className="text-xs text-gray-600 mb-1">Tiến độ</p>
                      <p className="text-xl font-bold text-gray-900">{homeProgress}%</p>
                    </div>
                  )
                })()}
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

            {scheduleSlots.length === 0 ? (
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
                    {selectedScheduleSlot.schedules.map((schedule) => {
                      const status = getScheduleStatus(schedule)
                      const statusConfig = {
                        in_progress: { label: 'Đang dạy', className: 'bg-green-100 text-green-700' },
                        upcoming: { label: 'Sắp dạy', className: 'bg-yellow-100 text-yellow-700' },
                        completed: { label: 'Đã xong', className: 'bg-gray-100 text-gray-600' },
                      }[status]
                      const isExpanded = expandedStudentId === schedule.studentId
                      const studentAttachmentsList = studentAttachments[schedule.studentId] || []

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
                            {studentAttachmentsList.length > 0 && (
                              <button
                                onClick={() => setExpandedStudentId(isExpanded ? null : schedule.studentId)}
                                className="mt-3 w-full flex items-center justify-between text-left text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                              >
                                <span>Tài liệu phụ huynh đã gửi ({studentAttachmentsList.length})</span>
                                <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </button>
                            )}
                          </div>

                          {/* Expanded documents section */}
                          {isExpanded && studentAttachmentsList.length > 0 && (
                            <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-2">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Tài liệu phụ huynh đã gửi</p>
                              {studentAttachmentsList.map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">Tải lên: {file.uploadedAt}</p>
                                  </div>
                                  <button className="text-sm text-primary-600 hover:text-primary-700">Tải xuống</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Quick Actions - Large Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-no-transition border-2 border-gray-200 hover:border-primary-400 hover:shadow-xl cursor-pointer group">
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

          {/* Checklist Section */}
          <div className="card-no-transition">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Checklist bài học</h2>
                <p className="text-sm text-gray-600">
                  {selectedStudentData && `${selectedStudentData.name} - ${selectedStudentData.subject}`}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => openChecklistForm(selectedStudent)} className="btn-secondary flex items-center space-x-2 text-sm">
                  <Plus className="w-4 h-4" />
                  <span>Thêm bài mới</span>
                </button>
              </div>
            </div>

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
              })}
            </div>

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

  const renderStudentsSection = () => (
    <div className="h-full overflow-hidden">
      <div className="grid grid-cols-1 xl:grid-cols-[55%_45%] gap-4 h-full">
        <div className="card-no-transition space-y-5 overflow-y-auto">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold text-gray-900">Quản lý học sinh</h2>
            <p className="text-sm text-gray-500">
              Trang {studentPage}/{studentPages} · {students.length} học sinh
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {paginatedStudents.map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student.id)}
                className={`text-left border-2 rounded-2xl p-4 ${
                  selectedStudent === student.id
                    ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className={`font-bold ${selectedStudent === student.id ? 'text-primary-700' : 'text-gray-900'}`}>
                      {student.name}
                    </h3>
                    <p className="text-sm text-gray-600">{student.subject}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Tiến độ</span>
                    <span className="font-semibold">{student.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
                      style={{ width: `${student.progress}%` }}
                    ></div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStudentPage((page) => Math.max(1, page - 1))}
              disabled={studentPage === 1}
              className="px-3 py-2 rounded-xl border text-sm font-semibold disabled:opacity-50"
            >
              Trang trước
            </button>
            <div className="flex items-center space-x-2 text-sm font-semibold text-gray-600">
              <span>Trang</span>
              <span className="w-8 text-center text-gray-900">{studentPage}</span>
              <span>/ {studentPages}</span>
            </div>
            <button
              onClick={() => setStudentPage((page) => Math.min(studentPages, page + 1))}
              disabled={studentPage === studentPages}
              className="px-3 py-2 rounded-xl border text-sm font-semibold disabled:opacity-50"
            >
              Trang sau
            </button>
          </div>
        </div>

        <div className="card-no-transition overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Thông tin chi tiết học sinh</h3>
          {selectedStudentDetail ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Học sinh</p>
                  <p className="text-xl font-bold text-gray-900">{selectedStudentDetail.name}</p>
                  <p className="text-sm text-gray-600">{selectedStudentDetail.subject}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Tiến độ</p>
                  <p className="text-3xl font-bold text-primary-600">{selectedStudentDetail.progress}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Tuổi</p>
                  <p className="text-sm font-semibold text-gray-900">{(selectedStudentDetail as any).age || 'Chưa có thông tin'}</p>
                </div>

                <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Ngày tháng năm sinh</p>
                  <p className="text-sm font-semibold text-gray-900">{(selectedStudentDetail as any).dateOfBirth || 'Chưa có thông tin'}</p>
                </div>

                <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Trường</p>
                  <p className="text-sm font-semibold text-gray-900">{(selectedStudentDetail as any).school || 'Chưa có thông tin'}</p>
                </div>

                <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Lớp</p>
                  <p className="text-sm font-semibold text-gray-900">{(selectedStudentDetail as any).grade || 'Chưa có thông tin'}</p>
                </div>

                <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Phụ huynh</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedStudentDetail.parent}</p>
                </div>

                <div className="border border-gray-100 rounded-xl p-3 bg-gray-50 space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Liên hệ</p>
                  <p className="text-sm text-gray-900">{selectedStudentDetail.contact}</p>
                  <p className="text-sm text-gray-600">{selectedStudentDetail.email}</p>
                </div>

                <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Địa chỉ</p>
                  <p className="text-sm text-gray-900">{selectedStudentDetail.address}</p>
                </div>

                <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Kênh ưu tiên</p>
                  <p className="text-sm text-gray-900">{selectedStudentDetail.preferredChannel}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Chọn học sinh trong danh sách để xem chi tiết.</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderScheduleSection = () => (
    <div className="h-full overflow-y-auto space-y-4">
      <div className="card-no-transition">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Lịch dạy</h2>
          </div>
          <p className="text-sm text-gray-500">{tutorSchedules.length} buổi đã được lên lịch</p>
        </div>
        <div className="space-y-4">
          {scheduleDates.map((dateKey) => {
            const dateObj = new Date(dateKey)
            const dailySchedules = schedulesByDate[dateKey]
            const isTodayDate = isToday(dateObj)

            return (
              <div
                key={dateKey}
                className="border-2 border-gray-200 rounded-2xl p-4 bg-gradient-to-br from-white to-gray-50"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className={`text-lg font-bold ${isTodayDate ? 'text-primary-600' : 'text-gray-900'}`}>
                      {isTodayDate ? 'Hôm nay' : format(dateObj, 'EEEE, dd/MM/yyyy')}
                    </p>
                    <p className="text-sm text-gray-500">{dailySchedules.length} buổi</p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      <span>Đang dạy</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                      <span>Sắp dạy</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                      <span>Đã xong</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {dailySchedules.map((schedule) => {
                    const status = getScheduleStatus(schedule)
                    const statusConfig = {
                      in_progress: { label: 'Đang dạy', className: 'bg-green-100 text-green-700' },
                      upcoming: { label: 'Sắp dạy', className: 'bg-yellow-100 text-yellow-700' },
                      completed: { label: 'Đã xong', className: 'bg-gray-100 text-gray-600' },
                    }[status]

                    return (
                      <div
                        key={schedule.id}
                        className="border border-gray-200 rounded-xl p-4 bg-white hover:border-primary-300 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center flex-wrap gap-3 mb-2">
                              <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                                schedule.subject === 'Toán' ? 'bg-blue-500 text-white' :
                                schedule.subject === 'Hóa' ? 'bg-green-500 text-white' :
                                'bg-purple-500 text-white'
                              }`}>
                                {schedule.subject}
                              </span>
                              <span className="text-sm font-semibold text-gray-700">{schedule.time}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{schedule.student}</p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center gap-2">
                              {schedule.meetLink && (
                                <button
                                  onClick={() => handleJoinSchedule(schedule.id)}
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
                                    setCopiedScheduleLink(schedule.id)
                                    setTimeout(() => setCopiedScheduleLink(null), 2000)
                                  }}
                                  className="text-gray-500 hover:text-primary-600 transition-colors"
                                  title="Copy link"
                                >
                                  {copiedScheduleLink === schedule.id ? (
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
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  // Tổ chức dữ liệu theo môn học cho checklist section (khung giờ 14:00 - 15:30)
  const subjectsData = useMemo(() => {
    const subjectsMap: Record<string, SubjectData> = {}
    
    studentsAt14h.forEach(student => {
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
  }, [studentsAt14h, checklistItemsByStudent, tutorDetailItemsByStudentAndSubject, homeworkItemsByStudentAndSubject, subjectEvaluations])

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
    return (
      <div className="h-full overflow-y-auto space-y-4">
        <div className="card-no-transition space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Checklist bài học</h2>
              <p className="text-sm text-gray-600">Khung giờ 14:00 - 15:30</p>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => openChecklistForm()} className="btn-secondary flex items-center space-x-2 text-sm">
                <Plus className="w-4 h-4" />
                <span>Thêm bài mới</span>
              </button>
            </div>
          </div>

        <div className="space-y-4">
          {subjectsData.map((subjectData) => {
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
          })}
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
      title="Dashboard Tutor"
      sidebar={<TutorSidebar activeSection={activeSection} onSectionChange={setActiveSection} />}
    >
      <div className="h-full overflow-hidden">
        {renderContent()}
      </div>


      {showChecklistForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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
                      {student.name} - {student.subject}
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
                          <input
                            value={exercise.estimatedTime}
                            onChange={(e) => handleChecklistExerciseChange(idx, 'estimatedTime', e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Ví dụ: 20 phút"
                          />
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
                className="btn-primary text-sm px-6 py-3 rounded-xl"
              >
                Gửi checklist
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
