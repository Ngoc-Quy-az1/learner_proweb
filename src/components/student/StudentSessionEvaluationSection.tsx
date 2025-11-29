import React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import StarRating from '../tutor/StarRating'

interface ScheduleReview {
  name: string
  rating: number
  comment: string
}

interface StudentSessionEvaluationSectionProps {
  title?: string
  scheduleId: string
  reviews: ScheduleReview[] | undefined
  isExpanded: boolean
  scheduleStatus?: 'upcoming' | 'in_progress' | 'completed'
  onToggle: () => void
  alwaysExpanded?: boolean
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

const StudentSessionEvaluationSection: React.FC<StudentSessionEvaluationSectionProps> = ({
  title = 'Đánh giá buổi học',
  scheduleId,
  reviews,
  isExpanded,
  scheduleStatus = 'upcoming',
  onToggle,
  alwaysExpanded = false,
}) => {
  const defaultReviews = getDefaultReviews()

  const currentReviews =
    reviews && reviews.length === defaultReviews.length
      ? reviews.map((review, idx) => ({
          ...review,
          name: defaultReviews[idx].name,
        }))
      : defaultReviews

  return (
    <div className="rounded-2xl border-2 border-primary-50 bg-white p-4 shadow-sm mt-4">
      <div className="flex items-center justify-between mb-4">
        {alwaysExpanded ? (
          <h4 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h4>
        ) : (
          <button
            onClick={onToggle}
            className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-gray-900 hover:text-primary-600 transition-colors"
          >
            <h4>{title}</h4>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      {isExpanded && (
        <>
          {scheduleStatus === 'upcoming' ? (
            <p className="text-sm text-gray-500 italic">
              Buổi học chưa diễn ra nên chưa có đánh giá.
            </p>
          ) : (
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
                      <p className="text-sm text-gray-700">
                        {normalizedReview.comment || criterion.defaultComment}
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <StarRating
                        value={normalizedReview.rating || 0}
                        readOnly={true}
                      />
                    </div>
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

export default StudentSessionEvaluationSection

