import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import TutorSidebar from '../components/TutorSidebar'
import ChecklistTable, { ChecklistItem } from '../components/ChecklistTable'
import { Users, Calendar, FileText, Plus, Send, Clock, TrendingUp, UserCircle, Download, Award, Copy, ChevronRight, Upload } from 'lucide-react'
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
  result: 'completed' | 'in_progress' | 'not_done'
  solution: string
  note: string
}

interface TutorChecklistExercise {
  id: string
  title: string
  requirement: string
  estimatedTime: string
  attachment?: File | null
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
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportData, setReportData] = useState({
    attitude: '',
    improvementPoints: '',
    recommendations: '',
  })
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

  const students = [
    { id: '1', name: 'Nguyễn Văn A', subject: 'Toán', progress: 67, parent: 'Phạm Văn X', contact: '0123 456 789', email: 'phu_huynh_a@example.com', address: 'Hà Nội', preferredChannel: 'Zalo' },
    { id: '2', name: 'Trần Thị B', subject: 'Lý', progress: 85, parent: 'Trần Văn C', contact: '0987 654 321', email: 'phu_huynh_b@example.com', address: 'Đà Nẵng', preferredChannel: 'Email' },
    { id: '3', name: 'Lê Văn C', subject: 'Hóa', progress: 45, parent: 'Lê Minh D', contact: '0909 888 777', email: 'phu_huynh_c@example.com', address: 'TP. HCM', preferredChannel: 'Điện thoại' },
    { id: '4', name: 'Phạm Thị D', subject: 'Toán', progress: 72, parent: 'Phạm Văn E', contact: '0911 223 344', email: 'phuhuynh_d@example.com', address: 'Hà Nội', preferredChannel: 'Zalo' },
    { id: '5', name: 'Ngô Văn E', subject: 'Lý', progress: 58, parent: 'Ngô Minh F', contact: '0905 112 113', email: 'phuhuynh_e@example.com', address: 'Buôn Ma Thuột', preferredChannel: 'SMS' },
    { id: '6', name: 'Đinh Thị F', subject: 'Hóa', progress: 91, parent: 'Đinh Văn G', contact: '0988 123 456', email: 'phuhuynh_f@example.com', address: 'Hải Phòng', preferredChannel: 'Email' },
    { id: '7', name: 'Trịnh Văn G', subject: 'Sinh', progress: 63, parent: 'Trịnh Thị H', contact: '0933 456 789', email: 'phuhuynh_g@example.com', address: 'Bắc Ninh', preferredChannel: 'Zalo' },
    { id: '8', name: 'Bùi Thị H', subject: 'Toán', progress: 76, parent: 'Bùi Văn I', contact: '0977 888 666', email: 'phuhuynh_h@example.com', address: 'Nha Trang', preferredChannel: 'Điện thoại' },
    { id: '9', name: 'Hà Văn I', subject: 'Lý', progress: 54, parent: 'Hà Thị K', contact: '0912 334 556', email: 'phuhuynh_i@example.com', address: 'Huế', preferredChannel: 'Zalo' },
    { id: '10', name: 'Nguyễn Thị J', subject: 'Hóa', progress: 82, parent: 'Nguyễn Văn L', contact: '0922 556 778', email: 'phuhuynh_j@example.com', address: 'Quảng Ninh', preferredChannel: 'Email' },
    { id: '11', name: 'Mai Văn K', subject: 'Toán', progress: 61, parent: 'Mai Thị M', contact: '0901 223 334', email: 'phuhuynh_k@example.com', address: 'Đà Lạt', preferredChannel: 'Zalo' },
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
    { id: '31', name: 'Đặng Văn E1', subject: 'Toán', progress: 40, parent: 'Đặng Thị F1', contact: '0982 998 221', email: 'phuhuynh_ee@example.com', address: 'Phan Thiết', preferredChannel: 'Email' },
    { id: '32', name: 'Trương Thị F1', subject: 'Lý', progress: 94, parent: 'Trương Văn G1', contact: '0930 221 334', email: 'phuhuynh_ff@example.com', address: 'Vĩnh Phúc', preferredChannel: 'Zalo' },
    { id: '33', name: 'Lưu Văn G1', subject: 'Hóa', progress: 51, parent: 'Lưu Thị H1', contact: '0920 665 778', email: 'phuhuynh_gg@example.com', address: 'Bến Tre', preferredChannel: 'Điện thoại' },
    { id: '34', name: 'Nguyễn Thị H1', subject: 'Toán', progress: 86, parent: 'Nguyễn Văn I1', contact: '0914 331 552', email: 'phuhuynh_hh@example.com', address: 'Sóc Trăng', preferredChannel: 'Zalo' },
    { id: '35', name: 'Phạm Văn I1', subject: 'Lý', progress: 60, parent: 'Phạm Thị K1', contact: '0975 443 661', email: 'phuhuynh_ii@example.com', address: 'Hòa Bình', preferredChannel: 'Email' },
    { id: '36', name: 'Lại Thị K1', subject: 'Hóa', progress: 68, parent: 'Lại Văn L1', contact: '0908 223 118', email: 'phuhuynh_jj@example.com', address: 'Hậu Giang', preferredChannel: 'Điện thoại' },
    { id: '37', name: 'Trần Văn L1', subject: 'Toán', progress: 55, parent: 'Trần Thị M1', contact: '0918 882 554', email: 'phuhuynh_kk@example.com', address: 'Thái Bình', preferredChannel: 'Zalo' },
    { id: '38', name: 'Ngô Thị M1', subject: 'Lý', progress: 79, parent: 'Ngô Văn N1', contact: '0964 773 221', email: 'phuhuynh_ll@example.com', address: 'Đồng Nai', preferredChannel: 'Email' },
    { id: '39', name: 'Trịnh Văn N1', subject: 'Hóa', progress: 62, parent: 'Trịnh Thị O1', contact: '0950 552 337', email: 'phuhuynh_mm@example.com', address: 'Vĩnh Long', preferredChannel: 'Điện thoại' },
    { id: '40', name: 'Cao Thị O1', subject: 'Toán', progress: 71, parent: 'Cao Văn P1', contact: '0906 661 114', email: 'phuhuynh_nn@example.com', address: 'Quảng Ngãi', preferredChannel: 'Zalo' },
  ]

  const [tutorSchedules] = useState<TutorSchedule[]>([
    {
      id: 'ts-1',
      studentId: '1',
      subject: 'Toán',
      student: 'Nguyễn Văn A',
      time: '14:00 - 15:30',
      date: new Date(),
      meetLink: 'https://meet.google.com/abc',
    },
    {
      id: 'ts-2',
      studentId: '2',
      subject: 'Lý',
      student: 'Trần Thị B',
      time: '16:00 - 17:30',
      date: new Date(),
      meetLink: 'https://meet.google.com/xyz',
    },
    {
      id: 'ts-3',
      studentId: '3',
      subject: 'Hóa',
      student: 'Lê Văn C',
      time: '18:00 - 19:30',
      date: new Date(),
      meetLink: 'https://meet.google.com/hij',
    },
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

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    {
      id: '1',
      subject: 'Toán',
      lesson: 'Giải hệ phương trình',
      task: 'Bài tập SGK 2,3,5',
      status: 'not_done',
    },
    {
      id: '2',
      subject: 'Toán',
      lesson: 'Ôn lý thuyết chương 2',
      task: 'Đọc lại trang 34-36',
      status: 'done',
      note: 'Hiểu 80%',
    },
    {
      id: '3',
      subject: 'Toán',
      lesson: 'Luyện đề 1',
      task: 'Làm phần A',
      status: 'in_progress',
      note: 'Cần hỗ trợ',
    },
  ])

  const handleStatusChange = (id: string, status: ChecklistItem['status']) => {
    setChecklistItems(items =>
      items.map(item => item.id === id ? { ...item, status } : item)
    )
  }

  const handleNoteChange = (id: string, note: string) => {
    setChecklistItems(items =>
      items.map(item => item.id === id ? { ...item, note } : item)
    )
  }

  const handleFileUpload = (id: string, file: File) => {
    console.log('Upload file for item:', id, file.name)
  }

  const handleSendReport = () => {
    console.log('Sending report:', reportData)
    setShowReportModal(false)
    alert('Báo cáo đã được gửi thành công!')
  }

  const completedCount = checklistItems.filter(item => item.status === 'done').length
  const totalCount = checklistItems.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const selectedStudentData = students.find(s => s.id === selectedStudent)

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
  }), [])

  const tutorDetailItemsBySubject: Record<string, TutorChecklistDetail[]> = {
    Toán: [
      {
        id: 'd1',
        lesson: 'Bài 3 – Giải hệ bằng phương pháp thế',
        estimatedTime: '10 phút',
        actualTime: '12 phút',
        result: 'completed',
        solution: 'Áp dụng phương pháp thế và kiểm tra từng bước.',
        note: 'Làm đúng, trình bày rõ.',
      },
      {
        id: 'd2',
        lesson: 'Bài 4 – Giải hệ bằng cộng đại số',
        estimatedTime: '15 phút',
        actualTime: '20 phút',
        result: 'in_progress',
        solution: 'Nhắc lại quy tắc cộng đại số và luyện thêm.',
        note: 'Sai bước chuyển vế, cần sửa.',
      },
      {
        id: 'd3',
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
        id: 'd4',
        lesson: 'Ôn phản ứng oxi hóa khử',
        estimatedTime: '15 phút',
        actualTime: '18 phút',
        result: 'completed',
        solution: 'Ghi nhớ 5 bước cân bằng bằng phương pháp thăng bằng electron.',
        note: 'Đã hiểu tốt.',
      },
    ],
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
      case 'reports':
        return renderReportsSection()
      default:
        return renderHomeSection()
    }
  }

  const renderHomeSection = () => {
    return (
      <div className="h-full overflow-y-auto space-y-6">
        {/* Main Layout - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile & Resources */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 self-start">
            {/* Profile Card */}
            <div className="card">
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
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center border border-green-200">
                  <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600 mb-1">Tiến độ</p>
                  <p className="text-xl font-bold text-gray-900">{progressPercentage}%</p>
                </div>
              </div>
            </div>

            {/* Resources Card */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Tài nguyên dành cho Tutor</h3>
              <p className="text-xs text-gray-600 mb-4">Hoàn toàn miễn phí dành cho giáo viên</p>
              
              <div className="space-y-3">
                <div className="border-2 border-gray-200 rounded-xl p-3 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Mẫu báo cáo</p>
                      <p className="text-xs text-gray-600">Nhiều template đẹp mắt</p>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-gray-200 rounded-xl p-3 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Đánh giá học sinh</p>
                      <p className="text-xs text-gray-600">Công cụ đánh giá nhanh</p>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-gray-200 rounded-xl p-3 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <Download className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Tài liệu giảng dạy</p>
                      <p className="text-xs text-gray-600">Tải về miễn phí</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        {/* Right Column - Main Actions */}
        <div className="lg:col-span-2 space-y-6 h-full overflow-y-auto pr-2">
          {/* Today's Schedule */}
          <div className="card hover:shadow-xl transition-shadow duration-300">
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
                <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
                  {scheduleSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedScheduleSlotId(slot.id)}
                      className={`min-w-[180px] border-2 rounded-2xl px-4 py-3 text-left transition-all ${
                        selectedScheduleSlotId === slot.id
                          ? 'border-primary-500 bg-primary-50 shadow-lg text-primary-700'
                          : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-sm font-bold">{slot.time}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {slot.subjects.length > 0 ? slot.subjects.join(', ') : 'Khác'}
                      </p>
                      <p className="text-xs text-gray-600 mt-2">{slot.schedules.length} học sinh</p>
                    </button>
                  ))}
                </div>

                {selectedScheduleSlot && (
                  <div className="mt-6 space-y-4">
                    {selectedScheduleSlot.meetLink && (
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Link lớp học</label>
                          <div className="flex items-center mt-1 border-2 border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
                            <input
                              type="text"
                              value={selectedScheduleSlot.meetLink}
                              readOnly
                              className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(selectedScheduleSlot.meetLink || '')
                                const firstScheduleId = selectedScheduleSlot.schedules[0]?.id
                                if (firstScheduleId) {
                                  setCopiedScheduleLink(firstScheduleId)
                                  setTimeout(() => setCopiedScheduleLink(null), 2000)
                                }
                              }}
                              className="text-gray-500 hover:text-primary-600 transition-colors"
                              title="Copy link"
                            >
                              {copiedScheduleLink && selectedScheduleSlot.schedules.some((s) => s.id === copiedScheduleLink) ? (
                                <Clock className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const firstScheduleId = selectedScheduleSlot.schedules[0]?.id
                            if (firstScheduleId) {
                              handleJoinSchedule(firstScheduleId)
                            }
                          }}
                          className="btn-primary whitespace-nowrap px-6 py-3 text-sm font-semibold"
                        >
                          Vào lớp ngay
                        </button>
                      </div>
                    )}

                    <div className="space-y-3">
                      {selectedScheduleSlot.schedules.map((schedule) => {
                        const status = getScheduleStatus(schedule)
                        const statusConfig = {
                          in_progress: { label: 'Đang dạy', className: 'bg-green-100 text-green-700' },
                          upcoming: { label: 'Sắp dạy', className: 'bg-yellow-100 text-yellow-700' },
                          completed: { label: 'Đã xong', className: 'bg-gray-100 text-gray-600' },
                        }[status]

                        return (
                          <div
                            key={schedule.id}
                            className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-2 border-gray-200 rounded-2xl p-4 bg-gradient-to-br from-white to-gray-50"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{schedule.student}</p>
                              <p className="text-xs text-gray-500">{schedule.subject}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {statusConfig && (
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.className}`}>
                                  {statusConfig.label}
                                </span>
                              )}
                              <button
                                onClick={() => handleJoinSchedule(schedule.id)}
                                className="btn-primary text-xs px-4 py-2"
                              >
                                Vào lớp
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Student selection + attachments */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Học sinh có lịch hôm nay</h2>
                  <p className="text-sm text-gray-600">Chọn học sinh để xem checklist và tài liệu</p>
                </div>
                <span className="text-xs font-semibold text-gray-500">{todayStudentsForHome.length} học sinh</span>
              </div>
              {todayStudentsForHome.length === 0 ? (
                <div className="text-sm text-gray-500 py-6 text-center">
                  Hôm nay không có học sinh nào có lịch dạy.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {todayStudentsForHome.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedStudent === student.id
                          ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className={`font-bold ${selectedStudent === student.id ? 'text-primary-700' : 'text-gray-900'}`}>
                            {student.name}
                          </p>
                          <p className="text-sm text-gray-600">{student.subject}</p>
                        </div>
                        {selectedStudent === student.id && <div className="w-3 h-3 bg-primary-500 rounded-full"></div>}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Tiến độ</span>
                        <span className="font-semibold">{student.progress}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Tài liệu phụ huynh đã gửi</h3>
                  <p className="text-xs text-gray-600">
                    {selectedStudentData ? `${selectedStudentData.name} • ${selectedStudentData.subject}` : 'Chọn học sinh để xem tài liệu'}
                  </p>
                </div>
                <button
                  onClick={() => setShowStudentAttachmentCard((prev) => !prev)}
                  className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  {showStudentAttachmentCard ? 'Thu gọn' : 'Mở ra'}
                </button>
              </div>
              {showStudentAttachmentCard && (
                <div className="space-y-2">
                  {(studentAttachments[selectedStudent] || []).length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Chưa có tài liệu nào được gửi.</p>
                  ) : (
                    studentAttachments[selectedStudent].map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">Tải lên: {file.uploadedAt}</p>
                        </div>
                        <button className="text-sm text-primary-600 hover:text-primary-700">Tải xuống</button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions - Large Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card border-2 border-gray-200 hover:border-primary-400 hover:shadow-xl transition-all cursor-pointer group">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Quản lý học sinh</h3>
                <p className="text-sm text-gray-600">Xem và quản lý danh sách học sinh</p>
              </div>
            </div>

            <div
              className="card border-2 border-gray-200 hover:border-primary-400 hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => openChecklistForm()}
            >
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Plus className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Tạo checklist mới</h3>
                <p className="text-sm text-gray-600">Thêm bài học và nhiệm vụ mới</p>
              </div>
            </div>
          </div>

          {/* Checklist Section */}
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Checklist bài học</h2>
                <p className="text-sm text-gray-600">
                  {selectedStudentData && `${selectedStudentData.name} - ${selectedStudentData.subject}`}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button className="btn-secondary flex items-center space-x-2 text-sm">
                  <Plus className="w-4 h-4" />
                  <span>Thêm bài mới</span>
                </button>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="btn-primary flex items-center space-x-2 text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi báo cáo</span>
                </button>
              </div>
            </div>

            <ChecklistTable
              items={checklistItems}
              editable={true}
              onStatusChange={handleStatusChange}
              onNoteChange={handleNoteChange}
              onUpload={handleFileUpload}
            />

            {/* Progress Summary */}
            <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border-2 border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tổng kết tiến độ</p>
                  <p className="text-lg font-bold text-gray-900">
                    {completedCount}/{totalCount} bài đã hoàn thành
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold gradient-text mb-1">{progressPercentage}%</div>
                  <div className="w-24 h-2 bg-white rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  }

  const renderStudentsSection = () => (
    <div className="h-full overflow-hidden">
      <div className="grid grid-cols-1 xl:grid-cols-[55%_45%] gap-6 h-full">
        <div className="card space-y-5 overflow-y-auto">
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
                className={`text-left border-2 rounded-2xl p-4 transition-all duration-200 ${
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

        <div className="card overflow-y-auto">
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
    <div className="h-full overflow-y-auto space-y-6">
      <div className="card">
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
                        className="border border-gray-200 rounded-xl p-4 bg-white hover:border-primary-300 hover:shadow-md transition-all"
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

  const renderChecklistSection = () => (
    <div className="h-full overflow-y-auto space-y-6">
      <div className="card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            <button
              onClick={() => setShowReportModal(true)}
              className="btn-primary flex items-center space-x-2 text-sm"
            >
              <Send className="w-4 h-4" />
              <span>Gửi báo cáo</span>
            </button>
          </div>
        </div>

        <div className="mb-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Chọn học sinh:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student.id)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedStudent === student.id
                    ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className={`font-bold ${selectedStudent === student.id ? 'text-primary-700' : 'text-gray-900'}`}>
                      {student.name}
                    </p>
                    <p className="text-sm text-gray-600">{student.subject}</p>
                  </div>
                  {selectedStudent === student.id && (
                    <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                  )}
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
        </div>

        <div className="space-y-4">
          {Object.entries(
            checklistItems.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
              if (!acc[item.subject]) acc[item.subject] = []
              acc[item.subject].push(item)
              return acc
            }, {})
          ).map(([subject, items]) => {
            const completed = items.filter((item) => item.status === 'done').length
            const isExpanded = expandedChecklistSubject ? expandedChecklistSubject === subject : true
            const detailItems = tutorDetailItemsBySubject[subject] || []

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
                    setExpandedChecklistSubject((prev) => (prev === subject ? null : subject))
                  }
                >
                  <div>
                    <p className="text-sm font-bold text-gray-900">{subject}</p>
                    <p className="text-xs text-gray-600">
                      {completed}/{items.length} nhiệm vụ hoàn thành
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-white border border-gray-200 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{item.lesson}</p>
                            <p className="text-xs text-gray-500">{item.task}</p>
                          </div>
                          <select
                            value={item.status}
                            onChange={(e) =>
                              handleStatusChange(item.id, e.target.value as ChecklistItem['status'])
                            }
                            className="text-xs border-2 border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                          >
                            <option value="not_done">Chưa xong</option>
                            <option value="in_progress">Đang làm</option>
                            <option value="done">Đã xong</option>
                          </select>
                        </div>
                      ))}
                    </div>

                    {detailItems.length > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
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
                          <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                              <tr>
                                <th className="px-4 py-2 font-semibold">Bài tập</th>
                                <th className="px-4 py-2 font-semibold">Thời gian (ước/thực)</th>
                                <th className="px-4 py-2 font-semibold">Lời giải</th>
                                <th className="px-4 py-2 font-semibold">Kết quả</th>
                                <th className="px-4 py-2 font-semibold">Nhận xét</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {detailItems.map((detail) => (
                                <tr key={detail.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-semibold text-gray-900">{detail.lesson}</td>
                                  <td className="px-4 py-3 text-gray-600">
                                    {detail.estimatedTime} / {detail.actualTime}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">
                                    <button className="text-primary-600 hover:text-primary-700 text-xs font-semibold flex items-center space-x-1">
                                      <Upload className="w-3 h-3" />
                                      <span>Tải bài làm</span>
                                    </button>
                                    <p className="text-xs text-gray-500 mt-1">{detail.solution}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        detail.result === 'completed'
                                          ? 'bg-green-100 text-green-700'
                                          : detail.result === 'in_progress'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-red-100 text-red-600'
                                      }`}
                                    >
                                      {detail.result === 'completed'
                                        ? 'Hoàn thành'
                                        : detail.result === 'in_progress'
                                          ? 'Đang làm'
                                          : 'Chưa xong'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">{detail.note}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border-2 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng kết tiến độ</p>
              <p className="text-lg font-bold text-gray-900">
                {completedCount}/{totalCount} bài đã hoàn thành
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold gradient-text mb-1">{progressPercentage}%</div>
              <div className="w-24 h-2 bg-white rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderReportsSection = () => (
    <div className="h-full overflow-y-auto space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">Báo cáo</h2>
          </div>
          <button
            onClick={() => setShowReportModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo báo cáo mới</span>
          </button>
        </div>
        <div className="space-y-4">
          <div className="border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-br from-white to-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-900">Báo cáo buổi học - {format(new Date(), 'dd/MM/yyyy')}</h3>
              <span className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">
                {selectedStudentData?.name || 'Chưa chọn học sinh'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {completedCount}/{totalCount} bài đã hoàn thành ({progressPercentage}%)
            </p>
            <p className="text-sm text-gray-700">
              {checklistItems.filter(i => i.note).length} ghi chú đã được thêm
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Layout 
      title="Dashboard Tutor"
      sidebar={<TutorSidebar activeSection={activeSection} onSectionChange={setActiveSection} />}
    >
      <div className="h-full overflow-hidden">
        {renderContent()}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Báo cáo buổi học</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Thái độ học tập
                </label>
                <textarea
                  value={reportData.attitude}
                  onChange={(e) => setReportData({ ...reportData, attitude: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  rows={3}
                  placeholder="Ví dụ: Tích cực, chủ động hỏi bài..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Điểm cần cải thiện
                </label>
                <textarea
                  value={reportData.improvementPoints}
                  onChange={(e) => setReportData({ ...reportData, improvementPoints: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  rows={3}
                  placeholder="Ví dụ: Cần luyện thêm phần nâng cao..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Đề xuất
                </label>
                <textarea
                  value={reportData.recommendations}
                  onChange={(e) => setReportData({ ...reportData, recommendations: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  rows={3}
                  placeholder="Ví dụ: Nên làm thêm bài tập SGK trang 45..."
                />
              </div>

              <div className="bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200 p-4 rounded-xl">
                <p className="text-sm font-semibold text-gray-700 mb-3">Tự động lấy từ checklist:</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">{checklistItems.length}</p>
                    <p className="text-xs text-gray-600">Bài học</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">{completedCount}/{totalCount}</p>
                    <p className="text-xs text-gray-600">Hoàn thành</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">{checklistItems.filter(i => i.note).length}</p>
                    <p className="text-xs text-gray-600">Ghi chú</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowReportModal(false)}
                className="btn-secondary"
              >
                Hủy
              </button>
              <button
                onClick={handleSendReport}
                className="btn-primary flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Gửi báo cáo</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <input
                    value={checklistForm.lesson}
                    onChange={(e) => setChecklistForm((prev) => ({ ...prev, lesson: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Ví dụ: Giải hệ phương trình"
                  />
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú cho phụ huynh / học sinh</label>
                <textarea
                  value={checklistForm.note}
                  onChange={(e) => setChecklistForm((prev) => ({ ...prev, note: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  rows={3}
                  placeholder="Ví dụ: chú ý hoàn thành phần nâng cao..."
                />
              </div>

              <div className="border-2 border-gray-200 rounded-2xl p-4 bg-gradient-to-br from-white to-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Tài liệu phụ huynh đã gửi</p>
                    <p className="text-xs text-gray-500">Xem lại trước khi tạo checklist</p>
                  </div>
                  <button
                    onClick={() => setShowAttachmentPreview((prev) => !prev)}
                    className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    {showAttachmentPreview ? 'Thu gọn' : 'Mở ra'}
                  </button>
                </div>
                {showAttachmentPreview && (
                  <div className="space-y-3">
                    {(studentAttachments[checklistForm.studentId] || []).length === 0 ? (
                      <p className="text-sm text-gray-500">Chưa có tài liệu nào được gửi cho học sinh này.</p>
                    ) : (
                      studentAttachments[checklistForm.studentId].map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">Tải lên: {file.uploadedAt}</p>
                          </div>
                          <button className="text-sm text-primary-600 hover:text-primary-700">Tải xuống</button>
                        </div>
                      ))
                    )}
                  </div>
                )}
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
