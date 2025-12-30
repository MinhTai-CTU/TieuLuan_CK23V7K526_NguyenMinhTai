"use client";

import React, { useState, useEffect, useRef } from "react";
import { getToken } from "@/lib/auth-storage";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

interface Reaction {
  id: string;
  type: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
}

interface BlogReactionsProps {
  blogSlug: string;
}

const REACTION_TYPES = [
  { type: "like", emoji: "👍", label: "Thích" },
  { type: "love", emoji: "❤️", label: "Yêu thích" },
  { type: "haha", emoji: "😂", label: "Haha" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "sad", emoji: "😢", label: "Buồn" },
  { type: "angry", emoji: "😡", label: "Giận dữ" },
];

const BlogReactions: React.FC<BlogReactionsProps> = ({ blogSlug }) => {
  const { isAuthenticated } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReactions();
  }, [blogSlug]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  const fetchReactions = async () => {
    try {
      const response = await fetch(`/api/blogs/${blogSlug}/reactions`);
      const data = await response.json();

      if (data.success) {
        setReactions(data.data.reactions || []);
        setCounts(data.data.counts || {});
        
        // Tìm reaction của user hiện tại
        const token = getToken();
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const currentUserId = payload.userId;
            const userReact = data.data.reactions.find(
              (r: Reaction) => r.user.id === currentUserId
            );
            setUserReaction(userReact?.type || null);
          } catch (e) {
            // Ignore
          }
        }
      }
    } catch (error) {
      console.error("Error fetching reactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReaction = async (type: string) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm cảm xúc");
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`/api/blogs/${blogSlug}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchReactions(); // Refresh reactions
        setShowPicker(false);
      } else {
        toast.error(data.error || "Không thể thêm cảm xúc");
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error("Có lỗi xảy ra");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <div className="animate-pulse text-gray-400">Đang tải...</div>
      </div>
    );
  }

  const totalReactions = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="border-t border-b border-gray-3 py-4 my-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Reaction button */}
          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                userReaction
                  ? "bg-blue-light-5 text-blue"
                  : "bg-gray-1 text-gray-600 hover:bg-gray-2"
              }`}
            >
              {userReaction ? (
                <>
                  <span className="text-xl">
                    {REACTION_TYPES.find((r) => r.type === userReaction)?.emoji}
                  </span>
                  <span className="text-sm font-medium">
                    {REACTION_TYPES.find((r) => r.type === userReaction)?.label}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl">👍</span>
                  <span className="text-sm font-medium">Thích</span>
                </>
              )}
            </button>

            {/* Reaction picker */}
            {showPicker && (
              <div
                ref={pickerRef}
                className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-3 p-2 flex gap-1 z-10"
              >
                {REACTION_TYPES.map((reaction) => (
                  <button
                    key={reaction.type}
                    onClick={() => handleReaction(reaction.type)}
                    className="p-2 hover:bg-gray-1 rounded-full transition-transform hover:scale-125"
                    title={reaction.label}
                  >
                    <span className="text-2xl">{reaction.emoji}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reaction counts */}
          {totalReactions > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {REACTION_TYPES.map((reaction) => {
                const count = counts[reaction.type] || 0;
                if (count === 0) return null;
                return (
                  <span key={reaction.type} className="flex items-center gap-1">
                    <span>{reaction.emoji}</span>
                    <span>{count}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Total reactions */}
        {totalReactions > 0 && (
          <div className="text-sm text-gray-600">
            {totalReactions} cảm xúc
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogReactions;

