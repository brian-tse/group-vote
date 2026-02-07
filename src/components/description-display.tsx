/**
 * Renders a vote/proposal description, handling both HTML (from rich text editor)
 * and plain text (legacy descriptions with newlines).
 */
export function DescriptionDisplay({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  const isHtml = content.includes("<");

  if (isHtml) {
    return (
      <div
        className={`prose prose-sm max-w-none text-gray-600 ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Plain text — preserve line breaks
  return (
    <p className={`whitespace-pre-line text-gray-600 ${className}`}>
      {content}
    </p>
  );
}
