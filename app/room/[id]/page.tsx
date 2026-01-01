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

  // --- SỬA: Thêm state lưu số lượng người chơi tối đa ---
  const [maxPlayers, setMaxPlayers] = useState(10); 

  useEffect(() => {
    const wsUrl = localStorage.getItem("current_ws_url");
    const username = localStorage.getItem("username");
    setCurrentUser(username);
    
    if (!wsUrl) {
      alert("Không tìm thấy cấu hình kết nối!");
      router.push('/');
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

      if (data.type === "ROOM_UPDATE") {
        setPlayers(data.players);
        
        // --- SỬA: Cập nhật maxPlayers từ Server nếu có gửi kèm ---
        if (data.max_players) {
          setMaxPlayers(data.max_players);
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

  const isAllReady = players.length >= 6 && players.every(p => p.isReady);
  const isHost = players.find(p => p.username === currentUser)?.isHost;

  return (
    <div className={styles.roomContainer}>
      <div className={styles.roomHeader}>
        <h2>Phòng: <span className={styles.highlight}>{params.id}</span></h2>
        <button className={styles.btnLeave} onClick={() => router.push('/')}>Thoát</button>
      </div>

      <div className={styles.gameArea}>
        <div className={styles.playerGrid}>
          {players.map((player) => (
            <div 
              key={player.id} 
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

          {/* --- SỬA: Thay số 10 cố định bằng biến maxPlayers linh hoạt --- */}
          {Array.from({ length: Math.max(0, maxPlayers - players.length) }).map((_, i) => (
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
            title={!isAllReady ? "Cần tối thiểu 6 người và tất cả phải sẵn sàng" : ""}
          >
            BẮT ĐẦU VÀO ĐÊM
          </button>
        )}
      </div>
    </div>
  );
}