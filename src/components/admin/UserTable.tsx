import { User, ROLE_LABELS } from './types'

interface UserTableProps {
  users: User[]
  loading: boolean
  editUserId: string | null
  editData: Partial<User>
  onStartEdit: (user: User) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onUpdateField: (field: keyof User, value: string) => void
  onDelete: (userId: string) => void
  onResetPassword: (userId: string) => void
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalResults: number
  }
  onPageChange: (page: number) => void
}

export default function UserTable({
  users,
  loading,
  editUserId,
  editData,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onUpdateField,
  onDelete,
  onResetPassword,
  pagination,
  onPageChange,
}: UserTableProps) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tên người dùng</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Mật khẩu</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Vai trò</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Ngày tham gia</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isEditing = editUserId === user.id
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {isEditing ? (
                        <input
                          className="w-full min-w-[150px] h-9 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          value={editData.name ?? ''}
                          onChange={(e) => onUpdateField('name', e.target.value)}
                          placeholder="Nhập tên"
                        />
                      ) : (
                        user.name
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {isEditing ? (
                        <input
                          className="w-full min-w-[180px] h-9 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          value={editData.email ?? ''}
                          onChange={(e) => onUpdateField('email', e.target.value)}
                          placeholder="Nhập email"
                        />
                      ) : (
                        user.email
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {isEditing ? (
                        <input
                          type="password"
                          className="w-full min-w-[120px] h-9 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          value={editData.password ?? ''}
                          onChange={(e) => onUpdateField('password', e.target.value)}
                          placeholder="Nhập mật khẩu mới"
                        />
                      ) : (
                        <button
                          onClick={() => onResetPassword(user.id)}
                          className="text-xs text-gray-600 font-mono hover:text-gray-800 cursor-pointer"
                          title="Click để đổi mật khẩu"
                        >
                          *****
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {isEditing ? (
                        <select
                          className="w-full min-w-[150px] h-9 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          value={editData.role ?? 'student'}
                          onChange={(e) => onUpdateField('role', e.target.value)}
                        >
                          <option value="student">Học sinh / Phụ huynh</option>
                          <option value="tutor">Tutor</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        ROLE_LABELS[user.role]
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {isEditing ? (
                        <input
                          className="w-full min-w-[160px] h-9 px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          type="text"
                          value={editData.joinDate ?? ''}
                          onChange={(e) => {
                            let value = e.target.value
                            value = value.replace(/[^\d/]/g, '')
                            if (value.length > 2 && value[2] !== '/') {
                              value = value.slice(0, 2) + '/' + value.slice(2)
                            }
                            if (value.length > 5 && value[5] !== '/') {
                              value = value.slice(0, 5) + '/' + value.slice(5)
                            }
                            if (value.length <= 10) {
                              onUpdateField('joinDate', value)
                            }
                          }}
                          placeholder="dd/mm/yyyy"
                          pattern="\d{2}/\d{2}/\d{4}"
                        />
                      ) : (
                        user.joinDate || (user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A')
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center space-x-3">
                          <button onClick={onSaveEdit} className="text-primary-600 hover:text-primary-700 text-sm font-semibold">
                            Lưu
                          </button>
                          <button onClick={onCancelEdit} className="text-gray-500 hover:text-gray-700 text-sm font-semibold">
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <button onClick={() => onStartEdit(user)} className="text-primary-600 hover:text-primary-700 text-sm font-semibold">
                            Sửa
                          </button>
                          <button onClick={() => onDelete(user.id)} className="text-red-600 hover:text-red-700 text-sm font-semibold">
                            Xóa
                          </button>
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 text-sm text-gray-600">
        <p>
          {loading ? (
            'Đang tải...'
          ) : (
            `Hiển thị ${pagination.totalResults === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}-${Math.min(
              pagination.page * pagination.limit,
              pagination.totalResults
            )} trong tổng ${pagination.totalResults} tài khoản`
          )}
        </p>
        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          <button
            disabled={pagination.page === 1 || loading}
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold disabled:opacity-40"
          >
            Trước
          </button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: pagination.totalPages }, (_, idx) => (
              <button
                key={idx}
                onClick={() => onPageChange(idx + 1)}
                disabled={loading}
                className={`w-8 h-8 rounded-lg text-sm font-semibold ${
                  pagination.page === idx + 1
                    ? 'bg-primary-500 text-white'
                    : 'border border-gray-200 text-gray-600 hover:border-primary-200'
                } disabled:opacity-40`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <button
            disabled={pagination.page === pagination.totalPages || loading}
            onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      </div>
    </>
  )
}

