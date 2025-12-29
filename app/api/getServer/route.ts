import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Gọi sang server thật
    const res = await fetch("https://werewolf1.anhdh.net/api/v1/servers/info", { 
      cache: 'no-store' 
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Lỗi kết nối Server gốc" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
    
  } catch (error) {
    return NextResponse.json({ error: "Lỗi Server nội bộ" }, { status: 500 });
  }
}