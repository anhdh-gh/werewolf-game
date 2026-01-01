import { PATHS } from "@/constants/paths";
import { API_PATHS } from "@/constants/paths.api";
import { KEYS } from "@/constants/keys";

// Helper: show alert from server meta
function showServerAlert(data) {
  let alertText = `Code: ${data?.meta?.code || "N/A"}\nMessage: ${data?.meta?.message || "No message"}`;
  if (data?.meta?.errors && data.meta.errors.length > 0) {
    const errorsText = data.meta.errors.map(e => `- ${e.field}: ${e.message}`).join("\n");
    alertText += `\nErrors:\n${errorsText}`;
  }
  alert(alertText);
}

// Core API fetch wrapper
export async function apiFetch(endpoint, options = {}) {
  const serverRaw = localStorage.getItem(KEYS.SERVER_SELECTED);
  if (!serverRaw) {
    window.location.href = PATHS.SERVER;
    return;
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

  // Show alert for meta
  showServerAlert(data);

  if (res.status === 401) {
    // try refresh token
    const refreshed = await refreshToken(server);
    if (refreshed) {
      // retry original request
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
    } else {
      // refresh failed → redirect to signin
      localStorage.removeItem(KEYS.ACCESS_TOKEN);
      localStorage.removeItem(KEYS.REFRESH_TOKEN);
      window.location.href = PATHS.SIGN_IN;
      return;
    }
  }

  return data;
}

// Refresh token logic
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
  } catch (err) {
    console.error(err);
    return false;
  }
}