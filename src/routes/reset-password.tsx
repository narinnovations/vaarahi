import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLogo, useSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — VAARAHI" },
      { name: "description", content: "Set a new password for your VAARAHI account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw))
    return "Include at least one letter and one number";
  return null;
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const settings = useSettings();
  const brandLogo = useLogo();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash and fires
    // PASSWORD_RECOVERY on load. We just wait for a session to exist.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session || event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validatePassword(password);
    if (err) return toast.error(err);
    if (password !== confirm) return toast.error("Passwords do not match");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success("Password updated — please sign in");
      navigate({ to: "/auth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-blush-gradient flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-background/95 p-8 shadow-luxe backdrop-blur">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <img src={brandLogo} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-champagne/50" />
          <div>
            <h1 className="font-display text-3xl tracking-[0.18em]">{settings.store.name}</h1>
            <p className="mt-1 text-xs tracking-[0.25em] uppercase text-muted-foreground">
              Choose a new password
            </p>
          </div>
        </div>

        {!ready ? (
          <p className="text-center text-sm text-muted-foreground">
            Verifying your reset link…
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 8, letters + numbers)"
              className="w-full rounded-full border border-border bg-background px-5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <input
              required
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-full border border-border bg-background px-5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <button
              type="submit"
              disabled={busy}
              className="bg-rose-gradient text-primary-foreground w-full rounded-full py-3 text-sm tracking-wider uppercase shadow-luxe disabled:opacity-60"
            >
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
