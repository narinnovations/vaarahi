import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLogo, useSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — VAARAHI" },
      { name: "description", content: "Reset your VAARAHI account password." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const settings = useSettings();
  const brandLogo = useLogo();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Password reset email sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
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
              Reset your password
            </p>
          </div>
        </div>

        {sent ? (
          <div className="space-y-4 text-center text-sm">
            <p className="text-muted-foreground">
              We've emailed a password reset link to <strong>{email}</strong>. Please check your inbox.
            </p>
            <Link to="/auth" className="text-primary hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="mb-2 text-sm text-muted-foreground">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-full border border-border bg-background px-5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <button
              type="submit"
              disabled={busy}
              className="bg-rose-gradient text-primary-foreground w-full rounded-full py-3 text-sm tracking-wider uppercase shadow-luxe disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send reset link"}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              <Link to="/auth" className="text-primary hover:underline">Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
