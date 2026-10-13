"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { LoginPanel } from "@/components/booking/login-panel";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api/client";
import type { components } from "@/lib/api/schema";

type User = components["schemas"]["User"];

type Auth = {
  /** `undefined` while the session is being checked, `null` for a guest */
  user: User | null | undefined;
  setUser: (user: User | null) => void;
  /** open the sign-in modal; `onDone` runs after a successful sign-in */
  openLogin: (onDone?: (user: User) => void) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

/**
 * The session lives in an httpOnly cookie; this keeps what the UI needs (who is signed in)
 * and the single sign-in modal, which uses the same LoginPanel and API calls as the checkout.
 */
export function AuthProvider({ consentUrl, children }: { consentUrl?: string; children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [afterLogin, setAfterLogin] = useState<((user: User) => void) | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<User>("/me/")
      .then((me) => !cancelled && setUser(me))
      .catch(() => !cancelled && setUser(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const openLogin = useCallback((onDone?: (user: User) => void) => {
    setAfterLogin(() => onDone ?? null);
    setOpen(true);
  }, []);

  const logout = useCallback(async () => {
    await api("/auth/logout/", { method: "POST" });
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, setUser, openLogin, logout }), [user, openLogin, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Modal open={open} onClose={() => setOpen(false)} label="Вход">
        <LoginPanel
          bare
          consentUrl={consentUrl}
          onLoggedIn={(me) => {
            setUser(me);
            setOpen(false);
            afterLogin?.(me);
          }}
        />
      </Modal>
    </AuthContext.Provider>
  );
}
