"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './global.css'; 

export default function Home() {
  const router = useRouter();
  
  // --- STATE ---
  const [serverList, setServerList] = useState<any[]>([]); 
  const [selectedServer, setSelectedServer] = useState<any>(null); 
  
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ QUAN TRỌNG: Gọi vào "Cầu nối" nội bộ (File route.ts vừa tạo)
  // Không điền link https://werewolf1... vào đây để tránh lỗi CORS
  const MASTER_SERVER_API = "/api/get-servers";

  // --- 1. LOGIC KHỞI TẠO ---
  useEffect(() => {
    const initData = async () => {
      // Kiểm tra xem người dùng đã chọn server nào chưa
      const savedServerJson = localStorage.getItem("selectedServer");

      if (savedServerJson) {
        // TRƯỜNG HỢP 1: Người cũ (Đã chọn rồi) -> Vào thẳng logic Login
        const parsedServer = JSON.parse(savedServerJson);
        setSelectedServer(parsedServer);
        await checkLoginStatus(parsedServer);
      } else {
        // TRƯỜNG HỢP 2: Người mới -> Gọi API lấy danh sách Server
        console.log("🌍 Đang tải danh sách server...");
        try {
          const res = await fetch(MASTER_SERVER_API);
          const data = await res.json();

          // Cấu trúc API trả về: { meta:..., data: { servers: [...] } }
          if (data?.data?.servers) {
            console.log("✅ Đã lấy được danh sách:", data.data.servers);
            setServerList(data.data.servers);
          }
        } catch (error) {
          console.error("❌ Lỗi lấy server:", error);
          alert("Không thể tải danh sách máy chủ via Proxy.");
        } finally {
          setIsLoading(false); // Tắt loading để hiện màn hình chọn
        }
      }
    };

    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  // --- 2. HÀM CHECK LOGIN & REFRESH TOKEN ---
  const checkLoginStatus = async (currentServer: any) => {
    setIsLoading(true);

    // Ghép API User: https://domain + /api/v1
    const API_BASE_URL = `${currentServer.api}/api/v1`; 

    let token = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!token) {
      setIsLoggedIn(false);
      setIsLoading(false);
      return;
    }

    try {
      let res = await fetch(`${API_BASE_URL}/users/info`, { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // Nếu Token hết hạn (401) -> Gọi Refresh
      if (res.status === 401 && refreshToken) {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newAccessToken = refreshData.data?.access_token || refreshData.access_token;
          const newRefreshToken = refreshData.data?.refresh_token || refreshData.refresh_token;

          if (newAccessToken) {
              localStorage.setItem("accessToken", newAccessToken);
              token = newAccessToken; 
              if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);
              
              // Gọi lại info lần 2
              res = await fetch(`${API_BASE_URL}/users/info`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                  }
              });
          }
        }
      }

      if (res.ok) {
        const data = await res.json();
        setUserInfo(data);
        setIsLoggedIn(true);
      } else {
        handleLocalLogout(); 
      }

    } catch (error) {
      console.error("Lỗi login:", error);
    } finally {
      setIsLoading(false);
    }
  };


  // --- 3. CÁC HÀM XỬ LÝ SỰ KIỆN ---
  const handleSelectServer = (server: any) => {
    // Lưu server vào túi và reload trang
    localStorage.setItem("selectedServer", JSON.stringify(server));
    setSelectedServer(server);
    window.location.reload(); 
  };

  const handleChangeServer = () => {
    if(!window.confirm("Đổi server sẽ cần đăng nhập lại. OK?")) return;
    localStorage.removeItem("selectedServer");
    handleLocalLogout();
    setSelectedServer(null);
    window.location.reload(); 
  };

  const handleLocalLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    setUserInfo(null);
  }

  const handleLogout = (askConfirm = true) => {
    if (askConfirm && !window.confirm("Đăng xuất?")) return;
    handleLocalLogout();
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Xóa vĩnh viễn?")) return;
    const token = localStorage.getItem("accessToken");
    const API_BASE_URL = `${selectedServer.api}/api/v1`;

    try {
      const res = await fetch(`${API_BASE_URL}/users/user-delete`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        alert("Đã xóa.");
        handleLocalLogout();
        window.location.reload();
      }
    } catch (e) { console.error(e); }
  };

  // --- 4. GIAO DIỆN ---
  if (isLoading) return <div className="lobby-container"><h2 style={{color: '#ff5470'}}>🚀 Đang kết nối...</h2></div>;

  // MÀN HÌNH CHỌN SERVER
  if (!selectedServer) {
      return (
        <div className="lobby-container">
            <h1 className="lobby-title">🌍 CHỌN MÁY CHỦ</h1>
            <div className="lobby-box">
                <p className="lobby-desc">Danh sách Server Online:</p>
                <div className="btn-group">
                    {serverList.length > 0 ? (
                        serverList.map((server) => (
                            <button 
                                key={server.id} 
                                onClick={() => handleSelectServer(server)}
                                className="btn btn-secondary"
                                style={{
                                    marginBottom: '10px', 
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px'
                                }}
                            >
                                <span style={{fontWeight:'bold'}}>{server.name}</span>
                                <span style={{fontSize: '12px', opacity: 0.8, background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius:'4px'}}>
                                    {server.id}
                                </span>
                            </button>
                        ))
                    ) : (
                        <p style={{color: 'gray'}}>Không tìm thấy server...</p>
                    )}
                </div>
            </div>
        </div>
      );
  }

  // MÀN HÌNH CHÍNH
  return (
    <div className="lobby-container">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', maxWidth:'400px', marginBottom:'20px'}}>
        <h1 className="lobby-title" style={{margin:0, fontSize: '24px'}}>🐺 MA SÓI</h1>
        <button onClick={handleChangeServer} style={{fontSize:'12px', padding:'5px 10px', background:'rgba(255,255,255,0.2)', color:'#fff', border:'none', borderRadius:'5px', cursor:'pointer'}}>
            Server: <b>{selectedServer.name}</b> (Đổi)
        </button>
      </div>
      
      {isLoggedIn ? (
        <div className="lobby-box">
          <h3 className="lobby-welcome">Chào, <span style={{color: '#ff9f43'}}>{userInfo?.username || localStorage.getItem('username')}</span>!</h3>
          <p className="lobby-desc">Khu vực: {selectedServer.name}</p>
          <div className="btn-group">
            <button onClick={() => alert(`WebSocket: ${selectedServer.ws}`)} className="btn btn-play">🎮 TÌM PHÒNG</button>
            <button onClick={() => handleLogout(true)} className="btn btn-logout">🚪 Đăng xuất</button>
            <button onClick={handleDeleteAccount} className="btn btn-delete" style={{marginTop:'15px', color:'#ff4d4d', border:'1px solid #ff4d4d', background:'transparent'}}>⚠️ Xóa TK</button>
          </div>
        </div>
      ) : (
        <div className="lobby-box">
          <p className="lobby-desc">Kết nối đến: <b>{selectedServer.name}</b></p>
          <div className="btn-group">
            <Link href="/signin" style={{width: '100%'}}><button className="btn btn-primary">ĐĂNG NHẬP</button></Link>
            <Link href="/signup" style={{width: '100%'}}><button className="btn btn-secondary">ĐĂNG KÝ</button></Link>
          </div>
        </div>
      )}
    </div>
  );
}