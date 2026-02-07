"use client";

export default function VoteDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 py-8">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-800">
          Something went wrong loading this vote
        </h2>
        <p className="mt-2 text-sm text-red-700">
          {error.message || "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-red-500">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Try again
      </button>
    </div>
  );
}
