import { useState, useCallback } from 'react'
import { X, User, Mail, Lock, Shield, UserCircle, Image as ImageIcon, Clock, FileText, UserPlus } from 'lucide-react'
import { User as UserType } from './types'
import { apiCall, API_BASE_URL } from '../../config/api'
import { getCookie } from '../../utils/cookies'

interface NewUser {
  name: string
  email: string
  role: UserType['role']
  password: string
  avatar: File | null
  avatarUrl: string
}

interface AddUserFormProps {
  newUser: NewUser
  onUserChange: (user: NewUser) => void
  onClose: () => void
  onSuccess: () => void
}

export default function AddUserForm({ newUser, onUserChange, onClose, onSuccess }: AddUserFormProps) {
  const [uploadingFile, setUploadingFile] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const accessToken = getCookie('accessToken')

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to upload file')
    }

    const data = await response.json()
    return data.file.url
  }

  const handleAddUserAvatarChange = async (file: File | null) => {
    if (!file) {
      onUserChange({
        ...newUser,
        avatar: null,
        avatarUrl: '',
      })
      setAvatarPreview(null)
      return
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Vui lòng chọn file ảnh hợp lệ (PNG, JPG, GIF, WEBP)')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('Kích thước file không được vượt quá 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    try {
      setUploadingFile(true)
      const url = await uploadFile(file)
      onUserChange({
        ...newUser,
        avatar: file,
        avatarUrl: url,
      })
      if (url) {
        setAvatarPreview(url)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi upload file')
      onUserChange({
        ...newUser,
        avatar: null,
        avatarUrl: '',
      })
      setAvatarPreview(null)
    } finally {
      setUploadingFile(false)
    }
  }

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUserChange({ ...newUser, name: e.target.value })
  }, [newUser, onUserChange])

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUserChange({ ...newUser, email: e.target.value })
  }, [newUser, onUserChange])

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUserChange({ ...newUser, password: e.target.value })
  }, [newUser, onUserChange])

  const handleRoleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onUserChange({
      ...newUser,
      role: e.target.value as UserType['role'],
    })
  }, [newUser, onUserChange])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isCreatingUser) return

    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      alert('Vui lòng điền đầy đủ Tên, Email và Mật khẩu')
      return
    }

    try {
      setIsCreatingUser(true)
      const userData: any = {
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        password: newUser.password.trim(),
        role: newUser.role,
      }

      if (newUser.avatarUrl) {
        userData.avatarUrl = newUser.avatarUrl
      }

      await apiCall('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      })

      onSuccess()
      onClose()
      alert('Đã tạo tài khoản thành công!')
    } catch (error) {
      console.error('Error creating user:', error)
      let errorMessage = 'Có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại.'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      alert(errorMessage)
    } finally {
      setIsCreatingUser(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Thêm người dùng mới</h2>
          <p className="text-sm text-gray-600">Điền thông tin để tạo tài khoản mới</p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Quay lại</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Thông tin đăng nhập</p>
                <h4 className="text-lg font-bold text-gray-900">Tài khoản & phân quyền</h4>
              </div>
            </div>
            <span className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              {newUser.role === 'student' ? 'Học sinh / Phụ huynh' : 'Tutor'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <User className="w-4 h-4 text-gray-500" />
                Tên người dùng <span className="text-red-500">*</span>
              </label>
              <input
                id="add-user-name"
                value={newUser.name}
                onChange={handleNameChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                placeholder="Nhập tên người dùng"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Mail className="w-4 h-4 text-gray-500" />
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="add-user-email"
                type="email"
                value={newUser.email}
                onChange={handleEmailChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                placeholder="Nhập email"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Lock className="w-4 h-4 text-gray-500" />
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newUser.password}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder-gray-400"
                placeholder="Nhập mật khẩu"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Shield className="w-4 h-4 text-gray-500" />
                Vai trò <span className="text-red-500">*</span>
              </label>
              <select
                value={newUser.role}
                onChange={handleRoleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
              >
                <option value="student">Học sinh / Phụ huynh</option>
                <option value="tutor">Tutor</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hồ sơ</p>
                <h4 className="text-lg font-bold text-gray-900">Ảnh đại diện</h4>
              </div>
            </div>
          </div>

          <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100/50 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              {avatarPreview || newUser.avatarUrl ? (
                <div className="flex-shrink-0">
                  <img
                    src={avatarPreview || newUser.avatarUrl}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-1">Ảnh đại diện</p>
                <p className="text-xs text-gray-600">Tải ảnh (PNG, JPG, tối đa 5MB)</p>
                {uploadingFile && newUser.avatar && (
                  <p className="mt-2 text-xs font-medium text-blue-600 flex items-center gap-1">
                    <Clock className="w-3 h-3 animate-spin" />
                    Đang upload...
                  </p>
                )}
                {!uploadingFile && newUser.avatar && (
                  <p className="mt-2 text-xs font-medium text-blue-600 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {newUser.avatar.name}
                  </p>
                )}
                {newUser.avatarUrl && !uploadingFile && (
                  <p className="mt-1 text-xs font-medium text-green-600 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px]">✓</span>
                    Đã upload thành công
                  </p>
                )}
              </div>
              <label
                className={`px-5 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer text-center font-semibold text-gray-700 transition-all flex items-center justify-center gap-2 ${
                  uploadingFile ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                {uploadingFile ? 'Đang upload...' : avatarPreview || newUser.avatarUrl ? 'Đổi ảnh' : 'Chọn ảnh'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingFile}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    if (file) handleAddUserAvatarChange(file)
                  }}
                />
              </label>
            </div>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Hủy
          </button>
          <button
            type="submit"
            disabled={isCreatingUser}
            className={`px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-md ${
              isCreatingUser ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            {isCreatingUser ? 'Đang tạo...' : 'Lưu tài khoản'}
          </button>
        </div>
      </form>
    </div>
  )
}

