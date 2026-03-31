# Hướng dẫn Deploy lên Vercel 🚀

Ứng dụng của bạn đã sẵn sàng để chạy 24/7 trên Vercel. Vì đây là môi trường serverless, bạn cần thực hiện các bước sau để đưa nó lên mạng:

## Bước 1: Tạo Repository trên GitHub
1. Truy cập [github.com](https://github.com) và tạo một repository mới (ví dụ: `web-hoc-tieng-trung`).
2. Mở terminal tại thư mục dự án và chạy các lệnh sau:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Chinese Learning Platform"
   git branch -M main
   git remote add origin https://github.com/TEN_CUA_BAN/web-hoc-tieng-trung.git
   git push -u origin main
   ```

## Bước 2: Kết nối với Vercel
1. Truy cập [vercel.com](https://vercel.com) và Đăng nhập (bằng GitHub).
2. Nhấn **"Add New"** -> **"Project"**.
3. Tìm repository `web-hoc-tieng-trung` và nhấn **"Import"**.

## Bước 3: Cấu hình Biến môi trường (CRITICAL)
Trong phần **Environment Variables**, bạn PHẢI thêm các biến sau thì web mới hoạt động được:

| Tên biến | Giá trị |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Lấy từ Supabase Project Settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Lấy từ Supabase Project Settings |
| `OPENAI_API_KEY` | Key của bạn để dùng AI & TTS |

## Bước 4: Deploy
Nhấn **"Deploy"**. Vercel sẽ tự động build và cung cấp cho bạn một đường dẫn (URL) dạng `https://your-project.vercel.app`.

---
**Lưu ý:** Sau này mỗi khi bạn `git push` code mới lên GitHub, Vercel sẽ tự động cập nhật web cho bạn!
