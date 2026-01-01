"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function AuthLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}