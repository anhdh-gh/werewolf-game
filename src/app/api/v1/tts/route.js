import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");

  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  // 🔥 QUAN TRỌNG: Dùng domain translate.google.com thay vì googleapis.com
  // client=tw-ob là client public ổn định nhất cho việc này
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=vi&client=tw-ob`;

  try {
    const response = await fetch(url, {
      headers: {
        // 🔥 GIẢ MẠO TRÌNH DUYỆT: Đây là chìa khóa để Google không chặn
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Referer": "https://translate.google.com/",
      },
    });

    if (!response.ok) {
      throw new Error(`Google TTS Error: ${response.status} ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: "Failed to fetch audio" }, { status: 500 });
  }
}