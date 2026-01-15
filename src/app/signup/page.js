"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";
import { API_PATHS } from "@/constants/paths.api";
import { useApiFetch } from "@/hooks/useApiFetch";
import { CODES } from "@/constants/codes";
import localFont from "next/font/local";

const fontHorror = localFont({
  
  src: "../../../public/fonts/Fz-Gypsy-Curse.ttf", 
  display: "swap",
});


export default function SignupPage() {
  const router = useRouter();
  const [server, setServer] = useState(null);
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const apiFetch = useApiFetch();

  // Logic giữ nguyên 100%
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
      const res = await apiFetch(API_PATHS.SIGN_UP, {
        method: "POST",
        body: JSON.stringify(form),
      });
      if(res.meta.code === CODES.SUCCESS) {
        router.push(PATHS.SIGN_IN);
      }
      alert("Đăng ký thành công");
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
      
      {/* 1. Background Image: Rõ nét lấy từ trang Server */}
      <Image
        src="/image/select_server_screen.jpg"
        alt="Horror Background"
        fill
        priority
        className="object-cover object-center opacity-100 contrast-100 saturate-100" 
      />
      
      {/* 2. Overlay ma mị: Giữ gradient để nổi bật form */}
      <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />

      {/* Main Content */}
      <div className="w-full max-w-md flex flex-col items-center gap-6 relative z-20 py-8 animate-in fade-in zoom-in duration-500">
        
        {/* Header Title: Đồng bộ font Creepster */}
        <div className="text-center w-full mb-2">
           <h1 className={`${fontHorror.className} text-5xl text-[#990000] mb-2 drop-shadow-[0_0_15px_rgba(255,0,0,0.6)] tracking-widest`}>
             HIẾN TẾ LINH HỒN
           </h1>
           <p className={`${fontHorror.className} text-red-500/90 text-xl tracking-widest uppercase border-b border-red-900/30 pb-2 inline-block`}>
             Máy chủ: {server.name}
           </p>
        </div>

        {/* Form Container: Style tối, border đỏ giống trang Server */}
        <form
          onSubmit={handleSubmit}
          className="w-full bg-black/60 border border-red-900/30  rounded-2xl p-8 flex flex-col gap-5 shadow-[0_0_40px_rgba(0,0,0,0.8)]"
        >
          {/* Inputs: Placeholder sáng màu đỏ, font kinh dị */}
          <div className="space-y-4">
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ĐỊA CHỈ EMAIL..."
              required
              className={`${fontHorror.className} w-full p-4 rounded-xl bg-black/50 border border-red-900/20 text-red-100 placeholder-red-400 outline-none focus:border-red-600 focus:shadow-[0_0_15px_rgba(153,0,0,0.3)] transition-all text-xl tracking-widest`}
            />
            
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="TÊN NGƯỜI DÙNG..."
              required
              className={`${fontHorror.className} w-full p-4 rounded-xl bg-black/50 border border-red-900/20 text-red-100 placeholder-red-400 outline-none focus:border-red-600 focus:shadow-[0_0_15px_rgba(153,0,0,0.3)] transition-all text-xl tracking-widest`}
            />

            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="MẬT MÃ..."
              required
              className={`${fontHorror.className} w-full p-4 rounded-xl bg-black/50 border border-red-900/20 text-red-100 placeholder-red-400 outline-none focus:border-red-600 focus:shadow-[0_0_15px_rgba(153,0,0,0.3)] transition-all text-xl tracking-widest`}
            />
          </div>

          {/* Submit button: Style giống nút VÀO LÀNG có giọt máu */}
          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-4 mt-2 rounded-2xl text-red-100 bg-[#7f1d1d] hover:bg-red-700 border-2 border-red-900 transition-all overflow-hidden group disabled:opacity-50"
          >
            <span className={`${fontHorror.className} relative z-10 text-3xl drop-shadow-[2px_2px_2px_black] tracking-wider`}>
              {loading ? "ĐANG TRIỆU HỒI..." : "XÁC NHẬN"}
            </span>
            
            {/* Giọt máu trang trí */}
            {!loading && (
                <>
                    <div className="absolute top-0 left-[20%] w-[1px] h-4 bg-red-500/40 group-hover:h-6 transition-all duration-500" />
                    <div className="absolute top-0 left-[50%] w-[1px] h-6 bg-red-500/40 group-hover:h-10 transition-all duration-500" />
                    <div className="absolute top-0 left-[80%] w-[1px] h-3 bg-red-500/40 group-hover:h-5 transition-all duration-500" />
                </>
            )}
          </button>
        </form>

        {/* Action Buttons: Dưới form */}
        <div className="w-full max-w-md flex flex-col items-center gap-4">
          <button
            onClick={() => router.push(PATHS.SIGN_IN)}
            className={`${fontHorror.className} text-red-400 text-xl hover:text-red-200 transition-all tracking-widest drop-shadow-[0_0_5px_rgba(255,0,0,0.3)]`}
          >
            Đã có khế ước?... Đăng nhập
          </button>

          <button
            onClick={() => router.push(PATHS.SERVER)}
            className={`${fontHorror.className} text-sm text-red-900/80 hover:text-red-600 transition-colors tracking-[0.2em] uppercase`}
          >
             Rời bỏ máy chủ này 
          </button>
        </div>

      </div>
    </div>
  );
}