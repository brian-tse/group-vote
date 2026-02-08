"use client";

import { useTransition } from "react";
import { toggleMemberActive, toggleMemberRole, toggleVotingMember, removeMember } from "./actions";
import type { Member, MemberRole } from "@/lib/types";

interface MemberRowProps {
  member: Member;
  divisionName?: string;
  showDivision: boolean;
  isSuperAdmin: boolean;
}

export function MemberRow({ member, divisionName, showDivision, isSuperAdmin }: MemberRowProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => {
      toggleMemberActive(member.id, !member.active);
    });
  }

  function handleToggleRole() {
    let newRole: MemberRole;
    if (member.role === "super_admin") {
      newRole = "admin";
    } else if (member.role === "admin") {
      newRole = "member";
    } else {
      newRole = "admin";
    }
    if (
      !confirm(
        `Change ${member.email} role to ${newRole}?`
      )
    )
      return;
    startTransition(() => {
      toggleMemberRole(member.id, newRole);
    });
  }

  function handleToggleVoting() {
    startTransition(() => {
      toggleVotingMember(member.id, !member.voting_member);
    });
  }

  function handleRemove() {
    if (!confirm(`Remove ${member.email} from the group?`)) return;
    startTransition(() => {
      removeMember(member.id);
    });
  }

  const roleStyle =
    member.role === "super_admin"
      ? "inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
      : member.role === "admin"
        ? "inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800"
        : "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800";

  const roleLabel =
    member.role === "super_admin" ? "super admin" : member.role;

  // Role toggle button label
  let roleToggleLabel: string;
  if (member.role === "super_admin") {
    roleToggleLabel = "Make Admin";
  } else if (member.role === "admin") {
    roleToggleLabel = "Make Member";
  } else {
    roleToggleLabel = "Make Admin";
  }

  return (
    <tr className={isPending ? "opacity-50" : ""}>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
        {member.name || "\u2014"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
        {member.email}
      </td>
      {showDivision && (
        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
          {divisionName || "\u2014"}
        </td>
      )}
      <td className="whitespace-nowrap px-4 py-3 text-sm">
        <span className={roleStyle}>
          {roleLabel}
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
      <td className="whitespace-nowrap px-4 py-3 text-sm">
        <button
          onClick={handleToggleVoting}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <span
            className={
              member.voting_member
                ? "inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                : "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
            }
          >
            {member.voting_member ? "Shareholder" : "Non-voting"}
          </span>
        </button>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
        {isSuperAdmin && (
          <button
            onClick={handleToggleRole}
            disabled={isPending}
            className="mr-2 text-purple-600 hover:text-purple-800 disabled:opacity-50"
          >
            {roleToggleLabel}
          </button>
        )}
        <button
          onClick={handleToggle}
          disabled={isPending}
          className="mr-2 text-brand-500 hover:text-brand-700 disabled:opacity-50"
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
