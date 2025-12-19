import { useEffect, useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Link as LinkIcon, X, Edit2, Plus, Upload } from 'lucide-react'
import { splitFileUrls } from '../../utils/fileUrlHelper'
import { API_BASE_URL } from '../../config/api'
import { getCookie } from '../../utils/cookies'
import { processImageFile, isImageFile } from '../../utils/imageProcessor'

export interface TutorChecklistExercise {
  id: string
  title: string
  requirement: string
  estimatedTime: string
  note: string
  assignmentUrls?: string[] // Changed to array for better file management
}

export interface ChecklistFormData {
  studentId: string
  scheduleId: string
  lesson: string
  name: string              // Tên checklist
  description: string       // Nội dung/mô tả checklist
  tasks: string            // Giữ lại để tương thích
  note: string
  dueDate: string
  exercises: TutorChecklistExercise[]
}

interface ChecklistFormProps {
  students: Array<{ id: string; name: string }>
  schedulesByStudent: Record<string, Array<{ id: string; label: string }>>
  formData: ChecklistFormData
  isSubmitting: boolean
  selectedStudentGrade?: string  // Grade của học sinh được chọn
  onFormChange: (data: ChecklistFormData) => void
  onSubmit: () => void
  onClose: () => void
}

// Function to get subjects based on grade
const getSubjectsByGrade = (grade?: string): string[] => {
  if (!grade) return ['Toán', 'Ngữ văn', 'Tiếng Anh'] // Default subjects

  // Extract grade number from string (e.g., "Lớp 5" -> 5, "5" -> 5)
  const gradeMatch = grade.match(/\d+/)
  if (!gradeMatch) return ['Toán', 'Ngữ văn', 'Tiếng Anh']
  
  const gradeNum = parseInt(gradeMatch[0], 10)

  if (gradeNum >= 1 && gradeNum <= 5) {
    // Lớp 1-5
    const subjects = [
      'Tiếng Việt',
      'Toán',
      'Đạo đức',
      'Âm nhạc',
      'Mỹ thuật',
      'Thủ công / Kĩ thuật',
      'Thể dục',
      'Tin học',
    ]
    
    if (gradeNum >= 1 && gradeNum <= 3) {
      subjects.push('Tự nhiên & Xã hội')
    }
    
    if (gradeNum >= 4 && gradeNum <= 5) {
      subjects.push('Khoa học')
      subjects.push('Lịch sử & Địa lý')
    }
    
    return subjects
  } else if (gradeNum >= 6 && gradeNum <= 9) {
    // Lớp 6-9
    const subjects = [
      'Toán',
      'Ngữ văn',
      'Sinh học',
      'Lịch sử',
      'Địa lý',
      'Công dân (GDCD)',
      'Công nghệ',
      'Âm nhạc',
      'Mỹ thuật',
      'Thể dục',
      'Tin học',
      'Tiếng Anh',
    ]
    
    if (gradeNum >= 7) {
      subjects.push('Vật lý')
    }
    
    if (gradeNum >= 8) {
      subjects.push('Hóa học')
    }
    
    return subjects
  } else if (gradeNum >= 10 && gradeNum <= 12) {
    // Lớp 10-12
    return [
      'Toán',
      'Ngữ văn',
      'Vật lý',
      'Hóa học',
      'Sinh học',
      'Lịch sử',
      'Địa lý',
      'Giáo dục công dân',
      'Công nghệ',
      'Tin học',
      'Thể dục',
      'Quốc phòng – An ninh',
      'Tiếng Anh',
    ]
  }
  
  // Default fallback
  return ['Toán', 'Ngữ văn', 'Tiếng Anh']
}

export default function ChecklistForm({
  students,
  schedulesByStudent,
  formData,
  isSubmitting,
  selectedStudentGrade,
  onFormChange,
  onSubmit,
  onClose,
}: ChecklistFormProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({}) // exerciseId-fileIndex -> uploading
  const [clickingUpload, setClickingUpload] = useState<Record<string, boolean>>({}) // exerciseId-fileIndex -> clicking
  const [clickingAddFile, setClickingAddFile] = useState<Record<string, boolean>>({}) // exerciseId -> clicking add file button
  const [uploadErrors, setUploadErrors] = useState<Record<string, string | null>>({}) // exerciseId-fileIndex -> error message
  const availableSubjects = getSubjectsByGrade(selectedStudentGrade)
  const studentSchedules = schedulesByStudent[formData.studentId] || []
  
  const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB

  // Hiển thị nhãn khung giờ: chỉ giờ + buổi (sáng / trưa / tối)
  const getScheduleDisplayLabel = (label: string): string => {
    // label gốc: "29/11 · 06:02 - 11:02 · Toán"
    const parts = label.split('·')
    const timePart = (parts[1] || label).trim() // "06:02 - 11:02"

    const startTime = timePart.split('-')[0]?.trim() // "06:02"
    const hourStr = startTime.split(':')[0]
    const hour = parseInt(hourStr, 10)

    let period = ''
    if (!Number.isNaN(hour)) {
      if (hour < 12) period = 'Sáng'
      else if (hour < 18) period = 'Trưa'
      else period = 'Tối'
    }

    return period ? `${timePart} (${period})` : timePart
  }

  // Chỉ hiển thị các khung giờ thuộc đúng ngày được chọn
  const filteredSchedules = useMemo(() => {
    if (!formData.dueDate) return studentSchedules

    const selectedDate = new Date(formData.dueDate)
    if (Number.isNaN(selectedDate.getTime())) return studentSchedules

    const day = String(selectedDate.getDate()).padStart(2, '0')
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const selectedLabelDate = `${day}/${month}` // Ví dụ: "29/11"

    return studentSchedules.filter((schedule) => {
      // Label đang được build ở TutorDashboard dạng "29/11 · 06:02 - 11:02 ..."
      const labelDate = schedule.label.split('·')[0]?.trim()
      return labelDate === selectedLabelDate
    })
  }, [formData.dueDate, studentSchedules])

  useEffect(() => {
    if (filteredSchedules.length === 0) {
      if (formData.scheduleId) {
        onFormChange({ ...formData, scheduleId: '' })
      }
      return
    }
    const hasCurrent = filteredSchedules.some((schedule) => schedule.id === formData.scheduleId)
    if (!hasCurrent) {
      onFormChange({ ...formData, scheduleId: filteredSchedules[0].id })
    }
  }, [
    formData.studentId,
    formData.dueDate,
    filteredSchedules.map((s) => s.id).join(','),
    formData.scheduleId,
  ])
  const handleExerciseChange = (index: number, field: keyof TutorChecklistExercise, value: string | string[] | File | null) => {
    const nextExercises = [...formData.exercises]
    nextExercises[index] = { ...nextExercises[index], [field]: value }
    onFormChange({ ...formData, exercises: nextExercises })
  }

  // Initialize assignmentUrls from assignmentUrl (for backward compatibility)
  useEffect(() => {
    const needsUpdate = formData.exercises.some(ex => {
      // If assignmentUrl exists but assignmentUrls doesn't, need to convert
      return (ex as any).assignmentUrl && !ex.assignmentUrls
    })
    
    if (needsUpdate) {
      const updatedExercises = formData.exercises.map(ex => {
        if ((ex as any).assignmentUrl && !ex.assignmentUrls) {
          const urls = splitFileUrls((ex as any).assignmentUrl)
          const { assignmentUrl, ...rest } = ex as any
          return { ...rest, assignmentUrls: urls }
        }
        return ex
      })
      onFormChange({ ...formData, exercises: updatedExercises })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  const adjustEstimatedTime = (index: number, delta: number) => {
    const nextExercises = [...formData.exercises]
    const currentValue = parseInt(nextExercises[index]?.estimatedTime?.toString() || '0', 10) || 0
    const updatedValue = Math.max(0, currentValue + delta)
    nextExercises[index] = {
      ...nextExercises[index],
      estimatedTime: updatedValue === 0 ? '' : `${updatedValue}`,
    }
    onFormChange({ ...formData, exercises: nextExercises })
  }

  const addExercise = () => {
    onFormChange({
      ...formData,
      exercises: [
        ...formData.exercises,
        { id: `exercise-${Date.now()}`, title: '', requirement: '', estimatedTime: '', note: '', assignmentUrls: [] },
      ],
    })
  }

  const addEmptyFileRow = (exerciseIndex: number) => {
    const exercise = formData.exercises[exerciseIndex]
    const currentUrls = exercise.assignmentUrls || []
    // Set flag để tránh xóa dòng trống khi blur
    setClickingAddFile(prev => ({ ...prev, [exercise.id]: true }))
    handleExerciseChange(exerciseIndex, 'assignmentUrls', [...currentUrls, ''])
    // Clear flag sau một chút
    setTimeout(() => {
      setClickingAddFile(prev => {
        const next = { ...prev }
        delete next[exercise.id]
        return next
      })
    }, 300)
  }

  const removeFile = (exerciseIndex: number, fileIndex: number) => {
    const exercise = formData.exercises[exerciseIndex]
    const currentUrls = exercise.assignmentUrls || []
    const newUrls = currentUrls.filter((_, idx) => idx !== fileIndex)
    handleExerciseChange(exerciseIndex, 'assignmentUrls', newUrls)
  }

  const handleFileUpload = async (exerciseIndex: number, fileIndex: number, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const exercise = formData.exercises[exerciseIndex]
    if (!exercise) return

    const file = fileList[0]
    const uploadKey = `${exercise.id}-${fileIndex}`
    
    // Kiểm tra kích thước file
    if (file.size > MAX_FILE_SIZE) {
      setUploadErrors((prev) => ({ ...prev, [uploadKey]: `File "${file.name}" vượt quá 15MB. Vui lòng chọn file nhỏ hơn.` }))
      return
    }
    
    // Kiểm tra định dạng file
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const isValidType = allowedTypes.includes(file.type) || 
      ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')
    
    if (!isValidType) {
      setUploadErrors((prev) => ({ ...prev, [uploadKey]: `Định dạng file "${file.name}" không được hỗ trợ. Vui lòng chọn file PDF, hình ảnh, Word, PowerPoint hoặc Excel.` }))
      return
    }
    
    setUploadingFiles((prev) => ({ ...prev, [uploadKey]: true }))
    setUploadErrors((prev) => ({ ...prev, [uploadKey]: null }))

    try {
      // Process image file before upload
      let processedFile = file
      if (isImageFile(file)) {
        try {
          processedFile = await processImageFile(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.8,
            maxSizeMB: 2
          })
        } catch (error) {
          console.warn('Image processing failed, using original:', error)
          // Continue with original file if processing fails
        }
      }
      
      // Upload processed file
      const uploadPayload = new FormData()
      uploadPayload.append('files', processedFile)

      const accessToken = getCookie('accessToken')
      const response = await fetch(`${API_BASE_URL}/files/upload-multiple`, {
        method: 'POST',
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: uploadPayload,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Không thể tải file. Vui lòng thử lại.')
      }

      const data = await response.json()
      // Lấy URL từ response
      let uploadedUrl: string | null = null
      
      if (Array.isArray(data?.files) && data.files.length > 0) {
        uploadedUrl = data.files[0]?.url || null
      } else if (Array.isArray(data?.file) && data.file.length > 0) {
        uploadedUrl = data.file[0]?.url || null
      } else if (Array.isArray(data?.urls) && data.urls.length > 0) {
        uploadedUrl = data.urls[0] || null
      } else if (data?.url) {
        uploadedUrl = data.url
      } else if (data?.file?.url) {
        uploadedUrl = data.file.url
      }

      if (!uploadedUrl) {
        throw new Error('Không nhận được đường dẫn file từ máy chủ.')
      }

      // Cập nhật URL tại vị trí fileIndex (thay thế nếu đã có, thêm mới nếu chưa có)
      const currentUrls = exercise.assignmentUrls || []
      const newUrls = [...currentUrls]
      if (fileIndex < newUrls.length) {
        newUrls[fileIndex] = uploadedUrl
      } else {
        newUrls.push(uploadedUrl)
      }
      handleExerciseChange(exerciseIndex, 'assignmentUrls', newUrls)
      setUploadErrors((prev) => ({ ...prev, [uploadKey]: null }))
    } catch (error) {
      console.error('Upload file error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Tải file thất bại. Vui lòng thử lại.'
      setUploadErrors((prev) => ({ ...prev, [uploadKey]: errorMessage }))
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [uploadKey]: false }))
    }
  }

  const removeExercise = (index: number) => {
    if (formData.exercises.length === 1) return
    const nextExercises = formData.exercises.filter((_, idx) => idx !== index)
    onFormChange({ ...formData, exercises: nextExercises })
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
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
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn học sinh</label>
            <select
              value={formData.studentId}
              onChange={(e) => onFormChange({ ...formData, studentId: e.target.value })}
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Môn học</label>
              <div className="relative">
                <input
                  type="text"
                  list="subjects-list"
                  value={formData.lesson}
                  onChange={(e) => onFormChange({ ...formData, lesson: e.target.value })}
                  placeholder="Chọn hoặc nhập môn học"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
                <datalist id="subjects-list">
                  {availableSubjects.map((subject) => (
                    <option key={subject} value={subject} />
                  ))}
                </datalist>
              </div>
              {selectedStudentGrade && (
                <p className="text-xs text-gray-500 mt-1">Môn học phù hợp với {selectedStudentGrade} (hoặc nhập môn học khác)</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ngày tháng</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => onFormChange({ ...formData, dueDate: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Khung giờ / Buổi học</label>
            <select
              value={formData.scheduleId}
              onChange={(e) => onFormChange({ ...formData, scheduleId: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
            >
              {filteredSchedules.length === 0 ? (
                <option value="">Không có khung giờ khả dụng</option>
              ) : (
                filteredSchedules.map((schedule, index) => (
                  <option key={schedule.id} value={schedule.id}>
                    {`Ca ${index + 1} | ${getScheduleDisplayLabel(schedule.label)}`}
                  </option>
                ))
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">Chọn đúng buổi học để checklist xuất hiện trong khung giờ tương ứng.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tên bài học</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              placeholder="Ví dụ: Bài tập về nhà tuần 1"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tất cả nhiệm vụ và bài tập cần hoàn thành</label>
            <textarea
              value={formData.description}
              onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              rows={4}
              placeholder="Nhập mô tả chi tiết về checklist..."
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Danh sách bài tập</p>
                <p className="text-xs text-gray-500">Tạo từng bài kèm thời gian và tài liệu</p>
              </div>
              <button
                onClick={addExercise}
                className="text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                + Thêm bài tập
              </button>
            </div>

            <div className="space-y-3">
              {formData.exercises.map((exercise, idx) => (
                <div key={exercise.id} className="border border-gray-200 rounded-2xl p-4 bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Bài {idx + 1}</p>
                    {formData.exercises.length > 1 && (
                      <button
                        onClick={() => removeExercise(idx)}
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
                        onChange={(e) => handleExerciseChange(idx, 'title', e.target.value)}
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
                          onChange={(e) => handleExerciseChange(idx, 'estimatedTime', e.target.value)}
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
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Yêu cầu chi tiết (description)</label>
                    <textarea
                      value={exercise.requirement}
                      onChange={(e) => handleExerciseChange(idx, 'requirement', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={2}
                      placeholder="Mô tả nhiệm vụ cho học sinh..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nhận xét</label>
                    <textarea
                      value={exercise.note}
                      onChange={(e) => handleExerciseChange(idx, 'note', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={2}
                      placeholder="Ghi chú thêm cho học sinh..."
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-gray-600">
                        File bài tập
                    </label>
                      <button
                        onClick={() => addEmptyFileRow(idx)}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Thêm file
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {/* Danh sách file */}
                      {exercise.assignmentUrls && exercise.assignmentUrls.length > 0 ? (
                        <div className="space-y-2">
                          {exercise.assignmentUrls.map((url, fileIndex) => {
                            const isEmpty = !url || url.trim() === ''
                            const uploadKey = `${exercise.id}-${fileIndex}`
                            const isUploading = uploadingFiles[uploadKey] || false
                            
                            return (
                              <div key={fileIndex} className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white">
                                  <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                {isEmpty ? (
                                  <>
                          <input
                                      type="text"
                                      value={url}
                                      onChange={(e) => {
                                        const exercise = formData.exercises[idx]
                                        const currentUrls = exercise.assignmentUrls || []
                                        const newUrls = [...currentUrls]
                                        newUrls[fileIndex] = e.target.value
                                        handleExerciseChange(idx, 'assignmentUrls', newUrls)
                                      }}
                                      onBlur={(e) => {
                                        const uploadKey = `${exercise.id}-${fileIndex}`
                                        // Delay để tránh xóa khi click vào upload button hoặc nút thêm file
                                        setTimeout(() => {
                                          if (!clickingUpload[uploadKey] && !clickingAddFile[exercise.id]) {
                                            const input = e.target as HTMLInputElement
                                            if (!input.value.trim()) {
                                              removeFile(idx, fileIndex)
                                            }
                                          }
                                          setClickingUpload(prev => {
                                            const next = { ...prev }
                                            delete next[uploadKey]
                                            return next
                                          })
                                        }, 150)
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault()
                                          e.currentTarget.blur()
                                        }
                                      }}
                            className="flex-1 text-sm outline-none"
                                      placeholder="Nhập URL file bài tập"
                                    />
                                    <label
                                      className={`p-1.5 rounded transition cursor-pointer ${
                                        isUploading
                                          ? 'text-gray-400 cursor-wait'
                                          : 'text-primary-600 hover:bg-primary-50'
                                      }`}
                                      title="Tải file từ thiết bị"
                                      onMouseDown={(e) => {
                                        e.stopPropagation()
                                        const uploadKey = `${exercise.id}-${fileIndex}`
                                        setClickingUpload(prev => ({ ...prev, [uploadKey]: true }))
                                      }}
                                    >
                                      {isUploading ? (
                                        <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <Upload className="w-4 h-4" />
                                      )}
                                      <input
                                        type="file"
                                        accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                        className="hidden"
                                        onChange={(event) => {
                                          const file = event.target.files?.[0]
                                          if (!file) return
                                          
                                          // Kiểm tra kích thước file (15MB)
                                          const MAX_FILE_SIZE = 15 * 1024 * 1024
                                          if (file.size > MAX_FILE_SIZE) {
                                            const uploadKey = `${exercise.id}-${fileIndex}`
                                            setUploadErrors((prev) => ({ ...prev, [uploadKey]: `File "${file.name}" vượt quá 15MB. Vui lòng chọn file nhỏ hơn.` }))
                                            event.target.value = ''
                                            return
                                          }
                                          
                                          // Kiểm tra định dạng file
                                          const allowedTypes = [
                                            'application/pdf',
                                            'image/jpeg',
                                            'image/jpg',
                                            'image/png',
                                            'image/gif',
                                            'image/webp',
                                            'application/msword',
                                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                            'application/vnd.ms-powerpoint',
                                            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                                            'application/vnd.ms-excel',
                                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                                          ]
                                          const fileExtension = file.name.split('.').pop()?.toLowerCase()
                                          const isValidType = allowedTypes.includes(file.type) || 
                                            ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')
                                          
                                          if (!isValidType) {
                                            const uploadKey = `${exercise.id}-${fileIndex}`
                                            setUploadErrors((prev) => ({ ...prev, [uploadKey]: `Định dạng file "${file.name}" không được hỗ trợ. Vui lòng chọn file PDF, hình ảnh, Word, PowerPoint hoặc Excel.` }))
                                            event.target.value = ''
                                            return
                                          }
                                          
                                          handleFileUpload(idx, fileIndex, event.target.files)
                                          event.target.value = ''
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                        }}
                                        disabled={isUploading}
                                      />
                                    </label>
                                    <button
                                      onClick={() => removeFile(idx, fileIndex)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                                      title="Xóa dòng"
                                      disabled={isUploading}
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                      className="flex-1 text-sm text-primary-600 hover:underline break-all"
                                      title={url}
                                >
                                      {url.length > 60 ? `${url.substring(0, 60)}...` : url}
                                </a>
                        <label
                                      className={`p-1.5 rounded transition cursor-pointer ${
                                        isUploading
                                          ? 'text-gray-400 cursor-wait'
                                          : 'text-primary-600 hover:bg-primary-50'
                                      }`}
                                      title="Tải file mới thay thế"
                                      onMouseDown={(e) => {
                                        e.stopPropagation()
                                        const uploadKey = `${exercise.id}-${fileIndex}`
                                        setClickingUpload(prev => ({ ...prev, [uploadKey]: true }))
                                      }}
                                    >
                                      {isUploading ? (
                                        <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                          <Upload className="w-4 h-4" />
                                      )}
                          <input
                            type="file"
                            accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                            className="hidden"
                            onChange={(event) => {
                                          const files = event.target.files
                                          if (files && files.length > 0) {
                                            const file = files[0]
                                            const uploadKey = `${exercise.id}-${fileIndex}`
                                            // Kiểm tra kích thước file trước khi upload
                                            if (file.size > MAX_FILE_SIZE) {
                                              setUploadErrors((prev) => ({ ...prev, [uploadKey]: 'File không được vượt quá 15MB' }))
                                              event.target.value = ''
                                              return
                                            }
                                            // Clear error trước khi upload
                                            setUploadErrors((prev) => ({ ...prev, [uploadKey]: null }))
                                            handleFileUpload(idx, fileIndex, files)
                                          }
                              event.target.value = ''
                            }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                        }}
                                        disabled={isUploading}
                          />
                        </label>
                                    <button
                                      onClick={() => {
                                        const exercise = formData.exercises[idx]
                                        const currentUrls = exercise.assignmentUrls || []
                                        const newUrls = [...currentUrls]
                                        newUrls[fileIndex] = ''
                                        handleExerciseChange(idx, 'assignmentUrls', newUrls)
                                      }}
                                      className="p-1.5 text-gray-500 hover:bg-gray-50 rounded transition"
                                      title="Sửa URL"
                                      disabled={isUploading}
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => removeFile(idx, fileIndex)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                                      title="Xóa file"
                                      disabled={isUploading}
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                </div>
                                {uploadErrors[uploadKey] && (
                                  <p className="text-xs text-red-500 px-1">{uploadErrors[uploadKey]}</p>
                                )}
                              </div>
                            )
                          })}
                      </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Chưa có file nào. Nhấn "Thêm file" để thêm file mới.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="flex items-center justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="btn-primary text-sm px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi checklist'}
          </button>
        </div>
      </div>
    </div>
  )
}

