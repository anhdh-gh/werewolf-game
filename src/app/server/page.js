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
    <div className="min-h-screen bg-gradient-to-b from-[#0b0b12] via-[#0f0f1a] to-black text-white px-5 flex items-center justify-center">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        {/* Header */}
        <div className="text-center">
          <div className="text-xs tracking-widest text-purple-400 mb-2">
            ĐÊM TRĂNG ĐÃ LÊN
          </div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
            CHỌN NGÔI LÀNG
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Mỗi làng là một ván Ma Sói khác nhau
          </p>
        </div>

        {/* Server List */}
        <div className="w-full flex flex-col gap-4">
          {loading
            ? [1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-white/5 animate-pulse"
                />
              ))
            : servers.map((sv) => {
                const isSelected = selectedServer?.id === sv.id;

                return (
                  <button
                    key={sv.id}
                    onClick={() => handleSelect(sv)}
                    className={`
                      relative w-full rounded-2xl p-5
                      ${isSelected ? "bg-red-600 border-red-500" : "bg-white/5 border-white/10"}
                      backdrop-blur
                      hover:border-red-500/50
                      active:scale-[0.97]
                      transition-all duration-200
                      flex items-center justify-between
                    `}
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-lg font-bold">
                        {isSelected ? "🌕 " : "🐺 "} {sv.name}
                      </span>
                      <span className="text-xs text-slate-400">Làng #{sv.id}</span>
                    </div>

                    <span className="relative flex h-3 w-3">
                      <span
                        className={`absolute inline-flex h-full w-full rounded-full ${
                          isSelected ? "bg-red-400" : "bg-emerald-400"
                        } opacity-70 animate-ping`}
                      />
                      <span
                        className={`relative inline-flex h-3 w-3 rounded-full ${
                          isSelected ? "bg-red-500" : "bg-emerald-500"
                        }`}
                      />
                    </span>
                  </button>
                );
              })}
        </div>

        {/* Action Buttons: show only when a server is selected */}
        {selectedServer && (
          <div className="w-full flex flex-col gap-4 mt-4">
            <button
              onClick={handleBackToSignIn}
              className="w-full py-3 rounded-xl border border-white/20 text-white hover:bg-white/5 transition font-semibold"
            >
              ← Quay về đăng nhập
            </button>

            <button
              onClick={handleGoToSignup}
              className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 transition text-white font-semibold"
            >
              Đăng ký ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
