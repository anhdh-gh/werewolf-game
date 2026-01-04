"use client";

import AuthLayout from "@/layouts/AuthLayout";
import RoomContent from "@/components/RoomContent";
import { RoomProvider } from "@/contexts/RoomContext";

export default function HomePage() {
  return (
    <AuthLayout>
      <RoomProvider>
        <RoomContent />
      </RoomProvider>
    </AuthLayout>
  );
}