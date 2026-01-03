"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";
import { API_PATHS } from "@/constants/paths.api";
import { useApiFetch } from "@/hooks/useApiFetch";

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

  // Load selected server or redirect to server selection
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(KEYS.ACCESS_TOKEN);
      localStorage.removeItem(KEYS.REFRESH_TOKEN);
      localStorage.removeItem(KEYS.USER_ID);
      localStorage.removeItem(KEYS.USERNAME);
      const selected = localStorage.getItem(KEYS.SERVER_SELECTED);
      if (!selected) {
        router.replace(PATHS.SERVER); // no server → redirect
      } else {
        setServer(JSON.parse(selected));
      }
    }
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle login submit
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
        router.push(PATHS.HOME); // redirect to app page
      }
    } catch (err) {
      console.error(err);
      alert("Network error, please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!server) return null; // prevent flash UI before redirect

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0b0b12] via-[#0f0f1a] to-black px-5 py-10">

      {/* Form container */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white/5 backdrop-blur rounded-2xl p-8 flex flex-col gap-6"
      >
        <h2 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">
          Đăng nhập vào {server.name}
        </h2>

        {/* Inputs */}
        <input
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="Username"
          required
          className="p-3 rounded-lg bg-white/10 border border-white/20 focus:border-red-500 outline-none text-white placeholder-white/60"
        />
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          required
          className="p-3 rounded-lg bg-white/10 border border-white/20 focus:border-red-500 outline-none text-white placeholder-white/60"
        />

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 transition text-white font-semibold disabled:opacity-50"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      {/* Two action buttons: Sign up or choose server */}
      <div className="w-full max-w-md flex flex-col gap-3 mt-6">
        <button
          onClick={() => router.push(PATHS.SIGN_UP)}
          className="w-full py-3 rounded-xl border border-white/20 text-white hover:bg-white/5 transition font-semibold"
        >
          📝 Đăng ký
        </button>

        <button
          onClick={() => router.push(PATHS.SERVER)}
          className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 transition text-white font-semibold"
        >
          🔄 Chọn lại server
        </button>
      </div>
    </div>
  );
}