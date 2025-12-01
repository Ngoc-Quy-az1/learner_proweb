import React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import StarRating from './StarRating'

interface ScheduleReview {
  name: string
  rating: number
  comment: string
}

interface SessionEvaluationSectionProps {
  title?: string
  scheduleId: string
  canEdit: boolean
  reviews: ScheduleReview[] | undefined
  isExpanded: boolean
  saving: boolean
  scheduleStatus?: 'upcoming' | 'in_progress' | 'completed'
  onToggle: () => void
  onSave: (reviews: ScheduleReview[]) => void
  onChangeReview: (index: number, field: 'rating' | 'comment', value: number | string) => void
}

const evaluationCriteria = [
  {
    name: 'Mức độ tập trung',
    description: 'Học sinh có duy trì sự chú ý suốt buổi học.',
    defaultComment: 'Cần tập trung hơn trong giờ học.',
  },
  {
    name: 'Hiểu nội dung bài học',
    description: 'Hiểu khái niệm, nắm được cách làm bài.',
    defaultComment: 'Cần củng cố lại kiến thức cơ bản.',
  },
  {
    name: 'Hoàn thành nhiệm vụ',
    description: 'Làm đủ, đúng thời gian và yêu cầu.',
    defaultComment: 'Cần hoàn thành đầy đủ bài tập.',
  },
  {
    name: 'Thái độ & tinh thần học',
    description: 'Chủ động hỏi, hợp tác, tôn trọng giờ học.',
    defaultComment: 'Cần tích cực hơn trong học tập.',
  },
  {
    name: 'Kỹ năng trình bày & tư duy',
    description: 'Trình bày rõ ràng, biết giải thích lại bài.',
    defaultComment: 'Cần rèn luyện thêm kỹ năng trình bày.',
  },
]

const getDefaultReviews = (): ScheduleReview[] =>
  evaluationCriteria.map((criterion) => ({
    name: criterion.name,
    rating: 0,
    comment: '',
  }))

const SessionEvaluationSection: React.FC<SessionEvaluationSectionProps> = ({
  title = 'Đánh giá buổi học',
  scheduleId,
  canEdit,
  reviews,
  isExpanded,
  saving,
  scheduleStatus = 'upcoming',
  onToggle,
  onSave,
  onChangeReview,
}) => {
  // Ẩn component nếu buổi học chưa bắt đầu
  if (scheduleStatus === 'upcoming') {
    return null
  }

  const defaultReviews = getDefaultReviews()

  const currentReviews =
    reviews && reviews.length === defaultReviews.length
      ? reviews.map((review, idx) => ({
          ...review,
          name: defaultReviews[idx].name,
        }))
      : defaultReviews

  const handleSaveClick = () => {
    onSave(currentReviews)
  }

  return (
    <div className="rounded-2xl border-2 border-primary-50 bg-white p-4 sm:p-6 shadow-sm mt-4">
      <div className="flex items-center justify-between mb-4 gap-2">
        <button
          onClick={onToggle}
          className="flex items-center justify-between flex-1 text-2xl md:text-3xl font-bold text-gray-900 hover:text-primary-600 transition-colors min-w-0"
        >
          <h4 className="text-left">{title}</h4>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 flex-shrink-0 ml-2" />
          ) : (
            <ChevronDown className="w-5 h-5 flex-shrink-0 ml-2" />
          )}
        </button>
        {isExpanded && canEdit && (
          <button
            onClick={handleSaveClick}
            disabled={saving}
            className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-base font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-md flex-shrink-0 whitespace-nowrap"
          >
            {saving ? 'Đang lưu...' : 'Lưu đánh giá'}
          </button>
        )}
      </div>
      {isExpanded && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {evaluationCriteria.map((criterion, index) => {
            const review = currentReviews[index] || {
              name: criterion.name,
              rating: 0,
              comment: '',
            }
            const normalizedReview = {
              ...review,
              name: criterion.name,
            }

            return (
              <div
                key={`${scheduleId}-${criterion.name}`}
                className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50"
              >
                <h5 className="text-lg font-bold text-gray-900 mb-1">
                  {criterion.name}
                </h5>
                <p className="text-sm text-gray-600 mb-3">
                  {criterion.description}
                </p>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-3 py-2 mb-3">
                  {canEdit ? (
                    <textarea
                      value={normalizedReview.comment || ''}
                      onChange={(e) =>
                        onChangeReview(index, 'comment', e.target.value)
                      }
                      className="w-full bg-transparent border-none outline-none text-sm text-gray-700 resize-none"
                      rows={3}
                      placeholder={criterion.defaultComment}
                    />
                  ) : (
                    <p className="text-sm text-gray-700">
                      {normalizedReview.comment || criterion.defaultComment}
                    </p>
                  )}
                </div>
                <div className="flex justify-center">
                  <StarRating
                    value={normalizedReview.rating || 0}
                    onChange={(val) =>
                      canEdit ? onChangeReview(index, 'rating', val) : undefined
                    }
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SessionEvaluationSection


