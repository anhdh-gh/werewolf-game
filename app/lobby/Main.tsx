"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import 'app/global.css'

export default function Home() {
  const router = useRouter();
  
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [serverList, setServerList] = useState<any[]>([]); 
  const [selectedServer, setSelectedServer] = useState<any>(null); 
  
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ CHUẨN: Gọi vào API nội bộ (File route.ts bạn vừa tạo)
  // Next.js sẽ tự động nối cầu sang server thật, không bị lỗi CORS nữa.
  const MASTER_SERVER_API = "https://werewolf.anhdh.net/api/v1/servers/info";

  // --- 1. LOGIC KHỞI TẠO (Chạy 1 lần khi vào trang) ---
  useEffect(() => {
    const initData = async () => {
      // B1: Kiểm tra xem trong máy đã lưu server nào chưa?
      const savedServerJson = localStorage.getItem("selectedServer");

      if (savedServerJson) {
        // --- TRƯỜNG HỢP 1: NGƯỜI CŨ (Đã chọn server từ trước) ---
        try {
          const parsedServer = JSON.parse(savedServerJson);
          setSelectedServer(parsedServer);
          // Có server rồi thì đi kiểm tra đăng nhập luôn
          await checkLoginStatus(parsedServer);
        } catch (e) {
          // Phòng trường hợp dữ liệu cũ bị lỗi
          localStorage.removeItem("selectedServer");
          window.location.reload();
        }
      } else {
        // --- TRƯỜNG HỢP 2: NGƯỜI MỚI (Chưa chọn server) ---
        console.log("🌍 Đang gọi API nội bộ để lấy danh sách server...");
        try {
          const res = await fetch(MASTER_SERVER_API);
          
          // Kiểm tra kỹ xem API có trả về lỗi HTML không (lỗi 404/500)
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("text/html")) {
             throw new Error("API Proxy trả về HTML (Kiểm tra lại tên file route.ts)");
          }

          if (!res.ok) {
            throw new Error(`Lỗi HTTP: ${res.status}`);
          }

          const data = await res.json();
          console.log("✅ Dữ liệu Server trả về:", data);

          // Cấu trúc: { meta: ..., data: { servers: [...] } }
          if (data?.data?.servers) {
            setServerList(data.data.servers);
          } else {
             console.warn("API trả về nhưng không có danh sách servers:", data);
          }
        } catch (error) {
          console.error("❌ Lỗi tải server:", error);
          alert("Không thể tải danh sách máy chủ. Vui lòng kiểm tra lại file api/get-servers/route.ts");
        } finally {
          setIsLoading(false); // Tắt loading để hiện màn hình chọn
        }
      }
    };

    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  // --- 2. HÀM KIỂM TRA ĐĂNG NHẬP ---
  const checkLoginStatus = async (currentServer: any) => {
    setIsLoading(true);

    // Xử lý URL: API trả về domain gốc, ta cộng thêm /api/v1
    // Ví dụ: https://werewolf.anhdh.net + /api/v1
    const API_BASE_URL = `${currentServer.api}/api/v1`; 

    let token = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!token) {
      setIsLoggedIn(false);
      setIsLoading(false);
      return;
    }

    try {
      // Gọi API lấy thông tin User
      let res = await fetch(`${API_BASE_URL}/users/info`, { 
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // --- LOGIC GIA HẠN TOKEN (AUTO REFRESH) ---
      if (res.status === 401 && refreshToken) {
        console.log("⚠️ Token hết hạn! Đang xin cấp lại...");
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, { 
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

      // Xử lý kết quả cuối cùng
      if (res.ok) {
        const data = await res.json();
        setUserInfo(data);
        setIsLoggedIn(true);
      } else {
        // Token hỏng hẳn -> Đăng xuất cục bộ
        handleLocalLogout(); 
      }

    } catch (error) {
      console.error("Lỗi login:", error);
      // Nếu lỗi mạng, tạm thời coi như chưa login
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };


  // --- 3. CÁC HÀM XỬ LÝ SỰ KIỆN ---

  const handleSelectServer = (server: any) => {
    // 1. Lưu server vào túi
    localStorage.setItem("selectedServer", JSON.stringify(server));
    setSelectedServer(server);
    
    // 2. Reload trang để code chạy lại từ đầu với server mới (Cách an toàn nhất)
    window.location.reload(); 
  };

  const handleChangeServer = () => {
    if(!window.confirm("Đổi máy chủ sẽ cần đăng nhập lại. Bạn có chắc không?")) return;
    
    // Xóa server đã chọn và token cũ
    localStorage.removeItem("selectedServer");
    handleLocalLogout();
    
    // Reset state để hiện lại màn hình chọn
    setSelectedServer(null);
    
    // Reload để gọi lại API lấy danh sách mới nhất
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
    if (askConfirm && !window.confirm("Bạn chắc chắn muốn đăng xuất?")) return;
    handleLocalLogout();
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("CẢNH BÁO: Hành động này sẽ xóa tài khoản vĩnh viễn!")) return;
    
    const token = localStorage.getItem("accessToken");
    const API_BASE_URL = `${selectedServer.api}/api/v1`;

    try {
      const res = await fetch(`${API_BASE_URL}/users/user-delete`, { 
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

  // Giai đoạn: CHƯA CHỌN SERVER -> Hiện danh sách
  if (!selectedServer) {
      return (
        <div className="lobby-container">
            <h1 className="lobby-title">🌍 CHỌN MÁY CHỦ</h1>
            <div className="lobby-box">
                <p className="lobby-desc">Danh sách Server Online (Lấy từ API):</p>
                <div className="btn-group">
                    {serverList.length > 0 ? (
                        serverList.map((server) => (
                            <button 
                                key={server.id} 
                                onClick={() => handleSelectServer(server)}
                                className="btn btn-secondary"
                                style={{
                                    marginBottom: '10px', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: '15px'
                                }}
                            >
                                <span style={{fontWeight:'bold'}}>{server.name}</span>
                                <span style={{fontSize: '12px', opacity: 0.8, background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius:'4px'}}>
                                    {server.id}
                                </span>
                            </button>
                        ))
                    ) : (
                        <div style={{textAlign: 'center'}}>
                            <p style={{color: 'gray', marginBottom: '10px'}}>Không tìm thấy server nào...</p>
                            <button onClick={() => window.location.reload()} className="btn" style={{fontSize: '12px'}}>Thử lại</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      );
  }

  // Giai đoạn: ĐÃ CHỌN SERVER -> Hiện Sảnh hoặc Form Login
  return (
    <div className="lobby-container">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', maxWidth:'400px', marginBottom:'20px'}}>
        <h1 className="lobby-title" style={{margin:0, fontSize: '24px'}}>🐺 MA SÓI</h1>
        {/* Nút đổi server */}
        <button onClick={handleChangeServer} style={{fontSize:'12px', padding:'5px 10px', background:'rgba(255,255,255,0.2)', color:'#fff', border:'none', borderRadius:'5px', cursor:'pointer'}}>
            Server: <b>{selectedServer.name}</b> (Đổi)
        </button>
      </div>
      
      {isLoggedIn ? (
        // ĐÃ ĐĂNG NHẬP
        <div className="lobby-box">
          <h3 className="lobby-welcome">
            Chào, <span style={{color: '#ff9f43'}}>{userInfo?.username || localStorage.getItem('username')}</span>!
          </h3>
          <p className="lobby-desc">Bạn đang ở khu vực: {selectedServer.name}</p>
          
          <div className="btn-group">
            <button onClick={() => alert(`Kết nối WebSocket: ${selectedServer.ws}`)} className="btn btn-play">🎮 TÌM PHÒNG</button>
            <button onClick={() => handleLogout(true)} className="btn btn-logout">🚪 Đăng xuất</button>
            <button onClick={handleDeleteAccount} className="btn btn-delete" style={{marginTop:'15px', color:'#ff4d4d', border:'1px solid #ff4d4d', background:'transparent'}}>⚠️ Xóa TK</button>
          </div>
        </div>
      ) : (
        // CHƯA ĐĂNG NHẬP
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