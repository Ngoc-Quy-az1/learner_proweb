import React, { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { Plus, ChevronUp, ChevronDown, Upload, Loader2 } from 'lucide-react'

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
    files: FileList | null
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

  // Track original values to detect changes
  const originalValuesRef = useRef<Record<string, Partial<HomeworkItem>>>({})

  // Initialize original values when items first appear (chỉ lưu lần đầu, không overwrite khi user thay đổi)
  useEffect(() => {
    homeworkItems.forEach((item) => {
      const key = item.id
      // Chỉ lưu original values nếu chưa có (lần đầu tiên thấy item này)
      // Sau khi save, original values đã được cập nhật trong handleSave, nên không overwrite ở đây
      if (!originalValuesRef.current[key]) {
        // First time seeing this item, save original values
        originalValuesRef.current[key] = {
          task: item.task,
          deadline: item.deadline,
          assignmentUrl: item.assignmentUrl,
          studentSolutionFile: item.studentSolutionFile,
          tutorSolution: item.tutorSolution,
          difficulty: item.difficulty,
          result: item.result,
          note: item.note,
        }
      }
      // Nếu đã có original values, không overwrite (để giữ original values cho việc detect changes)
      // Sau khi save thành công, original values sẽ được cập nhật trong handleSave
    })
  }, [homeworkItems.map((item) => item.id).join(',')])

  // Helper to check if an item has changes
  const hasChanges = (homework: HomeworkItem): boolean => {
    const original = originalValuesRef.current[homework.id]
    // Nếu chưa có original values, không hiển thị nút Lưu (item mới sẽ có original values sau khi mount)
    if (!original) {
      return false
    }
    
    // So sánh từng field để phát hiện thay đổi
    const changed = (
      homework.task !== original.task ||
      homework.deadline !== original.deadline ||
      homework.assignmentUrl !== original.assignmentUrl ||
      homework.studentSolutionFile !== original.studentSolutionFile ||
      homework.tutorSolution !== original.tutorSolution ||
      homework.difficulty !== original.difficulty ||
      homework.result !== original.result ||
      homework.note !== original.note
    )
    
    return changed
  }

  // Handle save and reset tracking
  const handleSave = async (homeworkId: string) => {
    // Update original values to current values TRƯỚC khi save
    const current = homeworkItems.find((item) => item.id === homeworkId)
    if (current) {
      originalValuesRef.current[homeworkId] = {
        task: current.task,
        deadline: current.deadline,
        assignmentUrl: current.assignmentUrl,
        studentSolutionFile: current.studentSolutionFile,
        tutorSolution: current.tutorSolution,
        difficulty: current.difficulty,
        result: current.result,
        note: current.note,
      }
    }
    
    // Gọi API save (sau khi cập nhật original values, nếu user thay đổi tiếp thì hasChanges sẽ so sánh với original mới)
    await onSaveHomework(subjectKey, homeworkId)
  }

  const handleToggle = () => onToggleSection(sectionKey, !isExpanded)
  const handleAddHomework = () => {
    if (onAddHomework) {
      onAddHomework(subjectKey, scheduleId)
    }
  }

  return (
    <div className="rounded-2xl border-2 border-primary-50 bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-2">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center justify-between flex-1 text-2xl md:text-3xl font-bold text-gray-900 hover:text-primary-600 transition-colors min-w-0"
        >
          <h4 className="text-left">Bài tập về nhà</h4>
          {isExpanded ? <ChevronUp className="w-5 h-5 flex-shrink-0 ml-2" /> : <ChevronDown className="w-5 h-5 flex-shrink-0 ml-2" />}
        </button>

        {canEdit && isExpanded && (
          <button
            type="button"
            onClick={handleAddHomework}
            disabled={!scheduleId}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 disabled:opacity-50 transition flex-shrink-0"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Thêm bài tập</span>
          </button>
        )}
      </div>

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
                  ? format(new Date(homework.deadline), 'MM/dd/yyyy')
                  : 'mm/dd/yyyy'
                
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
                            onChange={(e) =>
                              onChangeField(subjectKey, homework.id, 'task', e.target.value)
                            }
                            className="w-full text-base sm:text-lg font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-200 p-0 rounded"
                            placeholder="Nhập tên bài tập"
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                          {/* Status - 3 trạng thái: Chưa làm, Đang làm, Đã hoàn thành */}
                          {canEdit ? (
                            <select
                              value={homework.result || 'not_done'}
                              onChange={(e) =>
                                onChangeField(
                                  subjectKey,
                                  homework.id,
                                  'result',
                                  e.target.value as HomeworkItem['result']
                                )
                              }
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
                              onChange={(e) =>
                                onChangeField(
                                  subjectKey,
                                  homework.id,
                                  'difficulty',
                                  e.target.value as HomeworkItem['difficulty']
                                )
                              }
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
                      <p className="text-sm sm:text-base text-gray-600">
                        Hạn nộp: {canEdit ? (
                          <input
                            type="date"
                            value={homework.deadline ? format(new Date(homework.deadline), 'yyyy-MM-dd') : ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                const date = new Date(e.target.value)
                                date.setHours(23, 59, 59)
                                onChangeField(subjectKey, homework.id, 'deadline', date.toISOString())
                              }
                            }}
                            className="text-sm sm:text-base text-gray-600 border-none bg-transparent focus:outline-none focus:ring-0 p-0"
                          />
                        ) : (
                          formattedDeadline
                        )}
                      </p>
                    </div>

                    {/* Body */}
                    <div className="px-4 sm:px-5 py-4 space-y-4">
                      {/* Upload Bài tập */}
                      {canEdit && !isStudentMode && onUploadFile && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          {homework.assignmentUrl ? (
                            <a
                              href={homework.assignmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs sm:text-sm text-primary-600 hover:underline flex-1 truncate break-all"
                              title={homework.assignmentUrl}
                            >
                              {homework.assignmentUrl}
                            </a>
                          ) : (
                            <span className="text-xs sm:text-sm text-gray-400 flex-1">Chưa có file bài tập</span>
                          )}
                          <label
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 ${
                              taskFileUploadingKey === `${homework.id}-assignmentUrl`
                                ? 'cursor-wait opacity-60'
                                : 'cursor-pointer hover:bg-primary-50'
                            }`}
                            title={
                              taskFileUploadingKey === `${homework.id}-assignmentUrl`
                                ? 'Đang upload...'
                                : 'Upload file bài tập'
                            }
                          >
                            {taskFileUploadingKey === `${homework.id}-assignmentUrl` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            <input
                              type="file"
                              className="hidden"
                              accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                              onChange={(e) => {
                                onUploadFile(homework.id, 'assignmentUrl', e.target.files)
                                e.target.value = ''
                              }}
                            />
                          </label>
                        </div>
                      )}

                      {/* Bài làm học sinh - Tutor chỉ xem và tải, không upload */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0">Bài làm HS:</label>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {homework.studentSolutionFile ? (
                            <a
                              href={homework.studentSolutionFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs sm:text-sm text-primary-600 hover:underline flex-1 truncate break-all"
                              title={homework.studentSolutionFile}
                            >
                              {homework.studentSolutionFile}
                            </a>
                          ) : (
                            <span className="text-xs sm:text-sm text-gray-400 flex-1">Chưa có bài làm</span>
                          )}
                        </div>
                      </div>

                      {/* Link Lời giải */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0">Lời giải:</label>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {canEdit ? (
                            <>
                              <input
                                type="text"
                                value={homework.tutorSolution || ''}
                                onChange={(e) =>
                                  onChangeField(subjectKey, homework.id, 'tutorSolution', e.target.value)
                                }
                                className="flex-1 text-xs sm:text-sm text-gray-700 px-2 sm:px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                placeholder="Dán link lời giải"
                              />
                              {onUploadFile && (
                                <label
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 ${
                                    taskFileUploadingKey === `${homework.id}-tutorSolution`
                                      ? 'cursor-wait opacity-60'
                                      : 'cursor-pointer hover:bg-primary-50'
                                  }`}
                                  title="Upload lời giải"
                                >
                                  {taskFileUploadingKey === `${homework.id}-tutorSolution` ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Upload className="w-3.5 h-3.5" />
                                  )}
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                    onChange={(e) => {
                                      onUploadFile(homework.id, 'tutorSolution', e.target.files)
                                      e.target.value = ''
                                    }}
                                  />
                                </label>
                              )}
                            </>
                          ) : (
                            <span className="text-xs sm:text-sm text-gray-700 flex-1 break-all">{homework.tutorSolution || '—'}</span>
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
                            onChange={(e) =>
                              onChangeField(subjectKey, homework.id, 'note', e.target.value)
                            }
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
                        {hasChanges(homework) && (
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


