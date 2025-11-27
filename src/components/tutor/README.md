# Tutor Dashboard Components

Các component đã được tách ra từ `TutorDashboard.tsx` để dễ quản lý và bảo trì.

## Cấu trúc Component

### Components nhỏ
- `InfoCard.tsx` - Hiển thị thông tin học sinh
- `StatCard.tsx` - Hiển thị thống kê
- `StarRating.tsx` - Component đánh giá bằng sao
- `ChecklistForm.tsx` - Form tạo checklist mới
- `HomeworkTable.tsx` - Bảng quản lý bài tập về nhà
- `DetailTable.tsx` - Bảng chi tiết bài tập
- `SubjectEvaluation.tsx` - Component đánh giá môn học

## Cách sử dụng

Import các component từ `@/components/tutor`:

```typescript
import { InfoCard, StatCard, ChecklistForm, HomeworkTable, DetailTable, SubjectEvaluation } from '@/components/tutor'
```

## TODO: Các Section lớn cần tách tiếp

1. `HomeSection` - Section trang chủ với lịch dạy hôm nay
2. `StudentsSection` - Section quản lý học sinh
3. `ChecklistSection` - Section checklist bài học
4. `ScheduleSection` - Section lịch học (đã có MonthlyCalendar component)

## Refactoring Plan

1. ✅ Tạo các component nhỏ (InfoCard, StatCard, StarRating)
2. ✅ Tạo ChecklistForm
3. ✅ Tạo các bảng (HomeworkTable, DetailTable)
4. ✅ Tạo SubjectEvaluation
5. ⏳ Tạo các Section lớn (HomeSection, StudentsSection, ChecklistSection)
6. ⏳ Refactor TutorDashboard để sử dụng các component mới

