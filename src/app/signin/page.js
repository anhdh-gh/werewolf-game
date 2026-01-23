"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import localFont from "next/font/local";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";
import { API_PATHS } from "@/constants/paths.api";
import { useApiFetch } from "@/hooks/useApiFetch";

const fontHorror = localFont({
  src: "../../../public/fonts/Fz-Gypsy-Curse.ttf",
  display: "swap",
  variable: "--font-horror",
});

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
    <div className={`${fontHorror.variable} relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center px-4`}>
      
      {/* Style ép font horror và màu đỏ cho placeholder */}
      <style>{`
        .input-horror-placeholder::placeholder {
          font-family: var(--font-horror);
          color: #ff0000 !important; 
          opacity: 0.7; 
          letter-spacing: 0.15em;
        }
      `}</style>

      {/* Background Image */}
      <Image
        src="/image/select_server_screen.jpg"
        alt="Horror Background"
        fill
        priority
        className="object-cover opacity-100 contrast-100 saturate-100"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />

      {/* Main Content */}
      <div className="w-full max-w-md flex flex-col items-center gap-6 relative z-20 py-8 animate-in fade-in zoom-in duration-500">
        
        {/* Header Title */}
        <div className="text-center w-full mb-2">
           <h1 className={`${fontHorror.className} text-5xl text-red-600 mb-2 drop-shadow-[0_0_15px_rgba(255,0,0,0.4)] tracking-widest`}>
             ĐĂNG NHẬP
           </h1>
           <p className={`${fontHorror.className} text-red-600 text-xl tracking-widest uppercase border-b border-red-900/30 pb-2 inline-block`}>
             Máy chủ: {server.name}
           </p>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="w-full bg-black/60 border border-red-900/30 rounded-2xl p-8 flex flex-col gap-6 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
        >
          {/* Inputs */}
          <div className="space-y-4">
            <div className="group">
                <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Tên đăng nhập..."
                    required
                    /* SỬA QUAN TRỌNG: Thêm dấu ! trước border-2 và border-white để ghi đè CSS global */
                    className="input-horror-placeholder font-sans w-full p-4 rounded-xl !border !border-white text-red-600 outline-none shadow-[0_4px_10px_rgba(0,0,0,0.5)] focus:!border-white focus:bg-zinc-900/80 focus:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all text-base tracking-widest" 
                />
            </div>
            
            <div className="group">
                <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Mật khẩu..."
                    required
                    /* SỬA QUAN TRỌNG: Thêm dấu ! trước border-2 và border-white */
                    className="input-horror-placeholder font-sans w-full p-4 rounded-xl !border !border-white text-red-600 outline-none shadow-[0_4px_10px_rgba(0,0,0,0.5)] focus:!border-white focus:bg-zinc-900/80 focus:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all text-base tracking-widest"
                />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-4 mt-2 rounded-2xl bg-red-500/40 hover:bg-red-500 border-2 border-red-900 transition-all overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={`${fontHorror.className} text-white relative z-10 text-3xl drop-shadow-[2px_2px_2px_black] tracking-wider`}>
                {loading ? "ĐANG VÀO..." : "XÁC NHẬN"}
              </span>
            
            {!loading && (
                <>
                    <div className="absolute top-0 left-[20%] w-[1px] h-4 bg-red-500/40 group-hover:h-6 transition-all duration-500" />
                    <div className="absolute top-0 left-[50%] w-[1px] h-6 bg-red-500/40 group-hover:h-10 transition-all duration-500" />
                    <div className="absolute top-0 left-[80%] w-[1px] h-3 bg-red-500/40 group-hover:h-5 transition-all duration-500" />
                </>
            )}
          </button>
        </form>

        {/* Action Links */}
        <div className="w-full flex flex-col items-center gap-3">
          <button
            onClick={() => router.push(PATHS.SIGN_UP)}
            className={`${fontHorror.className} text-lg text-red-600 hover:text-red-500 transition-colors tracking-widest`}
          >
            Chưa có xác?... Đăng ký
          </button>

          <button
            onClick={() => router.push(PATHS.SERVER)}
            className={`${fontHorror.className} text-sm text-red-600 hover:text-red-500 tracking-widest uppercase transition-colors`}
          >
             Quay lại chọn máy chủ 
          </button>
        </div>

      </div>
    </div>
  );
}