"use client";

import AuthLayout from "@/layouts/AuthLayout";
import RoomContent from "@/components/RoomContent";
import MicButton from "@/components/MicButton";

export default function HomePage() {
  return (
    <AuthLayout>
      <RoomContent />
      <MicButton onToggle={(muted) => console.log("muted =", muted)} />
    </AuthLayout>
  );
}