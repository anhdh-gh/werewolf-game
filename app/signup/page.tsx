// app/signup/page.tsx
import SignupForm from './signupForm';
import s from './signup.module.css';

export default function SignupPage() {
  return (
    <main className={s.pageWrapper}>
      <div className={s.signupContainer}>
        <h1 className={s.title}>Gia Nhập Bầy Đàn</h1>
        <p style={{marginBottom: '20px', color: '#bbb'}}>
            Tạo tài khoản để bắt đầu cuộc săn đêm nay.
        </p>
        
        {/* Gọi form vào làm việc */}
        <SignupForm />
      </div>
    </main>
  );
}