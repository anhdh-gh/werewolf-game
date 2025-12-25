"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import s from './signup.module.css';

export default function SignupForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
        ...formData,
        [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
        setError("Mật khẩu nhập lại không khớp!");
        return;
    }

    if (formData.password.length < 6) {
        setError("Mật khẩu phải dài hơn 6 ký tự!");
        return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('https://werewolf.anhdh.net/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Đăng ký thất bại!');
      }

      alert(`Chào mừng ${formData.username}! Hãy đăng nhập để vào hang.`);
      router.push('/signin');

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Lỗi kết nối Server!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup}>
      {error && <div className={s.errorMsg}>⚠️ {error}</div>}

      {/* Đã thêm htmlFor và id đầy đủ */}
      
      <div className={s.inputGroup}>
        <label htmlFor="reg-user" className={s.label}>Tên nhân vật</label>
        <input 
            id="reg-user"
            name="username" type="text" placeholder="Ví dụ: Sói Cô Đơn"
            className={s.inputField} required
            onChange={handleChange}
            disabled={isLoading}
        />
      </div>

      <div className={s.inputGroup}>
        <label htmlFor="reg-email" className={s.label}>Email</label>
        <input 
            id="reg-email"
            name="email" type="email" placeholder="soi@gmail.com"
            className={s.inputField} required
            onChange={handleChange}
            disabled={isLoading}
        />
      </div>

      <div className={s.inputGroup}>
        <label htmlFor="reg-pass" className={s.label}>Mật khẩu</label>
        <input 
            id="reg-pass"
            name="password" type="password" 
            className={s.inputField} required
            onChange={handleChange}
            disabled={isLoading}
        />
      </div>

      <div className={s.inputGroup}>
        <label htmlFor="reg-confirm" className={s.label}>Nhập lại mật khẩu</label>
        <input 
            id="reg-confirm"
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