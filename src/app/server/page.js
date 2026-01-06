"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";
import { API_PATHS } from "@/constants/paths.api";

export default function ServerPage() {
  const router = useRouter();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(KEYS.SERVER_SELECTED);
      localStorage.removeItem(KEYS.ACCESS_TOKEN);
      localStorage.removeItem(KEYS.REFRESH_TOKEN);
      localStorage.removeItem(KEYS.USER_ID);
      localStorage.removeItem(KEYS.USERNAME);
    }

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
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleBackToSignIn = () => router.push(PATHS.SIGN_IN);
  const handleGoToSignup = () => router.push(PATHS.SIGN_UP);

  return (
    <div 
      className="min-h-screen text-white px-4 sm:px-5 md:px-6 flex items-center justify-center relative overflow-hidden bg-black"
      style={{
        backgroundImage: "url('/image/select_server.png')",
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'contrast(1.2) saturate(1.2) brightness(0.8)',
        minHeight: '100vh',
        width: '100vw',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Nhúng font ma mị trực tiếp */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Creepster&family=Nosifer&display=swap');
        
        .font-horror { font-family: 'Creepster', cursive; }
        .font-blood { font-family: 'Nosifer', cursive; }
        
        @keyframes bloodDrip {
          0% { height: 0; opacity: 0.8; }
          100% { height: 40px; opacity: 0; }
        }
        .blood-drip {
          position: absolute;
          top: 0;
          width: 3px;
          background: #ff0000;
          animation: bloodDrip 2s infinite;
          pointer-events: none;
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 ghostly-fog-layer-1 animate-fog-drift opacity-40" />
        <div className="absolute inset-0 ghostly-vignette" />
      </div>
      
      <div className="w-full max-w-md flex flex-col items-center gap-8 relative z-20 py-8">
        {/* Header - Phông chữ Nosifer uốn éo như máu chảy */}
        <div className="text-center px-4 w-full">
          <h1 className="text-4xl sm:text-5xl font-blood text-[#ff0000] mb-3 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] tracking-widest">
            CHỌN MÁY CHỦ
          </h1>
          <p className="text-red-500/80 text-lg font-horror tracking-widest animate-pulse">
            "Cẩn thận... lũ sói đang đói"
          </p>
        </div>
  
        {/* Server List */}
        <div className="w-full flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading
            ? [1, 2].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
              ))
            : servers.map((sv) => {
                const isSelected = selectedServer?.id === sv.id;
  
                return (
                  <button
                    key={sv.id}
                    onClick={() => handleSelect(sv)}
                    className={`
                        relative w-full rounded-2xl p-5 transition-all duration-500 overflow-hidden
                        ${isSelected 
                          ? "bg-red-950/60 border-2 border-red-600 shadow-[0_0_25px_rgba(153,27,27,0.6)]" 
                          : "bg-white/5 border border-white/10 hover:bg-red-900/20"}
                        group
                      `}
                  >
                    <div className="flex flex-col items-start relative z-10">
                      <span className={`text-xl sm:text-2xl font-horror transition-colors ${isSelected ? "text-red-500" : "text-gray-300 group-hover:text-red-400"}`}>
                        {isSelected ? "🩸 " : "💀 "} {sv.name}
                      </span>
                      <span className="text-xs font-mono opacity-40">ID:{sv.id}</span>
                    </div>
                  </button>
                );
              })}
        </div>
  
        {/* Action Button - Vào làng ma mị */}
        {selectedServer && (
          <div className="w-full flex flex-col gap-4 mt-2 animate-in fade-in zoom-in duration-700">
            <button
              onClick={handleBackToSignIn}
              className="group relative w-full py-5 rounded-2xl text-red-100 font-horror text-3xl bg-[#660000] hover:bg-[#880000] transition-all border-2 border-red-900 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            >
              {/* Hiệu ứng giọt máu chảy xuống khi chọn */}
              <div className="blood-drip left-[20%]" style={{ animationDelay: '0.1s' }} />
              <div className="blood-drip left-[50%]" style={{ animationDelay: '0.5s' }} />
              <div className="blood-drip left-[80%]" style={{ animationDelay: '0.3s' }} />
              
              <span className="relative z-10 drop-shadow-[2px_2px_2px_black]">
                VÀO LÀNG
              </span>
            </button>
  
            {/* Enhance the 'Đăng ký ngay' button */}
            <button
              onClick={handleGoToSignup}
              className="w-full py-2 text-gray-500 font-horror text-sm hover:text-red-500 transition-colors uppercase tracking-[0.3em] relative group"
            >
              <span className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-20 transition-opacity rounded-md"></span>
              <span className="relative z-10 font-bold text-red-600 group-hover:text-red-700">
                Linh hồn mới? Đăng ký ngay...
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}