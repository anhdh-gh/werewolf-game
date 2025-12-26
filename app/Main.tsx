"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './global.css'; 

export default function Home() {
  const router = useRouter();
  
  // --- STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Đường dẫn API gốc
  const API_BASE_URL = "https://werewolf.anhdh.net/api/v1"; 

  // --- 1. LOGIC KIỂM TRA & GIA HẠN TOKEN ---
  useEffect(() => {
    const checkLoginStatus = async () => {
      // 1. Lấy cả 2 chìa khóa trong túi ra
      let token = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!token) {
        setIsLoggedIn(false);
        setIsLoading(false);
        return;
      }

      try {
        // 2. Thử gọi API lấy thông tin (Lần 1)
        let res = await fetch(`${API_BASE_URL}/users/info`, { // Lưu ý: Check kỹ lại xem là /info hay /get-info nhé
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        // 3. QUAN TRỌNG: Nếu bị lỗi 401 (Hết hạn) VÀ có Refresh Token trong tay
        if (res.status === 401 && refreshToken) {
          console.log("⚠️ Token hết hạn! Đang thử dùng thẻ bài miễn tử (Refresh Token)...");

          // --- Gọi API xin cấp lại Token mới ---
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                refresh_token: refreshToken // Gửi refreshToken lên
            })
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            console.log("✅ Gia hạn thành công!", refreshData);

            // Lấy token mới từ dữ liệu trả về (Cần check kỹ cấu trúc data.data... hay data...)
            // Giả sử server trả về: { data: { access_token: "..." } }
            const newAccessToken = refreshData.data?.access_token || refreshData.access_token;

            if (newAccessToken) {
                // 4. Lưu token mới vào túi ngay lập tức
                localStorage.setItem("accessToken", newAccessToken);
                token = newAccessToken; // Cập nhật biến tạm để dùng ngay bên dưới

                // 5. GỌI LẠI (RETRY) API lấy thông tin với Token Mới
                res = await fetch(`${API_BASE_URL}/users/info`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Dùng token mới tinh
                    }
                });
            }
          } else {
             console.log("❌ Thẻ bài miễn tử cũng hết hạn rồi. Bắt buộc đăng xuất.");
          }
        }

        // 6. Xử lý kết quả cuối cùng (Của lần 1 hoặc lần 2)
        if (res.ok) {
          const data = await res.json();
          setUserInfo(data); // Lưu thông tin user
          setIsLoggedIn(true);
        } else {
          // Cứu không được nữa thì đành logout
          handleLogout(false); 
        }

      } catch (error) {
        console.error("Lỗi kết nối:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // --- 2. CÁC HÀM PHỤ TRỢ (Logout, Delete) ---
  const handleLogout = (askConfirm = true) => {
    if (askConfirm) {
      const confirm = window.confirm("Bạn chắc chắn muốn rời khỏi hang sói?");
      if (!confirm) return;
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    
    setIsLoggedIn(false);
    setUserInfo(null);
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("CẢNH BÁO: Xóa tài khoản vĩnh viễn? Hành động này không thể hoàn tác!");
    if (confirmDelete) {
      const token = localStorage.getItem("accessToken");
      try {
        const res = await fetch(`${API_BASE_URL}/users/delete`, { 
          method: 'POST', 
          headers: {
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          alert("Đã xóa tài khoản.");
          localStorage.clear();
          setIsLoggedIn(false);
          router.push('/signup');
        } else {
            alert("Lỗi xóa tài khoản.");
        }
      } catch (error) { console.error(error); }
    }
  };

  // --- GIAO DIỆN ---
  if (isLoading) return <div className="lobby-container"><h2 style={{color: '#ff5470'}}>🐺 Đang kiểm tra danh tính...</h2></div>;

  return (
    <div className="lobby-container">
      <h1 className="lobby-title">🐺 MA SÓI ONLINE</h1>
      
      {isLoggedIn ? (
        <div className="lobby-box">
          <h3 className="lobby-welcome">
            Chào mừng, <span style={{color: '#ff9f43'}}>{userInfo?.username || localStorage.getItem('username')}</span>!
          </h3>
          <p className="lobby-desc">Đêm nay bạn muốn làm gì?</p>
          
          <div className="btn-group">
            <button onClick={() => alert("Sắp ra mắt...")} className="btn btn-play">🎮 TÌM PHÒNG CHƠI</button>
            <button onClick={() => handleLogout(true)} className="btn btn-logout">🚪 Đăng xuất</button>
            <button onClick={handleDeleteAccount} className="btn btn-delete" style={{marginTop:'15px', color:'#ff4d4d', border:'1px solid #ff4d4d', background:'transparent'}}>⚠️ Xóa tài khoản</button>
          </div>
        </div>
      ) : (
        <div className="lobby-box">
          <p className="lobby-desc">Bạn chưa có danh phận? Hãy gia nhập bầy đàn ngay!</p>
          <div className="btn-group">
            <Link href="/signin" style={{width: '100%'}}><button className="btn btn-primary">ĐĂNG NHẬP</button></Link>
            <Link href="/signup" style={{width: '100%'}}><button className="btn btn-secondary">ĐĂNG KÝ</button></Link>
          </div>
        </div>
      )}
    </div>
  );
}