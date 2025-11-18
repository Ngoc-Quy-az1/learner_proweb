# SKILLAR - Hệ thống quản lý học tập

Hệ thống quản lý học tập thông minh, kết nối học sinh, phụ huynh, tutor và giáo viên trong một nền tảng duy nhất.

## 🚀 Tính năng chính

### 👨‍🎓 Học sinh / Phụ huynh
- Xem lịch học tuần với link Meet
- Quản lý checklist bài học
- Upload ảnh bài tập
- Xem báo cáo buổi học
- Theo dõi tiến độ học tập

### 👨‍🏫 Tutor (Giáo viên kèm chính)
- Quản lý danh sách học sinh
- Tick checklist và ghi chú
- Gửi báo cáo buổi học
- Yêu cầu hỗ trợ bộ môn
- Upload ảnh bài làm

### 🧑‍🏫 Giáo viên bộ môn
- Nhận thông báo yêu cầu hỗ trợ
- Quản lý lịch dạy thêm
- Gửi báo cáo ngắn

### 🧑‍💼 Admin
- Quản lý người dùng (tạo, sửa, xóa)
- Phân công giáo viên bộ môn
- Theo dõi hoạt động hệ thống
- Xem báo cáo tổng hợp

## 🛠️ Công nghệ sử dụng

- **React 18** - UI Framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Lucide React** - Icons
- **date-fns** - Date formatting

## 📦 Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build cho production
npm run build

# Preview production build
npm run preview
```

## 🔐 Đăng nhập demo

Sử dụng các email sau để đăng nhập (mật khẩu bất kỳ):

- `student@skillar.com` - Học sinh
- `parent@skillar.com` - Phụ huynh
- `tutor@skillar.com` - Tutor
- `teacher@skillar.com` - Giáo viên bộ môn
- `admin@skillar.com` - Admin

## 🎨 Màu sắc

- **Primary Blue**: #007DFF
- **White**: #FFFFFF
- **Gray**: #6B7280 (và các shades)

## 📁 Cấu trúc thư mục

```
src/
├── components/       # Components dùng chung
│   ├── Layout.tsx
│   ├── ChecklistTable.tsx
│   └── ScheduleWidget.tsx
├── contexts/        # React Contexts
│   └── AuthContext.tsx
├── pages/           # Các trang chính
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── StudentDashboard.tsx
│   ├── TutorDashboard.tsx
│   ├── TeacherDashboard.tsx
│   └── AdminDashboard.tsx
├── App.tsx          # Main app component
├── main.tsx         # Entry point
└── index.css        # Global styles
```

## 🚧 Tính năng sắp tới

- [ ] Tích hợp API backend
- [ ] Upload file thực tế
- [ ] Xuất báo cáo PDF
- [ ] Tích hợp Zalo notification
- [ ] Real-time updates
- [ ] Mobile responsive improvements

## 📝 License

© 2024 SKILLAR. All rights reserved.

