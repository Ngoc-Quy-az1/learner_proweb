import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Sidebar from '../components/Sidebar'
import { ScheduleItem } from '../components/ScheduleWidget'
import WeeklyCalendar from '../components/WeeklyCalendar'
import MonthlyCalendar from '../components/MonthlyCalendar'
import ChecklistTable, { ChecklistItem } from '../components/ChecklistTable'

import { TaskItem } from '../components/TaskTable'
import { BookOpen, MessageSquare, TrendingUp, Calendar, Target, UserCircle, Play, ChevronRight, ChevronDown, ChevronUp, Clock, Copy, Upload, FileText, AlertTriangle, Star, Eye, Download, Search, Filter } from 'lucide-react'
import { format, isToday } from 'date-fns'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Giả định kiểu dữ liệu cho ChecklistDetailItem nếu chưa có trong file gốc
interface ChecklistDetailItem {
  id: string
  lesson: string
  estimatedTime: number
  actualTime: number
  result: 'completed' | 'not_accurate' | 'not_completed'
  qualityNote: string
  solutionType: 'text' | 'file' | 'image'
  solutionText?: string
  solutionFileName?: string
  solutionPreview?: string
  uploadedFileName?: string
  assignmentFileName?: string
}

// Interface cho chi tiết bài tập về nhà
interface HomeworkDetailItem {
  id: string
  task: string
  estimatedTime: number // phút
  actualTime?: number // phút
  difficulty: 'easy' | 'medium' | 'hard' | 'advanced'
  result: 'completed' | 'not_completed'
  comment?: string
  solutionType?: 'text' | 'file' | 'image'
  solutionText?: string
  solutionFileName?: string
  solutionPreview?: string
  uploadedFileName?: string
  assignmentFileName?: string
}

const checklistResultConfig: Record<
  ChecklistDetailItem['result'],
  { label: string; className: string }
> = {
  completed: { label: 'Hoàn thành', className: 'bg-green-100 text-green-800' },
  not_accurate: { label: 'Chưa chính xác', className: 'bg-yellow-100 text-yellow-800' },
  not_completed: { label: 'Chưa xong', className: 'bg-red-100 text-red-800' },
}

const homeworkResultConfig: Record<
  HomeworkDetailItem['result'],
  { label: string; className: string }
> = {
  completed: { label: 'Hoàn thành', className: 'bg-green-100 text-green-800' },
  not_completed: { label: 'Chưa hoàn thành', className: 'bg-red-100 text-red-800' },
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

// Giả định component ChecklistDetailTable nếu chưa có trong file gốc
// Để code chạy, cần có component này hoặc thay thế bằng JSX đơn giản
const ChecklistDetailTable = ({
  items,
  onUpload,
  onUploadSolution,
}: {
  items: ChecklistDetailItem[]
  onUpload: (id: string, file: File) => void
  onUploadSolution: (id: string, file: File) => void
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({})
  const [solutionUploads, setSolutionUploads] = useState<Record<string, string>>({})

  const handleFileChange = (id: string, file?: File) => {
    if (!file) return
    setUploadedFiles(prev => ({ ...prev, [id]: file.name }))
    onUpload(id, file)
  }

  const handleSolutionChange = (id: string, file?: File) => {
    if (!file) return
    setSolutionUploads(prev => ({ ...prev, [id]: file.name }))
    onUploadSolution(id, file)
  }

  const renderResultBadge = (result: ChecklistDetailItem['result']) => {
    const config = checklistResultConfig[result]
    return (
      <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 italic">Không có chi tiết bài tập được đánh giá.</p>
      ) : (
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
            <thead className="bg-blue-50">
              <tr className="text-xs uppercase tracking-wider text-gray-500">
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Bài tập</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Thời gian ước lượng</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">File bài tập</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Thời gian thực tế</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Upload bài làm</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Lời giải</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Kết quả</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Nhận xét</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-3 py-2 font-semibold text-gray-900 min-w-[120px]">{item.lesson}</td>
                  <td className="px-2 sm:px-3 py-2 text-gray-600 whitespace-nowrap">{item.estimatedTime} phút</td>
                  <td className="px-2 sm:px-3 py-2 min-w-[140px]">
                    {item.assignmentFileName ? (
                      <div className="flex items-center gap-1 sm:gap-2 text-blue-600">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="text-xs font-semibold truncate max-w-[100px] sm:max-w-[120px]">{item.assignmentFileName}</span>
                        <Download className="w-3 h-3 cursor-pointer hover:text-blue-700 flex-shrink-0" />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-gray-900 font-medium whitespace-nowrap">{item.actualTime} phút</td>
                  <td className="px-2 sm:px-3 py-2 min-w-[140px]">
                    {item.uploadedFileName ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-1 sm:gap-2 text-green-600">
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="text-xs font-semibold truncate max-w-[100px] sm:max-w-[120px]">{item.uploadedFileName}</span>
                          <Download className="w-3 h-3 cursor-pointer hover:text-green-700 flex-shrink-0" />
                        </div>
                        <label className="inline-flex items-center gap-1 text-primary-600 cursor-pointer hover:text-primary-700 text-xs font-semibold">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileChange(item.id, e.target.files?.[0])}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          />
                          <Upload className="w-3 h-3 flex-shrink-0" />
                          <span className="whitespace-nowrap">Cập nhật</span>
                        </label>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-1 sm:gap-2 text-primary-600 cursor-pointer hover:text-primary-700 text-xs font-semibold">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileChange(item.id, e.target.files?.[0])}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                        <Upload className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate max-w-[100px] sm:max-w-none">{uploadedFiles[item.id] || 'Tải bài làm'}</span>
                      </label>
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-gray-600 space-y-1 sm:space-y-2 min-w-[150px]">
                    {item.solutionText && (
                      <p className="text-xs sm:text-sm text-gray-700 leading-snug">{item.solutionText}</p>
                    )}
                    {item.solutionFileName && (
                      <div className="text-xs font-semibold text-gray-700 flex items-center gap-1 sm:gap-2">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{item.solutionFileName}</span>
                      </div>
                    )}
                    {item.solutionType === 'image' && item.solutionPreview && (
                      <img
                        src={item.solutionPreview}
                        alt="Solution preview"
                        className="w-20 h-12 sm:w-24 sm:h-16 object-cover rounded-lg border"
                      />
                    )}
                    <label className="inline-flex items-center gap-1 sm:gap-2 text-primary-600 cursor-pointer hover:text-primary-700 text-xs font-semibold">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleSolutionChange(item.id, e.target.files?.[0])}
                      />
                      <Upload className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">{solutionUploads[item.id] || item.solutionFileName ? 'Cập nhật lời giải' : 'Thêm lời giải'}</span>
                    </label>
                  </td>
                  <td className="px-2 sm:px-3 py-2 whitespace-nowrap">{renderResultBadge(item.result)}</td>
                  <td className="px-2 sm:px-3 py-2 text-gray-500 min-w-[100px]">{item.qualityNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Component cho chi tiết bài tập về nhà
const HomeworkDetailTable = ({
  items,
  onUpload,
}: {
  items: HomeworkDetailItem[]
  onUpload: (id: string, file: File) => void
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({})

  const handleFileChange = (id: string, file?: File) => {
    if (!file) return
    setUploadedFiles(prev => ({ ...prev, [id]: file.name }))
    onUpload(id, file)
  }

  const getDifficultyDisplay = (difficulty: HomeworkDetailItem['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return { text: 'Dễ', bgColor: 'bg-green-100', textColor: 'text-green-700' }
      case 'medium':
        return { text: 'Trung bình', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' }
      case 'hard':
        return { text: 'Khó', bgColor: 'bg-orange-100', textColor: 'text-orange-700' }
      default:
        return { text: 'Khá', bgColor: 'bg-blue-100', textColor: 'text-blue-700' }
    }
  }

  const renderResultBadge = (result: HomeworkDetailItem['result']) => {
    const config = homeworkResultConfig[result]
    return (
      <span className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 italic">Không có chi tiết bài tập.</p>
      ) : (
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
            <thead className="bg-blue-50">
              <tr className="text-xs uppercase tracking-wider text-gray-500">
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Bài tập</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Thời gian ước lượng</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">File bài tập</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Thời gian thực tế</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Upload nộp bài</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Lời giải</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Mức độ</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Kết quả</th>
                <th className="px-2 sm:px-3 py-2 text-left font-semibold whitespace-nowrap">Nhận xét</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map(item => {
                const difficultyDisplay = getDifficultyDisplay(item.difficulty)
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-3 py-2 font-semibold text-gray-900 min-w-[120px]">{item.task}</td>
                    <td className="px-2 sm:px-3 py-2 text-gray-600 whitespace-nowrap">{item.estimatedTime} phút</td>
                    <td className="px-2 sm:px-3 py-2 min-w-[140px]">
                      {item.assignmentFileName ? (
                        <div className="flex items-center gap-1 sm:gap-2 text-blue-600">
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="text-xs font-semibold truncate max-w-[100px] sm:max-w-[120px]">{item.assignmentFileName}</span>
                          <Download className="w-3 h-3 cursor-pointer hover:text-blue-700 flex-shrink-0" />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-2 sm:px-3 py-2 text-gray-900 font-medium whitespace-nowrap">
                      {item.actualTime ? `${item.actualTime} phút` : '—'}
                    </td>
                    <td className="px-2 sm:px-3 py-2 min-w-[140px]">
                      {item.uploadedFileName ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                          <div className="flex items-center gap-1 sm:gap-2 text-green-600">
                            <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="text-xs font-semibold truncate max-w-[100px] sm:max-w-[120px]">{item.uploadedFileName}</span>
                            <Download className="w-3 h-3 cursor-pointer hover:text-green-700 flex-shrink-0" />
                          </div>
                          <label className="inline-flex items-center gap-1 text-primary-600 cursor-pointer hover:text-primary-700 text-xs font-semibold">
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleFileChange(item.id, e.target.files?.[0])}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            <Upload className="w-3 h-3 flex-shrink-0" />
                            <span className="whitespace-nowrap">Cập nhật</span>
                          </label>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1 sm:gap-2 text-primary-600 cursor-pointer hover:text-primary-700 text-xs font-semibold">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileChange(item.id, e.target.files?.[0])}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          />
                          <Upload className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate max-w-[100px] sm:max-w-none">{uploadedFiles[item.id] || 'Tải bài làm'}</span>
                        </label>
                      )}
                    </td>
                    <td className="px-2 sm:px-3 py-2 text-gray-600 space-y-1 sm:space-y-2 min-w-[150px]">
                      {item.solutionText && (
                        <p className="text-xs sm:text-sm text-gray-700 leading-snug">{item.solutionText}</p>
                      )}
                      {item.solutionFileName && (
                        <div className="text-xs font-semibold text-gray-700 flex items-center gap-1 sm:gap-2">
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate max-w-[120px] sm:max-w-none">{item.solutionFileName}</span>
                        </div>
                      )}
                      {item.solutionType === 'image' && item.solutionPreview && (
                        <img
                          src={item.solutionPreview}
                          alt="Solution preview"
                          className="w-20 h-12 sm:w-24 sm:h-16 object-cover rounded-lg border"
                        />
                      )}
                      {!item.solutionText && !item.solutionFileName && (
                        <span className="text-xs text-gray-400">Chưa có lời giải</span>
                      )}
                    </td>
                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                      <span className={`${difficultyDisplay.bgColor} ${difficultyDisplay.textColor} px-2 py-0.5 rounded text-xs font-semibold`}>
                        {difficultyDisplay.text}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-2 whitespace-nowrap">{renderResultBadge(item.result)}</td>
                    <td className="px-2 sm:px-3 py-2 text-gray-500 min-w-[100px]">{item.comment || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function StudentDashboard() {
  const [activeSection, setActiveSection] = useState('home')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDateType, setSelectedDateType] = useState<'schedule' | 'checklist' | 'homework' | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [expandedHomeworkSession, setExpandedHomeworkSession] = useState<string | null>(null)
  const [expandedChecklistDate, setExpandedChecklistDate] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [showChecklistOverlay, setShowChecklistOverlay] = useState(false)
  const [selectedTutorSchedule, setSelectedTutorSchedule] = useState<string | null>(null) // ID của schedule được chọn để xem chi tiết tutor
  // Bộ lọc cho checklist
  const [checklistSearchQuery, setChecklistSearchQuery] = useState<string>('')
  const [checklistDateRange, setChecklistDateRange] = useState<'all' | 'week' | 'month' | 'custom'>('all')
  const [checklistCustomStartDate, setChecklistCustomStartDate] = useState<string>('')
  const [checklistCustomEndDate, setChecklistCustomEndDate] = useState<string>('')

  useEffect(() => {
    if (activeSection !== 'home' && showChecklistOverlay) {
      setShowChecklistOverlay(false)
    }
  }, [activeSection, showChecklistOverlay])
  
  // Checklist items with dates for multiple days - chỉ hiển thị 3 ngày: hôm qua, hôm nay, ngày mai
  const [checklistItems] = useState<(ChecklistItem & { date: Date })[]>([
    // Yesterday (17/11)
    {
      id: '4',
      subject: 'Toán',
      lesson: 'Luyện đề 1',
      task: 'Làm phần A',
      status: 'done',
      note: 'Hoàn thành tốt',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: '5',
      subject: 'Hóa',
      lesson: 'Bài tập SGK trang 56',
      task: 'Bài 1, 3',
      status: 'done',
      note: 'Đã nộp',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    // Today (18/11)
    {
      id: '1',
      subject: 'Toán',
      lesson: 'Giải hệ phương trình',
      task: 'Bài tập SGK 2,3,5',
      status: 'not_done',
      date: new Date(),
    },
    {
      id: '2',
      subject: 'Toán',
      lesson: 'Ôn lý thuyết chương 2',
      task: 'Đọc lại trang 34-36',
      status: 'done',
      note: 'Học tốt',
      date: new Date(),
    },
    {
      id: '3',
      subject: 'Hóa',
      lesson: 'Cân bằng phản ứng oxi hóa khử',
      task: 'Làm 3 bài tập',
      status: 'done',
      date: new Date(),
    },
    // Tomorrow (19/11)
    {
      id: '10',
      subject: 'Toán',
      lesson: 'Bài tập nâng cao',
      task: 'Làm bài 6-10',
      status: 'not_done',
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: '11',
      subject: 'Lý',
      lesson: 'Chuẩn bị bài mới',
      task: 'Đọc trước chương 3',
      status: 'not_done',
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
  ])
  
  // Schedules data for multiple days
  const [schedules] = useState<ScheduleItem[]>([
    // Today - Multiple classes in different times
    {
      id: '1',
      subject: 'Toán',
      time: '09:00 - 10:30',
      date: new Date(),
      meetLink: 'https://meet.google.com/abc-defg-hij',
      tutor: 'Tutor B',
      note: 'Ôn tập kiểm tra chương 2, chuẩn bị câu hỏi khó.',
      status: 'completed',
    },
    {
      id: '2',
      subject: 'Hóa',
      time: '14:00 - 15:30',
      date: new Date(),
      meetLink: 'https://meet.google.com/xyz-uvw-rst',
      tutor: 'Tutor C',
      note: 'Mang sổ thí nghiệm để tutor kiểm tra.',
      status: 'ongoing',
    },
    {
      id: '3',
      subject: 'Lý',
      time: '16:00 - 17:00',
      date: new Date(),
      meetLink: 'https://meet.google.com/abc-123',
      tutor: 'Tutor D',
      note: 'Ôn lại phần sóng cơ để thuyết trình.',
      status: 'upcoming',
    },
    // Tomorrow - Multiple classes
    {
      id: '4',
      subject: 'Toán',
      time: '08:00 - 09:30',
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      meetLink: 'https://meet.google.com/abc-456',
      tutor: 'Tutor B',
    },
    {
      id: '5',
      subject: 'Hóa',
      time: '10:00 - 11:30',
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      meetLink: 'https://meet.google.com/xyz-789',
      tutor: 'Tutor C',
    },
    {
      id: '6',
      subject: 'Toán',
      time: '14:00 - 15:30',
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      meetLink: 'https://meet.google.com/abc-012',
      tutor: 'Tutor B',
    },
    {
      id: '7',
      subject: 'Lý',
      time: '18:00 - 19:30',
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      meetLink: 'https://meet.google.com/xyz-345',
      tutor: 'Tutor D',
    },
    // Day after tomorrow
    {
      id: '8',
      subject: 'Hóa',
      time: '13:00 - 14:30',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      meetLink: 'https://meet.google.com/xyz-456',
      tutor: 'Tutor C',
    },
    {
      id: '9',
      subject: 'Toán',
      time: '15:00 - 16:30',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      meetLink: 'https://meet.google.com/abc-678',
      tutor: 'Tutor B',
    },
    // 3 days from now
    {
      id: '10',
      subject: 'Lý',
      time: '11:00 - 12:30',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      meetLink: 'https://meet.google.com/xyz-901',
      tutor: 'Tutor D',
    },
    {
      id: '11',
      subject: 'Toán',
      time: '17:00 - 18:30',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      meetLink: 'https://meet.google.com/abc-234',
      tutor: 'Tutor B',
    },
    // 4 days from now
    {
      id: '12',
      subject: 'Hóa',
      time: '09:30 - 11:00',
      date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      meetLink: 'https://meet.google.com/xyz-567',
      tutor: 'Tutor C',
    },
    {
      id: '13',
      subject: 'Lý',
      time: '14:30 - 16:00',
      date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      meetLink: 'https://meet.google.com/abc-890',
      tutor: 'Tutor D',
    },
    // 5 days from now
    {
      id: '14',
      subject: 'Toán',
      time: '10:00 - 11:00',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      meetLink: 'https://meet.google.com/xyz-123',
      tutor: 'Tutor B',
    },
    // 6 days from now
    {
      id: '15',
      subject: 'Hóa',
      time: '15:00 - 17:00',
      date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      meetLink: 'https://meet.google.com/abc-456',
      tutor: 'Tutor C',
    },
  ])

  const handleStatusChange = (id: string, status: ChecklistItem['status']) => {
    // Update checklist item status (this would normally update state)
    console.log('Update status:', id, status)
  }

  // Dữ liệu chi tiết tutor
  const tutorDetails = {
    'Tutor B': {
      name: 'Tutor B',
      email: 'tutorb@learnerpro.com',
      phone: '0901 234 567',
      subjects: ['Toán'],
      experience: '5 năm kinh nghiệm dạy Toán',
      education: 'Thạc sĩ Toán học - Đại học Bách Khoa',
      rating: 4.8,
      totalStudents: 45,
      specialties: ['Toán 10-12', 'Ôn thi Đại học', 'Toán nâng cao'],
      bio: 'Giáo viên nhiệt tình, có kinh nghiệm lâu năm trong việc dạy Toán cho học sinh THPT. Chuyên về luyện thi Đại học và Toán nâng cao.',
    },
    'Tutor C': {
      name: 'Tutor C',
      email: 'tutorc@learnerpro.com',
      phone: '0902 345 678',
      subjects: ['Hóa'],
      experience: '7 năm kinh nghiệm dạy Hóa',
      education: 'Thạc sĩ Hóa học - Đại học Khoa học Tự nhiên',
      rating: 4.9,
      totalStudents: 52,
      specialties: ['Hóa 10-12', 'Hóa vô cơ', 'Hóa hữu cơ'],
      bio: 'Giáo viên chuyên về Hóa học, từng đạt giải cao trong các kỳ thi Olympic Hóa học. Có phương pháp giảng dạy dễ hiểu, giúp học sinh nắm vững kiến thức.',
    },
    'Tutor D': {
      name: 'Tutor D',
      email: 'tutord@learnerpro.com',
      phone: '0903 456 789',
      subjects: ['Lý'],
      experience: '6 năm kinh nghiệm dạy Vật lý',
      education: 'Thạc sĩ Vật lý - Đại học Sư phạm',
      rating: 4.7,
      totalStudents: 38,
      specialties: ['Vật lý 10-12', 'Cơ học', 'Điện học'],
      bio: 'Giáo viên tận tâm, có phương pháp giảng dạy hiện đại, sử dụng nhiều ví dụ thực tế để giúp học sinh hiểu rõ các khái niệm Vật lý.',
    },
  }

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
  const [parentNote, setParentNote] = useState('')

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

  // Homework items grouped by date - chỉ hiển thị 2 ngày: hôm qua và hôm nay
  const [taskItems] = useState<(TaskItem & { sessionDate?: Date; sessionTime?: string; sessionId?: string })[]>([
    // Yesterday (17/11)
    {
      id: 'y1',
      task: 'Làm bài tập Toán chương 2',
      subject: 'Toán',
      difficulty: 'medium',
      deadline: '17/11',
      sessionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      sessionTime: '09:00 - 10:30',
      sessionId: 'y1',
    },
    {
      id: 'y2',
      task: 'Ôn tập Hóa chương 1',
      subject: 'Hóa',
      difficulty: 'easy',
      deadline: '17/11',
      sessionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      sessionTime: '14:00 - 15:30',
      sessionId: 'y2',
    },
    // Today (18/11)
    {
      id: '1',
      task: 'Làm lại bài 4 (SGK tr.33)',
      subject: 'Toán',
      difficulty: 'medium',
      deadline: '18/11',
      sessionDate: new Date(),
      sessionTime: '09:00 - 10:30',
      sessionId: '1',
    },
    {
      id: '2',
      task: 'Giải 2 bài nâng cao (Azota link)',
      subject: 'Toán',
      difficulty: 'advanced',
      deadline: '18/11',
      sessionDate: new Date(),
      sessionTime: '09:00 - 10:30',
      sessionId: '1',
    },
    {
      id: '3',
      task: 'Ghi chép công thức vào vở học',
      subject: 'Toán',
      difficulty: 'easy',
      deadline: '18/11',
      sessionDate: new Date(),
      sessionTime: '09:00 - 10:30',
      sessionId: '1',
    },
    {
      id: '4',
      task: 'Làm bài tập Hóa SGK trang 56',
      subject: 'Hóa',
      difficulty: 'medium',
      deadline: '18/11',
      sessionDate: new Date(),
      sessionTime: '14:00 - 15:30',
      sessionId: '2',
    },
    {
      id: '5',
      task: 'Chuẩn bị bài mới chương 3',
      subject: 'Hóa',
      difficulty: 'easy',
      deadline: '18/11',
      sessionDate: new Date(),
      sessionTime: '14:00 - 15:30',
      sessionId: '2',
    },
    {
      id: '6',
      task: 'Làm bài tập Lý chương 2',
      subject: 'Lý',
      difficulty: 'advanced',
      deadline: '18/11',
      sessionDate: new Date(),
      sessionTime: '16:00 - 17:00',
      sessionId: '3',
    },
  ])

  // Chi tiết bài tập về nhà với đầy đủ thông tin
  const [homeworkDetailItems] = useState<Record<string, HomeworkDetailItem[]>>({
    // Yesterday sessions
    'y1': [
      {
        id: 'y1-1',
        task: 'Làm bài tập Toán chương 2',
        estimatedTime: 20,
        actualTime: 22,
        difficulty: 'medium',
        result: 'completed',
        comment: 'Hoàn thành tốt',
        uploadedFileName: 'bai_tap_toan_chuong_2.pdf',
        solutionFileName: 'loi_giai_toan_chuong_2.pdf',
        assignmentFileName: 'bai_tap_toan_chuong_2_goc.pdf',
      },
    ],
    'y2': [
      {
        id: 'y2-1',
        task: 'Ôn tập Hóa chương 1',
        estimatedTime: 15,
        actualTime: 15,
        difficulty: 'easy',
        result: 'completed',
        comment: 'Đã nộp đúng hạn',
        uploadedFileName: 'on_tap_hoa_chuong_1.pdf',
        assignmentFileName: 'on_tap_hoa_chuong_1_goc.pdf',
      },
    ],
    // Today sessions
    '1': [
      {
        id: '1',
        task: 'Làm lại bài 4 (SGK tr.33)',
        estimatedTime: 15,
        actualTime: 18,
        difficulty: 'medium',
        result: 'completed',
        comment: 'Làm đúng, trình bày rõ ràng',
        solutionType: 'text',
        solutionText: 'Áp dụng phương pháp thế, trình bày từng bước.',
        assignmentFileName: 'bai_4_sgk_trang_33.pdf',
      },
      {
        id: '2',
        task: 'Giải 2 bài nâng cao (Azota link)',
        estimatedTime: 20,
        actualTime: 25,
        difficulty: 'advanced',
        result: 'not_completed',
        comment: 'Cần luyện thêm phần rút gọn',
        solutionFileName: 'loi_giai_bai_nang_cao.pdf',
        assignmentFileName: 'bai_nang_cao_azota.pdf',
      },
      {
        id: '3',
        task: 'Ghi chép công thức vào vở học',
        estimatedTime: 10,
        actualTime: 10,
        difficulty: 'easy',
        result: 'completed',
        comment: 'Hoàn thành tốt',
      },
    ],
    '2': [
      {
        id: '4',
        task: 'Làm bài tập Hóa SGK trang 56',
        estimatedTime: 20,
        actualTime: 22,
        difficulty: 'medium',
        result: 'completed',
        comment: 'Làm đúng các bước',
      },
      {
        id: '5',
        task: 'Chuẩn bị bài mới chương 3',
        estimatedTime: 15,
        difficulty: 'easy',
        result: 'not_completed',
        comment: 'Chưa hoàn thành',
      },
    ],
    '3': [
      {
        id: '6',
        task: 'Làm bài tập Lý chương 2',
        estimatedTime: 25,
        actualTime: 30,
        difficulty: 'advanced',
        result: 'completed',
        comment: 'Hiểu bài tốt',
        solutionType: 'file',
        solutionFileName: 'loi_giai_ly_chuong_2.pdf',
      },
    ],
  })

  const handleFileUpload = (id: string, file: File) => {
    console.log('Upload file for item:', id, file.name)
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

  const handleAddItem = () => {
    console.log('Add new item')
    // TODO: Implement add functionality
  }

  const handleEditItem = (id: string) => {
    console.log('Edit item:', id)
    // TODO: Implement edit functionality
  }

  const handleDeleteItem = (id: string) => {
    // Delete checklist item (this would normally update state)
    console.log('Delete item:', id)
  }

  const handleJoinClass = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId)
    if (schedule?.meetLink) {
      window.open(schedule.meetLink, '_blank')
    }
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

  // Filter today's data
  const todaySchedules = schedules.filter(s => isToday(s.date))
  const todayChecklist = checklistItems.filter(item => isToday(item.date))
  
  const completedCount = checklistItems.filter(item => item.status === 'done').length
  const totalCount = checklistItems.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  
  // Group checklist by date
  const checklistByDate = groupByDate(checklistItems)
  
  // Lọc checklist dựa trên bộ lọc
  const getFilteredChecklistItems = () => {
    let filtered = [...checklistItems]
    
    // Lọc theo tìm kiếm
    if (checklistSearchQuery.trim()) {
      const query = checklistSearchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.lesson.toLowerCase().includes(query) ||
        item.task.toLowerCase().includes(query) ||
        item.subject.toLowerCase().includes(query) ||
        (item.note && item.note.toLowerCase().includes(query))
      )
    }
    
    // Lọc theo mốc thời gian
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (checklistDateRange === 'week') {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date)
        itemDate.setHours(0, 0, 0, 0)
        return itemDate >= weekAgo && itemDate <= today
      })
    } else if (checklistDateRange === 'month') {
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date)
        itemDate.setHours(0, 0, 0, 0)
        return itemDate >= monthAgo && itemDate <= today
      })
    } else if (checklistDateRange === 'custom' && checklistCustomStartDate && checklistCustomEndDate) {
      const startDate = new Date(checklistCustomStartDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(checklistCustomEndDate)
      endDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date)
        return itemDate >= startDate && itemDate <= endDate
      })
    }
    // 'all' không lọc gì
    
    return filtered
  }
  
  const filteredChecklistItems = getFilteredChecklistItems()
  const filteredChecklistByDate = groupByDate(filteredChecklistItems)
  
  // Get sorted date keys - hiển thị tất cả ngày sau khi lọc
  const today = new Date()
  const allDates = Object.keys(filteredChecklistByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  const checklistDates = allDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Sắp xếp mới nhất trước
  
  // Get selected date details
  const selectedChecklistDetails = selectedDate && selectedDateType === 'checklist' ? checklistByDate[selectedDate] : []

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

  const attentionSubjects = subjectPerformance
    .filter((subject) => subject.completionRate < 80)
    .sort((a, b) => a.completionRate - b.completionRate)

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
  
  const handleDateClick = (date: string, type: 'schedule' | 'checklist') => {
    setSelectedDate(date)
    setSelectedDateType(type)
  }
  
  const handleCloseDetail = () => {
    setSelectedDate(null)
    setSelectedDateType(null)
  }
  
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

  // Helper function to get tutor avatar initial
  const getTutorInitial = (tutorName: string) => {
    return tutorName.charAt(tutorName.length - 1).toUpperCase()
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
          return renderHomeSection()
        case 'schedule':
          return renderScheduleSection()
        case 'checklist':
          return renderChecklistSection()
        case 'homework':
          return renderHomeworkSection()
        case 'analytics':
          return renderAnalyticsSection()
        default:
          return renderHomeSection()
      }
    })()
    
    return <div className="h-full overflow-hidden">{content}</div>
  }

  const renderTodayChecklistGroups = (forceExpand = false) => {
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

  const renderHomeSection = () => (
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
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5">Vào lớp học</h3>
                    <p className="text-[10px] sm:text-xs text-gray-600 leading-tight">Tham gia buổi học trực tuyến</p>
                  </div>
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
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5">Xem checklist</h3>
                    <p className="text-[10px] sm:text-xs text-gray-600 leading-tight">Theo dõi tiến độ học tập</p>
                  </div>
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
          <div className="card hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center space-x-2 mb-4 sm:mb-6">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Tải tài liệu cho Tutor</h2>
            </div>            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Ghi chú cho Tutor</label>
                <textarea
                  value={parentNote}
                  onChange={(e) => setParentNote(e.target.value)}
                  placeholder="Nhập ghi chú chi tiết (ví dụ: phần con cần ôn lại, vấn đề trong buổi trước...)"
                  rows={3}
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                />
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100">
                <input
                  type="file"
                  id="document-upload"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = e.target.files
                    if (files) {
                      console.log('Uploaded files:', Array.from(files).map(f => f.name))
                      // TODO: Handle file upload
                    }
                  }}
                />
                <label htmlFor="document-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Click để tải tài liệu
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, JPG, PNG (tối đa 10MB)
                  </p>
                </label>
              </div>
              
              {/* Uploaded Files List */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 mb-2">Tài liệu đã tải:</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-primary-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Bai_tap_Toan_15_11.pdf</p>
                        <p className="text-xs text-gray-500">Tải lên: 15/11/2025 08:30</p>
                      </div>
                    </div>
                    <button className="text-red-500 hover:text-red-700 text-sm">
                      Xóa
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Ghi_chu_Hoa.docx</p>
                        <p className="text-xs text-gray-500">Tải lên: 15/11/2025 09:15</p>
                      </div>
                    </div>
                    <button className="text-red-500 hover:text-red-700 text-sm">
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Schedule (Vị trí mới: thứ hai) */}
          <div className="card hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Lịch học hôm nay</h2>
                <p className="text-sm text-gray-600">{todaySchedules.length} buổi học</p>
              </div>
              <button
                onClick={() => setActiveSection('schedule')}
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

                  return (
                    <div
                      key={schedule.id}
                      onClick={() => schedule.tutor && setSelectedTutorSchedule(schedule.id)}
                      className="border-2 border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all bg-gradient-to-br from-white to-gray-50 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                              schedule.subject === 'Toán' ? 'bg-blue-500 text-white' :
                              schedule.subject === 'Hóa' ? 'bg-green-500 text-white' :
                              'bg-gray-500 text-white'
                            }`}>
                              {schedule.subject}
                            </span>
                            <span className="text-sm font-semibold text-gray-700">{schedule.time}</span>
                          </div>
                          {schedule.tutor && (
                            <p className="text-sm text-gray-600">Tutor: {schedule.tutor}</p>
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
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Modal chi tiết Tutor */}
          {selectedTutorSchedule && (() => {
            const schedule = todaySchedules.find(s => s.id === selectedTutorSchedule)
            if (!schedule || !schedule.tutor) return null
            const tutorDetail = tutorDetails[schedule.tutor as keyof typeof tutorDetails]
            if (!tutorDetail) return null

            return (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedTutorSchedule(null)}
              >
                <div 
                  className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold text-gray-900">Thông tin chi tiết Tutor</h2>
                    <button
                      onClick={() => setSelectedTutorSchedule(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <span className="text-2xl">&times;</span>
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Header với thông tin buổi học */}
                    <div className="border-b border-gray-200 pb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                          schedule.subject === 'Toán' ? 'bg-blue-500 text-white' :
                          schedule.subject === 'Hóa' ? 'bg-green-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {schedule.subject}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">{schedule.time}</span>
                      </div>
                      <p className="text-sm text-gray-600">{format(schedule.date, 'EEEE, dd/MM/yyyy')}</p>
                    </div>

                    {/* Thông tin Tutor */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                          {tutorDetail.name.charAt(tutorDetail.name.length - 1)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{tutorDetail.name}</h3>
                          <p className="text-sm text-gray-600">{tutorDetail.experience}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 ${star <= Math.floor(tutorDetail.rating) ? 'text-yellow-400 fill-yellow-400' : star <= tutorDetail.rating ? 'text-yellow-400 fill-yellow-200' : 'text-gray-300'}`}
                              />
                            ))}
                            <span className="text-sm font-semibold text-gray-700 ml-1">{tutorDetail.rating}/5.0</span>
                            <span className="text-xs text-gray-500">({tutorDetail.totalStudents} học sinh)</span>
                          </div>
                        </div>
                      </div>

                      {/* Thông tin liên hệ */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                          <p className="text-sm text-gray-900">{tutorDetail.email}</p>
                        </div>
                        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Số điện thoại</p>
                          <p className="text-sm text-gray-900">{tutorDetail.phone}</p>
                        </div>
                      </div>

                      {/* Học vấn */}
                      <div className="border border-gray-200 rounded-xl p-4 bg-gradient-to-r from-blue-50 to-blue-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Học vấn</p>
                        <p className="text-sm font-semibold text-gray-900">{tutorDetail.education}</p>
                      </div>

                      {/* Chuyên môn */}
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-3">Chuyên môn</p>
                        <div className="flex flex-wrap gap-2">
                          {tutorDetail.specialties.map((specialty, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-xs font-semibold"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Giới thiệu */}
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-2">Giới thiệu</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{tutorDetail.bio}</p>
                      </div>
                    </div>
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
                onClick={() => setActiveSection('checklist')}
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
                  formatter={(value: number, name: string, props: any) => {
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

        <div className="card hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900">Môn cần chú ý</h2>
          </div>
          {attentionSubjects.length === 0 ? (
            <p className="text-sm text-gray-500">Tất cả các môn đều đạt trên 80%.</p>
          ) : (
            <div className="space-y-3">
              {attentionSubjects.slice(0, 4).map((subject) => (
                <div key={subject.subject} className="border-2 border-red-100 rounded-xl p-3 bg-red-50/60">
                  <div className="flex items-center justify-between text-sm font-semibold text-gray-900 mb-1">
                    <span>{subject.subject}</span>
                    <span>{subject.completionRate}%</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {subject.completed}/{subject.total} nhiệm vụ đã hoàn thành
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const handleViewChecklist = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId)
    if (schedule) {
      // Navigate to checklist section with the schedule date
      const scheduleDateKey = format(schedule.date, 'yyyy-MM-dd')
      setActiveSection('checklist')
      setSelectedDate(scheduleDateKey)
      setSelectedDateType('checklist')
    }
  }

  const renderScheduleSection = () => (
    <div className="h-full overflow-hidden">
      <div className="h-full flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
        <MonthlyCalendar
          schedules={schedules}
          onJoinClass={handleJoinClass}
          onViewChecklist={handleViewChecklist}
        />
      </div>
    </div>
  )

  const renderChecklistSection = () => {
    // Calculate stats for each date
    const getChecklistStats = (items: (ChecklistItem & { date: Date })[]) => {
      const completed = items.filter(item => item.status === 'done').length
      const total = items.length
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
      return { completed, total, percentage }
    }

    // Group checklist items by subject for a specific date
    const getChecklistBySubject = (dateKey: string) => {
      const items = checklistByDate[dateKey] || []
      const subjects = Array.from(new Set(items.map(item => item.subject)))
      return subjects.map(subject => ({
        subject,
        items: items.filter(item => item.subject === subject),
      }))
    }

    return (
      <div className="h-full overflow-y-auto space-y-3 sm:space-y-4">
        {/* Checklist list by date with expand/collapse */}
        <div className="card hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center space-x-2 mb-4 sm:mb-6">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Checklist</h2>
          </div>
          
          {/* Bộ lọc */}
          <div className="mb-4 space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            {/* Tìm kiếm */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo bài học, nhiệm vụ, môn học..."
                value={checklistSearchQuery}
                onChange={(e) => setChecklistSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            
            {/* Mốc thời gian */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Mốc thời gian:</span>
              </div>
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
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={checklistCustomStartDate}
                    onChange={(e) => setChecklistCustomStartDate(e.target.value)}
                    className="px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="Từ ngày"
                  />
                  <span className="text-gray-500">đến</span>
                  <input
                    type="date"
                    value={checklistCustomEndDate}
                    onChange={(e) => setChecklistCustomEndDate(e.target.value)}
                    className="px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    placeholder="Đến ngày"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            {checklistDates.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Không tìm thấy checklist nào phù hợp với bộ lọc.</p>
            ) : (
              checklistDates.map((dateKey) => {
                const dateObj = new Date(dateKey)
                const dayChecklist = filteredChecklistByDate[dateKey] || []
              const isTodayDate = isToday(dateObj)
              const isExpanded = expandedChecklistDate === dateKey
              const stats = getChecklistStats(dayChecklist)
              const subjectGroups = getChecklistBySubject(dateKey)

              return (
                <div
                  key={dateKey}
                  className={`border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all ${
                    isExpanded
                      ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-primary-300 hover:shadow-md bg-gradient-to-br from-white to-gray-50'
                  }`}
                >
                  <button
                    className="w-full flex items-center justify-between text-left"
                    onClick={() => {
                      setExpandedChecklistDate(isExpanded ? null : dateKey)
                    }}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${
                        isTodayDate
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        <span className="text-sm sm:text-base">{format(dateObj, 'dd')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm sm:text-base font-bold truncate ${isTodayDate ? 'text-primary-600' : 'text-gray-900'}`}>
                          {isTodayDate ? 'Hôm nay' : format(dateObj, 'EEEE, dd/MM/yyyy')}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {stats.completed}/{stats.total} hoàn thành ({stats.percentage}%)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                      {/* Progress bar */}
                      <div className="w-16 sm:w-24 h-2 bg-gray-200 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className={`h-full rounded-full transition-all ${
                            stats.percentage === 100 ? 'bg-green-500' :
                            stats.percentage >= 50 ? 'bg-primary-500' :
                            'bg-yellow-500'
                          }`}
                          style={{ width: `${stats.percentage}%` }}
                        ></div>
                      </div>
                      <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90 text-primary-600' : 'text-gray-400'}`} />
                    </div>
                  </button>
                  
                  {isExpanded && dayChecklist.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      {subjectGroups.map((group) => {
                        const subjectCompleted = group.items.filter(item => item.status === 'done').length
                        const subjectTotal = group.items.length
                        const subjectPercentage = subjectTotal > 0 ? Math.round((subjectCompleted / subjectTotal) * 100) : 0

                        return (
                          <div key={group.subject} className="space-y-3">
                            <div className="flex items-center justify-between">
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
                            </div>

                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  subjectPercentage === 100 ? 'bg-green-500' :
                                  subjectPercentage >= 50 ? 'bg-primary-500' :
                                  'bg-yellow-500'
                                }`}
                                style={{ width: `${subjectPercentage}%` }}
                              ></div>
                            </div>

                            <div className="space-y-2">
                              {group.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-gray-900 truncate">{item.lesson}</p>
                                    <p className="text-xs text-gray-600 truncate">{item.task}</p>
                                    {item.note && (
                                      <p className="text-xs text-gray-500 mt-1">Ghi chú: {item.note}</p>
                                    )}
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
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h4 className="text-sm font-bold text-gray-900 mb-3">Chi tiết bài tập</h4>
                              <ChecklistDetailTable
                                items={getSubjectDetailItems(group.subject)}
                                onUpload={(id, file) => handleDetailFileUpload(group.subject, id, file)}
                                onUploadSolution={(id, file) => handleDetailSolutionUpload(group.subject, id, file)}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }))}
          </div>
        </div>
      </div>
    )
  }

  const renderHomeworkSection = () => {
    // Group homework by date - chỉ hiển thị 2 ngày: hôm qua và hôm nay
    const groupHomeworkByDate = () => {
      const grouped: Record<string, typeof taskItems> = {}
      taskItems.forEach(task => {
        if (task.sessionDate) {
          const dateKey = format(task.sessionDate, 'yyyy-MM-dd')
          if (!grouped[dateKey]) {
            grouped[dateKey] = []
          }
          grouped[dateKey].push(task)
        }
      })
      return grouped
    }

    // Group by session within each date
    const groupBySession = (tasks: typeof taskItems) => {
      const grouped: Record<string, typeof taskItems> = {}
      tasks.forEach(task => {
        if (task.sessionId && task.sessionTime) {
          const key = `${task.sessionId}-${task.sessionTime}`
          if (!grouped[key]) {
            grouped[key] = []
          }
          grouped[key].push(task)
        }
      })
      return grouped
    }
    
    const homeworkByDate = groupHomeworkByDate()
    
    // Chỉ lấy 2 ngày: hôm qua và hôm nay
    const today = new Date()
    const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000)
    const todayStr = format(today, 'yyyy-MM-dd')
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd')
    
    const homeworkDates = [yesterdayStr, todayStr].filter(dateKey => homeworkByDate[dateKey])
    
    // Get session info
    const getSessionInfo = (tasks: typeof taskItems) => {
      if (tasks.length === 0) return null
      const firstTask = tasks[0]
      return {
        subject: firstTask.subject,
        date: firstTask.sessionDate,
        time: firstTask.sessionTime,
      }
    }
    
    return (
      <div className="h-full overflow-y-auto space-y-3 sm:space-y-4">
        <div className="card hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center space-x-2 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gray-200">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Bài tập về nhà</h2>
          </div>
          
          {/* Homework list by date with expand/collapse */}
          <div className="space-y-2 sm:space-y-4">
            {homeworkDates.map((dateKey) => {
              const dateObj = new Date(dateKey)
              const dayTasks = homeworkByDate[dateKey] || []
              const isTodayDate = isToday(dateObj)
              const isExpanded = expandedHomeworkSession === dateKey
              const sessionGroups = groupBySession(dayTasks)
              const sessionKeys = Object.keys(sessionGroups)
              
              return (
                <div
                  key={dateKey}
                  className={`border-2 rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all ${
                    isExpanded
                      ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-primary-300 hover:shadow-md bg-gradient-to-br from-white to-gray-50'
                  }`}
                >
                  <button
                    className="w-full flex items-center justify-between text-left"
                    onClick={() => {
                      setExpandedHomeworkSession(isExpanded ? null : dateKey)
                    }}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${
                        isTodayDate
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        <span className="text-sm sm:text-base">{format(dateObj, 'dd')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm sm:text-base font-bold truncate ${isTodayDate ? 'text-primary-600' : 'text-gray-900'}`}>
                          {isTodayDate ? 'Hôm nay' : format(dateObj, 'EEEE, dd/MM/yyyy')}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">{dayTasks.length} bài tập</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90 text-primary-600' : 'text-gray-400'}`} />
                  </button>
                  
                  {isExpanded && dayTasks.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      {sessionKeys.map((sessionKey) => {
                        const sessionTasks = sessionGroups[sessionKey]
                        const sessionInfo = getSessionInfo(sessionTasks)
                        if (!sessionInfo) return null
                        
                        return (
                          <div key={sessionKey} className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <span className={`px-4 py-1.5 rounded-lg text-sm font-bold shadow-md ${
                                sessionInfo.subject === 'Toán' ? 'bg-blue-500 text-white' :
                                sessionInfo.subject === 'Hóa' ? 'bg-green-500 text-white' :
                                sessionInfo.subject === 'Lý' ? 'bg-purple-500 text-white' :
                                'bg-gray-500 text-white'
                              }`}>
                                {sessionInfo.subject}
                              </span>
                              <span className="text-sm text-gray-600">
                                {sessionInfo.time}
                              </span>
                            </div>
                            
                            <div className="pl-4">
                              <h4 className="text-sm font-bold text-gray-900 mb-3">Chi tiết bài tập</h4>
                              <HomeworkDetailTable
                                items={homeworkDetailItems[sessionTasks[0]?.sessionId || ''] || []}
                                onUpload={(id, file) => handleFileUpload(id, file)}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Layout 
      title="Dashboard Học Sinh"
      sidebar={<Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />}
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