import { supabase } from "@/integrations/supabase/client";

export async function logActivity(action: string, entity?: string, entityId?: string, metadata?: Record<string, unknown>) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    await supabase.from("activity_logs").insert({
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      action,
      entity: entity ?? null,
      entity_id: entityId ?? null,
      metadata: (metadata ?? null) as never,
    });
  } catch (e) {
    console.warn("[activity_log]", e);
  }
}

export async function recordPageView(path: string) {
  try {
    const sessionKey = "vaarahi_sid";
    let sid = typeof window !== "undefined" ? sessionStorage.getItem(sessionKey) : null;
    if (!sid && typeof window !== "undefined") {
      sid = crypto.randomUUID();
      sessionStorage.setItem(sessionKey, sid);
    }
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("page_views").insert({
      path,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      session_id: sid,
      user_id: userData?.user?.id ?? null,
    });
  } catch {
    /* silent */
  }
}
