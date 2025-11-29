import { FileText, Download, Upload, ChevronUp, ChevronDown } from 'lucide-react'

export interface TutorChecklistDetail {
  id: string
  lesson: string
  estimatedTime: string
  actualTime: string
  result: 'completed' | 'in_progress' | 'not_done' | 'incorrect'
  solution: string
  note: string
  uploadedFile?: string
  assignmentFileName?: string
}

interface DetailTableProps {
  items: TutorChecklistDetail[]
  onChange: (id: string, field: keyof TutorChecklistDetail, value: string) => void
}

export default function DetailTable({ items, onChange }: DetailTableProps) {
  if (items.length === 0) {
    return (
      <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
          <p className="text-sm font-semibold text-gray-900">Chi tiết bài tập</p>
          <div className="flex items-center space-x-2">
            <button className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              Upload bài làm
            </button>
            <button className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              Thêm bài tập
            </button>
          </div>
        </div>
        <div className="px-4 py-8 text-center text-sm text-gray-500">
          Chưa có chi tiết bài tập.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
        <p className="text-sm font-semibold text-gray-900">Chi tiết bài tập</p>
        <div className="flex items-center space-x-2">
          <button className="text-xs font-semibold text-primary-600 hover:text-primary-700">
            Upload bài làm
          </button>
          <button className="text-xs font-semibold text-primary-600 hover:text-primary-700">
            Thêm bài tập
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[1000px] w-full text-sm text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2 font-semibold min-w-[200px]">Bài tập</th>
              <th className="px-4 py-2 font-semibold min-w-[150px] whitespace-nowrap">Thời gian (ước/thực)</th>
              <th className="px-4 py-2 font-semibold min-w-[200px]">File bài tập</th>
              <th className="px-4 py-2 font-semibold min-w-[250px]">Upload bài làm</th>
              <th className="px-4 py-2 font-semibold min-w-[250px]">Lời giải</th>
              <th className="px-4 py-2 font-semibold min-w-[150px]">Kết quả</th>
              <th className="px-4 py-2 font-semibold min-w-[200px]">Nhiệm vụ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {items.map((detail) => (
              <tr key={detail.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 min-w-[200px]">
                  <input
                    type="text"
                    value={detail.lesson}
                    onChange={(e) => onChange(detail.id, 'lesson', e.target.value)}
                    className="font-semibold text-gray-900 w-full min-w-[180px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    placeholder="Nhập tên bài tập"
                  />
                </td>
                <td className="px-4 py-3 min-w-[150px] whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {/* Ước tính */}
                    <div className="flex flex-col items-center border border-gray-300 rounded bg-white">
                      <button
                        onClick={() => {
                          const current = parseInt(detail.estimatedTime.replace(/\D/g, '')) || 0
                          const newValue = current + 1
                          onChange(detail.id, 'estimatedTime', `${newValue} phút`)
                        }}
                        className="w-full px-1.5 py-0.5 hover:bg-gray-100 rounded-t border-b border-gray-200 transition-colors"
                      >
                        <ChevronUp className="w-3 h-3 text-gray-600 mx-auto" />
                      </button>
                      <div className="px-2 py-0.5 bg-white w-full text-center border-y border-gray-200 min-w-[24px]">
                        <span className="text-xs font-semibold text-gray-900">
                          {parseInt(detail.estimatedTime.replace(/\D/g, '')) || 0}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const current = parseInt(detail.estimatedTime.replace(/\D/g, '')) || 0
                          const newValue = Math.max(0, current - 1)
                          onChange(detail.id, 'estimatedTime', `${newValue} phút`)
                        }}
                        className="w-full px-1.5 py-0.5 hover:bg-gray-100 rounded-b border-t border-gray-200 transition-colors"
                      >
                        <ChevronDown className="w-3 h-3 text-gray-600 mx-auto" />
                      </button>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">/</span>
                    {/* Thực tế */}
                    <div className="flex flex-col items-center border border-gray-300 rounded bg-white">
                      <button
                        onClick={() => {
                          const current = parseInt(detail.actualTime.replace(/\D/g, '')) || 0
                          const newValue = current + 1
                          onChange(detail.id, 'actualTime', `${newValue} phút`)
                        }}
                        className="w-full px-1.5 py-0.5 hover:bg-gray-100 rounded-t border-b border-gray-200 transition-colors"
                      >
                        <ChevronUp className="w-3 h-3 text-gray-600 mx-auto" />
                      </button>
                      <div className="px-2 py-0.5 bg-white w-full text-center border-y border-gray-200 min-w-[24px]">
                        <span className="text-xs font-semibold text-gray-900">
                          {parseInt(detail.actualTime.replace(/\D/g, '')) || 0}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const current = parseInt(detail.actualTime.replace(/\D/g, '')) || 0
                          const newValue = Math.max(0, current - 1)
                          onChange(detail.id, 'actualTime', `${newValue} phút`)
                        }}
                        className="w-full px-1.5 py-0.5 hover:bg-gray-100 rounded-b border-t border-gray-200 transition-colors"
                      >
                        <ChevronDown className="w-3 h-3 text-gray-600 mx-auto" />
                      </button>
                    </div>
                    <span className="text-xs text-gray-500 font-medium ml-0.5">phút</span>
                  </div>
                </td>
                <td className="px-4 py-3 min-w-[200px]">
                  {detail.assignmentFileName ? (
                    <div className="flex items-center gap-2 text-blue-600">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-semibold truncate max-w-[150px]">{detail.assignmentFileName}</span>
                      <Download className="w-4 h-4 cursor-pointer hover:text-blue-700 flex-shrink-0" />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 min-w-[250px]">
                  {detail.uploadedFile ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText className="w-4 h-4 text-primary-600 flex-shrink-0" />
                      <span className="text-xs text-gray-700 break-all whitespace-normal">{detail.uploadedFile}</span>
                      <Download className="w-4 h-4 text-gray-500 hover:text-primary-600 cursor-pointer flex-shrink-0" />
                      <button className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 whitespace-nowrap flex-shrink-0">
                        Cập nhật
                      </button>
                    </div>
                  ) : (
                    <button className="text-primary-600 hover:text-primary-700 text-xs font-semibold flex items-center space-x-1 whitespace-nowrap">
                      <Upload className="w-3 h-3" />
                      <span>Tải bài làm</span>
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 min-w-[250px]">
                  <div className="space-y-2">
                    <textarea
                      value={detail.solution}
                      onChange={(e) => onChange(detail.id, 'solution', e.target.value)}
                      className="text-sm text-gray-700 w-full min-w-[220px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none bg-white"
                      rows={2}
                      placeholder="Nhập lời giải"
                    />
                    {detail.solution ? (
                      <button className="text-primary-600 hover:text-primary-700 text-xs font-semibold flex items-center space-x-1 whitespace-nowrap">
                        <Upload className="w-3 h-3" />
                        <span>Cập nhật</span>
                      </button>
                    ) : (
                      <button className="text-primary-600 hover:text-primary-700 text-xs font-semibold flex items-center space-x-1 whitespace-nowrap">
                        <Upload className="w-3 h-3" />
                        <span>Thêm lời giải</span>
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 min-w-[150px]">
                  <select
                    value={detail.result}
                    onChange={(e) => onChange(detail.id, 'result', e.target.value as TutorChecklistDetail['result'])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 cursor-pointer w-full ${
                      detail.result === 'completed'
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : detail.result === 'incorrect'
                          ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                          : detail.result === 'in_progress'
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
                <td className="px-4 py-3 min-w-[200px]">
                  <input
                    type="text"
                    value={detail.note}
                    onChange={(e) => onChange(detail.id, 'note', e.target.value)}
                    className="text-sm text-gray-700 w-full min-w-[180px] px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    placeholder="Nhập nhiệm vụ"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

