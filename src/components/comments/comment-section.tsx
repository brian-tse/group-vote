"use client";

import { useState, useMemo } from "react";
import type { VoteComment } from "@/lib/types";
import { addComment } from "@/lib/actions/comment-actions";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";

interface CommentSectionProps {
  voteId: string;
  comments: VoteComment[];
  currentMemberId: string;
  isAdmin: boolean;
  isVoteOpen: boolean;
}

export function CommentSection({
  voteId,
  comments,
  currentMemberId,
  isAdmin,
  isVoteOpen,
}: CommentSectionProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  // Group into threads: top-level sorted newest first, replies sorted oldest first
  const threads = useMemo(() => {
    const topLevel = comments
      .filter((c) => !c.parent_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const repliesByParent = new Map<string, VoteComment[]>();
    for (const c of comments) {
      if (c.parent_id) {
        const list = repliesByParent.get(c.parent_id) || [];
        list.push(c);
        repliesByParent.set(c.parent_id, list);
      }
    }
    // Sort replies oldest first within each thread
    for (const [, list] of repliesByParent) {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    return topLevel.map((comment) => ({
      comment,
      replies: repliesByParent.get(comment.id) || [],
    }));
  }, [comments]);

  const handleReply = (commentId: string) => {
    setEditingCommentId(null);
    setReplyingTo(commentId);
  };

  const handleStartEdit = (commentId: string) => {
    setReplyingTo(null);
    setEditingCommentId(commentId);
  };

  const handleAddReply = async (parentId: string, body: string) => {
    return addComment(voteId, body, parentId);
  };

  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">
        Discussion{" "}
        <span className="font-normal text-gray-400">
          ({comments.length})
        </span>
      </h2>

      {isVoteOpen && (
        <div className="mt-4">
          <CommentForm
            submitLabel="Comment"
            onSubmit={async (body) => addComment(voteId, body)}
          />
        </div>
      )}

      <div className="mt-6 space-y-5">
        {threads.length === 0 && (
          <p className="text-sm text-gray-400">
            No comments yet. Start the discussion!
          </p>
        )}
        {threads.map(({ comment, replies }) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            voteId={voteId}
            currentMemberId={currentMemberId}
            isAdmin={isAdmin}
            isVoteOpen={isVoteOpen}
            isTopLevel={true}
            onReply={handleReply}
            replyingTo={replyingTo}
            editingCommentId={editingCommentId}
            onStartEdit={handleStartEdit}
            onCancelEdit={() => setEditingCommentId(null)}
            onCancelReply={() => setReplyingTo(null)}
            replies={replies}
            onAddReply={handleAddReply}
          />
        ))}
      </div>
    </div>
  );
}
