import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getAccessToken,
  loginRequest,
  logoutRequest,
  meRequest,
  tryRestoreSession,
  type AdminMe,
} from "@/api/adminAuth";
import { setSessionLostHandler } from "@/api/http";
import { setAccessToken } from "@/auth/token";

type AuthState = {
  user: AdminMe | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchMe: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminMe | null>(null);
  const [loading, setLoading] = useState(true);

  const refetchMe = useCallback(async () => {
    const tok = getAccessToken();
    if (!tok) {
      setUser(null);
      return;
    }
    const me = await meRequest();
    setUser(me);
  }, []);

  useEffect(() => {
    setSessionLostHandler(() => {
      setUser(null);
      setAccessToken(null);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await tryRestoreSession();
        if (getAccessToken()) {
          const me = await meRequest();
          if (!cancelled) setUser(me);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { admin } = await loginRequest(email, password);
    setUser({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refetchMe }),
    [user, loading, login, logout, refetchMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
