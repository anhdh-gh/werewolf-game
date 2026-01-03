"use client";

import { useRouter } from "next/navigation";
import { apiFetch } from "@/utils/apiClient";
import { PATHS } from "@/constants/paths";

export function useApiFetch() {
  const router = useRouter();

  return async function apiFetchWithRouter(endpoint, options) {
    try {
      return await apiFetch(endpoint, options);
    } catch (err) {
      if (err?.type === "NO_SERVER") {
        router.push(PATHS.SERVER);
        return;
      }

      if (err?.type === "UNAUTHORIZED") {
        router.push(PATHS.SIGN_IN);
        return;
      }

      throw err; // other errors
    }
  };
}
