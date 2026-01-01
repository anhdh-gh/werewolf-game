"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import 'app/global.css'; // Sửa lại đường dẫn import cho chuẩn
import { appRouterContext } from 'next/dist/server/route-modules/app-route/shared-modules';

export default function Home() {
  const router = useRouter();
  
  // --- STATE ---
  const [apiUrl, setApiUrl] = useState("");
  // SỬA: Đổi tên từ API_BASE thành apiBase (viết thường) để tránh trùng tên với biến cục bộ và dùng const thay vì var
  const [apiBase, setApiBase] = useState(""); 
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [Players, setPlayers] = useState(10); 
  const [isCreating, setIsCreating] = useState(false); 

   const handleLocalLogout = useCallback(() => { // Thêm useCallback để tránh loop trong useEffect
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    setUserInfo(null);
  }, []);

  // --- 1. HÀM CHECK LOGIN ---
  const checkLoginStatus = useCallback(async (currentApiUrl: string) => {
    if (!currentApiUrl) {
        setIsLoading(false);
        return;
    }

    const API_BASE_LOCAL = currentApiUrl.endsWith('/api/v1') ? currentApiUrl : `${currentApiUrl}/api/v1`;

    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (accessToken) {
        setIsLoggedIn(true);
    }

    if (!accessToken && !refreshToken) {
        setIsLoggedIn(false);
        setIsLoading(false);
        return;
    }

    try {
        if (!refreshToken) throw new Error("No refresh token");

        const refreshRes = await fetch(`${API_BASE_LOCAL}/auth/refresh`, { 
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
                if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);
                setIsLoggedIn(true); 
            }
        } else {
            if (!accessToken) {
                handleLocalLogout();
            }
        }
    } catch (error) {
        console.error("❌ Lỗi mạng:", error);
        if (accessToken) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
    } finally {
        setIsLoading(false);
    }
  }, [handleLocalLogout]);

  // --- 2. KHỞI TẠO ---
  useEffect(() => {
    const initData = async () => {
      const savedServer = localStorage.getItem("selectedServer");
      
      if (savedServer) {
        try {
          const serverObj = JSON.parse(savedServer);
          const url = serverObj.api;
          setApiUrl(url);
          // SỬA: Gọi hàm setApiBase(...) thay vì dùng dấu bằng =
          setApiBase(url.endsWith('/api/v1') ? url : `${url}/api/v1`);
         
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

  const handleLogout = (askConfirm = true) => {
    if (askConfirm && !window.confirm("Bạn chắc chắn muốn đăng xuất?")) return;
    handleLocalLogout();
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("CẢNH BÁO: Xóa tài khoản vĩnh viễn?")) return;
    
    // SỬA: Khai báo lại biến accessToken lấy từ localStorage để hàm fetch bên dưới có dữ liệu dùng
    const tokenToDelete = localStorage.getItem("accessToken");
   
    try {
      // SỬA: Dùng biến state apiBase (đã sửa tên ở trên) và biến token vừa lấy
      const res = await fetch(`${apiBase}/users/user-delete`, { 
        method: 'POST', 
        headers: { 
          'Authorization': `Bearer ${tokenToDelete}`, 
          'Content-Type': 'application/json' 
        },
      });
      if (res.ok) {
        alert("Đã xóa tài khoản.");
        handleLocalLogout();
        window.location.reload();
      } else { alert("Lỗi xóa tài khoản."); }
    } catch (e) { console.error(e); }
  };

  const handleCreateRoom = async() =>{
   let players = window.prompt("Nhập số lượng người chơi :","10");
   
   if(!players){
    return;
   }
    let numPlayers = parseInt(players);
    if(isNaN(numPlayers) || numPlayers < 4 || numPlayers > 15){
      alert("số lượng người chơi không họp lệ");
      return;
    }

    setIsCreating(true);
    const token = localStorage.getItem("accessToken");
    if(token){
      console.log("không còn access_token");
    }

    try{
      const res = await fetch(`${apiBase}/rooms/create`,{
        method : 'POST',
        headers :{
          'Authorization' : `Bearer ${token}`,
          'Content-Type' : 'application/json'
        },
        body: JSON.stringify({
           room:{
            max_players : numPlayers
          }
      })
      });

      const data = await res.json();
      if(res.ok){
        let urlWebSoket = data.data.next_step.websocket;
        localStorage.setItem("current_ws_url",urlWebSoket);
        console.log("phòng đã tạo: " + data);
        var roomCode = data.data.room.code;
        alert(`Tạo phòng thành công! Mã phòng : ${ roomCode|| '...'}`)
        router.push(`/room/${roomCode}`)
      }
      else{
        alert("Lỗi tạo phòng ");
      }

    }catch(error){
      console.error("lỗi kêt lối:" + error);
      alert("khong thể kết nối máy chủ");
    } finally{
      setIsCreating(false);
    }
  };




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
            Chào, <span style={{color: '#ff9f43'}}>{localStorage.getItem('username') || "Thợ Săn"}</span>!
          </h3>
          <p className="lobby-desc">Sẵn sàng đi săn chưa?</p>
          <div className="btn-group">
            <button className="btn btn-play" onClick={handleCreateRoom} disabled={isCreating}>
              {isCreating ? "⌛ Đang tạo..." : "🎮 Tạo Phòng"}
            </button>
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