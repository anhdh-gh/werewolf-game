"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../room.module.css';

export default function GameRoom() {
  const params = useParams();
  const router = useRouter();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const wsUrl = localStorage.getItem("current_ws_url");
    
    if (!wsUrl) {
      alert("Không tìm thấy cấu hình kết nối!");
      router.push('/lobby');
      return;
    }

    // --- KẾT NỐI WEBSOCKET ---
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("✅ Đã kết nối WebSocket thành công");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 Nhận tin nhắn:", data);
      // Cập nhật trạng thái game/người chơi tại đây
    };

    ws.onclose = () => {
      console.log("❌ Mất kết nối WebSocket");
      localStorage.removeItem("current_ws_url");
    };

    setSocket(ws);

    // Cleanup: Ngắt kết nối khi rời khỏi trang (hoặc đóng tab)
    return () => ws.close();
  }, [router]);

  return (
    <div className={styles.roomContainer}>
      <h1>Phòng: {params.id}</h1>
      <div className={styles.gameArea}>
          {/* Giao diện chơi game ở đây */}
      </div>
      <button onClick={() => router.push('/lobby')}>Thoát phòng</button>
    </div>
  );
}