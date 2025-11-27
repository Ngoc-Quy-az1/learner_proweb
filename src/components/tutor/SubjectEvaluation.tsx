import StarRating from './StarRating'

interface SubjectEvaluation {
  concentration: number
  understanding: number
  taskCompletion: number
  attitude: number
  presentation: number
  generalComment: string
}

interface SubjectEvaluationProps {
  evaluation: SubjectEvaluation
  subject: string
  onChange: (field: keyof SubjectEvaluation, value: number | string) => void
}

export default function SubjectEvaluationComponent({ evaluation, subject, onChange }: SubjectEvaluationProps) {
  const evaluationCriteria = [
    {
      key: 'concentration' as const,
      title: 'Mức độ tập trung',
      description: 'Học sinh có duy trì sự chú ý suốt buổi học.',
      feedback: evaluation.concentration < 3 ? 'Cần tập trung hơn trong giờ học.' : evaluation.concentration < 4 ? 'Tập trung tốt, đôi khi mất tập trung.' : 'Tập trung rất tốt trong suốt buổi học.'
    },
    {
      key: 'understanding' as const,
      title: 'Hiểu nội dung bài học',
      description: 'Hiểu khái niệm, nắm được cách làm bài.',
      feedback: evaluation.understanding < 3 ? 'Cần củng cố lại kiến thức cơ bản.' : evaluation.understanding < 4 ? 'Hiểu phần cơ bản, cần thực hành thêm.' : 'Hiểu rõ và vận dụng tốt kiến thức.'
    },
    {
      key: 'taskCompletion' as const,
      title: 'Hoàn thành nhiệm vụ',
      description: 'Làm đủ, đúng thời gian và yêu cầu.',
      feedback: evaluation.taskCompletion < 3 ? 'Cần hoàn thành đầy đủ bài tập.' : evaluation.taskCompletion < 4 ? 'Hoàn thành phần lớn bài tập.' : 'Hoàn thành xuất sắc mọi nhiệm vụ.'
    },
    {
      key: 'attitude' as const,
      title: 'Thái độ & tinh thần học',
      description: 'Chủ động hỏi, hợp tác, tôn trọng giờ học.',
      feedback: evaluation.attitude < 3 ? 'Cần tích cực hơn trong học tập.' : evaluation.attitude < 4 ? 'Thái độ tích cực, cần chủ động hơn.' : 'Thái độ rất tích cực và chủ động.'
    },
    {
      key: 'presentation' as const,
      title: 'Kỹ năng trình bày & tư duy',
      description: 'Trình bày rõ ràng, biết giải thích lại bài.',
      feedback: evaluation.presentation < 3 ? 'Cần rèn luyện thêm kỹ năng trình bày.' : evaluation.presentation < 4 ? 'Trình bày tốt, cần cải thiện phần giải thích.' : 'Trình bày rõ ràng và logic.'
    }
  ]

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-4 space-y-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3">{subject === 'general' ? 'Đánh giá chi tiết' : 'Đánh giá chi tiết môn học'}</h3>
      {evaluationCriteria.map((criterion) => (
        <div key={criterion.key} className="border-b border-gray-100 pb-4 last:border-b-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">{criterion.title}</h4>
              <p className="text-xs text-gray-600 mb-2">{criterion.description}</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-2">
                <p className="text-xs text-gray-700">{criterion.feedback}</p>
              </div>
            </div>
            <div className="ml-4">
              <StarRating
                value={evaluation[criterion.key]}
                onChange={(val) => onChange(criterion.key, val)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

