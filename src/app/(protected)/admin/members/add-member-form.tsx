"use client";

import { useActionState, useRef } from "react";
import { addMember, type AddMemberState } from "./actions";
import type { Division, MemberRole } from "@/lib/types";

const initialState: AddMemberState = { error: null, success: false };

interface AddMemberFormProps {
  divisions: Division[];
  memberRole: MemberRole;
  memberDivisionId: string;
}

export function AddMemberForm({ divisions, memberRole, memberDivisionId }: AddMemberFormProps) {
  const [state, formAction, isPending] = useActionState(addMember, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const isSuperAdmin = memberRole === "super_admin";

  // Reset form on success
  if (state.success && formRef.current) {
    formRef.current.reset();
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Add Member</h2>
      <form ref={formRef} action={formAction} className="mt-3 flex flex-wrap gap-3">
        <input
          name="name"
          type="text"
          placeholder="Name (optional)"
          className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="email@example.com"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {isSuperAdmin ? (
          <select
            name="division_id"
            defaultValue={memberDivisionId}
            className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {divisions.map((div) => (
              <option key={div.id} value={div.id}>
                {div.name}
              </option>
            ))}
          </select>
        ) : (
          <input type="hidden" name="division_id" value={memberDivisionId} />
        )}
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
        <p className="mt-2 text-sm text-green-600">Member added successfully.</p>
      )}
    </div>
  );
}
