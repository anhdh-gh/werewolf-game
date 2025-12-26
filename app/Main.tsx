"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './global.css'; 

export default function Home() {
  const router = useRouter();
  
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [userInfo, setUserInfo] = useState<any>(null); // Lưu thông tin user từ Server
  const [isLoading, setIsLoading] = useState(true);    // Trạng thái đang tải dữ liệu

  // Đường dẫn API gốc
  const API_BASE_URL = "https://werewolf.anhdh.net/api/v1"; 

  // --- 1. LOGIC LẤY TOKEN VÀ GỌI API KHI VÀO TRANG ---
  useEffect(() => {
    const checkLoginStatus = async () => {
      // Lấy chìa khóa trong túi ra
      const token = localStorage.getItem("accessToken");

      if (!token) {
        // Không có token -> Chưa đăng nhập
        setIsLoggedIn(false);
        setIsLoading(false);
        return;
      }

      // Có token -> Gọi Server để kiểm tra xem token còn hạn không & Lấy tên
      try {
        const res = await fetch(`${API_BASE_URL}/users/get-info`, {
          method: 'POST', // Hoặc GET (tùy API bên bạn quy định, thường lấy info là GET hoặc POST)
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // <--- Gửi token kèm theo
          }
        });

        if (res.ok) {
          const data = await res.json();
          // Token ngon -> Lưu thông tin user
          setUserInfo(data);
          setIsLoggedIn(true);
        } else {
          // Token hết hạn hoặc không hợp lệ -> Đuổi về trang login
          console.log("Token hết hạn hoặc lỗi");
          handleLogout(false); // Logout không cần hỏi
        }
      } catch (error) {
        console.error("Lỗi kết nối server:", error);
      } finally {
        setIsLoading(false); // Tắt màn hình chờ
      }
    };

    checkLoginStatus();
  }, []);

  // --- 2. HÀM XỬ LÝ ĐĂNG XUẤT ---
  const handleLogout = (askConfirm = true) => {
    if (askConfirm) {
      const confirm = window.confirm("Bạn chắc chắn muốn rời khỏi hang sói?");
      if (!confirm) return;
    }

    // Xóa sạch dấu vết
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    
    setIsLoggedIn(false);
    setUserInfo(null);
    router.refresh(); // Làm mới trang
  };

  // --- 3. HÀM XỬ LÝ XÓA TÀI KHOẢN ---
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("CẢNH BÁO: Xóa tài khoản vĩnh viễn? Hành động này không thể hoàn tác!");
    
    if (confirmDelete) {
      const token = localStorage.getItem("accessToken");
      
      try {
        const res = await fetch(`${API_BASE_URL}/users/user-delete`, { // Sửa lại đúng endpoint theo ảnh bạn gửi (User delete)
          method: 'POST', // Theo ảnh bạn gửi API delete là POST, kiểm tra lại nếu là DELETE
          headers: {
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          alert("Tài khoản của bạn đã bị xóa khỏi bầy đàn.");
          localStorage.clear();
          setIsLoggedIn(false);
          router.push('/signup');
        } else {
          const data = await res.json();
          alert(data.message || "Không thể xóa tài khoản lúc này.");
        }
      } catch (error) {
        console.error("Lỗi xóa tài khoản:", error);
        alert("Lỗi kết nối server.");
      }
    }
  };

  // --- GIAO DIỆN ---
  
  // Màn hình chờ khi đang check token (tránh giật lag giao diện)
  if (isLoading) {
    return (
      <div className="lobby-container">
        <h2 style={{color: '#ff5470'}}>🐺 Đang đánh hơi...</h2>
      </div>
    );
  }

  return (
    <div className="lobby-container">
      <h1 className="lobby-title">🐺 MA SÓI ONLINE</h1>
      
      {isLoggedIn ? (
        /* === ĐÃ ĐĂNG NHẬP === */
        <div className="lobby-box">
          <h3 className="lobby-welcome">
            Chào mừng, 
            {/* Ưu tiên hiển thị tên lấy từ API, nếu chưa có thì lấy tạm trong localStorage */}
            <span style={{color: '#ff9f43'}}> {userInfo?.username || localStorage.getItem('username')}</span>!
          </h3>
          <p className="lobby-desc">Đêm nay bạn muốn làm gì?</p>
          
          <div className="btn-group">
            <button 
              onClick={() => alert("Chức năng đang phát triển...")} 
              className="btn btn-play"
            >
              🎮 TÌM PHÒNG CHƠI
            </button>

            <button onClick={() => handleLogout(true)} className="btn btn-logout">
              🚪 Đăng xuất
            </button>

            <button 
              onClick={handleDeleteAccount} 
              className="btn btn-delete" 
              style={{ 
                marginTop: '15px', 
                backgroundColor: 'rgba(255, 77, 77, 0.1)', 
                color: '#ff4d4d', 
                border: '1px solid #ff4d4d',
                fontSize: '0.8rem',
                padding: '8px'
              }}
            >
              ⚠️ Xóa tài khoản
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