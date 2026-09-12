"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Heart, PhilippinePeso } from "lucide-react";
import { Button, Field, cn, inputClass } from "@/src/components/ui";
import { isSupabaseConfigured, supabase, supabaseLoginEmail, supabaseLoginUsername } from "@/src/lib/supabase";

type AuthStatus = "checking" | "signed-out" | "signed-in";

interface AuthContextValue {
  user: SupabaseUser | null;
  username: string;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? "checking" : "signed-out");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setUser(data.session?.user || null);
      setStatus(data.session?.user ? "signed-in" : "signed-out");
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setStatus(session?.user ? "signed-in" : "signed-out");
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const signIn = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") || "").trim();
    const password = String(form.get("password") || "");
    const email = username.toLowerCase() === supabaseLoginUsername.toLowerCase() ? supabaseLoginEmail : username;

    if (username.toLowerCase() !== supabaseLoginUsername.toLowerCase() && !username.includes("@")) {
      setError("Please use the household username.");
      setSubmitting(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError("Login failed. Please check the username and password.");
    setSubmitting(false);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ user, username: supabaseLoginUsername, signOut }), [signOut, user]);

  if (!isSupabaseConfigured) {
    return <AuthShell title="Supabase setup needed" message="Add your Supabase URL and publishable key before logging in." />;
  }

  if (status === "checking") {
    return <AuthShell title="Budget Tracker" message="Checking your login session." />;
  }

  if (!user) {
    return (
      <AuthContext.Provider value={value}>
        <main className="flex min-h-screen items-center justify-center bg-[#ded8ff] p-4 text-slate-900">
          <section className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-[0_32px_90px_rgba(103,93,198,0.22)]">
            <div className="flex items-center gap-3">
              <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6c63f6] to-[#8d85ff] text-white shadow-[0_12px_28px_rgba(103,93,198,0.28)]">
                <Heart size={25} fill="currentColor" strokeWidth={1.5} />
                <PhilippinePeso className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 text-[#6c63f6] shadow-sm" size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#6c63f6]">Budget Tracker</p>
                <h1 className="text-2xl font-semibold text-slate-950">Sign in</h1>
              </div>
            </div>
            <form className="mt-6 grid gap-4" onSubmit={signIn}>
              <Field label="Username">
                <input className={inputClass} name="username" autoComplete="username" defaultValue={supabaseLoginUsername} required />
              </Field>
              <Field label="Password">
                <input className={inputClass} name="password" type="password" autoComplete="current-password" required />
              </Field>
              {error ? <p className="rounded-lg border border-[#fac1cf] bg-[#fff1f4] px-3 py-2 text-sm font-semibold text-[#c43d5c]">{error}</p> : null}
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </section>
        </main>
      </AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function AuthShell({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#ded8ff] p-4 text-slate-900">
      <section className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white/95 p-6 text-center shadow-[0_32px_90px_rgba(103,93,198,0.22)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#6c63f6] text-white">
          <Heart size={24} fill="currentColor" strokeWidth={1.5} />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-slate-950">{title}</h1>
        <p className={cn("mt-2 text-sm leading-6 text-slate-600")}>{message}</p>
      </section>
    </main>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}