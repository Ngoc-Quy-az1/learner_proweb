import { useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { StatCard, AddUserForm, UserTable, ResetPasswordModal, User } from './index'
import { Users, GraduationCap, UserCog, Calendar } from 'lucide-react'
import { apiCall } from '../../config/api'

interface UserManagementSectionProps {
  stats: {
    total: number
    students: number
    tutors: number
    lessonsToday: number
  }
  statsLoading: boolean
  users: User[]
  usersLoading: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  roleFilter: 'all' | 'student' | 'tutor' | 'admin'
  onRoleFilterChange: (value: 'all' | 'student' | 'tutor' | 'admin') => void
  sortField: 'name' | 'email' | 'createdAt'
  onSortFieldChange: (field: 'name' | 'email' | 'createdAt') => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (order: 'asc' | 'desc') => void
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalResults: number
  }
  onPageChange: (page: number) => void
  onRefresh: () => void
}

interface NewUser {
  name: string
  email: string
  role: User['role']
  password: string
  avatar: File | null
  avatarUrl: string
}

const INITIAL_NEW_USER: NewUser = {
  name: '',
  email: '',
  role: 'student',
  password: '',
  avatar: null,
  avatarUrl: '',
}

export default function UserManagementSection({
  stats,
  statsLoading,
  users,
  usersLoading,
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  sortField,
  onSortFieldChange,
  sortOrder,
  onSortOrderChange,
  pagination,
  onPageChange,
  onRefresh,
}: UserManagementSectionProps) {
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [newUser, setNewUser] = useState<NewUser>(INITIAL_NEW_USER)
  const [editUserId, setEditUserId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<User>>({})
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const resetNewUser = () => {
    setNewUser(INITIAL_NEW_USER)
  }

  const handleAddUserSuccess = () => {
    resetNewUser()
    setIsAddingUser(false)
    onRefresh()
  }

  const startEditUser = (user: User) => {
    setEditUserId(user.id)
    let joinDateForInput = ''
    if (user.createdAt) {
      const date = new Date(user.createdAt)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      joinDateForInput = `${day}/${month}/${year}`
    } else if (user.joinDate) {
      const date = new Date(user.joinDate)
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        joinDateForInput = `${day}/${month}/${year}`
      }
    }
    setEditData({ ...user, joinDate: joinDateForInput })
  }

  const cancelEditUser = () => {
    setEditUserId(null)
    setEditData({})
  }

  const updateEditField = (field: keyof User, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleResetPassword = (userId: string) => {
    setResetPasswordUserId(userId)
    setNewPassword('')
  }

  const confirmResetPassword = async () => {
    if (!resetPasswordUserId || !newPassword.trim()) {
      alert('Vui lòng nhập mật khẩu mới')
      return
    }

    try {
      await apiCall(`/users/${resetPasswordUserId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          password: newPassword.trim(),
        }),
      })

      alert('Đã reset mật khẩu thành công')
      setResetPasswordUserId(null)
      setNewPassword('')
      onRefresh()
    } catch (error) {
      console.error('Error resetting password:', error)
      let errorMessage = 'Có lỗi xảy ra khi reset mật khẩu'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      alert(errorMessage)
    }
  }

  const saveEditUser = async () => {
    if (!editUserId) return
    const requiredFields: Array<keyof User> = ['name', 'email', 'role']
    const missing = requiredFields.some((field) => !editData[field])
    if (missing) {
      alert('Vui lòng điền đầy đủ thông tin trước khi lưu.')
      return
    }

    const originalUser = users.find((u) => u.id === editUserId)
    if (!originalUser) return

    const hasNameChange = editData.name !== originalUser.name
    const hasEmailChange = editData.email !== originalUser.email
    const hasPasswordChange = editData.password && editData.password.trim() && editData.password !== originalUser.password
    const hasRoleChange = editData.role !== originalUser.role

    if (!hasNameChange && !hasEmailChange && !hasPasswordChange && !hasRoleChange) {
      cancelEditUser()
      return
    }

    try {
      const updateBody: any = {
        name: editData.name,
        email: editData.email,
      }

      if (hasPasswordChange && editData.password && editData.password.trim()) {
        updateBody.password = editData.password.trim()
      }

      if (hasRoleChange) {
        updateBody.role = editData.role
      }

      await apiCall(`/users/${editUserId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateBody),
      })

      onRefresh()
      cancelEditUser()
      alert('Đã cập nhật thông tin thành công')
    } catch (error) {
      console.error('Error saving user:', error)
      let errorMessage = 'Có lỗi xảy ra khi cập nhật thông tin'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      alert(errorMessage)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return

    try {
      await apiCall(`/users/${userId}`, {
        method: 'DELETE',
      })
      alert('Đã xóa tài khoản thành công')
      onRefresh()
    } catch (error) {
      console.error('Error deleting user:', error)
      let errorMessage = 'Có lỗi xảy ra khi xóa tài khoản'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      alert(errorMessage)
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng số người dùng"
          value={statsLoading ? '...' : stats.total}
          icon={<Users className="w-7 h-7 text-white" />}
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard
          label="Số lượng học sinh"
          value={statsLoading ? '...' : stats.students}
          icon={<GraduationCap className="w-7 h-7 text-white" />}
          gradient="from-green-500 to-green-600"
        />
        <StatCard
          label="Số lượng tutor"
          value={statsLoading ? '...' : stats.tutors}
          icon={<UserCog className="w-7 h-7 text-white" />}
          gradient="from-purple-500 to-purple-600"
        />
        <StatCard
          label="Ca học hôm nay"
          value={statsLoading ? '...' : stats.lessonsToday}
          icon={<Calendar className="w-7 h-7 text-white" />}
          gradient="from-yellow-500 to-yellow-600"
        />
      </div>

      {/* Show AddUserForm or User Management Table */}
      {isAddingUser ? (
        <AddUserForm
          newUser={newUser}
          onUserChange={setNewUser}
          onClose={() => {
            setIsAddingUser(false)
            resetNewUser()
          }}
          onSuccess={handleAddUserSuccess}
        />
      ) : (
        <>
          <div className="card">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Quản lý tài khoản người dùng</h2>
                <p className="text-sm text-gray-600">Danh sách tài khoản hiện có trên hệ thống</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
                  <Search className="w-4 h-4 text-gray-500 mr-2" />
                  <input
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Tìm kiếm tên hoặc email"
                    className="text-sm text-gray-700 outline-none bg-transparent w-48"
                  />
                </div>
                <div className="flex bg-gray-100 rounded-xl p-1">
                  {[
                    { label: 'Tất cả', value: 'all' as const },
                    { label: 'Học sinh / PH', value: 'student' as const },
                    { label: 'Tutor', value: 'tutor' as const },
                    { label: 'Admin', value: 'admin' as const },
                  ].map((button) => (
                    <button
                      key={button.value}
                      onClick={() => onRoleFilterChange(button.value)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                        roleFilter === button.value ? 'bg-white shadow text-primary-600' : 'text-gray-500'
                      }`}
                    >
                      {button.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm gap-2">
                  <span className="text-xs text-gray-500 font-semibold">Sắp xếp:</span>
                  <select
                    value={sortField}
                    onChange={(e) => {
                      const newField = e.target.value as 'name' | 'email' | 'createdAt'
                      onSortFieldChange(newField)
                      if (newField === 'createdAt') {
                        onSortOrderChange('desc')
                      } else {
                        onSortOrderChange('asc')
                      }
                    }}
                    className="text-sm text-gray-700 outline-none bg-transparent border-none"
                  >
                    <option value="name">Tên</option>
                    <option value="email">Email</option>
                    <option value="createdAt">Ngày tham gia</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
                    className="text-sm text-gray-700 outline-none bg-transparent border-none"
                  >
                    {sortField === 'createdAt' ? (
                      <>
                        <option value="desc">Gần nhất</option>
                        <option value="asc">Muộn nhất</option>
                      </>
                    ) : (
                      <>
                        <option value="asc">A - Z</option>
                        <option value="desc">Z - A</option>
                      </>
                    )}
                  </select>
                </div>
                <button onClick={() => setIsAddingUser(true)} className="btn-primary flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Thêm tài khoản</span>
                </button>
              </div>
            </div>

            <UserTable
              users={users}
              loading={usersLoading}
              editUserId={editUserId}
              editData={editData}
              onStartEdit={startEditUser}
              onCancelEdit={cancelEditUser}
              onSaveEdit={saveEditUser}
              onUpdateField={updateEditField}
              onDelete={handleDeleteUser}
              onResetPassword={handleResetPassword}
              pagination={pagination}
              onPageChange={onPageChange}
            />
          </div>

          <ResetPasswordModal
            userId={resetPasswordUserId}
            newPassword={newPassword}
            onPasswordChange={setNewPassword}
            onConfirm={confirmResetPassword}
            onClose={() => {
              setResetPasswordUserId(null)
              setNewPassword('')
            }}
          />
        </>
      )}
    </div>
  )
}

