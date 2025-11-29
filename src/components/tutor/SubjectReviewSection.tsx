import React, { useState } from 'react'
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import type { AssignmentApiItem } from '../../pages/TutorDashboard'

interface SubjectReviewSectionProps {
  title?: string
  assignments: AssignmentApiItem[]
  scheduleSubject?: string
  canEdit?: boolean
  loading?: boolean
  assignmentReviews: Record<string, any>
  assignmentReviewSaving?: Record<string, boolean>
  assignmentReviewDeleting?: Record<string, boolean>
  getAssignmentKey: (assignment: AssignmentApiItem, index: number) => string
  onChangeField: (assignmentKey: string, field: 'comment' | 'result', value: string | number) => void
  onSave: (assignmentKey: string) => void
  onDelete: (assignmentKey: string) => void
}

const SubjectReviewSection: React.FC<SubjectReviewSectionProps> = ({
  title = 'Đánh giá chung cho từng môn',
  assignments,
  scheduleSubject,
  canEdit = true,
  loading = false,
  assignmentReviews,
  assignmentReviewSaving,
  assignmentReviewDeleting,
  getAssignmentKey,
  onChangeField,
  onSave,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="rounded-2xl border-2 border-primary-50 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
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
        {loading && (
          <span className="text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải...
          </span>
        )}
      </div>
      {isExpanded &&
        (assignments.length === 0 ? (
          <div className="text-sm text-gray-500 italic">Chưa có checklist nào để đánh giá.</div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment, index) => {
              const assignmentKey = getAssignmentKey(assignment, index)
              const reviewState = assignmentReviews[assignmentKey] || { result: 0, comment: '' }
              const isSaving = !!assignmentReviewSaving?.[assignmentKey]
              const isDeleting = !!assignmentReviewDeleting?.[assignmentKey]
              const hasComment = !!(reviewState.comment && reviewState.comment.trim())

              return (
                <div
                  key={assignmentKey}
                  className="border border-gray-200 rounded-2xl bg-gray-50 p-5 space-y-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">
                        MÔN
                      </p>
                      <p className="text-lg md:text-xl font-bold text-gray-900">
                        {assignment.subject || scheduleSubject || 'Môn học'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 mt-2 md:mt-0">
                      {canEdit ? (
                        <>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => onSave(assignmentKey)}
                            className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition whitespace-nowrap shadow-sm"
                          >
                            {isSaving ? 'Đang lưu...' : 'Lưu nhận xét'}
                          </button>
                          {hasComment && (
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => onDelete(assignmentKey)}
                              className="px-4 py-2 rounded-full text-sm font-semibold text-red-600 bg-white border-2 border-red-200 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition whitespace-nowrap shadow-sm"
                            >
                              {isDeleting ? 'Đang xoá...' : 'Xoá'}
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Chỉ xem</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <textarea
                      value={reviewState.comment || ''}
                      onChange={(e) =>
                        onChangeField(assignmentKey, 'comment', e.target.value)
                      }
                      rows={3}
                      placeholder="Nhập đánh giá chung cho môn học..."
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm md:text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ))}
    </div>
  )
}

export default SubjectReviewSection


