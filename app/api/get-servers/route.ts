import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log("🚀 Đang gọi API Server thật (Method: POST)...");

    // --- THAY ĐỔI QUAN TRỌNG Ở ĐÂY ---
    const res = await fetch("https://werewolf.anhdh.net/api/v1/servers/info", { 
      method: 'POST', // <--- SỬA THÀNH POST
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      // Nếu server cần body rỗng thì thêm dòng dưới, không thì thôi:
      // body: JSON.stringify({}) 
    });

    if (!res.ok) {
      console.error("❌ Server thật từ chối:", res.status, res.statusText);
      return NextResponse.json(
        { error: `Lỗi từ Server gốc: ${res.status} ${res.statusText}` }, 
        { status: res.status }
      );
    }

    const data = await res.json();
    console.log("✅ Lấy dữ liệu thành công:", data);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("❌ Lỗi API Proxy:", error);
    return NextResponse.json(
      { error: "Lỗi kết nối đến máy chủ vệ tinh" }, 
      { status: 500 }
    );
  }
}