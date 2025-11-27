interface ResetPasswordModalProps {
  userId: string | null
  newPassword: string
  onPasswordChange: (password: string) => void
  onConfirm: () => void
  onClose: () => void
}

export default function ResetPasswordModal({
  userId,
  newPassword,
  onPasswordChange,
  onConfirm,
  onClose,
}: ResetPasswordModalProps) {
  if (!userId) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Reset mật khẩu</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Nhập mật khẩu mới"
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            autoFocus
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-semibold"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  )
}

