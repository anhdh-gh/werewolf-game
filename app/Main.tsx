"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Import hook điều hướng
import './global.css';

export default function Home() {
  const router = useRouter();

  // --- STATE ---
  const [serverList, setServerList] = useState<any[]>([]); 
  const [selectedServer, setSelectedServer] = useState<any>(null); // Server đã chọn
  const [selectedWS,setSelectedWS] = useState<any>(null);
  const [tempSelected, setTempSelected] = useState<any>(null); // Server đang chọn trong dropdown
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. KHỞI TẠO ---
  useEffect(() => {
    const initData = async () => {
      const savedServerJson = localStorage.getItem("selectedServer");
      if (savedServerJson) {
        try {
          const parsedServer = JSON.parse(savedServerJson);
          setSelectedServer(parsedServer);
          // Nếu đã chọn server rồi, bạn có muốn tự động nhảy sang signin luôn không?
          // Nếu muốn tự động thì uncomment dòng dưới:
          // router.push('/signin'); 
        } catch (e) {
          resetSelection();
        } finally {
          setIsLoading(false);
        }
      } else {
        await fetchServerList();
      }
    };
    initData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchServerList = async () => {
    try {
      const res = await fetch("/api/get-servers"); 
      if (!res.ok) throw new Error("API Error");
      const data = await res.json();
      if (data?.data?.servers) {
        setServerList(data.data.servers);
        // Mặc định chọn server đầu tiên
        if (data.data.servers.length > 0) {
            setTempSelected(data.data.servers[0]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. XỬ LÝ SỰ KIỆN ---
  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serverId = e.target.value;
    const server = serverList.find(s => String(s.id) === serverId);
    setTempSelected(server);
  };

  

  // ===> ĐÂY LÀ ĐOẠN QUAN TRỌNG BẠN CẦN SỬA <===
  const handleConfirmServer = () => {
    if (!tempSelected) return;

    // 1. Lưu thông tin server vào trình duyệt
    localStorage.setItem("selectedServer", JSON.stringify(tempSelected));
    
    // 2. Xóa token cũ (để tránh xung đột tài khoản giữa các server)
    localStorage.removeItem("accessToken");

    // 3. CHUYỂN HƯỚNG SANG TRANG ĐĂNG NHẬP
    router.push('/signin'); 
  };

  const resetSelection = () => {
    localStorage.removeItem("selectedServer");
    localStorage.removeItem("accessToken");
    window.location.reload();
  };

  // --- 3. GIAO DIỆN ---
  if (isLoading) return <div className="lobby-container">Loading...</div>;

  // === MÀN HÌNH CHỌN SERVER (KHI CHƯA CHỌN) ===
  if (!selectedServer) {
    return (
      <div className="lobby-container">
        <h1 className="lobby-title">CHỌN MÁY CHỦ</h1>
        <div className="lobby-box" style={{maxWidth: '400px'}}>
            <p style={{marginBottom: '10px', color: '#ccc'}}>Vui lòng chọn khu vực:</p>
            
            <select 
                className="server-dropdown"
                onChange={handleDropdownChange}
                value={tempSelected?.id || ""}
                style={{
                    width: '100%', padding: '12px', marginBottom: '20px',
                    borderRadius: '5px', border: '1px solid #555',
                    backgroundColor: '#222', color: '#fff', fontSize: '16px'
                }}
            >
                {serverList.map((sv) => (
                    <option key={sv.id} value={sv.id}>
                        {sv.name}
                    </option>
                ))}
            </select>

            <button 
                onClick={handleConfirmServer} 
                className="btn btn-primary"
                style={{width: '100%', padding: '14px', fontWeight: 'bold'}}
            >
                XÁC NHẬN & ĐĂNG NHẬP
            </button>
        </div>
      </div>
    );
  }

  // === MÀN HÌNH KHI ĐÃ CÓ SERVER (Nếu user quay lại trang chủ) ===
  return (
    <div className="lobby-container">
      <div className="lobby-box">
         <h3>Đang ở server: <span style={{color: '#2ecc71'}}>{selectedServer.name}</span></h3>
         
         <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
             <button 
                className="btn btn-primary" 
                onClick={() => router.push('/signin')}
             >
                ➡️ Vào Đăng Nhập
             </button>
             
             <button 
                className="btn btn-secondary" 
                onClick={resetSelection}
             >
                🔄 Đổi Server khác
             </button>
         </div>
      </div>
    </div>
  );
}