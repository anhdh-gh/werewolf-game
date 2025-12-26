"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './global.css'; // Đảm bảo đã import file CSS

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [username, setUsername] = useState("Người lạ");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("username");

    if (token) {
      setIsLoggedIn(true);
      if (storedUser) setUsername(storedUser);
    }
  }, []);

  const handleLogout = () => {
    const confirm = window.confirm("Bạn chắc chắn muốn rời khỏi hang sói?");
    if (confirm) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("username");
      setIsLoggedIn(false);
      setUsername("Người lạ");
      router.refresh();
    }
  };

  return (
    <div className="lobby-container">
      <h1 className="lobby-title">🐺 MA SÓI ONLINE</h1>
      
      {isLoggedIn ? (
        /* === ĐÃ ĐĂNG NHẬP === */
        <div className="lobby-box">
          <h3 className="lobby-welcome">
            Chào mừng, <span style={{color: '#ff9f43'}}>{username}</span>!
          </h3>
          <p className="lobby-desc">Đêm nay bạn muốn làm gì?</p>
          
          <div className="btn-group">
            <button 
              onClick={() => alert("Đang tìm phòng... (Chức năng sắp ra mắt)")} 
              className="btn btn-play"
            >
              🎮 TÌM PHÒNG CHƠI
            </button>

            <button onClick={handleLogout} className="btn btn-logout">
              🚪 Đăng xuất
            </button>
          </div>
        </div>
      ) : (
        /* === CHƯA ĐĂNG NHẬP === */
        <div className="lobby-box">
          <p className="lobby-desc">
            Bạn chưa có danh phận? Hãy gia nhập bầy đàn ngay!
          </p>
          
          <div className="btn-group">
            <Link href="/signin" style={{width: '100%'}}>
              <button className="btn btn-primary">ĐĂNG NHẬP</button>
            </Link>
            
            <Link href="/signup" style={{width: '100%'}}>
              <button className="btn btn-secondary">ĐĂNG KÝ</button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}