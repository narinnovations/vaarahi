import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "super_admin" | "admin" | "manager" | "staff" | "readonly" | "customer";

const RANK: Record<AppRole, number> = {
  super_admin: 100,
  admin: 80,
  manager: 60,
  staff: 40,
  readonly: 20,
  customer: 0,
};

/**
 * Returns the current user's roles + convenience helpers.
 * Enforce permissions in the UI *and* rely on Supabase RLS for real security.
 */
export function usePermissions() {
  const { data, isLoading } = useQuery({
    queryKey: ["current-user-roles"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return { user: null, roles: [] as AppRole[] };
      const { data: rows } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return {
        user,
        roles: (rows ?? []).map((r) => r.role as AppRole),
      };
    },
    staleTime: 60_000,
  });

  const roles = data?.roles ?? [];
  const has = (role: AppRole) => roles.includes(role);
  const atLeast = (role: AppRole) => Math.max(...roles.map((r) => RANK[r] ?? 0), 0) >= RANK[role];

  return {
    isLoading,
    user: data?.user ?? null,
    roles,
    has,
    atLeast,
    canWrite: atLeast("staff"),
    canManage: atLeast("manager"),
    isAdmin: atLeast("admin"),
    isSuperAdmin: has("super_admin"),
    isReadOnly: roles.length > 0 && roles.every((r) => r === "readonly" || r === "customer"),
  };
}
