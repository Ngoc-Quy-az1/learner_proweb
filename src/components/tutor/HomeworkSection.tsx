import React, { useState } from 'react'
import { format } from 'date-fns'
import { Plus, ChevronUp, ChevronDown, Loader2, FileText, X, Edit2, Calendar } from 'lucide-react'
import { splitFileUrls } from '../../utils/fileUrlHelper'
import { processImageFile, isImageFile } from '../../utils/imageProcessor'

export interface HomeworkItem {
  id: string
  homeworkId?: string
  scheduleId?: string
  task: string
  deadline: string
  assignmentUrl?: string
  studentSolutionFile?: string
  tutorSolution?: string
  difficulty: 'easy' | 'medium' | 'hard'
  result: 'completed' | 'in_progress' | 'not_done' | 'incorrect'
  note: string
  subject?: string
}

interface HomeworkSectionProps {
  studentId: string
  subject: string
  scheduleId?: string
  homeworkMap: Record<string, HomeworkItem[]>
  expandedSections: Record<string, boolean>
  onToggleSection: (sectionKey: string, nextValue: boolean) => void
  onChangeField: (
    subjectKey: string,
    homeworkId: string,
    field: keyof HomeworkItem,
    value: string | HomeworkItem['difficulty']
  ) => void
  onSaveHomework: (subjectKey: string, homeworkId: string) => void
  onDeleteHomework: (subjectKey: string, homeworkId: string) => void
  onAddHomework?: (subjectKey: string, scheduleId?: string) => void
  onUploadFile?: (
    homeworkId: string,
    field: 'assignmentUrl' | 'tutorSolution' | 'studentSolutionFile',
    files: FileList | null,
    fileIndex?: number
  ) => void
  taskFileUploadingKey: string | null
  canEdit?: boolean
  isStudentMode?: boolean // Student can only upload studentSolutionFile
  resolveSubjectName: (code?: string, fallback?: string) => string
}

const HomeworkSection: React.FC<HomeworkSectionProps> = ({
  studentId,
  subject,
  scheduleId,
  homeworkMap,
  expandedSections,
  onToggleSection,
  onChangeField,
  onSaveHomework,
  onDeleteHomework,
  onAddHomework,
  onUploadFile,
  taskFileUploadingKey,
  canEdit = true,
  isStudentMode = false,
  resolveSubjectName,
}) => {
  if (!studentId) return null

  const normalizedSubject = (subject || 'Chung').trim()

  const resolveSubjectKey = () => {
    const subjectKeys = Object.keys(homeworkMap || {})

    if (scheduleId) {
      const scheduleMatchKey = subjectKeys.find((key) =>
        homeworkMap[key]?.some((item) => item.scheduleId === scheduleId)
      )
      if (scheduleMatchKey) return scheduleMatchKey
    }

    if (homeworkMap[normalizedSubject]) return normalizedSubject

    const normalizedUpper = normalizedSubject.toUpperCase()
    const directUpperMatch = subjectKeys.find((key) => key.toUpperCase() === normalizedUpper)
    if (directUpperMatch) return directUpperMatch

    const displayTarget = resolveSubjectName(normalizedSubject).toLowerCase()
    const displayMatch = subjectKeys.find(
      (key) => resolveSubjectName(key).toLowerCase() === displayTarget
    )
    if (displayMatch) return displayMatch

    return normalizedSubject
  }

  const subjectKey = resolveSubjectKey()
  const sectionKey = `${studentId}-${subjectKey}-${scheduleId || 'all'}`
  const isExpanded = expandedSections[sectionKey] ?? false
  const subjectItems = homeworkMap[subjectKey] || []

  // Nếu đang xem theo buổi (có scheduleId) thì CHỈ hiển thị bài tập gắn với buổi đó,
  // không fallback sang bài của các buổi khác cùng môn
  const homeworkItems =
    scheduleId && subjectItems.length > 0
      ? subjectItems.filter((item) => item.scheduleId === scheduleId)
      : subjectItems

  // Track trạng thái đã chỉnh sửa cho từng homework để quyết định hiển thị nút Lưu
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({})

  const markDirty = (homeworkId: string) => {
    setDirtyMap(prev => ({
      ...prev,
      [homeworkId]: true,
    }))
  }

  // Handle save and reset tracking
  const handleSave = async (homeworkId: string) => {
    await onSaveHomework(subjectKey, homeworkId)
    // Sau khi lưu thành công, đánh dấu đã sạch -> ẩn nút Lưu
    setDirtyMap(prev => ({
      ...prev,
      [homeworkId]: false,
    }))
  }

  const handleToggle = () => onToggleSection(sectionKey, !isExpanded)
  const handleAddHomework = () => {
    if (onAddHomework) {
      onAddHomework(subjectKey, scheduleId)
    }
  }

  return (
    <div className="rounded-2xl border-2 border-primary-50 bg-white p-4 sm:p-6 shadow-sm">
      {/* Header: chỉ còn tiêu đề + mũi tên thu gọn giống trạng thái ban đầu */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center justify-between flex-1 text-2xl md:text-3xl font-bold text-gray-900 hover:text-primary-600 transition-colors min-w-0"
        >
          <h4 className="text-left">Bài tập về nhà</h4>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 flex-shrink-0 ml-2" />
          ) : (
            <ChevronDown className="w-5 h-5 flex-shrink-0 ml-2" />
          )}
        </button>
      </div>

      {/* Nút thêm bài tập được đẩy xuống dưới header, canh phải, chỉ hiện khi đang mở */}
      {canEdit && isExpanded && (
        <div className="flex justify-end mb-3 sm:mb-4">
          <button
            type="button"
            onClick={handleAddHomework}
            disabled={!scheduleId}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 disabled:opacity-50 transition"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Thêm bài tập</span>
          </button>
        </div>
      )}

      {isExpanded && (
        <>
          {homeworkItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">Chưa có bài tập về nhà</p>
            </div>
          ) : (
            <div className="space-y-4">
              {homeworkItems.map((homework) => {
                const difficultyLabels = {
                  easy: 'Dễ',
                  medium: 'Trung bình',
                  hard: 'Khó',
                }
                const difficultyColors = {
                  easy: 'bg-green-100 text-green-700',
                  medium: 'bg-yellow-100 text-yellow-700',
                  hard: 'bg-red-100 text-red-700',
                }
                const formattedDeadline = homework.deadline
                  ? format(new Date(homework.deadline), 'dd/MM/yyyy')
                  : 'dd/MM/yyyy'
                
                return (
                  <div
                    key={homework.id}
                    className="border-l-4 border-primary-500 bg-white rounded-lg shadow-sm overflow-hidden"
                  >
                    {/* Header */}
                    <div className="px-4 sm:px-5 py-3 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={homework.task}
                            onChange={(e) => {
                              markDirty(homework.id)
                              onChangeField(subjectKey, homework.id, 'task', e.target.value)
                            }}
                            className="w-full text-base sm:text-lg font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-200 p-0 rounded"
                            placeholder="Nhập tên bài tập"
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                          {/* Status - 3 trạng thái: Chưa làm, Đang làm, Đã hoàn thành */}
                          {canEdit ? (
                            <select
                              value={homework.result || 'not_done'}
                              onChange={(e) => {
                                markDirty(homework.id)
                                onChangeField(
                                  subjectKey,
                                  homework.id,
                                  'result',
                                  e.target.value as HomeworkItem['result']
                                )
                              }}
                              className={`text-xs px-2 sm:px-3 py-1.5 sm:py-1 rounded-full font-semibold whitespace-nowrap border-none focus:outline-none focus:ring-0 w-full sm:w-auto ${
                                homework.result === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : homework.result === 'in_progress'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              <option value="not_done" className="bg-gray-100 text-gray-700">Chưa làm</option>
                              <option value="in_progress" className="bg-yellow-100 text-yellow-700">Đang làm</option>
                              <option value="completed" className="bg-green-100 text-green-700">Đã hoàn thành</option>
                            </select>
                          ) : (
                            <span
                              className={`text-xs px-2 sm:px-3 py-1.5 sm:py-1 rounded-full font-semibold whitespace-nowrap ${
                                homework.result === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : homework.result === 'in_progress'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {homework.result === 'completed'
                                ? 'Đã hoàn thành'
                                : homework.result === 'in_progress'
                                  ? 'Đang làm'
                                  : 'Chưa làm'}
                            </span>
                          )}
                          {/* Difficulty */}
                          {canEdit ? (
                            <select
                              value={homework.difficulty}
                              onChange={(e) => {
                                markDirty(homework.id)
                                onChangeField(
                                  subjectKey,
                                  homework.id,
                                  'difficulty',
                                  e.target.value as HomeworkItem['difficulty']
                                )
                              }}
                              className="text-xs px-2 sm:px-3 py-1.5 sm:py-1 rounded-full font-semibold bg-yellow-100 text-yellow-700 border-none focus:outline-none focus:ring-0 w-full sm:w-auto"
                            >
                              <option value="easy" className="bg-green-100 text-green-700">Dễ</option>
                              <option value="medium" className="bg-yellow-100 text-yellow-700">Trung bình</option>
                              <option value="hard" className="bg-red-100 text-red-700">Khó</option>
                            </select>
                          ) : (
                            <span
                              className={`text-xs px-2 sm:px-3 py-1.5 sm:py-1 rounded-full font-semibold ${difficultyColors[homework.difficulty]}`}
                            >
                              {difficultyLabels[homework.difficulty]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm sm:text-base text-gray-600 flex items-center gap-2">
                        <span>Hạn nộp:</span>
                        {canEdit ? (
                          <div className="relative inline-flex items-center">
                            <input
                              type="date"
                              value={homework.deadline ? format(new Date(homework.deadline), 'yyyy-MM-dd') : ''}
                              onChange={(e) => {
                                if (e.target.value) {
                                  const date = new Date(e.target.value)
                                  date.setHours(23, 59, 59)
                                  markDirty(homework.id)
                                  onChangeField(subjectKey, homework.id, 'deadline', date.toISOString())
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-gray-300 bg-white shadow-sm text-xs sm:text-sm">
                              <span className="text-gray-700">{formattedDeadline}</span>
                              <Calendar className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                        ) : (
                          <span>{formattedDeadline}</span>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="px-4 sm:px-5 py-4 space-y-4">
                      {/* Upload Bài tập - hỗ trợ nhiều file */}
                      {canEdit && !isStudentMode && onUploadFile && (
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                          <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0 mt-1 sm:w-32">
                            File bài tập
                          </label>
                          <div className="flex-1 min-w-0 flex flex-col gap-2">
                            {(() => {
                              const urls = splitFileUrls(homework.assignmentUrl || '')
                              return urls.length > 0 ? (
                                urls.map((url, urlIndex) => {
                                  const fileName = url.split('/').pop() || url
                                  return (
                                  <div
                                    key={urlIndex}
                                    className="flex items-center gap-2 sm:gap-3"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (url) {
                                          window.open(url, '_blank', 'noopener,noreferrer')
                                        }
                                      }}
                                      className="flex-1 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm text-primary-600 hover:bg-primary-50 hover:border-primary-300 text-left truncate"
                                      title={url}
                                    >
                                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                      <span className="truncate">
                                        {fileName}
                                      </span>
                                    </button>
                                    <label
                                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 ${
                                        taskFileUploadingKey === `${homework.id}-assignmentUrl-${urlIndex}`
                                          ? 'cursor-wait opacity-60'
                                          : 'cursor-pointer hover:bg-primary-50'
                                      }`}
                                      title={
                                        taskFileUploadingKey === `${homework.id}-assignmentUrl-${urlIndex}`
                                          ? 'Đang upload...'
                                          : 'Thay thế file'
                                      }
                                    >
                                      {taskFileUploadingKey === `${homework.id}-assignmentUrl-${urlIndex}` ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Edit2 className="w-4 h-4" />
                                      )}
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0]
                                          if (!file) return
                                          
                                          // Kiểm tra kích thước file (15MB)
                                          const MAX_FILE_SIZE = 15 * 1024 * 1024
                                          if (file.size > MAX_FILE_SIZE) {
                                            alert(`File "${file.name}" vượt quá 15MB. Vui lòng chọn file nhỏ hơn.`)
                                            e.target.value = ''
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
                                            alert(`Định dạng file "${file.name}" không được hỗ trợ. Vui lòng chọn file PDF, hình ảnh, Word, PowerPoint hoặc Excel.`)
                                            e.target.value = ''
                                            return
                                          }
                                          
                                          onUploadFile(homework.id, 'assignmentUrl', e.target.files, urlIndex)
                                          e.target.value = ''
                                        }}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-red-300 text-red-500 flex-shrink-0 hover:bg-red-50"
                                      title="Xóa file"
                                      onClick={() => {
                                        const currentUrls = splitFileUrls(homework.assignmentUrl || '')
                                        const nextUrls = currentUrls.filter((_, idx) => idx !== urlIndex)
                                        const nextValue = nextUrls.join('\n')
                                        markDirty(homework.id)
                                        onChangeField(subjectKey, homework.id, 'assignmentUrl', nextValue)
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                  )
                                })
                              ) : (
                                <span className="text-xs sm:text-sm text-gray-400">Chưa có file bài tập</span>
                              )
                            })()}
                            <label
                              className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-dashed border-primary-300 text-primary-600 text-xs sm:text-sm ${
                                taskFileUploadingKey === `${homework.id}-assignmentUrl`
                                  ? 'cursor-wait opacity-60'
                                  : 'cursor-pointer hover:bg-primary-50'
                              }`}
                              title={
                                taskFileUploadingKey === `${homework.id}-assignmentUrl`
                                  ? 'Đang upload...'
                                  : 'Thêm file bài tập'
                              }
                            >
                              {taskFileUploadingKey === `${homework.id}-assignmentUrl` ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="w-4 h-4" />
                                  <span>Thêm file</span>
                                </>
                              )}
                              <input
                                type="file"
                                className="hidden"
                                accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                multiple
                                onChange={(e) => {
                                  markDirty(homework.id)
                                  onUploadFile(homework.id, 'assignmentUrl', e.target.files)
                                  e.target.value = ''
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Bài làm học sinh - Tutor chỉ xem và tải, không upload */}
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 flex-shrink-0 mt-1 leading-tight sm:w-32">
                          <span className="block">Bài làm</span>
                          <span className="block">học sinh</span>
                        </label>
                        <div className="flex-1 min-w-0">
                          {(() => {
                            const urls = splitFileUrls(homework.studentSolutionFile || '')
                            if (urls.length === 0) {
                              return (
                                <span className="text-xs sm:text-sm text-gray-400 flex-1">
                                  Chưa có bài làm
                                </span>
                              )
                            }
                            
                            return (
                              <div className="flex flex-col gap-1">
                                {urls.map((url, idx) => {
                                  const rawName = url.split('/').pop() || url
                                  const fileName = rawName.split('?')[0] || rawName
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        if (url) {
                                          window.open(url, '_blank', 'noopener,noreferrer')
                                        }
                                      }}
                                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm text-primary-600 hover:bg-primary-50 hover:border-primary-300 text-left truncate"
                                      title={url}
                                    >
                                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                      <span className="truncate">
                                        {urls.length > 1 ? `Bài làm ${idx + 1}` : fileName}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            )
                          })()}
                        </div>
                      </div>

                      {/* File Lời giải - hỗ trợ nhiều file giống File bài tập */}
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0 mt-1 sm:w-32">
                          File lời giải
                        </label>
                        <div className="flex-1 min-w-0">
                          {canEdit && onUploadFile ? (
                            <div className="flex flex-col gap-2">
                              {(() => {
                                const urls = splitFileUrls(homework.tutorSolution || '')
                                return urls.length > 0 ? (
                                  urls.map((url, urlIndex) => {
                                    const uploadKey = `${homework.id}-tutorSolution-${urlIndex}`
                                    const isUploading = taskFileUploadingKey === uploadKey
                                    const fileName = (url.split('/').pop() || url).split('?')[0]

                                    return (
                                      <div
                                        key={urlIndex}
                                        className="flex items-center gap-2 sm:gap-3"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (url) {
                                              window.open(url, '_blank', 'noopener,noreferrer')
                                            }
                                          }}
                                          className="flex-1 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm text-primary-600 hover:bg-primary-50 hover:border-primary-300 text-left truncate"
                                          title={url}
                                        >
                                          <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                          <span className="truncate">{fileName}</span>
                                        </button>
                                        <label
                                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 ${
                                            isUploading ? 'cursor-wait opacity-60' : 'cursor-pointer hover:bg-primary-50'
                                          }`}
                                          title={isUploading ? 'Đang upload...' : 'Thay thế file'}
                                        >
                                          {isUploading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Edit2 className="w-4 h-4" />
                                          )}
                                          <input
                                            type="file"
                                            className="hidden"
                                            accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0]
                                              if (!file) return
                                              
                                              // Kiểm tra kích thước file (15MB)
                                              const MAX_FILE_SIZE = 15 * 1024 * 1024
                                              if (file.size > MAX_FILE_SIZE) {
                                                alert(`File "${file.name}" vượt quá 15MB. Vui lòng chọn file nhỏ hơn.`)
                                                e.target.value = ''
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
                                                alert(`Định dạng file "${file.name}" không được hỗ trợ. Vui lòng chọn file PDF, hình ảnh, Word, PowerPoint hoặc Excel.`)
                                                e.target.value = ''
                                                return
                                              }
                                              
                                              onUploadFile(homework.id, 'tutorSolution', e.target.files, urlIndex)
                                              e.target.value = ''
                                            }}
                                          />
                                        </label>
                                        <button
                                          type="button"
                                          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-red-300 text-red-500 flex-shrink-0 hover:bg-red-50"
                                          title="Xóa file"
                                          onClick={() => {
                                            const currentUrls = splitFileUrls(homework.tutorSolution || '')
                                            const nextUrls = currentUrls.filter((_, idx) => idx !== urlIndex)
                                            const nextValue = nextUrls.join('\n')
                                            markDirty(homework.id)
                                            onChangeField(subjectKey, homework.id, 'tutorSolution', nextValue)
                                          }}
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )
                                  })
                                ) : (
                                  <span className="text-xs sm:text-sm text-gray-400">Chưa có file lời giải</span>
                                )
                              })()}

                              <label
                                className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-dashed border-primary-300 text-primary-600 text-xs sm:text-sm ${
                                  taskFileUploadingKey === `${homework.id}-tutorSolution`
                                    ? 'cursor-wait opacity-60'
                                    : 'cursor-pointer hover:bg-primary-50'
                                }`}
                                title={
                                  taskFileUploadingKey === `${homework.id}-tutorSolution`
                                    ? 'Đang upload...'
                                    : 'Thêm file lời giải'
                                }
                              >
                                {taskFileUploadingKey === `${homework.id}-tutorSolution` ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4" />
                                    <span>Thêm file</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return
                                    
                                    // Kiểm tra kích thước file (15MB)
                                    const MAX_FILE_SIZE = 15 * 1024 * 1024
                                    if (file.size > MAX_FILE_SIZE) {
                                      alert(`File "${file.name}" vượt quá 15MB. Vui lòng chọn file nhỏ hơn.`)
                                      e.target.value = ''
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
                                      alert(`Định dạng file "${file.name}" không được hỗ trợ. Vui lòng chọn file PDF, hình ảnh, Word, PowerPoint hoặc Excel.`)
                                      e.target.value = ''
                                      return
                                    }
                                    
                                    markDirty(homework.id)
                                    onUploadFile(homework.id, 'tutorSolution', e.target.files)
                                    e.target.value = ''
                                  }}
                                />
                              </label>
                            </div>
                          ) : (
                            (() => {
                              const urls = splitFileUrls(homework.tutorSolution || '')
                              return urls.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  {urls.map((url, idx) => {
                                    const fileName = (url.split('/').pop() || url).split('?')[0]
                                    return (
                                      <a
                                        key={idx}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs sm:text-sm text-primary-600 hover:underline break-all"
                                        title={url}
                                      >
                                        {urls.length > 1 ? `File lời giải ${idx + 1}` : fileName}
                                      </a>
                                    )
                                  })}
                                </div>
                              ) : (
                                <span className="text-xs sm:text-sm text-gray-400">Chưa có file lời giải</span>
                              )
                            })()
                          )}
                        </div>
                      </div>

                      {/* Nhận xét */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0">Nhận xét:</label>
                        {canEdit ? (
                          <input
                            type="text"
                            value={homework.note || ''}
                            onChange={(e) => {
                              markDirty(homework.id)
                              onChangeField(subjectKey, homework.id, 'note', e.target.value)
                            }}
                            className="flex-1 text-xs sm:text-sm text-gray-700 px-2 sm:px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                            placeholder="Nhận xét"
                          />
                        ) : (
                          <span className="text-xs sm:text-sm text-gray-700 flex-1 break-words">{homework.note || '—'}</span>
                        )}
                      </div>
                    </div>

                    {/* Footer - Action Buttons - Chỉ hiển thị nút Lưu khi có thay đổi */}
                        {canEdit && (
                      <div className="px-4 sm:px-5 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                        {dirtyMap[homework.id] && (
                          <button
                            onClick={() => handleSave(homework.id)}
                            className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold text-xs sm:text-sm transition"
                          >
                            Lưu
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteHomework(subjectKey, homework.id)}
                          className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold text-xs sm:text-sm transition"
                        >
                          Xoá
                        </button>
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
  )
}

export default HomeworkSection


