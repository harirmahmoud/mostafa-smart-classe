export const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

const AUTH_STORAGE_KEY = "mostafa-smart-classe.auth";

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]> | null;

  constructor(
    message: string,
    status: number,
    errors: Record<string, string[]> | null = null
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export type AuthRole = {
  id?: number;
  name: string;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  roles?: AuthRole[];
};

export type AuthPayload = {
  token: string;
  token_type: string;
  user: AuthUser;
};

export type ResourceOption = {
  label: string;
  value: string | number;
};

export type ResourceField = {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "date" | "time" | "select";
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
  step?: number;
  options?: ResourceOption[];
  defaultValue?: string | number;
};

export type ResourceLookup = {
  field: string;
  endpoint: string;
  labelKey: string;
  valueKey?: string;
};

export type ResourceColumn = {
  key: string;
  label: string;
  type?: "text" | "badge" | "datetime";
};

export type ResourceScanAction = {
  title: string;
  endpoint: string;
  fields: ResourceField[];
  submitLabel?: string;
  successMessage?: string;
};

export type ResourceConfig = {
  title: string;
  description: string;
  endpoint: string;
  columns: ResourceColumn[];
  fields: ResourceField[];
  lookups?: ResourceLookup[];
  scanAction?: ResourceScanAction;
};

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string;
};

function readToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

export function persistAuth(auth: AuthPayload) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearAuth() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function readAuth() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthPayload;
  } catch {
    return null;
  }
}

async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const token = options.token ?? readToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body = options.body;
  if (body !== undefined && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: body as BodyInit | null | undefined,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "string"
        ? payload
        : payload?.message || "The request could not be completed.";

    throw new ApiError(message, response.status, payload?.errors ?? null);
  }

  return payload as T;
}

export const authApi = {
  login: (body: { email: string; password: string }) =>
    apiRequest<AuthPayload>("/auth/login", {
      method: "POST",
      body,
    }),
  register: (body: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) =>
    apiRequest<AuthPayload>("/auth/register", {
      method: "POST",
      body,
    }),
  me: () => apiRequest<AuthUser>("/auth/me"),
  logout: () => apiRequest<{ message: string }>("/auth/logout", { method: "POST" }),
};

export const resourceApi = {
  list: <T>(endpoint: string) => apiRequest<T[]>(endpoint),
  get: <T>(endpoint: string) => apiRequest<T>(endpoint),
  create: <T>(endpoint: string, body: Record<string, unknown>) =>
    apiRequest<T>(endpoint, { method: "POST", body }),
  post: <T>(endpoint: string, body?: Record<string, unknown>) =>
    apiRequest<T>(endpoint, { method: "POST", body: body || {} }),
  update: <T>(endpoint: string, body: Record<string, unknown>) =>
    apiRequest<T>(endpoint, { method: "PUT", body }),
  remove: (endpoint: string) =>
    apiRequest<{ message?: string }>(endpoint, { method: "DELETE" }),
  scan: <T>(endpoint: string, body: Record<string, unknown>) =>
    apiRequest<T>(endpoint, { method: "POST", body }),
};
