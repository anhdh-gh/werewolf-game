"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Creepster, Nosifer } from "next/font/google";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";
import { API_PATHS } from "@/constants/paths.api";
import { useApiFetch } from "@/hooks/useApiFetch";

// Đồng bộ Font giống hệt trang Server
const fontHorror = Creepster({ weight: "400", subsets: ["latin"], display: "swap" });
const fontBlood = Nosifer({ weight: "400", subsets: ["latin"], display: "swap" });

function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("Invalid JWT", err);
    return null;
  }
}

export default function SigninPage() {
  const router = useRouter();
  const [server, setServer] = useState(null);
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const apiFetch = useApiFetch();

  // Logic giữ nguyên
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(KEYS.ACCESS_TOKEN);
      localStorage.removeItem(KEYS.REFRESH_TOKEN);
      localStorage.removeItem(KEYS.USER_ID);
      localStorage.removeItem(KEYS.USERNAME);
      const selected = localStorage.getItem(KEYS.SERVER_SELECTED);
      if (!selected) {
        router.replace(PATHS.SERVER);
      } else {
        setServer(JSON.parse(selected));
      }
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!server) return;

    setLoading(true);

    try {
      const data = await apiFetch(API_PATHS.SIGN_IN, {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (data?.data?.access_token) {
        const decoded = parseJwt(data?.data?.access_token);
        localStorage.setItem(KEYS.ACCESS_TOKEN, data.data.access_token);
        localStorage.setItem(KEYS.REFRESH_TOKEN, data.data.refresh_token);
        localStorage.setItem(KEYS.USER_ID, decoded.sub);
        localStorage.setItem(KEYS.USERNAME, decoded.username);
        router.push(PATHS.HOME);
      }
    } catch (err) {
      console.error(err);
      alert("Network error, please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!server) return null;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center px-4">
      
      {/* 1. Background đã làm rõ hơn (Bỏ các filter làm tối) */}
      <Image
        src="/image/select_server.png"
        alt="Horror Background"
        fill
        priority
        className="object-cover opacity-100 contrast-100 saturate-100" 
      />
      
      {/* Giảm lớp phủ đen xuống mức thấp để nhìn rõ ảnh nền */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/40 z-10 pointer-events-none" />

      {/* Main Content */}
      <div className="w-full max-w-md flex flex-col items-center gap-8 relative z-20 py-8 animate-in fade-in zoom-in duration-500">
        
        {/* Header Title - Dùng lại font Creepster giống Server */}
        <div className="text-center w-full relative">
           <h1 className={`${fontHorror.className} text-5xl text-[#990000] mb-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] tracking-widest leading-relaxed`}>
             ĐĂNG NHẬP
           </h1>
           <div className="text-red-200/80 font-mono text-sm tracking-[0.3em] uppercase border-b border-red-900/50 pb-1 inline-block bg-black/40 px-4 rounded-full backdrop-blur-sm">
             Server: {server.name}
           </div>
        </div>

        {/* Form Container - Nền tối nhẹ để nổi bật trên background sáng */}
        <form
          onSubmit={handleSubmit}
          className="w-full bg-black/70 border border-red-900/40 backdrop-blur-md rounded-2xl p-8 flex flex-col gap-6 shadow-[0_0_40px_rgba(0,0,0,0.6)] relative overflow-hidden"
        >
          {/* Inputs */}
          <div className="space-y-5">
            <div className="group relative">
                <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Tên đăng nhập"
                    required
                    className={`w-full p-4 bg-black/40 border border-red-900/30 text-red-50 placeholder-red-200/30 rounded-xl outline-none 
                    focus:border-red-500 focus:bg-black/60 focus:shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all duration-300 ${fontHorror.className} text-xl tracking-widest`}
                />
            </div>
            
            <div className="group relative">
                <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Mật khẩu"
                    required
                    className={`w-full p-4 bg-black/40 border border-red-900/30 text-red-50 placeholder-red-200/30 rounded-xl outline-none 
                    focus:border-red-500 focus:bg-black/60 focus:shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all duration-300 ${fontHorror.className} text-xl tracking-widest`}
                />
            </div>
          </div>

          {/* Submit button - Style máu me nhưng dùng font Creepster */}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full group overflow-hidden rounded-xl border-2 border-[#7f1d1d] shadow-[0_0_10px_#450a0a] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 mt-2 bg-[#450a0a]/80 hover:bg-[#7f1d1d]"
          >
            {/* Nội dung button */}
            <div className="relative py-4 z-10 flex items-center justify-center gap-2">
                <span className={`${fontHorror.className} text-3xl text-red-100 drop-shadow-[2px_2px_0_#000] tracking-widest`}>
                {loading ? "ĐANG VÀO..." : "XÁC NHẬN"}
                </span>
                {!loading && <span className="text-xl animate-pulse">🩸</span>}
            </div>

            {/* Hiệu ứng giọt máu chảy (Decoration) */}
            {!loading && (
                <>
                    <div className="absolute top-0 left-[15%] w-[1px] h-6 bg-red-500/30 group-hover:h-10 transition-all duration-500" />
                    <div className="absolute top-0 right-[25%] w-[1px] h-4 bg-red-500/30 group-hover:h-8 transition-all duration-500" />
                </>
            )}
          </button>
        </form>

        {/* Links */}
        <div className="w-full flex flex-col items-center gap-4 bg-black/30 p-4 rounded-xl backdrop-blur-sm border border-white/5">
          <button
            onClick={() => router.push(PATHS.SIGN_UP)}
            className={`${fontHorror.className} text-red-400 text-xl hover:text-red-200 hover:drop-shadow-[0_0_8px_rgba(255,0,0,0.5)] transition-all tracking-widest`}
          >
            Chưa có xác?... Đăng ký
          </button>

          <button
            onClick={() => router.push(PATHS.SERVER)}
            className="text-[10px] text-gray-400 hover:text-white font-mono tracking-[0.2em] uppercase transition-colors"
          >
            [ Quay lại chọn máy chủ ]
          </button>
        </div>

      </div>
    </div>
  );
}