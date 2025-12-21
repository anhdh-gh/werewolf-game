// app/signup/SignupForm.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import s from './signup.module.css'; // Import CSS module

export default function SignupForm() {
  // Các biến lưu dữ liệu nhập
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState("");
  const router = useRouter();

  // Hàm cập nhật state khi gõ phím (Viết gộp cho gọn)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
        ...formData,
        [e.target.name]: e.target.value
    });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Kiểm tra mật khẩu trùng khớp
    if (formData.password !== formData.confirmPassword) {
        setError("❌ Mật khẩu nhập lại không khớp!");
        return;
    }

    // 2. Kiểm tra độ dài mật khẩu
    if (formData.password.length < 6) {
        setError("❌ Mật khẩu phải dài hơn 6 ký tự!");
        return;
    }

    // 3. Nếu ngon lành -> Gửi API (Giả lập)
    console.log("Dữ liệu đăng ký:", formData);
    alert("Đăng ký thành công! Chào mừng Sói mới.");
    
    // Chuyển hướng về trang đăng nhập
    router.push('/signin');
  };

  return (
    <form onSubmit={handleSignup}>
      {/* Hiện lỗi nếu có */}
      {error && <div className={s.errorMsg}>{error}</div>}

      <div className={s.inputGroup}>
        <label className={s.label}>Tên nhân vật</label>
        <input 
            name="username" type="text" placeholder="Ví dụ: Sói Cô Đơn"
            className={s.inputField} required
            onChange={handleChange}
        />
      </div>

      <div className={s.inputGroup}>
        <label className={s.label}>Email (để lấy lại pass)</label>
        <input 
            name="email" type="email" placeholder="soi@gmail.com"
            className={s.inputField} required
            onChange={handleChange}
        />
      </div>

      <div className={s.inputGroup}>
        <label className={s.label}>Mật khẩu</label>
        <input 
            name="password" type="password" 
            className={s.inputField} required
            onChange={handleChange}
        />
      </div>

      <div className={s.inputGroup}>
        <label className={s.label}>Nhập lại mật khẩu</label>
        <input 
            name="confirmPassword" type="password" 
            className={s.inputField} required
            onChange={handleChange}
        />
      </div>

      <button type="submit" className={s.submitButton}>
        📝 Tạo Tài Khoản
      </button>
      
      <div style={{marginTop: '15px', fontSize: '0.9rem', color: '#aaa'}}>
        Đã là thành viên? <Link href="/signin" style={{color: '#ff9f43'}}>Đăng nhập ngay</Link>
      </div>
    </form>
  );
}