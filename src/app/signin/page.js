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

export default function SigninPage(){
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
           <h1 className={`${fontHorror.className} text-5xl text-[#990000] mb-2 drop-shadow-[0_0_15px_rgba(255,0,0,0.4)] tracking-widest`}>
             ĐĂNG NHẬP
           </h1>
           {/* Đã sửa font chữ Server */}
           <p className={`${fontHorror.className} text-red-500/90 text-xl tracking-widest uppercase border-b border-red-900/30 pb-2 inline-block`}>
             Máy chủ: {server.name}
           </p>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="w-full bg-black/100 border border-red-900/30  rounded-2xl p-8 flex flex-col gap-6 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
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
                    // Đã thêm fontHorror, chỉnh màu placeholder sáng lên (red-400), tăng size chữ (text-xl)
                    className="w-full p-4 rounded-xl bg-black/50 border border-red-900/20 text-red-100 placeholder-red-300 outline-none focus:border-red-600 focus:shadow-[0_0_15px_rgba(153,0,0,0.3)] transition-all text-base tracking-widest" 
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
                    // Tương tự cho password
                    className="w-full p-4 rounded-xl bg-black/50 border border-red-900/20 text-red-100 placeholder-red-300 outline-none focus:border-red-600 focus:shadow-[0_0_15px_rgba(153,0,0,0.3)] transition-all text-base tracking-widest"
                />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-4 mt-2 rounded-2xl text-red-100 bg-[#7f1d1d] hover:bg-red-700 border-2 border-red-900 transition-all overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={`${fontHorror.className} relative z-10 text-3xl drop-shadow-[2px_2px_2px_black] tracking-wider`}>
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
            className={`${fontHorror.className} text-red-800 text-lg hover:text-red-500 transition-colors tracking-widest`}
          >
            Chưa có xác?... Đăng ký
          </button>

          <button
            onClick={() => router.push(PATHS.SERVER)}
            // Đã sửa font chữ nút quay lại
            className={`${fontHorror.className} text-sm text-red-900/80 hover:text-red-500 tracking-widest uppercase transition-colors`}
          >
             Quay lại chọn máy chủ 
          </button>
        </div>

      </div>
    </div>
  );
}