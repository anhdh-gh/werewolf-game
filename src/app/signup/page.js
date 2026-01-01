"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";
import { API_PATHS } from "@/constants/paths.api";

export default function SignupPage() {
  const router = useRouter();
  const [server, setServer] = useState(null);
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(KEYS.ACCESS_TOKEN);
      localStorage.removeItem(KEYS.REFRESH_TOKEN);
      localStorage.removeItem(KEYS.USER_ID);
      localStorage.removeItem(KEYS.USERNAME);
      const selected = localStorage.getItem(KEYS.SERVER_SELECTED);
      if (!selected) {
        router.replace(PATHS.SERVER); // redirect if no server selected
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
      const res = await fetch(server.api + API_PATHS.SIGN_UP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      // Build alert message
      let alertText = `Code: ${data?.meta?.code || "N/A"}\nMessage: ${data?.meta?.message || "No message"}`;
      if (data?.meta?.errors && data.meta.errors.length > 0) {
        const errorsText = data.meta.errors.map(e => `- ${e.field}: ${e.message}`).join("\n");
        alertText += `\nErrors:\n${errorsText}`;
      }

      alert(alertText);

      if (res.ok) {
        router.push(PATHS.SIGN_IN);
      }
    } catch (err) {
      console.error(err);
      alert("Network error, please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!server) return null; // avoid flash UI before redirect

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0b0b12] via-[#0f0f1a] to-black px-5 py-10">
      
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white/5 backdrop-blur rounded-2xl p-8 flex flex-col gap-6"
      >
        <h2 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">
          Đăng ký vào {server.name}
        </h2>

        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          required
          className="p-3 rounded-lg bg-white/10 border border-white/20 focus:border-red-500 outline-none text-white placeholder-white/60"
        />
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 transition text-white font-semibold disabled:opacity-50"
        >
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>
      </form>

      {/* Two buttons below form */}
      <div className="w-full max-w-md flex flex-col gap-3 mt-6">
        <button
          onClick={() => router.push(PATHS.SERVER)}
          className="w-full py-3 rounded-xl border border-white/20 text-white hover:bg-white/5 transition font-semibold"
        >
          🔄 Chọn lại server
        </button>

        <button
          onClick={() => router.push(PATHS.SIGN_IN)}
          className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 transition text-white font-semibold"
        >
          ← Quay về đăng nhập
        </button>
      </div>
    </div>
  );
}