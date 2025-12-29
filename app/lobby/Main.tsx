"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import 'app/global.css'

export default function Home() {
  const router = useRouter();
  
  const [apiUrl,setApiUrl] = useState("");

  useEffect(() => {
    const savedServer = localStorage.getItem("selectedServer");
    if(savedServer){
      const servedObj = JSON.parse(savedServer);
      setApiUrl(servedObj.api);

    }
  });
  

  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. LOGIC KHỞI TẠO (Chạy 1 lần khi vào trang) ---
  useEffect(() => {
    // Vào trang là kiểm tra đăng nhập luôn, không cần hỏi han chọn server gì cả
    checkLoginStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // --- 2. HÀM KIỂM TRA ĐĂNG NHẬP ---
  const checkLoginStatus = async () => {
    setIsLoading(true);

    let token = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    // Nếu không có token -> Coi như chưa đăng nhập -> Dừng
    if (!token) {
      setIsLoggedIn(false);
      setIsLoading(false);
      return;
    }

    try {
      // Gọi API lấy thông tin User
      let res = await fetch(`${apiUrl}/users/info`, { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // --- LOGIC GIA HẠN TOKEN (AUTO REFRESH) ---
      // Nếu API báo lỗi 401 (Hết hạn) và ta có refreshToken
      if (res.status === 401 && refreshToken) {
        console.log("⚠️ Token hết hạn! Đang xin cấp lại...");
        
        const refreshRes = await fetch(`${apiUrl}/auth/refresh`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          // Lấy token mới (xử lý cả 2 trường hợp cấu trúc data)
          const newAccessToken = refreshData.data?.access_token || refreshData.access_token;
          const newRefreshToken = refreshData.data?.refresh_token || refreshData.refresh_token;

          if (newAccessToken) {
              localStorage.setItem("accessToken", newAccessToken);
              token = newAccessToken; 
              if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);

              // Gọi lại API info với chìa khóa mới
              res = await fetch(`${apiUrl}/users/info`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                  }
              });
          }
        }
      }

      // Xử lý kết quả cuối cùng
      if (res.ok) {
        const data = await res.json();
        setUserInfo(data);
        setIsLoggedIn(true);
      } else {
        // Token hỏng hẳn (Refresh thất bại) -> Đăng xuất
        handleLocalLogout(); 
      }

    } catch (error) {
      console.error("Lỗi login:", error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. CÁC HÀM XỬ LÝ SỰ KIỆN ---

  const handleLocalLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    setUserInfo(null);
  }

  const handleLogout = (askConfirm = true) => {
    if (askConfirm && !window.confirm("Bạn chắc chắn muốn đăng xuất?")) return;
    handleLocalLogout();
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("CẢNH BÁO: Hành động này sẽ xóa tài khoản vĩnh viễn!")) return;
    
    const token = localStorage.getItem("accessToken");

    try {
      const res = await fetch(`${apiUrl}/users/user-delete`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        alert("Đã xóa tài khoản thành công.");
        handleLocalLogout();
        window.location.reload();
      } else {
        alert("Có lỗi xảy ra khi xóa tài khoản.");
      }
    } catch (e) { console.error(e); }
  };

  // --- 4. GIAO DIỆN HIỂN THỊ ---
  
  // Giai đoạn Loading
  if (isLoading) return <div className="lobby-container"><h2 style={{color: '#ff5470'}}>🚀 Đang kết nối vệ tinh...</h2></div>;

  // Giao diện chính (Sảnh hoặc Form Login)
  return (
    <div className="lobby-container">
      <div style={{marginBottom:'20px', textAlign:'center'}}>
        <h1 className="lobby-title" style={{fontSize: '32px', margin: 0}}>🐺 MA SÓI ONLINE</h1>
        <p style={{color: '#888', fontSize: '14px', marginTop: '5px'}}>Cổng vào thế giới bóng đêm</p>
      </div>
      
      {isLoggedIn ? (
        // --- TRƯỜNG HỢP 1: ĐÃ ĐĂNG NHẬP ---
        <div className="lobby-box">
          <h3 className="lobby-welcome">
            Chào, <span style={{color: '#ff9f43'}}>{userInfo?.username || localStorage.getItem('username')}</span>!
          </h3>
          <p className="lobby-desc">Bạn đã sẵn sàng cho cuộc đi săn?</p>
          
          <div className="btn-group">
            {/* Logic tìm phòng sẽ viết sau, giờ cứ để nút bấm */}
            <button onClick={() => alert("Tính năng vào phòng đang phát triển!")} className="btn btn-play">
                🎮 TÌM PHÒNG NGAY
            </button>
            
            <button onClick={() => handleLogout(true)} className="btn btn-logout">
                🚪 Đăng xuất
            </button>

            <button onClick={handleDeleteAccount} className="btn btn-delete" style={{marginTop:'15px', color:'#ff4d4d', border:'1px solid #ff4d4d', background:'transparent'}}>
                ⚠️ Xóa Tài Khoản
            </button>
          </div>
        </div>
      ) : (
        // --- TRƯỜNG HỢP 2: CHƯA ĐĂNG NHẬP ---
        <div className="lobby-box">
          <p className="lobby-desc">Vui lòng đăng nhập để tiếp tục</p>
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