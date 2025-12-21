// app/signin/page.tsx
import LoginForm from './loginForm'
// Import cùng file CSS đó để dùng các class cho khung ngoài
import s from './signin.module.css'; 
import { Metadata } from 'next';

// (Tùy chọn) Đặt tiêu đề cho thẻ trên trình duyệt
export const metadata: Metadata = {
  title: 'Đăng nhập | Ma Sói Online',
  description: 'Cổng vào thế giới bóng đêm',
};

export default function SignInPage() {
  return (
    // Lớp bao ngoài cùng (pageWrapper)
    <main className={s.pageWrapper}>
      {/* Cái hộp ở giữa (loginContainer) */}
      <div className={s.loginContainer}>
        <h1 className={s.title}>Ma Sói Online</h1>
        <p className={s.subtitle}>Đêm nay ai sẽ là kẻ bị săn?</p>
        
        {/* Gọi component Form vào làm việc */}
        <LoginForm />
      </div>
    </main>
  );
}