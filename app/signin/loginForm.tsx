"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // <--- 1. Thêm cái này để chuyển trang
import s from './signin.module.css';

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // <--- 2. Thêm trạng thái đang tải
  
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => { // <--- Thêm từ khóa async
    e.preventDefault();
    setIsLoading(true); // Bắt đầu xoay vòng vòng

    try {
      // --- BẮT ĐẦU GỌI API ---
      // Lưu ý: Thay đường dẫn này bằng API thật của bạn
      const res = await fetch('https://werewolf.anhdh.net/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            username: username, // Gửi tên người dùng
            password: password  // Gửi mật khẩu
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // --- THÀNH CÔNG ---
        alert(`Chào mừng Sói ${username} đã về hang! 🐺`);
        // Có thể lưu token vào đây nếu cần: localStorage.setItem('token', data.token);
        
        router.push('/'); // Chuyển về trang chủ
      } else {
        // --- THẤT BẠI ---
        alert(data.message || 'Mật mã bí mật không đúng!');
      }

    } catch (error) {
      console.error('Lỗi:', error);
      alert('Không thể hú gọi bầy đàn (Lỗi kết nối Server)!');
    } finally {
      setIsLoading(false); // Dù thành công hay thất bại cũng tắt loading
    }
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
          disabled={isLoading} // Khóa ô nhập khi đang load
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
          disabled={isLoading}
        />
      </div>

      {/* Nút bấm */}
      <button 
        type="submit" 
        className={s.submitButton}
        disabled={isLoading} // Khóa nút khi đang load
        style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'wait' : 'pointer' }}
      >
          {isLoading ? 'Đang Triệu Hồi...' : 'Hú Nhập Bầy 🐺'} 
      </button>
      
      <div className={s.footerLink}>
        Chưa có bầy đàn? <a href="/signup" className={s.link}>Đăng ký ngay</a>
      </div>
    </form>
  );
}