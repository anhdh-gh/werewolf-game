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
      className="min-h-screen text-white px-4 sm:px-5 md:px-6 flex items-center justify-center relative bg-black"
      style={{
        backgroundImage: "url('/image/select_server.png')",
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'contrast(1.2) saturate(1.1) brightness(0.7)',
        minHeight: '100vh',
        width: '100vw',
      }}
    >
      {/* Font ma mị tĩnh */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Creepster&family=Nosifer&display=swap');
        .font-horror { font-family: 'Creepster', cursive; }
        .font-blood { font-family: 'Nosifer', cursive; }
      `}</style>

      {/* Overlay tĩnh để tăng độ tối, thay thế cho sương mù */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-10" />
      
      <div className="w-full max-w-md flex flex-col items-center gap-8 relative z-20 py-8">
        {/* Header */}
        <div className="text-center px-4 w-full">
          <h1 className="text-4xl sm:text-5xl font-blood text-[#990000] mb-3 drop-shadow-[0_0_10px_rgba(0,0,0,1)] tracking-widest">
            CHỌN MÁY CHỦ
          </h1>
          <p className="text-red-600/90 text-lg font-horror tracking-widest">
            "Cẩn thận... lũ sói đang đói"
          </p>
        </div>
  
        {/* Server List */}
        <div className="w-full flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {loading
            ? [1, 2].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-white/5 border border-white/10" />
              ))
            : servers.map((sv) => {
                const isSelected = selectedServer?.id === sv.id;
  
                return (
                  <button
                    key={sv.id}
                    onClick={() => handleSelect(sv)}
                    className={`
                        relative w-full rounded-2xl p-5 transition-all duration-200
                        ${isSelected 
                          ? "bg-red-950/70 border-2 border-red-700 shadow-[0_0_15px_rgba(153,0,0,0.5)]" 
                          : "bg-black/40 border border-white/10 hover:bg-red-900/10"}
                      `}
                  >
                    <div className="flex flex-col items-start relative z-10">
                      <span className={`text-xl sm:text-2xl font-horror ${isSelected ? "text-red-500" : "text-gray-300"}`}>
                        {isSelected ? "🩸 " : "💀 "} {sv.name}
                      </span>
                      <span className="text-[10px] font-mono opacity-30">ID:{sv.id}</span>
                    </div>
                  </button>
                );
              })}
        </div>
  
        {/* Action Button */}
        {selectedServer && (
          <div className="w-full flex flex-col gap-4 mt-2">
            <button
              onClick={handleBackToSignIn}
              className="relative w-full py-5 rounded-2xl text-red-100 font-horror text-3xl bg-[#7f1d1d] hover:bg-[#991b1b] border-2 border-red-900 shadow-[0_5px_15px_rgba(0,0,0,0.5)]"
            >
              <span className="relative z-10 drop-shadow-[2px_2px_2px_black]">
                VÀO LÀNG
              </span>
              {/* Giọt máu tĩnh (không chuyển động) */}
              <div className="absolute top-0 left-[20%] w-[2px] h-4 bg-red-600 opacity-60" />
              <div className="absolute top-0 left-[50%] w-[2px] h-6 bg-red-600 opacity-60" />
              <div className="absolute top-0 left-[80%] w-[2px] h-3 bg-red-600 opacity-60" />
            </button>
  
            <button
              onClick={handleGoToSignup}
              className="w-full py-2 text-red-700 font-horror text-sm hover:text-red-500 transition-colors uppercase tracking-[0.2em]"
            >
              📝 Đăng ký
            </button>
          </div>
        )}
      </div>
    </div>
  );
}