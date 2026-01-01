import { NextResponse } from 'next/server';
import { SERVERS } from '@/constants/servers'; 

export async function GET() {
  const responseData = {
    meta: {
      code: 200,
      message: "Success",
    },
    data: {
      servers: SERVERS,
    },
  };

  return NextResponse.json(responseData, { status: 200 });
}