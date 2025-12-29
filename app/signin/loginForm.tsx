"use client";

import { useState,useEffect } from 'react';
import { useRouter } from 'next/navigation';
import s from './signin.module.css';

export default function LoginForm() {

  // Tại bất kỳ file nào (SignIn.tsx, Profile.tsx...)
useEffect(() => {
  const savedServer = localStorage.getItem("selectedServer");
  if (savedServer) {
    
    const serverObj = JSON.parse(savedServer);
    setApiUrl(serverObj.api);
    console.log("API URL cần dùng là:", serverObj.api);
    // Bạn có thể set nó vào một state cục bộ ở đây để dùng trong component này
  }
}, []); 
   
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl , setApiUrl] = useState("");
  const router = useRouter();
//test
  console.log(apiUrl);
  //test
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. GỌI API ĐĂNG NHẬP
      const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
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
        
        // 2. LOGIC LƯU TOKEN (ĐÃ SỬA)
        // Vì token nằm trong object 'data' con, nên phải chui vào 1 lớp nữa
        const loginData = data.data; 

        if (loginData && loginData.access_token) {
             localStorage.setItem('accessToken', loginData.access_token);
        }
        if (loginData && loginData.refresh_token) {
             localStorage.setItem('refreshToken', loginData.refresh_token);
        }
        
        // Lưu luôn tên người dùng
        localStorage.setItem('username', username);
        
        alert(`Chào mừng Sói ${username} đã về hang! 🐺`);
        
        // 3. CHUYỂN HƯỚNG VỀ SẢNH
        router.push('/lobby'); 
        router.refresh(); 
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