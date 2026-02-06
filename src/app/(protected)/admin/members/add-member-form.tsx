"use client";

import { useActionState, useRef } from "react";
import { addMember, type AddMemberState } from "./actions";

const initialState: AddMemberState = { error: null, success: false };

export function AddMemberForm() {
  const [state, formAction, isPending] = useActionState(addMember, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form on success
  if (state.success && formRef.current) {
    formRef.current.reset();
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Add Member</h2>
      <form ref={formRef} action={formAction} className="mt-3 flex gap-3">
        <input
          name="name"
          type="text"
          placeholder="Name (optional)"
          className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="email@example.com"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add"}
        </button>
      </form>
      {state.error && (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      )}
      {state.success && (
        <p className="mt-2 text-sm text-green-600">Member added successfully.</p>
      )}
    </div>
  );
}
