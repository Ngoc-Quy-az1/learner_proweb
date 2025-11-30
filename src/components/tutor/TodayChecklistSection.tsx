import React, { useState } from 'react'
import { Plus, Upload, Loader2, ChevronDown, ChevronUp, Layers, Clock, Folder, Lightbulb, Target, MessageCircle, PenTool } from 'lucide-react'
import type { AssignmentApiItem } from '../../pages/TutorDashboard'

type TodayAssignmentStatus = 'pending' | 'in-progress' | 'completed'

type TodayAssignmentTask = {
  id?: string
  name?: string
  description?: string
  status?: TodayAssignmentStatus
  note?: string
  estimatedTime?: number
  actualTime?: number
  assignmentUrl?: string
  answerURL?: string
  solutionUrl?: string
}

interface TodayChecklistSectionProps {
  title?: string
  assignments: AssignmentApiItem[]
  canEdit: boolean
  selectedStudentId: string
  selectedScheduleSubject?: string
  scheduleDate?: Date
  expandedAssignmentId: string | null
  editingAssignmentId: string | null
  assignmentDrafts: Record<string, TodayAssignmentTask[]>
  savingAssignmentId: string | null
  deletingAssignmentId: string | null
  taskFileUploadingKey: string | null
  onCollapseAssignment: (assignmentKey: string) => void
  onToggleEditAssignment: (assignmentKey: string, assignment: AssignmentApiItem) => void
  onDeleteAssignment: (assignment: AssignmentApiItem) => void
  onClearDraft: (assignmentKey: string) => void
  onAddTask: (assignmentKey: string, assignment: AssignmentApiItem) => void
  onChangeTaskField: (
    assignmentKey: string,
    taskIndex: number,
    field: keyof TodayAssignmentTask,
    value: string | number | null
  ) => void
  onAdjustTaskTime: (
    assignmentKey: string,
    taskIndex: number,
    field: 'estimatedTime' | 'actualTime',
    delta: number
  ) => void
  onUploadTaskFile: (
    assignmentKey: string,
    taskIndex: number,
    field: 'assignmentUrl' | 'answerURL' | 'solutionUrl',
    files: FileList | null
  ) => void
  isStudentMode?: boolean // Student can only upload answerURL and change status
  onStatusChange?: (assignmentKey: string, taskIndex: number, status: TodayAssignmentStatus) => void
}

const TodayChecklistSection: React.FC<TodayChecklistSectionProps> = ({
  title = 'Checklist hôm nay',
  assignments,
  canEdit,
  selectedStudentId,
  selectedScheduleSubject,
  scheduleDate,
  expandedAssignmentId,
  editingAssignmentId,
  assignmentDrafts,
  savingAssignmentId,
  deletingAssignmentId,
  taskFileUploadingKey,
  onCollapseAssignment,
  onToggleEditAssignment,
  onDeleteAssignment,
  onClearDraft,
  onAddTask,
  onChangeTaskField,
  onAdjustTaskTime,
  onUploadTaskFile,
  isStudentMode = false,
  onStatusChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const renderTimeInput = (
    value: number | undefined,
    placeholder: string,
    onChange: (nextValue: string) => void,
    onAdjustLocal: (delta: number) => void
  ) => (
    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 px-1 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
        placeholder={placeholder}
      />
      <div className="flex flex-col border-l border-gray-200">
        <button
          type="button"
          onClick={() => onAdjustLocal(1)}
          className="px-0.5 py-0 hover:bg-gray-100"
        >
          <span className="text-[10px] leading-none">▲</span>
        </button>
        <button
          type="button"
          onClick={() => onAdjustLocal(-1)}
          className="px-0.5 py-0 hover:bg-gray-100"
        >
          <span className="text-[10px] leading-none">▼</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="rounded-2xl border-2 border-primary-50 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-gray-900 hover:text-primary-600 transition-colors"
        >
          <h4>{title}</h4>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
        <span className="text-xs text-gray-500">
          {assignments.length > 0 && scheduleDate
            ? `${assignments.length} checklist cho buổi ${scheduleDate.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
              })}`
            : null}
        </span>
      </div>
      {isExpanded && assignments.length > 0 ? (
        <div className="space-y-4">
          {assignments.map((assignment, index) => {
            const assignmentKey =
              assignment.id ||
              assignment._id ||
              `${assignment.subject || 'subject'}-${selectedStudentId}-${index}`
            const isExpanded = expandedAssignmentId === assignmentKey
            const isEditing = editingAssignmentId === assignmentKey && canEdit
            const assignmentTasks = (assignment.tasks || []) as TodayAssignmentTask[]
            const displayTasks =
              isEditing && assignmentDrafts[assignmentKey]
                ? assignmentDrafts[assignmentKey]
                : assignmentTasks
            const summaryRows =
              displayTasks.length > 0
                ? displayTasks
                : [{ id: `${assignmentKey}-summary` } as TodayAssignmentTask]

            return (
              <div
                key={assignmentKey}
                className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50"
              >
                <div className="flex items-center px-5 py-4 gap-4">
                  <p className="text-2xl font-bold text-primary-600 uppercase tracking-wide whitespace-nowrap w-48 flex-shrink-0">
                    {assignment.subject || selectedScheduleSubject}
                  </p>
                  <div className="h-12 w-px bg-gray-300 flex-shrink-0"></div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <h5 className="text-base font-bold text-gray-900">
                      {assignment.name || 'Checklist'}
                    </h5>
                    {assignment.description && (
                      <p className="text-sm text-gray-600 italic line-clamp-1">
                        {assignment.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isExpanded ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onCollapseAssignment(assignmentKey)}
                          className="px-4 py-1.5 rounded-full text-sm font-semibold text-primary-600 bg-white border border-primary-200 hover:bg-primary-50 transition"
                        >
                          Thu gọn
                        </button>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => onToggleEditAssignment(assignmentKey, assignment)}
                              disabled={savingAssignmentId === assignmentKey}
                              className="px-4 py-1.5 rounded-full text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
                            >
                              {isEditing
                                ? savingAssignmentId === assignmentKey
                                  ? 'Đang lưu...'
                                  : 'Lưu'
                                : 'Chỉnh sửa'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteAssignment(assignment)}
                              disabled={deletingAssignmentId === (assignment._id || assignment.id)}
                              className="px-4 py-1.5 rounded-full text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
                            >
                              {deletingAssignmentId === (assignment._id || assignment.id)
                                ? 'Đang xoá...'
                                : 'Xoá'}
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            // Toggle expansion - onCollapseAssignment handles the toggle logic
                            onCollapseAssignment(assignmentKey)
                            onClearDraft(assignmentKey)
                          }}
                          className="px-4 py-1.5 rounded-full text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 transition"
                        >
                          Chi tiết
                        </button>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => onDeleteAssignment(assignment)}
                            disabled={deletingAssignmentId === (assignment._id || assignment.id)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-60 disabled:cursor-not-allowed transition"
                          >
                            {deletingAssignmentId === (assignment._id || assignment.id)
                              ? 'Đang xoá...'
                              : 'Xoá'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="p-5 space-y-8 bg-white">
                    {/* Bảng tóm tắt */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">
                        Bảng tóm tắt
                      </p>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => onAddTask(assignmentKey, assignment)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 transition"
                        >
                          <Plus className="w-4 h-4" />
                          Thêm bài tập
                        </button>
                      )}
                    </div>
                    <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-sm overflow-x-auto scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-gray-100">
                      <table className="w-full text-base border-collapse min-w-[800px]">
                        <thead className="bg-purple-50 text-gray-700 uppercase text-sm md:text-base tracking-[0.3em] font-semibold">
                          <tr>
                            <th className="px-5 py-3 text-center font-semibold border-b-2 border-gray-200">
                              <div className="flex items-center justify-center gap-2">
                                <Layers className="w-5 h-5" />
                                Bài học
                              </div>
                            </th>
                            <th className="px-5 py-3 text-center font-semibold border-b-2 border-gray-200">
                              <div className="flex items-center justify-center gap-2">
                                <PenTool className="w-5 h-5" />
                                Nhiệm vụ
                              </div>
                            </th>
                            <th className="px-5 py-3 text-center font-semibold border-b-2 border-gray-200">
                              <div className="flex items-center justify-center gap-2">
                                <Clock className="w-5 h-5" />
                                Trạng thái
                              </div>
                            </th>
                            <th className="px-5 py-3 text-center font-semibold border-b-2 border-gray-200">
                              <div className="flex items-center justify-center gap-2">
                                <Lightbulb className="w-5 h-5" />
                                Nhận xét
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {summaryRows.map((task, taskIndex) => {
                            const rowLesson = task.name || assignment.name || '—'
                            const rowMission = task.description || assignment.description || '—'
                            const rowStatus = (task.status as TodayAssignmentStatus) || 'pending'
                            const rowChip =
                              rowStatus === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : rowStatus === 'in-progress'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                            // Nhận xét: chỉ lấy từ task.note
                            const rowNote = task.note || '—'
                            const stableKey = task.id || `${assignmentKey}-summary-${taskIndex}`
                            return (
                              <tr key={stableKey}>
                                <td className="px-5 py-4 font-semibold text-gray-900 text-center text-lg">
                                  {isEditing ? (
                                    <input
                                      value={task.name || ''}
                                      onChange={(e) =>
                                        onChangeTaskField(
                                          assignmentKey,
                                          taskIndex,
                                          'name',
                                          e.target.value
                                        )
                                      }
                                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                      placeholder="Nhập tên bài học"
                                    />
                                  ) : (
                                    rowLesson
                                  )}
                                </td>
                                <td className="px-5 py-4 text-gray-700 text-center text-base">
                                  {isEditing ? (
                                    <textarea
                                      value={task.description || ''}
                                      onChange={(e) =>
                                        onChangeTaskField(
                                          assignmentKey,
                                          taskIndex,
                                          'description',
                                          e.target.value
                                        )
                                      }
                                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                      rows={2}
                                      placeholder="Nhập nhiệm vụ"
                                    />
                                  ) : (
                                    rowMission
                                  )}
                                </td>
                                <td className="px-5 py-4 text-center text-base">
                                  {isEditing ? (
                                    <select
                                      value={rowStatus}
                                      onChange={(e) =>
                                        onChangeTaskField(
                                          assignmentKey,
                                          taskIndex,
                                          'status',
                                          e.target.value as TodayAssignmentStatus
                                        )
                                      }
                                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                    >
                                      <option value="pending">Chưa xong</option>
                                      <option value="in-progress">Đang làm</option>
                                      <option value="completed">Đã xong</option>
                                    </select>
                                  ) : (
                                    <span
                                      className={`px-4 py-1.5 rounded-full text-xs font-semibold ${rowChip}`}
                                    >
                                      {rowStatus === 'completed'
                                        ? 'Đã xong'
                                        : rowStatus === 'in-progress'
                                          ? 'Đang làm'
                                          : 'CHƯA XONG'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-5 py-4 text-gray-600 text-center text-base">
                                  <div className="flex items-start gap-2">
                                    {isEditing ? (
                                      <textarea
                                        value={task.note || ''}
                                        onChange={(e) =>
                                          onChangeTaskField(
                                            assignmentKey,
                                            taskIndex,
                                            'note',
                                            e.target.value
                                          )
                                        }
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        rows={2}
                                        placeholder="Ghi chú"
                                      />
                                    ) : (
                                      <span className="flex-1">{rowNote}</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Bảng chi tiết */}
                    <div className="rounded-2xl border border-gray-200 overflow-x-auto bg-white shadow-sm scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-gray-100">
                      <table className="w-full text-base min-w-[900px]">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold uppercase text-xs tracking-[0.3em]">
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                Bài học
                              </div>
                            </th>
                            <th className="px-4 py-3 text-center font-semibold uppercase text-xs tracking-[0.3em]">
                              <div className="flex items-center justify-center gap-2">
                                <Clock className="w-4 h-4" />
                                Thời gian
                              </div>
                            </th>
                            <th className="px-4 py-3 text-center font-semibold uppercase text-xs tracking-[0.3em]">
                              <div className="flex items-center justify-center gap-2">
                                <Folder className="w-4 h-4" />
                                File bài tập
                              </div>
                            </th>
                            <th className="px-4 py-3 text-center font-semibold uppercase text-xs tracking-[0.3em]">
                              <div className="flex items-center justify-center gap-2">
                                <Folder className="w-4 h-4" />
                                Bài làm học sinh
                              </div>
                            </th>
                            <th className="px-4 py-3 text-center font-semibold uppercase text-xs tracking-[0.3em]">
                              <div className="flex items-center justify-center gap-2">
                                <Lightbulb className="w-4 h-4" />
                                File lời giải
                              </div>
                            </th>
                            <th className="px-4 py-3 text-center font-semibold uppercase text-xs tracking-[0.3em]">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 flex items-center justify-center">
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                Trạng thái
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {displayTasks.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-4 py-4 text-center text-sm text-gray-500"
                              >
                                Chưa có nhiệm vụ nào trong checklist này.
                              </td>
                            </tr>
                          ) : (
                            displayTasks.map((task, taskIndex) => {
                              const taskStatus = (task.status as TodayAssignmentStatus) || 'pending'
                              const taskChipClass =
                                taskStatus === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : taskStatus === 'in-progress'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                              const stableKey = task.id || `${assignmentKey}-detail-${taskIndex}`
                              return (
                                <tr key={stableKey}>
                                  <td className="px-4 py-3 font-semibold text-gray-900">
                                    {isEditing ? (
                                      <input
                                        value={task.name || ''}
                                        onChange={(e) =>
                                          onChangeTaskField(
                                            assignmentKey,
                                            taskIndex,
                                            'name',
                                            e.target.value
                                          )
                                        }
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="Nhập tên bài học"
                                      />
                                    ) : (
                                      task.name || '—'
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-gray-700 text-center">
                                    {isEditing ? (
                                      <div className="flex items-center justify-center gap-1">
                                        {renderTimeInput(
                                          task.estimatedTime,
                                          'Ước',
                                          (value) =>
                                            onChangeTaskField(
                                              assignmentKey,
                                              taskIndex,
                                              'estimatedTime',
                                              value
                                            ),
                                          (delta) =>
                                            onAdjustTaskTime(
                                              assignmentKey,
                                              taskIndex,
                                              'estimatedTime',
                                              delta
                                            )
                                        )}
                                        <span className="text-xs">/</span>
                                        {renderTimeInput(
                                          task.actualTime,
                                          'Thực',
                                          (value) =>
                                            onChangeTaskField(
                                              assignmentKey,
                                              taskIndex,
                                              'actualTime',
                                              value
                                            ),
                                          (delta) =>
                                            onAdjustTaskTime(
                                              assignmentKey,
                                              taskIndex,
                                              'actualTime',
                                              delta
                                            )
                                        )}
                                      </div>
                                    ) : (
                                      <span className="whitespace-nowrap">
                                        {task.estimatedTime ? `${task.estimatedTime}'` : '—'} /{' '}
                                        {task.actualTime ? `${task.actualTime}'` : '—'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {isEditing && !isStudentMode ? (
                                      <div className="flex items-center justify-center gap-2 min-w-0">
                                        <input
                                          value={task.assignmentUrl || ''}
                                          onChange={(e) =>
                                            onChangeTaskField(
                                              assignmentKey,
                                              taskIndex,
                                              'assignmentUrl',
                                              e.target.value
                                            )
                                          }
                                          className="w-24 max-w-[140px] border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 truncate"
                                          placeholder="Link file bài tập"
                                          title={task.assignmentUrl || ''}
                                        />
                                        <label
                                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 ${
                                            taskFileUploadingKey ===
                                            `${assignmentKey}-${taskIndex}-assignmentUrl`
                                              ? 'cursor-wait opacity-60'
                                              : 'cursor-pointer hover:bg-primary-50'
                                          }`}
                                          title={
                                            taskFileUploadingKey ===
                                            `${assignmentKey}-${taskIndex}-assignmentUrl`
                                              ? 'Đang upload...'
                                              : 'Upload tài liệu'
                                          }
                                        >
                                          {taskFileUploadingKey ===
                                          `${assignmentKey}-${taskIndex}-assignmentUrl` ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Upload className="w-3.5 h-3.5" />
                                          )}
                                          <input
                                            type="file"
                                            className="hidden"
                                            accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                            onChange={(e) => {
                                              onUploadTaskFile(
                                                assignmentKey,
                                                taskIndex,
                                                'assignmentUrl',
                                                e.target.files
                                              )
                                              e.target.value = ''
                                            }}
                                          />
                                        </label>
                                      </div>
                                    ) : task.assignmentUrl ? (
                                      <a
                                        href={task.assignmentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block text-primary-600 hover:underline text-xs font-medium"
                                        title={task.assignmentUrl}
                                      >
                                        Xem file
                                      </a>
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {isStudentMode && !task.answerURL ? (
                                      <label
                                        className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-primary-300 text-primary-600 text-xs ${
                                          taskFileUploadingKey ===
                                          `${assignmentKey}-${taskIndex}-answerURL`
                                            ? 'cursor-wait opacity-60'
                                            : 'cursor-pointer hover:bg-primary-50'
                                        }`}
                                        title={
                                          taskFileUploadingKey ===
                                          `${assignmentKey}-${taskIndex}-answerURL`
                                            ? 'Đang upload...'
                                            : 'Upload bài làm'
                                        }
                                      >
                                        {taskFileUploadingKey ===
                                        `${assignmentKey}-${taskIndex}-answerURL` ? (
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
                                            onUploadTaskFile(
                                              assignmentKey,
                                              taskIndex,
                                              'answerURL',
                                              e.target.files
                                            )
                                            e.target.value = ''
                                          }}
                                        />
                                      </label>
                                    ) : isEditing && !isStudentMode ? (
                                      <div className="flex items-center justify-center gap-2 min-w-0">
                                        <input
                                          value={task.answerURL || ''}
                                          onChange={(e) =>
                                            onChangeTaskField(
                                              assignmentKey,
                                              taskIndex,
                                              'answerURL',
                                              e.target.value
                                            )
                                          }
                                          className="w-24 max-w-[140px] border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 truncate"
                                          placeholder="Link bài làm"
                                          title={task.answerURL || ''}
                                        />
                                        <label
                                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 ${
                                            taskFileUploadingKey ===
                                            `${assignmentKey}-${taskIndex}-answerURL`
                                              ? 'cursor-wait opacity-60'
                                              : 'cursor-pointer hover:bg-primary-50'
                                          }`}
                                          title={
                                            taskFileUploadingKey ===
                                            `${assignmentKey}-${taskIndex}-answerURL`
                                              ? 'Đang upload...'
                                              : 'Upload bài làm'
                                          }
                                        >
                                          {taskFileUploadingKey ===
                                          `${assignmentKey}-${taskIndex}-answerURL` ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Upload className="w-3.5 h-3.5" />
                                          )}
                                          <input
                                            type="file"
                                            className="hidden"
                                            accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                            onChange={(e) => {
                                              onUploadTaskFile(
                                                assignmentKey,
                                                taskIndex,
                                                'answerURL',
                                                e.target.files
                                              )
                                              e.target.value = ''
                                            }}
                                          />
                                        </label>
                                      </div>
                                    ) : task.answerURL ? (
                                      <a
                                        href={task.answerURL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block text-primary-600 hover:underline text-xs font-medium"
                                        title={task.answerURL}
                                      >
                                        Bài làm học sinh
                                      </a>
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {isEditing && !isStudentMode ? (
                                      <div className="flex items-center justify-center gap-2 min-w-0">
                                        <input
                                          value={task.solutionUrl || ''}
                                          onChange={(e) =>
                                            onChangeTaskField(
                                              assignmentKey,
                                              taskIndex,
                                              'solutionUrl',
                                              e.target.value
                                            )
                                          }
                                          className="w-24 max-w-[140px] border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 truncate"
                                          placeholder="Link lời giải"
                                          title={task.solutionUrl || ''}
                                        />
                                        <label
                                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-primary-300 text-primary-600 flex-shrink-0 ${
                                            taskFileUploadingKey ===
                                            `${assignmentKey}-${taskIndex}-solutionUrl`
                                              ? 'cursor-wait opacity-60'
                                              : 'cursor-pointer hover:bg-primary-50'
                                          }`}
                                          title={
                                            taskFileUploadingKey ===
                                            `${assignmentKey}-${taskIndex}-solutionUrl`
                                              ? 'Đang upload...'
                                              : 'Upload lời giải'
                                          }
                                        >
                                          {taskFileUploadingKey ===
                                          `${assignmentKey}-${taskIndex}-solutionUrl` ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Upload className="w-3.5 h-3.5" />
                                          )}
                                          <input
                                            type="file"
                                            className="hidden"
                                            accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                            onChange={(e) => {
                                              onUploadTaskFile(
                                                assignmentKey,
                                                taskIndex,
                                                'solutionUrl',
                                                e.target.files
                                              )
                                              e.target.value = ''
                                            }}
                                          />
                                        </label>
                                      </div>
                                    ) : task.solutionUrl ? (
                                      <a
                                        href={task.solutionUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block text-primary-600 hover:underline text-xs font-medium"
                                        title={task.solutionUrl}
                                      >
                                        File lời giải
                                      </a>
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {(isEditing || isStudentMode) ? (
                                      <select
                                        value={taskStatus}
                                        onChange={(e) => {
                                          const newStatus = e.target.value as TodayAssignmentStatus
                                          if (isStudentMode && onStatusChange) {
                                            onStatusChange(assignmentKey, taskIndex, newStatus)
                                          } else {
                                            onChangeTaskField(
                                              assignmentKey,
                                              taskIndex,
                                              'status',
                                              newStatus
                                            )
                                          }
                                        }}
                                        className="mx-auto border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                                      >
                                        <option value="pending">Chưa xong</option>
                                        <option value="in-progress">Đang làm</option>
                                        <option value="completed">Đã xong</option>
                                      </select>
                                    ) : (
                                      <div className="flex justify-center">
                                        <span
                                          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap inline-block ${taskChipClass}`}
                                        >
                                          {taskStatus === 'completed'
                                            ? 'Đã xong'
                                            : taskStatus === 'in-progress'
                                              ? 'Đang làm'
                                              : 'Chưa xong'}
                                        </span>
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
                )}
              </div>
            )
          })}
        </div>
      ) : isExpanded ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Chưa có checklist nào cho buổi học này</p>
          {/* Nút tạo checklist nằm ở phần thông tin nhanh bên trên, không đặt ở đây */}
        </div>
      ) : null}
    </div>
  )
}

export default TodayChecklistSection


