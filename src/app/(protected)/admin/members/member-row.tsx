"use client";

import { useTransition } from "react";
import { toggleMemberActive, removeMember } from "./actions";
import type { Member } from "@/lib/types";

export function MemberRow({ member }: { member: Member }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => {
      toggleMemberActive(member.id, !member.active);
    });
  }

  function handleRemove() {
    if (!confirm(`Remove ${member.email} from the group?`)) return;
    startTransition(() => {
      removeMember(member.id);
    });
  }

  return (
    <tr className={isPending ? "opacity-50" : ""}>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
        {member.name || "\u2014"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
        {member.email}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm">
        <span
          className={
            member.role === "admin"
              ? "inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800"
              : "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
          }
        >
          {member.role}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm">
        <span
          className={
            member.active
              ? "inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
              : "inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800"
          }
        >
          {member.active ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
        <button
          onClick={handleToggle}
          disabled={isPending}
          className="mr-2 text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {member.active ? "Deactivate" : "Activate"}
        </button>
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          Remove
        </button>
      </td>
    </tr>
  );
}
