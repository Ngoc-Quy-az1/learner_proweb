import React from 'react'
import { format } from 'date-fns'
import { Plus, ChevronUp, ChevronDown, FileText, Download, Upload, Loader2 } from 'lucide-react'

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

  const handleToggle = () => onToggleSection(sectionKey, !isExpanded)
  const handleAddHomework = () => {
    if (onAddHomework) {
      onAddHomework(subjectKey, scheduleId)
    }
  }

  return (
    <div className="rounded-2xl border-2 border-primary-50 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-gray-900 hover:text-primary-600 transition-colors"
        >
          <h4 className="text-inherit font-inherit">Bài tập về nhà</h4>
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {canEdit && isExpanded && (
          <button
            type="button"
            onClick={handleAddHomework}
            disabled={!scheduleId}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 disabled:opacity-50 transition"
          >
            <Plus className="w-4 h-4" />
            Thêm bài tập
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
            <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-gray-100">
              <table className="min-w-[1200px] w-full text-sm border-collapse table-fixed">
                <colgroup>
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold uppercase text-xs tracking-[0.3em] border-b-2 border-gray-200">
                      Bài tập
                    </th>
                    <th className="px-4 py-3 text-left font-semibold uppercase text-xs tracking-[0.3em] border-b-2 border-gray-200">
                      Deadline
                    </th>
                    <th className="px-4 py-3 text-left font-semibold uppercase text-xs tracking-[0.3em] border-b-2 border-gray-200">
                      Bài tập
                    </th>
                    <th className="px-4 py-3 text-left font-semibold uppercase text-xs tracking-[0.3em] border-b-2 border-gray-200">
                      Bài làm học sinh
                    </th>
                    <th className="px-4 py-3 text-left font-semibold uppercase text-xs tracking-[0.3em] border-b-2 border-gray-200">
                      Lời giải
                    </th>
                    <th className="px-4 py-3 text-left font-semibold uppercase text-xs tracking-[0.3em] border-b-2 border-gray-200">
                      Mức độ
                    </th>
                    <th className="px-4 py-3 text-left font-semibold uppercase text-xs tracking-[0.3em] border-b-2 border-gray-200">
                      Nhận xét
                    </th>
                    <th className="px-4 py-3 text-center font-semibold uppercase text-xs tracking-[0.3em] border-b-2 border-gray-200">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {homeworkItems.map((homework) => (
                    <tr key={homework.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {canEdit ? (
                          <input
                            type="text"
                            value={homework.task}
                            onChange={(e) =>
                              onChangeField(subjectKey, homework.id, 'task', e.target.value)
                            }
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-semibold text-gray-900"
                            placeholder="Nhập tên bài tập"
                          />
                        ) : (
                          <span className="font-semibold text-gray-900">{homework.task}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canEdit ? (
                          <input
                            type="datetime-local"
                            value={homework.deadline || ''}
                            onChange={(e) =>
                              onChangeField(subjectKey, homework.id, 'deadline', e.target.value)
                            }
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        ) : (
                          <span className="text-sm text-gray-700">
                            {homework.deadline
                              ? format(new Date(homework.deadline), 'dd/MM/yyyy HH:mm')
                              : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {homework.assignmentUrl ? (
                          <div className="flex items-start gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <a
                                href={homework.assignmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:underline text-xs break-all block"
                                title={homework.assignmentUrl}
                              >
                                {homework.assignmentUrl}
                              </a>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Download className="w-4 h-4 text-gray-500 hover:text-primary-600 cursor-pointer" />
                              {canEdit && !isStudentMode && onUploadFile && (
                                <label
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 ${
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
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Upload className="w-3.5 h-3.5" />
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
                              )}
                            </div>
                          </div>
                        ) : (
                          canEdit &&
                          !isStudentMode &&
                          onUploadFile && (
                            <div className="flex items-center justify-start">
                              <label
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 ${
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
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5" />
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
                          )
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {homework.studentSolutionFile ? (
                          <div className="flex items-start gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <a
                                href={homework.studentSolutionFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:underline text-xs break-all block"
                                title={homework.studentSolutionFile}
                              >
                                {homework.studentSolutionFile}
                              </a>
                            </div>
                            <Download className="w-4 h-4 text-gray-500 hover:text-primary-600 cursor-pointer flex-shrink-0" />
                            {isStudentMode && onUploadFile && (
                              <label
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 ${
                                  taskFileUploadingKey === `${homework.id}-studentSolutionFile`
                                    ? 'cursor-wait opacity-60'
                                    : 'cursor-pointer hover:bg-primary-50'
                                }`}
                                title={
                                  taskFileUploadingKey === `${homework.id}-studentSolutionFile`
                                    ? 'Đang upload...'
                                    : 'Upload lại bài làm'
                                }
                              >
                                {taskFileUploadingKey === `${homework.id}-studentSolutionFile` ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5" />
                                )}
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                  onChange={(e) => {
                                    onUploadFile(homework.id, 'studentSolutionFile', e.target.files)
                                    e.target.value = ''
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        ) : (
                          <>
                            {isStudentMode && onUploadFile ? (
                              <label
                                className={`inline-flex items-center justify-center px-3 py-2 rounded-lg border border-primary-300 text-primary-600 text-xs ${
                                  taskFileUploadingKey === `${homework.id}-studentSolutionFile`
                                    ? 'cursor-wait opacity-60'
                                    : 'cursor-pointer hover:bg-primary-50'
                                }`}
                                title={
                                  taskFileUploadingKey === `${homework.id}-studentSolutionFile`
                                    ? 'Đang upload...'
                                    : 'Upload bài làm'
                                }
                              >
                                {taskFileUploadingKey === `${homework.id}-studentSolutionFile` ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5 mr-1" />
                                )}
                                Upload bài làm
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                  onChange={(e) => {
                                    onUploadFile(homework.id, 'studentSolutionFile', e.target.files)
                                    e.target.value = ''
                                  }}
                                />
                              </label>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {homework.tutorSolution ? (
                          <div className="flex items-start gap-2 min-w-0">
                            <div className="flex-1 min-w-0">
                              <a
                                href={homework.tutorSolution}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:underline text-xs break-all block"
                                title={homework.tutorSolution}
                              >
                                {homework.tutorSolution}
                              </a>
                            </div>
                            {canEdit && !isStudentMode && onUploadFile && (
                              <label
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 ${
                                  taskFileUploadingKey === `${homework.id}-tutorSolution`
                                    ? 'cursor-wait opacity-60'
                                    : 'cursor-pointer hover:bg-primary-50'
                                }`}
                                title={
                                  taskFileUploadingKey === `${homework.id}-tutorSolution`
                                    ? 'Đang upload...'
                                    : 'Upload lời giải'
                                }
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
                          </div>
                        ) : (
                          canEdit && (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={homework.tutorSolution || ''}
                                onChange={(e) =>
                                  onChangeField(subjectKey, homework.id, 'tutorSolution', e.target.value)
                                }
                                className="flex-1 text-sm text-gray-700 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                placeholder="Dán link lời giải"
                              />
                              {onUploadFile && (
                                <label
                                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 ${
                                    taskFileUploadingKey === `${homework.id}-tutorSolution`
                                      ? 'cursor-wait opacity-60'
                                      : 'cursor-pointer hover:bg-primary-50'
                                  }`}
                                  title={
                                    taskFileUploadingKey === `${homework.id}-tutorSolution`
                                      ? 'Đang upload...'
                                      : 'Upload lời giải'
                                  }
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
                            </div>
                          )
                        )}
                      </td>
                      <td className="px-4 py-3">
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
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                          >
                            <option value="easy">Dễ</option>
                            <option value="medium">Trung bình</option>
                            <option value="hard">Khó</option>
                          </select>
                        ) : (
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              homework.difficulty === 'easy'
                                ? 'bg-green-100 text-green-700'
                                : homework.difficulty === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {homework.difficulty === 'easy'
                              ? 'Dễ'
                              : homework.difficulty === 'medium'
                                ? 'Trung bình'
                                : 'Khó'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canEdit ? (
                          <input
                            type="text"
                            value={homework.note || ''}
                            onChange={(e) =>
                              onChangeField(subjectKey, homework.id, 'note', e.target.value)
                            }
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Nhận xét"
                          />
                        ) : (
                          <span className="text-sm text-gray-700">{homework.note || '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {canEdit && (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => onSaveHomework(subjectKey, homework.id)}
                              className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold transition"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={() => onDeleteHomework(subjectKey, homework.id)}
                              className="text-xs font-semibold text-red-500 hover:text-red-600 transition"
                            >
                              Xoá
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default HomeworkSection


