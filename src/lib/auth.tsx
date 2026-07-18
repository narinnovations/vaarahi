import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);

      if (s?.user) {
        // defer role fetch to avoid deadlocks
        setTimeout(() => fetchRoles(s.user.id), 0);
      } else {
        setRoles([]);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);

      if (data.session?.user) {
        fetchRoles(data.session.user.id);
      }

      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function fetchRoles(uid: string) {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid);

    setRoles((data ?? []).map((r) => r.role));
  }

  const value: AuthState = {
    loading,
    session,
    user: session?.user ?? null,

    isAdmin:
      roles.includes("admin") ||
      roles.includes("super_admin"),

    isSuperAdmin:
      roles.includes("super_admin"),

    signOut: async () => {
      await supabase.auth.signOut();
      setRoles([]);
    },
  };

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);

  if (!ctx) {
    return {
      loading: true,
      session: null,
      user: null,
      isAdmin: false,
      isSuperAdmin: false,
      signOut: async () => {},
    } satisfies AuthState;
  }

  return ctx;
}