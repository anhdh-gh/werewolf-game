"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import s from './signin.module.css';

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. GỌI API ĐĂNG NHẬP
      const res = await fetch('https://werewolf.anhdh.net/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            username: username,
            password: password
        }),
      });

      const data = await res.json();
      console.log("👉 Dữ liệu Server trả về:", data);

      if (res.ok) {
        // --- THÀNH CÔNG ---
        
        // 2. LOGIC LƯU TOKEN (Quan trọng nhất)
        // Kiểm tra kỹ console log xem API trả về tên là 'access_token' hay 'accessToken'
        console.log("Kết quả đăng nhập:", data); 

        // Lưu vào bộ nhớ trình duyệt (LocalStorage)
        // Lưu ý: data.access_token hoặc data.accessToken tùy thuộc vào API của bạn trả về cái gì
        if (data.access_token) {
             localStorage.setItem('accessToken', data.access_token);
        }
        if (data.refresh_token) {
             localStorage.setItem('refreshToken', data.refresh_token);
        }
        
        // Lưu luôn tên người dùng để hiển thị ở Sảnh cho đẹp
        localStorage.setItem('username', username);
        
        alert(`Chào mừng Sói ${username} đã về hang! 🐺`);
        
        // 3. CHUYỂN HƯỚNG VỀ SẢNH
        router.push('/'); 
        router.refresh(); // Làm mới lại trang sảnh để nó cập nhật trạng thái đã đăng nhập
      } else {
        // --- THẤT BẠI ---
        alert(data.message || 'Mật mã bí mật không đúng!');
      }

    } catch (error) {
      console.error('Lỗi:', error);
      alert('Không thể hú gọi bầy đàn (Lỗi kết nối Server)!');
    } finally {
      setIsLoading(false);
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
          disabled={isLoading}
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
        disabled={isLoading}
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