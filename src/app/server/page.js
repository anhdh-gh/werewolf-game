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
      // Clear previous server & tokens to force new selection
      localStorage.removeItem(KEYS.SERVER_SELECTED);
      localStorage.removeItem(KEYS.ACCESS_TOKEN);
      localStorage.removeItem(KEYS.REFRESH_TOKEN);
      localStorage.removeItem(KEYS.USER_ID);
      localStorage.removeItem(KEYS.USERNAME);
    }

    // Fetch server list from API
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

  // Handle server selection
  const handleSelect = (server) => {
    // Save selected server to localStorage
    localStorage.setItem(KEYS.SERVER_SELECTED, JSON.stringify(server));
    setSelectedServer(server);

    // Vibrate lightly on mobile
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // Action buttons
  const handleBackToSignIn = () => router.push(PATHS.SIGN_IN);
  const handleGoToSignup = () => router.push(PATHS.SIGN_UP);

  return (
    <div 
      className="min-h-screen text-white px-4 sm:px-5 md:px-6 flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: "url('/image/OIG2.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)] pointer-events-none"></div>
      
      <div className="w-full max-w-md flex flex-col items-center gap-8 sm:gap-10 relative z-20 py-8 sm:py-10">
        {/* Header */}
        <div className="text-center px-4 w-full">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold werewolf-title mb-3 sm:mb-4">
            SELECT SERVER
          </h1>
          <p className="text-white/80 text-sm sm:text-base mt-2 tracking-wide werewolf-subtitle">
            Mỗi làng là một ván Ma Sói khác nhau
          </p>
        </div>

        {/* Server List */}
        <div className="w-full flex flex-col gap-4 sm:gap-5">
          {loading
            ? [1, 2].map((i) => (
              <div
                key={i}
                className="h-20 sm:h-24 rounded-2xl werewolf-server-card animate-pulse"
              />
            ))
            : servers.map((sv) => {
              const isSelected = selectedServer?.id === sv.id;

              return (
                <button
                  key={sv.id}
                  onClick={() => handleSelect(sv)}
                  className={`
                      relative w-full rounded-2xl p-5 sm:p-6 werewolf-server-card
                      ${isSelected ? "werewolf-server-selected" : ""}
                      active:scale-[0.98]
                      flex items-center justify-between
                      group
                    `}
                >
                  <div className="flex flex-col items-start gap-1.5 relative z-10 flex-1 min-w-0">
                    <span className="text-base sm:text-lg md:text-xl font-semibold text-white truncate w-full werewolf-text">
                      {isSelected ? "🌕 " : "🐺 "} {sv.name}
                    </span>
                    <span className="text-xs sm:text-sm text-white/60 font-normal werewolf-text">Làng #{sv.id}</span>
                  </div>

                  <span className="relative flex h-3.5 w-3.5 sm:h-4 sm:w-4 relative z-10 ml-3 sm:ml-4 flex-shrink-0">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full ${
                        isSelected 
                          ? "bg-[rgba(220,20,60,0.6)] opacity-70" 
                          : "bg-[rgba(138,43,226,0.4)] opacity-50"
                      } animate-ping`}
                    />
                    <span
                      className={`relative inline-flex h-full w-full rounded-full ${
                        isSelected 
                          ? "bg-[rgba(220,20,60,1)] shadow-[0_0_12px_rgba(220,20,60,0.8)]" 
                          : "bg-[rgba(138,43,226,0.8)] shadow-[0_0_8px_rgba(138,43,226,0.6)]"
                      }`}
                    />
                  </span>
                </button>
              );
            })}
        </div>

        {/* Action Buttons: show only when a server is selected */}
        {selectedServer && (
          <div className="w-full flex flex-col gap-3 sm:gap-4 mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={handleBackToSignIn}
              className="w-full py-4 sm:py-4.5 rounded-2xl text-white font-semibold text-sm sm:text-base werewolf-button-primary werewolf-text shadow-lg"
            >
              JOIN SERVER
            </button>

            <button
              onClick={handleGoToSignup}
              className="w-full py-4 sm:py-4.5 rounded-2xl text-white font-semibold text-sm sm:text-base werewolf-button-secondary werewolf-text"
            >
               Đăng ký
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
