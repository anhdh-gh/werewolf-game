"use client";

import AuthLayout from "@/layouts/AuthLayout";
import RoomContent from "@/components/RoomContent";

export default function HomePage() {
  return (
    <AuthLayout>
      <RoomContent />
    </AuthLayout>
  );
}