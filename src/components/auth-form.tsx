"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthActionResult } from "@/app/actions/auth";

type AuthMode = "login" | "signup";

type AuthState = AuthActionResult;

const initialState: AuthState = { error: null };

async function signInStateAction(_: AuthState, formData: FormData): Promise<AuthState> {
  return signIn(formData);
}

async function signUpStateAction(_: AuthState, formData: FormData): Promise<AuthState> {
  return signUp(formData);
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [state, action, isPending] = useActionState(
    mode === "login" ? signInStateAction : signUpStateAction,
    initialState,
  );

  const isLogin = mode === "login";

  return (
    <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm">
      <h1 className="text-2xl font-semibold text-zinc-900">{isLogin ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-1 text-sm text-zinc-600">
        {isLogin ? "Sign in to manage your notes." : "Start writing and organizing markdown notes."}
      </p>

      <form action={action} className="mt-6 space-y-4">
        <label className="block space-y-1 text-sm font-medium text-zinc-800">
          <span>Email</span>
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-500 focus:ring-2"
          />
        </label>

        <label className="block space-y-1 text-sm font-medium text-zinc-800">
          <span>Password</span>
          <input
            required
            name="password"
            type="password"
            minLength={8}
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-500 focus:ring-2"
          />
        </label>

        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Please wait..." : isLogin ? "Sign in" : "Sign up"}
        </button>
      </form>

      <p className="mt-4 text-sm text-zinc-600">
        {isLogin ? "Need an account?" : "Already have an account?"}{" "}
        <Link className="font-medium text-zinc-900 underline" href={isLogin ? "/signup" : "/login"}>
          {isLogin ? "Sign up" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
