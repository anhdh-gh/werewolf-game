"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Creepster, Nosifer } from "next/font/google";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";
import { API_PATHS } from "@/constants/paths.api";

// Tối ưu Font: Next.js sẽ tự động tải và lưu font này ở server nội bộ
const fontHorror = Creepster({ weight: "400", subsets: ["latin"], display: "swap" });
const fontBlood = Nosifer({ weight: "400", subsets: ["latin"], display: "swap" });

export default function ServerPage() {
  const router = useRouter();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState(null);

  useEffect(() => {
    // Chỉ thực hiện xóa khi cần thiết để tránh chặn main thread
    const itemsToRemove = [KEYS.SERVER_SELECTED, KEYS.ACCESS_TOKEN, KEYS.REFRESH_TOKEN, KEYS.USER_ID, KEYS.USERNAME];
    itemsToRemove.forEach(key => localStorage.removeItem(key));

    const fetchServers = async () => {
      try {
        const res = await fetch(API_PATHS.SERVER_LIST);
        const data = await res.json();
        setServers(data?.data?.servers || []);
      } catch (err) {
        console.error("Failed to fetch servers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  const handleSelect = (server) => {
    localStorage.setItem(KEYS.SERVER_SELECTED, JSON.stringify(server));
    setSelectedServer(server);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center px-4">
      
      {/* 1. Tối ưu Ảnh nền: Dùng Image component thay vì style background-image */}
      <Image
        src="/image/select_server.png"
        alt="Horror Background"
        fill
        priority
        className="object-cover opacity-60 contrast-125 saturate-150" // Dùng class thay vì inline style filter nặng
      />

      {/* 2. Overlay ma mị: Dùng gradient thay vì filter toàn trang */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/80 z-10 pointer-events-none" />

      <div className="w-full max-w-md flex flex-col items-center gap-8 relative z-20 py-8">
        {/* Header */}
        <div className="text-center w-full">
          <h1 className={`${fontHorror.className} text-4xl sm:text-5xl text-[#990000] mb-3 drop-shadow-[0_0_15px_rgba(255,0,0,0.4)] tracking-widest`}>
            CHỌN MÁY CHỦ
          </h1>
          <p className={`${fontHorror.className} text-red-600/90 text-2xl tracking-widest`}>
            "Cẩn thận... lũ sói đang đói"
          </p>
        </div>

        {/* Server List */}
        <div className="w-full flex flex-col gap-4 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="animate-pulse space-y-4">
              ={[1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 border border-white/5" />)}
            </div>
          ) : (
            servers.map((sv) => {
              const isSelected = selectedServer?.id === sv.id;
              return (
                <button
                  key={sv.id}
                  onClick={() => handleSelect(sv)}
                  className={`relative w-full rounded-2xl p-5 transition-all duration-300 group
                    ${isSelected 
                      ? "bg-red-950/40 border-2 border-red-700 shadow-[0_0_20px_rgba(153,0,0,0.3)]" 
                      : "bg-black/40 border border-white/10 hover:border-red-900/50 hover:bg-red-900/5"}`}
                >
                  <div className="flex flex-col items-start">
                    <span className={`${fontHorror.className} text-2xl ${isSelected ? "text-red-500" : "text-gray-400 group-hover:text-red-400"}`}>
                      {isSelected ? "🩸" : "💀"} {sv.name}
                    </span>
                    <span className="text-[10px] font-mono opacity-30 uppercase tracking-tighter">ID: {sv.id}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Action Button */}
        {selectedServer && (
          <div className="w-full flex flex-col gap-4 mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={() => router.push(PATHS.SIGN_IN)}
              className="relative w-full py-5 rounded-2xl text-red-100 bg-[#7f1d1d] hover:bg-red-700 border-2 border-red-900 transition-all overflow-hidden"
            >
              <span className={`${fontHorror.className} relative z-10 text-3xl drop-shadow-[2px_2px_2px_black]`}>
                VÀO LÀNG
              </span>
              {/* Giọt máu tĩnh - Tối ưu bằng Tailwind thay vì div chay */}
              <div className="absolute top-0 left-[20%] w-[1px] h-4 bg-red-500/40" />
              <div className="absolute top-0 left-[50%] w-[1px] h-6 bg-red-500/40" />
              <div className="absolute top-0 left-[80%] w-[1px] h-3 bg-red-500/40" />
            </button>

            <button
              onClick={() => router.push(PATHS.SIGN_UP)}
              className={`${fontHorror.className} w-full py-2 text-red-800 text-lg hover:text-red-500 transition-colors tracking-widest`}
            >
              Linh hồn mới vào!... Đăng ký
            </button>
          </div>
        )}
      </div>
      
      {/* Tối ưu Custom Scrollbar chỉ dành riêng cho vùng này */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #450a0a; border-radius: 10px; }
      `}</style>
    </div>
  );
}