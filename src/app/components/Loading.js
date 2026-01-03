"use client";

export default function Loading({ textMsg }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        {/* Spinner */}
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />

        {/* Message */}
        <p className="text-gray-500">
          {textMsg || "Werewolf..."}
        </p>
      </div>
    </div>
  );
}
