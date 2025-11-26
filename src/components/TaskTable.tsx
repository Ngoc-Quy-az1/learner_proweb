import { Calendar } from 'lucide-react'

export interface TaskItem {
  id: string
  task: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard' | 'advanced'
  deadline: string // Format: DD/MM
}

interface TaskTableProps {
  items: TaskItem[]
  onTaskClick?: (id: string) => void
}

export default function TaskTable({ items, onTaskClick }: TaskTableProps) {
  const getDifficultyDisplay = (difficulty: TaskItem['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return {
          text: 'Dễ',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
        }
      case 'medium':
        return {
          text: 'Trung bình',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
        }
      case 'hard':
        return {
          text: 'Khó',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-700',
        }
      default:
        return {
          text: 'Khá',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
        }
    }
  }

  const getSubjectBadgeColor = (subject: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      'Toán': { bg: 'bg-blue-500', text: 'text-white' },
      'Lý': { bg: 'bg-purple-500', text: 'text-white' },
      'Hóa': { bg: 'bg-green-500', text: 'text-white' },
      'Anh': { bg: 'bg-yellow-500', text: 'text-white' },
      'Văn': { bg: 'bg-red-500', text: 'text-white' },
    }
    return colors[subject] || { bg: 'bg-gray-500', text: 'text-white' }
  }

  if (items.length === 0) {
    return (
      <div className="card text-center py-12">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Chưa có nhiệm vụ nào</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-center py-3 px-4 font-bold text-gray-900 w-16">#</th>
              <th className="text-left py-3 px-4 font-bold text-gray-900">Nhiệm vụ</th>
              <th className="text-center py-3 px-4 font-bold text-gray-900">Môn</th>
              <th className="text-center py-3 px-4 font-bold text-gray-900">Mức độ</th>
              <th className="text-center py-3 px-4 font-bold text-gray-900">Hạn nộp</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const difficultyDisplay = getDifficultyDisplay(item.difficulty)
              const subjectBadge = getSubjectBadgeColor(item.subject)
              return (
                <tr
                  key={item.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    index === items.length - 1 ? 'border-b-0' : ''
                  }`}
                  onClick={() => onTaskClick?.(item.id)}
                >
                  <td className="py-4 px-4 text-center">
                    <span className="text-gray-700 font-medium">{index + 1}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-900 font-medium">{item.task}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`${subjectBadge.bg} ${subjectBadge.text} px-3 py-1 rounded-lg text-sm font-medium`}>
                      {item.subject}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`${difficultyDisplay.bgColor} ${difficultyDisplay.textColor} px-3 py-1 rounded-lg text-sm font-medium`}>
                      {difficultyDisplay.text}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="inline-flex items-center space-x-1 text-gray-700 font-medium">
                      <Calendar className="w-4 h-4" />
                      <span>{item.deadline}</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}















