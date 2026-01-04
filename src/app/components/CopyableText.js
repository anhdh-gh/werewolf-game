"use client";

import { useState } from "react";
import { Clipboard, Check } from "lucide-react";

export default function CopyableText({ label, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="flex items-center gap-1 text-xs text-gray-300">
      <span className="text-gray-400">{label}:</span>
      <span className="font-mono">{value}</span>

      <button
        onClick={handleCopy}
        className="ml-1 rounded p-1 hover:bg-zinc-700 transition"
        title={copied ? "Copied!" : "Copy"}
      >
        {copied ? (
          <Check size={14} className="text-green-400" />
        ) : (
          <Clipboard size={14} />
        )}
      </button>
    </div>
  );
}
