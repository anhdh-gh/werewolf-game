// app/signin/LoginForm.tsx
"use client";

import { useState } from 'react';
// Import file CSS Module vào. Đặt tên biến là 's' cho gọn.
import s from './signin.module.css';

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault(); // Ngăn trình duyệt tải lại trang
    // Demo: In ra console (Sau này sẽ gọi API thật ở đây)
    console.log("Đang đăng nhập với:", username, password);
    alert(`Sói ${username} đang cố gắng gia nhập bầy...`);
  };

  return (
    <form onSubmit={handleLogin}>
      {/* Ô nhập Tên */}
      <div className={s.inputGroup}>
        <label htmlFor="username" className={s.label}>
          Tên Sói hoặc Email
        </label>
        <input
          id="username"
          type="text"
          placeholder="Nhập tên của bạn..."
          className={s.inputField}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>

      {/* Ô nhập Mật khẩu */}
      <div className={s.inputGroup}>
        <label htmlFor="password" className={s.label}>
          Mật mã bí mật
        </label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          className={s.inputField}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {/* Nút bấm */}
      <button type="submit" className={s.submitButton}>
        🌕 Hú Nhập Bầy 🐺
      </button>
      
      <div className={s.footerLink}>
        Chưa có bầy đàn? <a href="/signup" className={s.link}>Đăng ký ngay</a>
      </div>
    </form>
  );
}