"use client";

import { useActionState, useRef } from "react";
import { addDivision, type AddDivisionState } from "./actions";

const initialState: AddDivisionState = { error: null, success: false };

export function AddDivisionForm() {
  const [state, formAction, isPending] = useActionState(addDivision, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  if (state.success && formRef.current) {
    formRef.current.reset();
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Add Division</h2>
      <form ref={formRef} action={formAction} className="mt-3 flex gap-3">
        <input
          name="name"
          type="text"
          required
          placeholder="Division name (e.g. East Bay)"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <input
          name="slug"
          type="text"
          required
          placeholder="Slug (e.g. eb)"
          className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isPending ? "Adding..." : "Add"}
        </button>
      </form>
      {state.error && (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      )}
      {state.success && (
        <p className="mt-2 text-sm text-green-600">Division created successfully.</p>
      )}
    </div>
  );
}
