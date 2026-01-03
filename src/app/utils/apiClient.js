import { API_PATHS } from "@/constants/paths.api";
import { KEYS } from "@/constants/keys";
import { CODES } from "@/constants/codes";

// ===== Helper: show alert from server meta =====
function showServerAlert(data) {
  if (data?.meta?.code !== CODES.SUCCESS) {
    let alertText = `Code: ${data?.meta?.code || "N/A"}\nMessage: ${data?.meta?.message || "No message"}`;

    if (data?.meta?.errors?.length) {
      const errorsText = data.meta.errors
        .map(e => `- ${e.field}: ${e.message}`)
        .join("\n");
      alertText += `\nErrors:\n${errorsText}`;
    }

    alert(alertText);
  }
}

// ===== Core fetch =====
export async function apiFetch(endpoint, options = {}) {
  const serverRaw = localStorage.getItem(KEYS.SERVER_SELECTED);
  if (!serverRaw) {
    throw { type: "NO_SERVER" };
  }

  const server = JSON.parse(serverRaw);
  let accessToken = localStorage.getItem(KEYS.ACCESS_TOKEN);

  const res = await fetch(`${server.api}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  const data = await res.json();
  showServerAlert(data);

  // ===== 401 handling =====
  if (res.status === 401) {
    const refreshed = await refreshToken(server);
    if (!refreshed) {
      localStorage.removeItem(KEYS.ACCESS_TOKEN);
      localStorage.removeItem(KEYS.REFRESH_TOKEN);
      throw { type: "UNAUTHORIZED" };
    }

    // retry once
    accessToken = localStorage.getItem(KEYS.ACCESS_TOKEN);
    const retryRes = await fetch(`${server.api}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const retryData = await retryRes.json();
    showServerAlert(retryData);
    return retryData;
  }

  return data;
}

// ===== Refresh token =====
async function refreshToken(server) {
  const refreshToken = localStorage.getItem(KEYS.REFRESH_TOKEN);
  if (!refreshToken) return false;

  try {
    const res = await fetch(server.api + API_PATHS.TOKEN_REFRESH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await res.json();
    showServerAlert(data);

    if (res.ok && data?.data?.access_token) {
      localStorage.setItem(KEYS.ACCESS_TOKEN, data.data.access_token);
      localStorage.setItem(KEYS.REFRESH_TOKEN, data.data.refresh_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
