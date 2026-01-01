"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";

export default function ServerPage() {
  const router = useRouter();
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasSelectedBefore, setHasSelectedBefore] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasSelectedBefore(!!localStorage.getItem(KEYS.SERVER_SELECTED));
    }

    const fetchServers = async () => {
      try {
        const res = await fetch("/api/v1/servers");
        const data = await res.json();
        setServers(data?.data?.servers || []);
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  const handleSelect = (server) => {
    if (navigator.vibrate) navigator.vibrate(40);

    localStorage.setItem(KEYS.SERVER_SELECTED, JSON.stringify(server));

    // 🔥 FIX Ở ĐÂY
    setHasSelectedBefore(true);
  };

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

        {/* Server list */}
        <div className="w-full flex flex-col gap-4">
          {loading ? (
            [1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
            ))
          ) : (
            servers.map((sv) => (
              <button
                key={sv.id}
                onClick={() => handleSelect(sv)}
                className="relative w-full rounded-2xl p-5 bg-white/5 border border-white/10 hover:border-red-500/50 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold">🐺 {sv.name}</div>
                  <div className="text-xs text-slate-400">Làng #{sv.id}</div>
                </div>
                <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
              </button>
            ))
          )}
        </div>

        {/* Back */}
        {hasSelectedBefore && (
          <button
            onClick={() => router.push(PATHS.SIGN_IN)}
            className="text-sm font-semibold text-slate-400 hover:text-white"
          >
            ← Quay về đăng nhập
          </button>
        )}
      </div>
    </div>
  );
}
