"use client";

import { useState } from "react";

interface MemberStats {
  id: string;
  name: string;
  email: string;
  voted: number;
  missed: number;
  rate: number;
}

type SortField = "name" | "voted" | "missed" | "rate";
type SortDir = "asc" | "desc";

export function ParticipationTable({ data }: { data: MemberStats[] }) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "name" ? "asc" : "desc");
    }
  }

  const sorted = [...data].sort((a, b) => {
    let cmp: number;
    if (sortField === "name") {
      cmp = a.name.localeCompare(b.name);
    } else {
      cmp = a[sortField] - b[sortField];
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  function SortHeader({
    field,
    label,
    className,
  }: {
    field: SortField;
    label: string;
    className?: string;
  }) {
    const isActive = sortField === field;
    return (
      <th
        className={`cursor-pointer select-none px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700 ${className || "text-left"}`}
        onClick={() => toggleSort(field)}
      >
        {label}
        {isActive && (
          <span className="ml-1">{sortDir === "asc" ? "^" : "v"}</span>
        )}
      </th>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <SortHeader field="name" label="Member" />
            <SortHeader
              field="voted"
              label="Voted"
              className="text-center"
            />
            <SortHeader
              field="missed"
              label="Missed"
              className="text-center"
            />
            <SortHeader
              field="rate"
              label="Rate"
              className="text-right"
            />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sorted.map((row) => (
            <tr key={row.id}>
              <td className="whitespace-nowrap px-4 py-3 text-sm">
                <div className="font-medium text-gray-900">{row.name}</div>
                <div className="text-xs text-gray-500">{row.email}</div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-green-600">
                {row.voted}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-red-500">
                {row.missed}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                <div className="flex items-center justify-end gap-2">
                  <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full ${
                        row.rate >= 75
                          ? "bg-green-500"
                          : row.rate >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${row.rate}%` }}
                    />
                  </div>
                  <span className="w-10 font-medium text-gray-700">
                    {row.rate}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
