"use client";

import { useState, useTransition } from "react";
import type { VoteComment } from "@/lib/types";
import { editComment, deleteComment } from "@/lib/actions/comment-actions";
import { CommentForm } from "./comment-form";

interface CommentItemProps {
  comment: VoteComment;
  voteId: string;
  currentMemberId: string;
  isAdmin: boolean;
  isVoteOpen: boolean;
  isTopLevel: boolean;
  onReply?: (commentId: string) => void;
  replyingTo: string | null;
  editingCommentId: string | null;
  onStartEdit: (commentId: string) => void;
  onCancelEdit: () => void;
  onCancelReply: () => void;
  replies?: VoteComment[];
  onAddReply: (parentId: string, body: string) => Promise<{ error?: string }>;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function CommentItem({
  comment,
  voteId,
  currentMemberId,
  isAdmin,
  isVoteOpen,
  isTopLevel,
  onReply,
  replyingTo,
  editingCommentId,
  onStartEdit,
  onCancelEdit,
  onCancelReply,
  replies = [],
  onAddReply,
}: CommentItemProps) {
  const [isDeleting, startDeleteTransition] = useTransition();
  const isOwn = comment.member_id === currentMemberId;
  const isEditing = editingCommentId === comment.id;
  const isReplying = replyingTo === comment.id;
  const wasEdited = comment.updated_at !== comment.created_at;
  const displayName = comment.member_name || comment.member_email;

  const handleDelete = () => {
    if (!confirm("Delete this comment?")) return;
    startDeleteTransition(async () => {
      await deleteComment(comment.id, voteId);
    });
  };

  return (
    <div className={isDeleting ? "opacity-50" : ""}>
      <div className="space-y-1">
        <div className="flex items-baseline gap-2 text-sm">
          <span className="font-medium text-gray-900">{displayName}</span>
          <span className="text-xs text-gray-400">
            {formatRelativeTime(comment.created_at)}
          </span>
          {wasEdited && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
        </div>

        {isEditing ? (
          <CommentForm
            initialBody={comment.body}
            submitLabel="Save"
            autoFocus
            onCancel={onCancelEdit}
            onSubmit={async (body) => {
              const result = await editComment(comment.id, voteId, body);
              if (!result.error) onCancelEdit();
              return result;
            }}
          />
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</p>
        )}

        {!isEditing && isVoteOpen && (
          <div className="flex gap-3 pt-0.5">
            {isTopLevel && onReply && (
              <button
                onClick={() => onReply(comment.id)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Reply
              </button>
            )}
            {isOwn && (
              <button
                onClick={() => onStartEdit(comment.id)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Edit
              </button>
            )}
            {(isOwn || isAdmin) && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-xs text-gray-400 hover:text-red-500"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="mt-3 space-y-3 border-l-2 border-gray-200 pl-4 ml-4">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              voteId={voteId}
              currentMemberId={currentMemberId}
              isAdmin={isAdmin}
              isVoteOpen={isVoteOpen}
              isTopLevel={false}
              replyingTo={replyingTo}
              editingCommentId={editingCommentId}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onCancelReply={onCancelReply}
              onAddReply={onAddReply}
            />
          ))}
        </div>
      )}

      {/* Inline reply form */}
      {isReplying && (
        <div className="mt-2 border-l-2 border-gray-200 pl-4 ml-4">
          <CommentForm
            submitLabel="Reply"
            placeholder={`Reply to ${displayName}...`}
            autoFocus
            onCancel={onCancelReply}
            onSubmit={async (body) => {
              const result = await onAddReply(comment.id, body);
              if (!result.error) onCancelReply();
              return result;
            }}
          />
        </div>
      )}
    </div>
  );
}
