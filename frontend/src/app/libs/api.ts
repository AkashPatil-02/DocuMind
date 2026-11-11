import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) return false;

  const data = await response.json();
  setTokens(data.access_token, data.refresh_token);
  return true;
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.detail || "Something went wrong") as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  try {
    return await request(endpoint, options);
  } catch (err) {
    const status = (err as { status?: number }).status;
    const hadToken = !!getAccessToken();

    if (status === 401 && hadToken && !endpoint.startsWith("/auth/login") && !endpoint.startsWith("/auth/register")) {
      const refreshed = await refreshAccessToken().catch(() => false);
      if (refreshed) {
        return await request(endpoint, options);
      }
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/signin";
      }
    }

    throw err;
  }
}
