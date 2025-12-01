import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { AssignmentApiItem } from '../../pages/TutorDashboard'

interface StudentSubjectReviewSectionProps {
  title?: string
  assignments: AssignmentApiItem[]
  scheduleSubject?: string
  loading?: boolean
  assignmentReviews: Record<string, any>
  getAssignmentKey: (assignment: AssignmentApiItem, index: number) => string
  alwaysExpanded?: boolean
}

const StudentSubjectReviewSection: React.FC<StudentSubjectReviewSectionProps> = ({
  title = 'Đánh giá chung cho từng môn',
  assignments,
  scheduleSubject,
  loading = false,
  assignmentReviews,
  getAssignmentKey,
  alwaysExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(alwaysExpanded)

  return (
    <div className="rounded-2xl border-2 border-primary-50 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        {alwaysExpanded ? (
          <h4 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h4>
        ) : (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center justify-between w-full text-2xl md:text-3xl font-bold text-gray-900 hover:text-primary-600 transition-colors"
          >
            <h4 className="text-left">{title}</h4>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 flex-shrink-0 ml-2" />
            ) : (
              <ChevronDown className="w-5 h-5 flex-shrink-0 ml-2" />
            )}
          </button>
        )}
        {loading && (
          <span className="text-sm text-gray-500 ml-2 flex-shrink-0">Đang tải...</span>
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
                  </div>
                  <div className="space-y-2">
                    <div className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm md:text-base bg-white min-h-[80px]">
                      {hasComment ? (
                        <p className="text-gray-700 whitespace-pre-wrap">{reviewState.comment}</p>
                      ) : (
                        <p className="text-gray-400 italic">Chưa có đánh giá</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
    </div>
  )
}

export default StudentSubjectReviewSection

