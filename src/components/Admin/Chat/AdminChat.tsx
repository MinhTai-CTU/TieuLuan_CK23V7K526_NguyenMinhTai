"use client";

import { useState, useEffect, useRef } from "react";
import { getToken, getUser } from "@/lib/auth-storage";
import toast from "react-hot-toast";
import Pusher from "pusher-js";
import { formatDistanceToNow, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";

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
  adminId: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    phone: string | null;
  };
  admin: {
    id: string;
    name: string | null;
    avatar: string | null;
  } | null;
  lastMessageAt: string | null;
  _count: {
    messages: number;
  };
  messages: Message[];
}

interface Order {
  id: string;
  orderId: string;
  status: string;
  total: number;
  createdAt: string;
}

export default function AdminChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);

  const user = getUser();
  const token = getToken();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversations
  useEffect(() => {
    if (!token) return;

    const loadConversations = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/chat/conversations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (data.success) {
          setConversations(data.data);
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
        toast.error("Không thể tải danh sách cuộc trò chuyện");
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [token]);

  // Initialize Pusher
  useEffect(() => {
    if (!user || !token) return;

    if (!pusherRef.current) {
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "", {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap1",
      });
    }

    // Subscribe to admin chat channel
    if (!channelRef.current) {
      channelRef.current = pusherRef.current.subscribe("admin-chat");
      channelRef.current.bind("new-message", (data: any) => {
        // Reload conversations to update last message
        if (token) {
          fetch("/api/chat/conversations", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
            .then((res) => res.json())
            .then((conversationsData) => {
              if (conversationsData.success) {
                setConversations(conversationsData.data);
                // If this is the selected conversation, add message to messages list
                if (
                  selectedConversation &&
                  data.conversationId === selectedConversation.id
                ) {
                  setMessages((prev) => {
                    // Check if message already exists to avoid duplicates
                    if (prev.some((msg) => msg.id === data.message.id)) {
                      return prev;
                    }
                    return [...prev, data.message];
                  });
                }
              }
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
  }, [user, token, selectedConversation]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !token) return;

    const loadMessages = async () => {
      try {
        const res = await fetch(
          `/api/chat/conversations/${selectedConversation.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        if (data.success) {
          setMessages(data.data.messages || []);
          setSelectedConversation(data.data.conversation);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        toast.error("Không thể tải tin nhắn");
      }
    };

    loadMessages();
  }, [selectedConversation?.id, token]);

  // Load customer orders when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !token) return;

    const loadCustomerOrders = async () => {
      try {
        const res = await fetch("/api/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (data.success) {
          // Filter orders for this customer
          const customerOrders = data.data.filter(
            (order: any) => order.userId === selectedConversation.userId
          );
          setCustomerOrders(customerOrders.slice(0, 5)); // Latest 5 orders
        }
      } catch (error) {
        console.error("Error loading customer orders:", error);
      }
    };

    loadCustomerOrders();
  }, [selectedConversation?.userId, token]);

  // Assign conversation to current admin
  const handleAssignToMe = async () => {
    if (!selectedConversation || !token || !user) return;

    try {
      const res = await fetch(
        `/api/chat/conversations/${selectedConversation.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ adminId: user.id }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setSelectedConversation(data.data);
        toast.success("Đã nhận cuộc trò chuyện");
      }
    } catch (error) {
      console.error("Error assigning conversation:", error);
      toast.error("Không thể nhận cuộc trò chuyện");
    }
  };

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
      !selectedConversation ||
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
          conversationId: selectedConversation.id,
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

  const unreadCount = (conv: Conversation) => conv._count.messages;

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

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Column 1: Conversations List */}
      <div className="w-1/4 border rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Cuộc trò chuyện</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">Đang tải...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              Chưa có cuộc trò chuyện nào
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 text-left border-b hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conv.id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {conv.user.avatar ? (
                      <img
                        src={conv.user.avatar}
                        alt={conv.user.name || ""}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">
                        {conv.user.name?.[0]?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {conv.user.name || conv.user.email}
                      </p>
                      {unreadCount(conv) > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          {unreadCount(conv)}
                        </span>
                      )}
                    </div>
                    {conv.messages?.[0] && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {conv.messages[0].content}
                      </p>
                    )}
                    {conv.lastMessageAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Column 2: Chat Messages */}
      <div className="w-2/4 border rounded-lg overflow-hidden flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {selectedConversation.user.avatar ? (
                    <img
                      src={selectedConversation.user.avatar}
                      alt={selectedConversation.user.name || ""}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 text-sm">
                      {selectedConversation.user.name?.[0]?.toUpperCase() ||
                        "?"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedConversation.user.name ||
                      selectedConversation.user.email}
                  </p>
                  <p className="text-xs text-gray-500">Đang hoạt động</p>
                </div>
              </div>
              {!selectedConversation.adminId && (
                <button
                  onClick={handleAssignToMe}
                  className="px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue-dark text-sm"
                >
                  Nhận cuộc trò chuyện
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#f0f2f5]">
              {messages.map((message, index) => {
                const isOwn = message.senderId === user?.id;
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
                      <div className="flex flex-col max-w-[70%]">
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
                                user.email?.[0]?.toUpperCase() ||
                                "A"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

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
                  disabled={isSending || isUploadingImage}
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
                    disabled={isSending || isUploadingImage}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={
                    (!inputMessage.trim() && !selectedImage) ||
                    isSending ||
                    isUploadingImage
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
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Chọn một cuộc trò chuyện để bắt đầu
          </div>
        )}
      </div>

      {/* Column 3: Customer Info */}
      <div className="w-1/4 border rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Thông tin khách hàng</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {selectedConversation ? (
            <>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Tên</p>
                  <p className="text-sm text-gray-900">
                    {selectedConversation.user.name || "Chưa có"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-sm text-gray-900">
                    {selectedConversation.user.email}
                  </p>
                </div>
                {selectedConversation.user.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">SĐT</p>
                    <p className="text-sm text-gray-900">
                      {selectedConversation.user.phone}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Lịch sử đơn hàng
                </h3>
                {customerOrders.length === 0 ? (
                  <p className="text-sm text-gray-400">Chưa có đơn hàng</p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {order.orderId}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(order.total)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(order.createdAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 text-sm">
              Chọn cuộc trò chuyện để xem thông tin
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
