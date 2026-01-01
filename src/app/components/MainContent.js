"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";

export default function MainContent() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#0b0b12] via-[#0f0f1a] to-black px-5 py-10 gap-8">
      <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">
        {`Xin chào ${localStorage.getItem(KEYS.USERNAME)}!`}
      </h1>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button onClick={() => router.push("/game")} className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold">Chơi game</button>
        <button onClick={() => router.push(PATHS.SERVER)} className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold">Chọn lại server</button>
        <button onClick={() => router.push(PATHS.SIGN_UP)} className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold">Đăng ký</button>
        <button onClick={() => router.push(PATHS.SIGN_IN)} className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold">Đăng nhập</button>
      </div>
    </main>
  );
}
