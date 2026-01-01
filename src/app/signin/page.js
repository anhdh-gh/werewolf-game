"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KEYS } from '@/constants/keys';
import { PATHS } from '@/constants/paths';

export default function ServerPage() {
  const router = useRouter();
  const [servers, setServers] = useState([]);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const res = await fetch('/api/v1/servers');
        const data = await res.json();
        
        if (data?.data?.servers) {
          setServers(data.data.servers);
        }
      } catch (error) {
        console.error("Lỗi tải server:", error);
      }
    };

    fetchServers();
  }, [router]);

  const handleSelect = (server) => {
    localStorage.setItem(KEYS.SERVER_SELECTED, JSON.stringify(server));
  };

  const handleBackToSignIn = () => {
    router.push(PATHS.SIGN_IN); 
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center pt-20 px-4">
      <h1 className="text-3xl font-bold mb-8 text-yellow-500">CHỌN MÁY CHỦ</h1>

      {/* Danh sách Server */}
      <div className="grid grid-cols-1 gap-4 w-full max-w-md">
        {servers.length === 0 ? (
          <p className="text-center text-gray-400">Đang tải danh sách...</p>
        ) : (
          servers.map((sv) => (
            <button
              key={sv.id}
              onClick={() => handleSelect(sv)}
              className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-yellow-500 hover:bg-slate-700 transition-all group"
            >
              <div className="text-left">
                <p className="font-bold text-lg group-hover:text-yellow-400">
                  {sv.name}
                </p>
                <p className="text-xs text-slate-400">Index: {sv.index}</p>
              </div>
              <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
            </button>
          ))
        )}
      </div>

      {/* Nút Quay về màn SignIn */}
      <button
        onClick={handleBackToSignIn}
        className="mt-8 px-6 py-2 text-slate-400 hover:text-white transition-colors flex items-center gap-2 border border-transparent hover:border-slate-700 rounded-full"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Quay về đăng nhập
      </button>
    </div>
  );
}