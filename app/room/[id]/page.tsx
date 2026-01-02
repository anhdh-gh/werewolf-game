"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './room.module.css';

export default function GameRoom() {
  const params = useParams();
  const router = useRouter();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  const [players, setPlayers] = useState<any[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // --- SỬA 1: Khởi tạo null hoặc 0 để tránh hiển thị sai 10 ô trước khi có dữ liệu ---
  // Nếu muốn mặc định 10 khi mất kết nối thì để 10, còn muốn chuẩn thì để 0
  const [maxPlayers, setMaxPlayers] = useState(4); 

  useEffect(() => {
    const wsUrl = localStorage.getItem("current_ws_url");
    const username = localStorage.getItem("username");
    setCurrentUser(username);
    
    if (!wsUrl) {
      alert("Không tìm thấy cấu hình kết nối!");
      router.push('../lobby');
      return;
    }

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("✅ Đã kết nối WebSocket");
      ws.send(JSON.stringify({ 
        type: "JOIN", 
        username: username,
        token: localStorage.getItem("accessToken")
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 Tin nhắn:", data);

      // --- SỬA 2: Bắt sự kiện cập nhật phòng và lấy max_players chuẩn ---
      if (data.type === "ROOM_UPDATE" || data.type === "JOIN_SUCCESS") {
        if (data.players) {
            setPlayers(data.players);
        }
        
        // Kiểm tra kỹ xem server trả về max_players ở cấp ngoài hay trong object room
        // Ví dụ: data.max_players hoặc data.room.max_players
        const roomLimit = data.max_players || data.room?.max_players;
        
        if (roomLimit) {
          setMaxPlayers(roomLimit);
        }
      }
    };

    ws.onclose = () => {
      console.log("❌ Mất kết nối WebSocket");
      localStorage.removeItem("current_ws_url");
    };

    setSocket(ws);
    return () => ws.close();
  }, [router]);

  const toggleReady = () => {
    const nextReadyState = !isReady;
    setIsReady(nextReadyState);
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "READY_STATUS",
        isReady: nextReadyState
      }));
    }
  };

  const isAllReady = players.length >= Math.max(4, players.length) && players.every(p => p.isReady);
  const isHost = players.find(p => p.username === currentUser)?.isHost;

  return (
    <div className={styles.roomContainer}>
      <div className={styles.roomHeader}>
        <h2>Phòng: <span className={styles.highlight}>{params.id}</span></h2>
        {/* Hiển thị số lượng người chơi hiện tại / tối đa để dễ debug */}
        <p style={{fontSize: '0.8rem', opacity: 0.7}}>
            ({players.length} / {maxPlayers > 0 ? maxPlayers : '...'})
        </p>
        <button className={styles.btnLeave} onClick={() => router.push('../lobby')}>Thoát phòng</button>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.playerGrid}>
          {/* 1. Render người chơi đã có */}
          {players.map((player) => (
            <div 
              key={player.id || player.username} 
              className={`${styles.playerCard} ${player.isHost ? styles.hostCard : ''}`}
            >
              <div className={styles.avatarWrapper}>
                <div className={styles.idAvatar}>
                   {player.username?.substring(0, 2).toUpperCase()}
                </div>
                {player.isReady && <span className={styles.readyBadge}>✓</span>}
              </div>
              
              <p className={styles.playerName}>
                {player.username} {player.username === currentUser && "(Bạn)"}
              </p>
              
              {player.isHost && <span className={styles.badgeHost}>CHỦ PHÒNG</span>}
            </div>
          ))}

          {/* 2. Render các ô trống còn lại */}
          {/* Logic: Số ô trống = Tổng giới hạn (maxPlayers) - Số người đang có (players.length) */}
          {/* Nếu maxPlayers chưa load kịp (vẫn là 0) thì không render ô trống nào (tránh lỗi giao diện) */}
          {maxPlayers > 0 && Array.from({ length: Math.max(0, maxPlayers - players.length) }).map((_, i) => (
            <div key={`empty-${i}`} className={`${styles.playerCard} ${styles.emptySlot}`}>
              <div className={styles.idAvatarEmpty}>?</div>
              <p className={styles.emptyText}>Chờ...</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.roomActions}>
        <button 
          className={`${styles.btnReady} ${isReady ? styles.btnReadyActive : ''}`}
          onClick={toggleReady}
        >
          {isReady ? "HỦY SẴN SÀNG" : "SẴN SÀNG"}
        </button>

        {isHost && (
          <button 
            className={styles.btnStart} 
            disabled={!isAllReady}
            title={!isAllReady ? "Cần tối thiểu người chơi và tất cả phải sẵn sàng" : ""}
          >
            BẮT ĐẦU VÀO ĐÊM
          </button>
        )}
      </div>
    </div>
  );
}