import { Plus, FileText, Download, Upload } from 'lucide-react'

interface HomeworkItem {
  id: string
  task: string
  deadline: string
  studentSolutionFile?: string
  tutorSolution?: string
  difficulty: 'easy' | 'medium' | 'hard'
  result: 'completed' | 'in_progress' | 'not_done' | 'incorrect'
  note: string
}

interface HomeworkTableProps {
  items: HomeworkItem[]
  onAdd: () => void
  onChange: (id: string, field: keyof HomeworkItem, value: string | 'easy' | 'medium' | 'hard' | 'completed' | 'in_progress' | 'not_done' | 'incorrect') => void
  onDelete: (id: string) => void
}

export default function HomeworkTable({ items, onAdd, onChange, onDelete }: HomeworkTableProps) {
  return (
    <div className="mt-4 bg-white rounded-xl border-2 border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">Giao bài tập về nhà</h3>
        <button
          onClick={onAdd}
          className="btn-primary flex items-center space-x-1 text-xs px-3 py-1.5"
        >
          <Plus className="w-3 h-3" />
          <span>Thêm bài tập</span>
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">Chưa có bài tập về nhà</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1400px] w-full text-sm text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 font-semibold min-w-[200px]">Bài tập</th>
                <th className="px-4 py-2 font-semibold min-w-[180px] whitespace-nowrap">Deadline</th>
                <th className="px-4 py-2 font-semibold min-w-[200px]">File lời giải học sinh</th>
                <th className="px-4 py-2 font-semibold min-w-[200px]">Lời giải của tutor</th>
                <th className="px-4 py-2 font-semibold min-w-[120px]">Mức độ</th>
                <th className="px-4 py-2 font-semibold min-w-[130px]">Kết quả</th>
                <th className="px-4 py-2 font-semibold min-w-[180px]">Nhận xét</th>
                <th className="px-4 py-2 font-semibold min-w-[80px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {items.map((homework) => (
                <tr key={homework.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 min-w-[200px]">
                    <input
                      type="text"
                      value={homework.task}
                      onChange={(e) => onChange(homework.id, 'task', e.target.value)}
                      className="font-semibold text-gray-900 w-full min-w-[180px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
                      placeholder="Nhập tên bài tập"
                    />
                  </td>
                  <td className="px-4 py-3 min-w-[180px] whitespace-nowrap">
                    <input
                      type="datetime-local"
                      value={homework.deadline || ''}
                      onChange={(e) => onChange(homework.id, 'deadline', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm text-gray-700"
                    />
                  </td>
                  <td className="px-4 py-3 min-w-[200px]">
                    {homework.studentSolutionFile ? (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary-600 flex-shrink-0" />
                        <span className="text-xs text-gray-700 break-all whitespace-normal flex-1">{homework.studentSolutionFile}</span>
                        <Download className="w-4 h-4 text-gray-500 hover:text-primary-600 cursor-pointer flex-shrink-0" />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">Chưa có file</span>
                    )}
                  </td>
                  <td className="px-4 py-3 min-w-[200px]">
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={homework.tutorSolution || ''}
                        onChange={(e) => onChange(homework.id, 'tutorSolution', e.target.value)}
                        className="text-sm text-gray-700 w-full min-w-[180px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                        placeholder="Nhập tên file hoặc text"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = '.pdf,.doc,.docx,.txt'
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0]
                              if (file) {
                                onChange(homework.id, 'tutorSolution', file.name)
                              }
                            }
                            input.click()
                          }}
                          className="text-xs px-3 py-1.5 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 whitespace-nowrap flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload file</span>
                        </button>
                        {homework.tutorSolution && (
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <Download className="w-4 h-4 text-gray-500 hover:text-primary-600 cursor-pointer flex-shrink-0" />
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 min-w-[120px]">
                    <select
                      value={homework.difficulty}
                      onChange={(e) => onChange(homework.id, 'difficulty', e.target.value as 'easy' | 'medium' | 'hard')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 cursor-pointer w-full ${
                        homework.difficulty === 'easy'
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : homework.difficulty === 'medium'
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                            : 'bg-red-100 text-red-700 border-red-300'
                      } focus:ring-2 focus:ring-primary-500`}
                    >
                      <option value="easy">Dễ</option>
                      <option value="medium">Trung bình</option>
                      <option value="hard">Khó</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 min-w-[130px]">
                    <select
                      value={homework.result}
                      onChange={(e) => onChange(homework.id, 'result', e.target.value as 'completed' | 'in_progress' | 'not_done' | 'incorrect')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 cursor-pointer w-full ${
                        homework.result === 'completed'
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : homework.result === 'incorrect'
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                            : homework.result === 'in_progress'
                              ? 'bg-blue-100 text-blue-700 border-blue-300'
                              : 'bg-red-100 text-red-600 border-red-300'
                      } focus:ring-2 focus:ring-primary-500`}
                    >
                      <option value="completed">Hoàn thành</option>
                      <option value="incorrect">Chưa chính xác</option>
                      <option value="in_progress">Đang làm</option>
                      <option value="not_done">Chưa xong</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 min-w-[180px]">
                    <input
                      type="text"
                      value={homework.note}
                      onChange={(e) => onChange(homework.id, 'note', e.target.value)}
                      className="text-sm text-gray-700 w-full min-w-[160px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                      placeholder="Nhập nhận xét"
                    />
                  </td>
                  <td className="px-4 py-3 min-w-[80px]">
                    <button
                      onClick={() => onDelete(homework.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-semibold"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

