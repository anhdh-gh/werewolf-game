// app/signup/SignupForm.tsx
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import s from './signup.module.css';

export default function SignupForm() {
  // 1. Giữ nguyên state lưu dữ liệu
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // 2. Thêm state loading
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
        ...formData,
        [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Xóa lỗi cũ trước khi chạy mới

    // --- Validate Client ---
    if (formData.password !== formData.confirmPassword) {
        setError("Mật khẩu nhập lại không khớp!");
        return;
    }

    if (formData.password.length < 6) {
        setError("Mật khẩu phải dài hơn 6 ký tự!");
        return;
    }

    // --- BẮT ĐẦU GỌI API ---
    setIsLoading(true);

    try {
      // Thay URL này bằng API Backend thật của bạn
      const res = await fetch('https://werewolf.anhdh.net/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Chỉ gửi những gì Backend cần (bỏ confirmPassword đi)
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Nếu Server báo lỗi (VD: Email trùng) thì ném lỗi xuống catch
        throw new Error(data.message || 'Đăng ký thất bại!');
      }

      // --- THÀNH CÔNG ---
      alert(`Chào mừng ${formData.username}! Hãy đăng nhập để vào hang.`);
      router.push('/signin');

    } catch (err: any) {
      // Bắt lỗi và hiện lên màn hình
      console.error(err);
      setError(err.message || "Lỗi kết nối Server!");
    } finally {
      setIsLoading(false); // Tắt loading dù thành công hay thất bại
    }
  };

  return (
    <form onSubmit={handleSignup}>
      {/* Hiện thông báo lỗi màu đỏ */}
      {error && <div className={s.errorMsg}>⚠️ {error}</div>}

      <div className={s.inputGroup}>
        <label className={s.label}>Tên nhân vật</label>
        <input 
            name="username" type="text" placeholder="Ví dụ: Sói Cô Đơn"
            className={s.inputField} required
            onChange={handleChange}
            disabled={isLoading} // Khóa khi đang tải
        />
      </div>

      <div className={s.inputGroup}>
        <label className={s.label}>Email</label>
        <input 
            name="email" type="email" placeholder="soi@gmail.com"
            className={s.inputField} required
            onChange={handleChange}
            disabled={isLoading}
        />
      </div>

      <div className={s.inputGroup}>
        <label className={s.label}>Mật khẩu</label>
        <input 
            name="password" type="password" 
            className={s.inputField} required
            onChange={handleChange}
            disabled={isLoading}
        />
      </div>

      <div className={s.inputGroup}>
        <label className={s.label}>Nhập lại mật khẩu</label>
        <input 
            name="confirmPassword" type="password" 
            className={s.inputField} required
            onChange={handleChange}
            disabled={isLoading}
        />
      </div>

      <button 
        type="submit" 
        className={s.submitButton}
        disabled={isLoading}
        style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'wait' : 'pointer' }}
      >
          {isLoading ? 'Đang Khắc Tên...' : 'Tạo Tài Khoản'}
      </button>
      
      <div style={{marginTop: '15px', fontSize: '0.9rem', color: '#aaa'}}>
        Đã là thành viên? <Link href="/signin" style={{color: '#ff9f43'}}>Đăng nhập ngay</Link>
      </div>
    </form>
  );
}