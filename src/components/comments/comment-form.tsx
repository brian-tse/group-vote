"use client";

import { useState, useTransition } from "react";

interface CommentFormProps {
  onSubmit: (body: string) => Promise<{ error?: string }>;
  onCancel?: () => void;
  initialBody?: string;
  submitLabel: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CommentForm({
  onSubmit,
  onCancel,
  initialBody = "",
  submitLabel,
  placeholder = "Write a comment...",
  autoFocus = false,
}: CommentFormProps) {
  const [body, setBody] = useState(initialBody);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setError(null);
    startTransition(async () => {
      const result = await onSubmit(body.trim());
      if (result.error) {
        setError(result.error);
      } else {
        setBody("");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        maxLength={2000}
        autoFocus={autoFocus}
        disabled={isPending}
        rows={3}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {body.length}/2000
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {isPending ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}
