# FOOLE Bắc Ninh - Tra cứu báo giá

Website Next.js dùng để tra cứu báo giá linh kiện điện thoại và upload Excel/CSV trong admin để cập nhật dữ liệu.

## Chạy local

```bash
npm install
cp .env.example .env
npm run import:data
npm run dev
```

Mở `http://localhost:3000`.

## Admin

- Trang admin: `http://localhost:3000/admin`
- Mật khẩu mặc định khi chưa cấu hình `.env`: `admin123`
- Khi chạy thật, đổi `ADMIN_PASSWORD` và `SESSION_SECRET` trong `.env`.

## Import dữ liệu

- Import ban đầu từ thư mục `data_mau`: `npm run import:data`
- Admin có thể upload `.xls`, `.xlsx`, `.csv`.
- Dòng trùng không đổi sẽ được bỏ qua.
- Dòng trùng nhưng thay đổi giá/thông tin sẽ cập nhật bản ghi cũ.
- Dòng mới sẽ được tạo mới.
