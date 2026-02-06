"use client";

import { useActionState } from "react";
import { loginWithMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { error: null, success: false };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginWithMagicLink,
    initialState
  );

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      <div className="bg-navy-500 px-4 py-6 text-center">
        <h1 className="text-2xl font-bold text-white">ACAMG Voting</h1>
        <p className="mt-1 text-sm text-white/60">
          Anesthesia Care Associates Medical Group
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Sign In
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in with your group email to access voting
            </p>
          </div>

          {state.success ? (
            <div className="rounded-lg bg-green-50 p-6 text-center">
              <h2 className="text-lg font-semibold text-green-800">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-green-700">
                We sent a login link to your email. Click it to sign in.
                The link expires in 15 minutes.
              </p>
            </div>
          ) : (
            <form action={formAction} className="space-y-6">
              {state.error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                  {state.error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Sending..." : "Send Login Link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
