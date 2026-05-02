"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  authApi,
  clearAuth,
  persistAuth,
  readAuth,
  type AuthPayload,
  type AuthUser,
} from "@/lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (body: { email: string; password: string }) => Promise<void>;
  register: (body: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = (payload: AuthPayload) => {
    persistAuth(payload);
    setToken(payload.token);
    setUser(payload.user);
  };

  const refreshSession = async () => {
    const session = readAuth();
    if (!session?.token) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    setToken(session.token);

    try {
      const currentUser = await authApi.me();
      const refreshedSession = { ...session, user: currentUser };
      persistAuth(refreshedSession);
      setUser(currentUser);
    } catch {
      clearAuth();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const login = async (body: { email: string; password: string }) => {
    const payload = await authApi.login(body);
    applySession(payload);
  };

  const register = async (body: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => {
    const payload = await authApi.register(body);
    applySession(payload);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
