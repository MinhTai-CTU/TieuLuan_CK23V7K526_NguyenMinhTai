"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { getToken } from "@/lib/auth-storage";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale/vi";

interface CommentUser {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  user: CommentUser;
  parentId: string | null;
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
}

interface BlogCommentsProps {
  blogSlug: string;
  blogAuthorId?: string | null;
}

// Component để render time ago chỉ trên client (tránh hydration error)
const TimeAgo: React.FC<{ date: string }> = ({ date }) => {
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    setTimeAgo(
      formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: vi,
      })
    );
  }, [date]);

  if (!timeAgo) return <span className="text-xs text-gray-600">...</span>;

  return <span className="text-xs text-gray-600">{timeAgo}</span>;
};

// CommentItem component với tất cả dependencies được truyền qua props
interface CommentItemProps {
  comment: Comment;
  level?: number;
  blogAuthorId?: string | null;
  isAuthenticated: boolean;
  replyingTo: string | null;
  replyContent: string;
  getReplyContent: (commentId: string) => string;
  onToggleReply: (commentId: string) => void;
  onReplyContentChange: (commentId: string, value: string) => void;
  onSubmitReply: (commentId: string) => void;
  onCancelReply: (commentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = React.memo(
  ({
    comment,
    level = 0,
    blogAuthorId,
    isAuthenticated,
    replyingTo,
    replyContent,
    getReplyContent,
    onToggleReply,
    onReplyContentChange,
    onSubmitReply,
    onCancelReply,
  }) => {
    const isAuthor = comment.userId === blogAuthorId;

    return (
      <div className={`${level > 0 ? "ml-8 mt-3" : "mb-4"}`}>
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {comment.user.avatar ? (
              <Image
                src={comment.user.avatar}
                alt={comment.user.name || comment.user.email}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-light-5 flex items-center justify-center text-blue font-medium">
                {(comment.user.name ||
                  comment.user.email ||
                  "U")[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-gray-1 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-dark">
                  {comment.user.name || comment.user.email}
                </span>
                {isAuthor && (
                  <span className="text-xs bg-blue text-white px-2 py-0.5 rounded">
                    Tác giả
                  </span>
                )}
                <TimeAgo date={comment.createdAt} />
              </div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>

            {/* Actions */}
            {isAuthenticated && level < 2 && (
              <div className="flex items-center gap-4 mt-2 ml-3">
                <button
                  onClick={() => onToggleReply(comment.id)}
                  className="text-xs text-gray-600 hover:text-blue transition-colors"
                >
                  Trả lời
                </button>
              </div>
            )}

            {/* Reply input */}
            {replyingTo === comment.id && (
              <div className="mt-3 ml-3">
                <textarea
                  value={replyContent}
                  onChange={(e) =>
                    onReplyContentChange(comment.id, e.target.value)
                  }
                  placeholder="Viết trả lời..."
                  className="w-full px-3 py-2 border border-gray-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue text-sm resize-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => onSubmitReply(comment.id)}
                    className="px-4 py-1.5 bg-blue text-white rounded-md hover:bg-blue-dark transition-colors text-sm"
                  >
                    Trả lời
                  </button>
                  <button
                    onClick={() => onCancelReply(comment.id)}
                    className="px-4 py-1.5 bg-gray-2 text-gray-700 rounded-md hover:bg-gray-3 transition-colors text-sm"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    level={level + 1}
                    blogAuthorId={blogAuthorId}
                    isAuthenticated={isAuthenticated}
                    replyingTo={replyingTo}
                    replyContent={getReplyContent(reply.id)}
                    getReplyContent={getReplyContent}
                    onToggleReply={onToggleReply}
                    onReplyContentChange={onReplyContentChange}
                    onSubmitReply={onSubmitReply}
                    onCancelReply={onCancelReply}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

CommentItem.displayName = "CommentItem";

const BlogComments: React.FC<BlogCommentsProps> = ({
  blogSlug,
  blogAuthorId,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  // Sử dụng object để lưu reply content cho từng comment ID
  const [replyContents, setReplyContents] = useState<{ [key: string]: string }>(
    {}
  );
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/blogs/${blogSlug}/comments`);
      const data = await response.json();

      if (data.success) {
        setComments(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [blogSlug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để bình luận");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Vui lòng nhập nội dung bình luận");
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`/api/blogs/${blogSlug}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Đã thêm bình luận");
        setNewComment("");
        await fetchComments();
      } else {
        toast.error(data.error || "Không thể thêm bình luận");
      }
    } catch (error) {
      console.error("Error creating comment:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleSubmitReply = useCallback(
    async (parentId: string) => {
      const replyContent = replyContents[parentId] || "";
      if (!replyContent.trim()) {
        toast.error("Vui lòng nhập nội dung trả lời");
        return;
      }

      try {
        const token = getToken();
        const response = await fetch(`/api/blogs/${blogSlug}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: replyContent.trim(),
            parentId,
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success("Đã trả lời bình luận");
          setReplyContents((prev) => {
            const newContents = { ...prev };
            delete newContents[parentId];
            return newContents;
          });
          setReplyingTo(null);
          await fetchComments();
        } else {
          toast.error(data.error || "Không thể trả lời");
        }
      } catch (error) {
        console.error("Error replying:", error);
        toast.error("Có lỗi xảy ra");
      }
    },
    [blogSlug, replyContents, fetchComments]
  );

  const handleReplyContentChange = useCallback(
    (commentId: string, value: string) => {
      setReplyContents((prev) => ({
        ...prev,
        [commentId]: value,
      }));
    },
    []
  );

  const handleToggleReply = useCallback(
    (commentId: string) => {
      setReplyingTo((prev) => (prev === commentId ? null : commentId));
      if (replyingTo !== commentId) {
        setReplyContents((prev) => ({
          ...prev,
          [commentId]: prev[commentId] || "",
        }));
      }
    },
    [replyingTo]
  );

  const handleCancelReply = useCallback((commentId: string) => {
    setReplyingTo(null);
    setReplyContents((prev) => {
      const newContents = { ...prev };
      delete newContents[commentId];
      return newContents;
    });
  }, []);

  const getReplyContent = useCallback(
    (commentId: string) => {
      return replyContents[commentId] || "";
    },
    [replyContents]
  );

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="text-gray-400">Đang tải bình luận...</div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-medium text-dark mb-6">
        Bình luận ({comments.length})
      </h3>

      {/* Comment form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name || user.email}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-light-5 flex items-center justify-center text-blue font-medium">
                  {(user?.name || user?.email || "U")[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận..."
                className="w-full px-4 py-3 border border-gray-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue resize-none"
                rows={3}
              />
              <div className="flex items-center justify-end mt-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue text-white rounded-md hover:bg-blue-dark transition-colors"
                >
                  Bình luận
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-gray-1 rounded-lg text-center">
          <p className="text-gray-600 mb-2">Vui lòng đăng nhập để bình luận</p>
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
        </div>
      ) : (
        <div>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              blogAuthorId={blogAuthorId}
              isAuthenticated={isAuthenticated}
              replyingTo={replyingTo}
              replyContent={getReplyContent(comment.id)}
              getReplyContent={getReplyContent}
              onToggleReply={handleToggleReply}
              onReplyContentChange={handleReplyContentChange}
              onSubmitReply={handleSubmitReply}
              onCancelReply={handleCancelReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogComments;
