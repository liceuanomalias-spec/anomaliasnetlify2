import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { storage } from "@/src/utils/storage";
import { apiFetch } from "@/src/utils/api";

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL;

export type UserType = "aluno" | "professor" | null;

export type User = {
  id: string;
  email: string;
  user_type: UserType;
};

type AuthState = {
  token: string | null;
  user: User | null;
  adminToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  adminLogout: () => Promise<void>;
  setUserType: (t: "aluno" | "professor") => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

const TOKEN_KEY = "aelc_token";
const USER_KEY = "aelc_user";
const ADMIN_TOKEN_KEY = "aelc_admin_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const t = await storage.getItem(TOKEN_KEY, "");
      const u = await storage.getItem<string>(USER_KEY, "");
      const at = await storage.getItem(ADMIN_TOKEN_KEY, "");
      if (t && typeof t === "string") setToken(t);
      if (u && typeof u === "string") {
        try { setUser(JSON.parse(u) as User); } catch {}
      }
      if (at && typeof at === "string") setAdminToken(at);
      setLoading(false);
    })();
  }, []);

  const persistAuth = async (t: string, u: User) => {
    setToken(t);
    setUser(u);
    await storage.setItem(TOKEN_KEY, t);
    await storage.setItem(USER_KEY, JSON.stringify(u));
  };

  const login = async (email: string, password: string) => {
    const result = await apiFetch<{ token: string; user: User }>(
      "/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      },
    );
    if (!result.ok) throw new Error(result.error);
    await persistAuth(result.data.token, result.data.user);
  };

  const register = async (email: string, password: string) => {
    const result = await apiFetch<{ token: string; user: User }>(
      "/api/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      },
    );
    if (!result.ok) throw new Error(result.error);
    await persistAuth(result.data.token, result.data.user);
  };

  const adminLogin = async (username: string, password: string) => {
    const result = await apiFetch<{ token: string }>(
      "/api/auth/admin-login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      },
    );
    if (!result.ok) throw new Error(result.error);
    setAdminToken(result.data.token);
    await storage.setItem(ADMIN_TOKEN_KEY, result.data.token);
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await storage.removeItem(TOKEN_KEY);
    await storage.removeItem(USER_KEY);
  };

  const adminLogout = async () => {
    setAdminToken(null);
    await storage.removeItem(ADMIN_TOKEN_KEY);
  };

  const setUserType = async (t: "aluno" | "professor") => {
    if (!token) throw new Error("Não autenticado");
    const result = await apiFetch<{ user_type: string }>("/api/user/type", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_type: t }),
    });
    if (!result.ok) throw new Error(result.error);
    if (user) {
      const updated = { ...user, user_type: t };
      setUser(updated);
      await storage.setItem(USER_KEY, JSON.stringify(updated));
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    const result = await apiFetch<{ user: User }>("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) return;
    setUser(result.data.user);
    await storage.setItem(USER_KEY, JSON.stringify(result.data.user));
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        adminToken,
        loading,
        login,
        register,
        adminLogin,
        logout,
        adminLogout,
        setUserType,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const API_BASE = BACKEND;
