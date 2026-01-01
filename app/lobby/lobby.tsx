"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
 import 'app/global.css'; // Mở lại nếu bạn đã sửa đường dẫn file CSS

export default function Home() {
  const router = useRouter();
  
  // --- STATE ---
  const [apiUrl, setApiUrl] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

   const handleLocalLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    setUserInfo(null);
  }

  // --- 1. HÀM CHECK LOGIN (LOGIC MỚI: CHỈ GỌI REFRESH) ---
  const checkLoginStatus = useCallback(async (currentApiUrl: string) => {
    if (!currentApiUrl) {
        setIsLoading(false);
        return;
    }

    const API_BASE = currentApiUrl.endsWith('/api/v1') ? currentApiUrl : `${currentApiUrl}/api/v1`;

    // Lấy token từ LocalStorage
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    // --- BƯỚC 1: KIỂM TRA NHANH ---
    // Nếu có accessToken, cho phép vào Lobby ngay lập tức (trải nghiệm mượt)
    if (accessToken) {
        console.log("✅ Tìm thấy accessToken, cho phép vào Sảnh...");
        setIsLoggedIn(true);
        // Chúng ta KHÔNG return ở đây, mà chạy tiếp xuống dưới để làm mới token ngầm
    }

    // Nếu không có cả 2 token thì chắc chắn là chưa đăng nhập
    if (!accessToken && !refreshToken) {
        console.log("❌ Không có token nào.");
        setIsLoggedIn(false);
        setIsLoading(false);
        return;
    }

    // --- BƯỚC 2: REFRESH NGẦM (BACKGROUND REFRESH) ---
    try {
        if (!refreshToken) throw new Error("No refresh token");

        console.log(`🔄 Đang âm thầm gia hạn phiên đăng nhập...`);
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newAccessToken = refreshData.data?.access_token || refreshData.access_token;
            const newRefreshToken = refreshData.data?.refresh_token || refreshData.refresh_token;
            
            if (newAccessToken) {
                console.log("✅ Gia hạn thành công.");
                localStorage.setItem("accessToken", newAccessToken);
                if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);
                setIsLoggedIn(true); 
            }
        } else {
            // Chỉ logout nếu cả accessToken cũng không có VÀ refresh thất bại
            console.log("❌ Phiên đăng nhập hết hạn hoàn toàn.");
            if (!accessToken) {
                handleLocalLogout();
            }
        }
    } catch (error) {
        console.error("❌ Lỗi mạng khi kiểm tra phiên:", error);
        // Nếu lỗi mạng nhưng đã có accessToken từ trước thì cứ giữ trạng thái đăng nhập
        if (accessToken) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
    } finally {
        setIsLoading(false);
    }
}, [handleLocalLogout]); // Thêm handleLocalLogout vào dependency

  // --- 2. KHỞI TẠO (GIỮ NGUYÊN) ---
  useEffect(() => {
    const initData = async () => {
      const savedServer = localStorage.getItem("selectedServer");
      
      if (savedServer) {
        try {
          const serverObj = JSON.parse(savedServer);
          const url = serverObj.api;
          setApiUrl(url);
          // Gọi hàm check ngay
          await checkLoginStatus(url);
        } catch (e) {
          console.error("Lỗi parse server:", e);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    initData();
  }, [checkLoginStatus]); 

  // --- 3. CÁC HÀM SỰ KIỆN ---
  // const handleLocalLogout = () => {
  //   localStorage.removeItem("accessToken");
  //   localStorage.removeItem("refreshToken");
  //   localStorage.removeItem("username");
  //   setIsLoggedIn(false);
  //   setUserInfo(null);
  // }

  const handleLogout = (askConfirm = true) => {
    if (askConfirm && !window.confirm("Bạn chắc chắn muốn đăng xuất?")) return;
    handleLocalLogout();
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("CẢNH BÁO: Xóa tài khoản vĩnh viễn?")) return;
    const token = localStorage.getItem("accessToken");
    const API_BASE = apiUrl.endsWith('/api/v1') ? apiUrl : `${apiUrl}/api/v1`;
    try {
      const res = await fetch(`${API_BASE}/users/user-delete`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        alert("Đã xóa tài khoản.");
        handleLocalLogout();
        window.location.reload();
      } else { alert("Lỗi xóa tài khoản."); }
    } catch (e) { console.error(e); }
  };

  

  // --- 4. GIAO DIỆN ---
  if (isLoading) return <div className="lobby-container"><h2>🚀 Đang kết nối...</h2></div>;

  return (
    <div className="lobby-container">
      <div style={{marginBottom:'20px', textAlign:'center'}}>
        <h1 className="lobby-title">🐺 MA SÓI ONLINE</h1>
        <p style={{color: '#888'}}>
             {apiUrl ? `Server: ${apiUrl}` : "Chưa kết nối Server"}
        </p>
      </div>
      
      {isLoggedIn ? (
        <div className="lobby-box">
          <h3 className="lobby-welcome">
            {/* Vì không gọi API Info nên ta ưu tiên lấy username từ LocalStorage */}
            Chào, <span style={{color: '#ff9f43'}}>{localStorage.getItem('username') || "Thợ Săn"}</span>!
          </h3>
          <p className="lobby-desc">Sẵn sàng đi săn chưa?</p>
          <div className="btn-group">
            <button className="btn btn-play" onClick={() => alert("Sắp ra mắt!")}>🎮Tạo Phòng</button>
            <button className="btn btn-join" style={{ backgroundColor: '#2ecc71', color: 'white' }}>
                🔑 Join Phòng
            </button>
            <button onClick={() => handleLogout(true)} className="btn btn-logout">🚪 Đăng xuất</button>
            <button onClick={handleDeleteAccount} className="btn btn-delete" style={{marginTop:'15px', color:'#ff4d4d', border:'1px solid #ff4d4d', background:'transparent'}}>
                ⚠️ Xóa Tài Khoản
            </button>
          </div>
        </div>
      ) : (
        <div className="lobby-box">
          <p className="lobby-desc">Vui lòng đăng nhập</p>
          <div className="btn-group">
            <Link href="/signin"><button className="btn btn-primary">ĐĂNG NHẬP</button></Link>
            <Link href="/signup"><button className="btn btn-secondary">ĐĂNG KÝ</button></Link>
          </div>
        </div>
      )}
    </div>
  );
}