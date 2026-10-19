import { Platform } from "react-native";
import { API_URL } from "./config";
import { storage } from "./storage";

const TOKEN_KEY = "gc_tokens";

interface Tokens {
  access_token: string;
  refresh_token: string;
}
let tokens: Tokens | null = null;
let onAuthLost: (() => void) | null = null;
let refreshing: Promise<boolean> | null = null;

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export function setAuthLostHandler(fn: (() => void) | null) {
  onAuthLost = fn;
}

export async function loadTokens(): Promise<boolean> {
  const raw = await storage.get(TOKEN_KEY);
  if (!raw) return false;
  try {
    tokens = JSON.parse(raw);
    return !!tokens;
  } catch {
    return false;
  }
}

export async function saveTokens(t: Tokens | null) {
  tokens = t;
  if (t) await storage.set(TOKEN_KEY, JSON.stringify(t));
  else await storage.remove(TOKEN_KEY);
}

async function rawFetch(
  path: string,
  method: string,
  body: unknown,
  token?: string,
) {
  try {
    return await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection.", 0);
  }
}

async function tryRefresh(): Promise<boolean> {
  if (!tokens?.refresh_token) return false;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await rawFetch("/auth/refresh", "POST", {
          refresh_token: tokens!.refresh_token,
        });
        if (!res.ok) return false;
        const data = await res.json();
        await saveTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
        return true;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: unknown } = {},
): Promise<T> {
  const method = opts.method ?? "GET";
  const isAuthRoute = path.startsWith("/auth/");
  let res = await rawFetch(path, method, opts.body, tokens?.access_token);

  if (res.status === 401 && !isAuthRoute && (await tryRefresh())) {
    res = await rawFetch(path, method, opts.body, tokens?.access_token);
  }
  if (res.status === 401 && !isAuthRoute) {
    await saveTokens(null);
    onAuthLost?.();
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok)
    throw new ApiError(
      data?.error ?? `Request failed (${res.status})`,
      res.status,
      data,
    );
  return data as T;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.onloadend = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}

const mimeFor = (filename: string) =>
  filename.toLowerCase().endsWith(".pdf")
    ? "application/pdf"
    : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function downloadFile(
  path: string,
  filename: string,
): Promise<void> {
  let res = await rawFetch(path, "GET", undefined, tokens?.access_token);
  if (res.status === 401 && (await tryRefresh())) {
    res = await rawFetch(path, "GET", undefined, tokens?.access_token);
  }
  if (!res.ok) {
    let data: any = null;
    try {
      data = await res.json();
    } catch {}
    throw new ApiError(
      data?.error ?? `Download failed (${res.status})`,
      res.status,
      data,
    );
  }

  const blob = await res.blob();

  // ---------- Web ----------
  if (Platform.OS === "web") {
    const doc = (globalThis as any).document;
    const url = URL.createObjectURL(blob);
    const a = doc.createElement("a");
    a.href = url;
    a.download = filename;
    doc.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }

  // ---------- Android / iOS ----------
  let FileSystem: any;
  try {
    FileSystem = require("expo-file-system/legacy"); // Expo SDK 54+
  } catch {
    FileSystem = require("expo-file-system"); // older SDKs
  }
  const Sharing = require("expo-sharing");

  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, await blobToBase64(blob), {
    encoding: FileSystem.EncodingType?.Base64 ?? "base64",
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new ApiError("Sharing is not available on this device.", 0);
  }
  await Sharing.shareAsync(uri, {
    mimeType: mimeFor(filename),
    dialogTitle: filename,
    UTI: filename.toLowerCase().endsWith(".pdf") ? "com.adobe.pdf" : undefined,
  });
}
