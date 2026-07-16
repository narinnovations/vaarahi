import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/vaarahi-logo.png";
import { useSettings, useLogo } from "@/lib/site-settings";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — VAARAHI" },
      { name: "description", content: "Sign in or create your VAARAHI account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const settings = useSettings();
  const brandLogo = useLogo();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/account" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/account`,
            data: {
              full_name: name,
            },
          },
        });

        if (error) throw error;

        toast.success("Account created successfully");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success("Welcome back");
      }

      navigate({ to: "/account" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/account`,
      },
    });

    if (error) {
      toast.error(error.message);
      setBusy(false);
    }
  };

  return (
    <div className="bg-blush-gradient flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-background/95 p-8 shadow-luxe backdrop-blur">

        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <img
            src={brandLogo || logo}
            alt=""
            className="h-16 w-16 rounded-full object-cover ring-2 ring-champagne/50"
          />

          <div>
            <h1 className="font-display text-3xl tracking-[0.18em]">
              {settings.store.name}
            </h1>

            <p className="mt-1 text-xs tracking-[0.25em] uppercase text-muted-foreground">
              {mode === "signin"
                ? "Welcome back"
                : "Create your account"}
            </p>
          </div>
        </div>

        <button
          onClick={google}
          disabled={busy}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-full border border-border bg-background px-4 py-3 text-sm font-medium transition hover:bg-blush disabled:opacity-60"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.1a6.9 6.9 0 010-4.41V6.85H2.18a11 11 0 000 10.3l3.66-2.85z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.85l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
            />
          </svg>

          Continue with Google
        </button>

        <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">

          {mode === "signup" && (
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="input"
            />
          )}

          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="input"
          />

          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="input"
          />

          <button
            type="submit"
            disabled={busy}
            className="bg-rose-gradient text-primary-foreground w-full rounded-full py-3 text-sm tracking-wider uppercase shadow-luxe disabled:opacity-60"
          >
            {busy
              ? "Please wait..."
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </button>

          {mode === "signin" && (
            <p className="text-center text-xs">
              <Link
                to="/forgot-password"
                className="text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </p>
          )}
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "signin"
            ? "New here? "
            : "Already have an account? "}

          <button
            onClick={() =>
              setMode(mode === "signin" ? "signup" : "signin")
            }
            className="font-medium text-primary hover:underline"
          >
            {mode === "signin"
              ? "Create an account"
              : "Sign in"}
          </button>
        </p>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          By continuing you agree to our{" "}
          <Link
            to="/policies/$slug"
            params={{ slug: "terms" }}
            className="underline"
          >
            Terms
          </Link>{" "}
          &{" "}
          <Link
            to="/policies/$slug"
            params={{ slug: "privacy" }}
            className="underline"
          >
            Privacy Policy
          </Link>
          .
        </p>

      </div>

      <style>{`
        .input{
          width:100%;
          border:1px solid var(--color-border);
          background:var(--color-background);
          border-radius:9999px;
          padding:.75rem 1.25rem;
          font-size:.875rem;
          outline:none;
          transition:border-color .2s,box-shadow .2s;
        }

        .input:focus{
          border-color:var(--color-primary);
          box-shadow:0 0 0 3px oklch(.7 .09 30 / .15);
        }
      `}</style>
    </div>
  );
}