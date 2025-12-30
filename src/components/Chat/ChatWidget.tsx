"use client";

import { useState, useEffect, useRef } from "react";
import { getToken, getUser } from "@/lib/auth-storage";
import toast from "react-hot-toast";
import Pusher from "pusher-js";
import { isSameDay } from "date-fns";
import { useChatUnreadCountCustomer } from "@/hooks/queries/useChatUnreadCountCustomer";
import { useQueryClient } from "@tanstack/react-query";

interface Message {
  id: string;
  content: string;
  imageUrl?: string | null;
  senderId: string;
  sender: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  lastMessageAt: string | null;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);
  const hasLoadedConversationRef = useRef(false);

  const user = getUser();
  const token = getToken();
  const isAdmin = user?.roles?.includes("ADMIN");
  const queryClient = useQueryClient();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize Pusher (always, not just when widget opens) to listen for new messages
  useEffect(() => {
    if (!user?.id) return;

    // Initialize Pusher
    if (!pusherRef.current) {
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "", {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap1",
      });
    }

    // Subscribe to user channel (always listen, even when widget is closed)
    if (!channelRef.current) {
      channelRef.current = pusherRef.current.subscribe(`user-${user.id}`);
      channelRef.current.bind("new-message", (data: any) => {
        // Invalidate unread count query to update badge immediately
        queryClient.invalidateQueries({
          queryKey: ["chat-unread-count-customer"],
        });

        // If widget is open and this is the current conversation, add message to list
        if (isOpen && data.conversationId === conversation?.id) {
          setMessages((prev) => {
            // Chỉ thêm message mới nếu chưa có trong list
            if (prev.some((msg) => msg.id === data.message.id)) {
              return prev;
            }
            return [...prev, data.message];
          });
        }
      });
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [user?.id, isOpen, conversation?.id, queryClient]);

  // Load or create conversation - chỉ chạy một lần khi mở widget
  useEffect(() => {
    if (!isOpen || !token || !user?.id) {
      // Reset khi đóng widget
      if (!isOpen) {
        hasLoadedConversationRef.current = false;
        setConversation(null);
        setMessages([]);
      }
      return;
    }

    // Chỉ load một lần
    if (hasLoadedConversationRef.current) return;

    const loadConversation = async () => {
      setIsLoading(true);
      hasLoadedConversationRef.current = true;
      try {
        // Try to get existing conversation
        const res = await fetch("/api/chat/conversations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (data.success && data.data.length > 0) {
          const conv = data.data[0];
          setConversation(conv);

          // Load messages
          try {
            const msgRes = await fetch(`/api/chat/conversations/${conv.id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            const msgData = await msgRes.json();
            if (msgData.success) {
              setMessages(msgData.data.messages || []);
            }
          } catch (error) {
            console.error("Error loading messages:", error);
          }
        } else {
          // Create new conversation
          const createRes = await fetch("/api/chat/conversations", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          const createData = await createRes.json();
          if (createData.success) {
            setConversation(createData.data);
          }
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
        toast.error("Không thể tải cuộc trò chuyện");
        hasLoadedConversationRef.current = false; // Reset để có thể thử lại
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, [isOpen, token, user?.id]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)");
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Kích thước file không được vượt quá 5MB");
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async () => {
    if (
      (!inputMessage.trim() && !selectedImage) ||
      !conversation ||
      !token ||
      isSending
    )
      return;

    setIsSending(true);
    let imageUrl: string | null = null;

    try {
      // Upload image if selected
      if (selectedImage) {
        setIsUploadingImage(true);
        const formData = new FormData();
        formData.append("image", selectedImage);

        const uploadRes = await fetch("/api/chat/upload-image", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          imageUrl = uploadData.data.url;
        } else {
          toast.error(uploadData.error || "Không thể upload ảnh");
          setIsSending(false);
          setIsUploadingImage(false);
          return;
        }
        setIsUploadingImage(false);
      }

      // Send message
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: conversation.id,
          content: inputMessage.trim() || (imageUrl ? "[Hình ảnh]" : ""),
          imageUrl: imageUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        setInputMessage("");
        removeImage();
      } else {
        toast.error(data.error || "Không thể gửi tin nhắn");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Không thể gửi tin nhắn");
    } finally {
      setIsSending(false);
      setIsUploadingImage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper function to format date label
  const formatDateLabel = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messageDate = new Date(date);
    messageDate.setHours(0, 0, 0, 0);

    if (isSameDay(today, messageDate)) {
      return "Hôm nay";
    }

    return messageDate.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Helper function to check if we need to show date separator
  const shouldShowDateSeparator = (
    currentMessage: Message,
    previousMessage: Message | undefined
  ): boolean => {
    if (!previousMessage) return true;

    const currentDate = new Date(currentMessage.createdAt);
    const previousDate = new Date(previousMessage.createdAt);

    return !isSameDay(currentDate, previousDate);
  };

  // Get unread count for customer (must be called before early return)
  const { data: unreadData } = useChatUnreadCountCustomer({
    enabled: !isAdmin && !!user,
  });

  const unreadCount = unreadData?.data?.unreadCount || 0;

  // Không hiển thị ChatWidget cho admin
  if (!user || isAdmin) return null;

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-blue ease-out duration-200 hover:bg-blue-dark fixed bottom-8 right-8 z-[9999]"
        aria-label="Chat"
      >
        <div className="relative">
          <svg
            className="fill-white w-7 h-7"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.1 0-2.12-.27-3.01-.75L4 20l.75-4.99C3.27 14.12 3 13.1 3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9z" />
            <circle cx="8.5" cy="11.5" r="1" />
            <circle cx="12" cy="11.5" r="1" />
            <circle cx="15.5" cy="11.5" r="1" />
          </svg>
          {!isOpen && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center font-medium text-xs bg-red-500 text-white rounded-full w-5 h-5 min-w-[20px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Chat Widget - Facebook Style */}
      {isOpen && (
        <div className="fixed bottom-24 right-8 w-[380px] h-[600px] bg-white rounded-t-lg shadow-2xl flex flex-col z-[10000] overflow-hidden">
          {/* Header - Facebook Style */}
          <div className="flex items-center justify-between p-4 border-b bg-[#0084ff] text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                {conversation?.user?.avatar ? (
                  <img
                    src={conversation.user.avatar}
                    alt="Support"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-6 h-6 fill-white"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-base">Hỗ trợ khách hàng</h3>
                <p className="text-xs text-white/90">
                  Thường phản hồi trong vài phút
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Minimize"
              >
                <svg
                  className="w-5 h-5 fill-white"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 13H5v-2h14v2z" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5 fill-white"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages - Facebook Style */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#f0f2f5]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400">Đang tải...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <p className="font-medium">Chào mừng bạn đến với hỗ trợ!</p>
                  <p className="text-sm mt-2">Hãy gửi tin nhắn để bắt đầu.</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.senderId === user.id;
                const previousMessage =
                  index > 0 ? messages[index - 1] : undefined;
                const showDateSeparator = shouldShowDateSeparator(
                  message,
                  previousMessage
                );

                return (
                  <div key={message.id}>
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-white px-3 py-1 rounded-full shadow-sm text-xs text-gray-500 font-medium">
                          {formatDateLabel(new Date(message.createdAt))}
                        </div>
                      </div>
                    )}
                    <div
                      className={`flex ${isOwn ? "justify-end" : "justify-start"} items-end gap-2`}
                    >
                      {!isOwn && (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {message.sender.avatar ? (
                            <img
                              src={message.sender.avatar}
                              alt={message.sender.name || ""}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 text-xs font-medium">
                              {message.sender.name?.[0]?.toUpperCase() || "?"}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex flex-col max-w-[75%]">
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isOwn
                              ? "bg-[#0084ff] text-white rounded-tr-sm"
                              : "bg-white text-gray-900 rounded-tl-sm shadow-sm"
                          }`}
                        >
                          {message.imageUrl && (
                            <div className="mb-2">
                              <img
                                src={message.imageUrl}
                                alt="Chat image"
                                className="max-w-full max-h-64 rounded-lg object-contain"
                              />
                            </div>
                          )}
                          {message.content && (
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </p>
                          )}
                        </div>
                        <p
                          className={`text-xs mt-1 px-2 ${
                            isOwn
                              ? "text-right text-gray-500"
                              : "text-left text-gray-500"
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString(
                            "vi-VN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                      {isOwn && (
                        <div className="w-8 h-8 rounded-full bg-blue flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name || ""}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-xs font-medium">
                              {user.name?.[0]?.toUpperCase() ||
                                user.email[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input - Facebook Style */}
          <div className="p-3 border-t bg-white">
            {imagePreview && (
              <div className="mb-2 relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-xs max-h-48 rounded-lg object-contain"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                  aria-label="Remove image"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending || isUploadingImage || !conversation}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Attach image"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-end gap-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-gray-900 placeholder-gray-500 max-h-24"
                  rows={1}
                  disabled={isSending || isUploadingImage || !conversation}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={
                  (!inputMessage.trim() && !selectedImage) ||
                  isSending ||
                  isUploadingImage ||
                  !conversation
                }
                className="p-2 bg-[#0084ff] text-white rounded-full hover:bg-[#0066cc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSending ? (
                  <svg
                    className="animate-spin w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
