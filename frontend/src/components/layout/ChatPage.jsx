import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import EmojiPicker from "emoji-picker-react";
import { useAuthContext } from "../../common/context/auth-context.jsx";
import { useSocketContext } from "../../common/context/SocketContext.jsx";

// ── Ticks: 1 check = sent, 2 gray = delivered, 2 blue = read ────────────────
const TickIcon = ({ state }) => {
  const color =
    state === "read"
      ? "#34b7f1"
      : state === "delivered"
      ? "rgba(255,255,255,0.85)"
      : "rgba(255,255,255,0.75)";

  if (state === "sent") {
    return (
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none" aria-label="sent">
        <path
          d="M11.071.653L4.103 7.622 1.929 5.448a.5.5 0 10-.707.707l2.527 2.528a.5.5 0 00.707 0l7.323-7.323a.5.5 0 00-.707-.707z"
          fill={color}
        />
      </svg>
    );
  }
  return (
    <svg width="18" height="11" viewBox="0 0 18 11" fill="none" aria-label={state}>
      <path
        d="M11.071.653L4.103 7.622 1.929 5.448a.5.5 0 10-.707.707l2.527 2.528a.5.5 0 00.707 0l7.323-7.323a.5.5 0 00-.707-.707z"
        fill={color}
      />
      <path
        d="M16.071.653L9.103 7.622 7.5 6.02l-.707.707 1.96 1.961a.5.5 0 00.707 0l7.323-7.323a.5.5 0 00-.708-.707z"
        fill={color}
      />
    </svg>
  );
};

const formatTime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const formatLastSeen = (iso) => {
  if (!iso) return "offline";
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "last seen just now";
  if (diff < 3600) return `last seen ${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `last seen ${Math.floor(diff / 3600)} h ago`;
  return `last seen ${d.toLocaleDateString()}`;
};

// Small "About: <title>" chip rendered on messages that have a task
const TaskChip = ({ title, mine }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mb-1 self-start
      ${
        mine
          ? "bg-white/20 text-white/90"
          : "bg-[var(--color-brand-primary-pale)] text-[var(--color-brand-primary)]"
      }`}
  >
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
    <span className="truncate max-w-[160px]">About: {title}</span>
  </span>
);

function ChatPage() {
  const { user } = useAuthContext();
  const myUserId = user?.id || user?._id || null;

  const {
    socket,
    onlineUsers,
    queryPresence,
    markChatRead,
    refreshUnreadChats,
  } = useSocketContext();

  const [threads, setThreads] = useState([]);
  // activeChat now just carries the partner id (no taskId — threads are per-pair)
  const [activeChat, setActiveChat] = useState(null); // { partnerId }
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new message / typing change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);

  // Fetch chat threads
  useEffect(() => {
    if (!myUserId) return;
    fetch(`${import.meta.env.VITE_APP_BACKEND_URL}/chat/threads`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => {
        const list = d.threads || [];
        setThreads(list);
        const partnerIds = list
          .map((t) => t.partner && String(t.partner._id))
          .filter(Boolean);
        if (partnerIds.length > 0) queryPresence(partnerIds);
      })
      .catch(() => {});
  }, [myUserId, queryPresence]);

  // Wire socket events
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg) => {
      const senderId = msg.sender?._id || msg.sender;

      // If active chat matches sender, append and mark read
      setActiveChat((curr) => {
        if (curr && String(curr.partnerId) === String(senderId)) {
          setMessages((prev) =>
            prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
          );
          markChatRead(senderId);
        }
        return curr;
      });

      // Update threads list (one row per partner)
      setThreads((prev) => {
        let found = false;
        const next = prev.map((t) => {
          if (t.partner && String(t.partner._id) === String(senderId)) {
            found = true;
            return {
              ...t,
              latestMessage: msg,
              lastMessageAt: msg.createdAt,
              unreadCount:
                activeChat && String(activeChat.partnerId) === String(senderId)
                  ? 0
                  : (t.unreadCount || 0) + 1,
            };
          }
          return t;
        });
        if (!found) {
          next.unshift({
            _id: `new-${senderId}`,
            partner: msg.sender,
            latestMessage: msg,
            lastMessageAt: msg.createdAt,
            unreadCount: 1,
          });
        }
        // re-sort by lastMessageAt desc
        return next.sort(
          (a, b) =>
            new Date(b.lastMessageAt || 0).getTime() -
            new Date(a.lastMessageAt || 0).getTime()
        );
      });
    };

    const onMessageSent = (msg) => {
      // Reconcile our own optimistic message
      setMessages((prev) => {
        const tempIdx = prev.findIndex(
          (m) =>
            typeof m._id === "string" &&
            m._id.startsWith("tmp-") &&
            m.message === msg.message
        );
        if (tempIdx === -1) {
          if (prev.some((m) => m._id === msg._id)) return prev;
          const senderId = msg.sender?._id || msg.sender;
          const receiverId = msg.receiver?._id || msg.receiver;
          const partnerId =
            String(senderId) === String(myUserId) ? receiverId : senderId;
          if (activeChat && String(activeChat.partnerId) === String(partnerId)) {
            return [...prev, msg];
          }
          return prev;
        }
        const copy = [...prev];
        copy[tempIdx] = msg;
        return copy;
      });

      // Update thread's latest message
      const partnerId =
        String(msg.sender?._id || msg.sender) === String(myUserId)
          ? msg.receiver?._id || msg.receiver
          : msg.sender?._id || msg.sender;

      setThreads((prev) => {
        let found = false;
        const next = prev.map((t) => {
          if (t.partner && String(t.partner._id) === String(partnerId)) {
            found = true;
            return {
              ...t,
              latestMessage: msg,
              lastMessageAt: msg.createdAt,
            };
          }
          return t;
        });
        if (!found && msg.receiver) {
          next.unshift({
            _id: `new-${partnerId}`,
            partner:
              String(msg.sender?._id) === String(myUserId)
                ? msg.receiver
                : msg.sender,
            latestMessage: msg,
            lastMessageAt: msg.createdAt,
            unreadCount: 0,
          });
        }
        return next.sort(
          (a, b) =>
            new Date(b.lastMessageAt || 0).getTime() -
            new Date(a.lastMessageAt || 0).getTime()
        );
      });
    };

    const onMessagesDelivered = ({ messageIds }) => {
      const ids = new Set(messageIds);
      setMessages((prev) =>
        prev.map((m) =>
          ids.has(String(m._id)) ? { ...m, delivered: true } : m
        )
      );
    };

    const onMessagesRead = ({ messageIds }) => {
      const ids = new Set(messageIds);
      setMessages((prev) =>
        prev.map((m) =>
          ids.has(String(m._id))
            ? { ...m, delivered: true, read: true }
            : m
        )
      );
    };

    const onTyping = ({ from }) => {
      if (activeChat && String(activeChat.partnerId) === String(from)) {
        setPartnerTyping(true);
      }
    };

    const onStopTyping = ({ from }) => {
      if (activeChat && String(activeChat.partnerId) === String(from)) {
        setPartnerTyping(false);
      }
    };

    socket.on("newMessage", onNewMessage);
    socket.on("messageSent", onMessageSent);
    socket.on("messagesDelivered", onMessagesDelivered);
    socket.on("messagesRead", onMessagesRead);
    socket.on("typing", onTyping);
    socket.on("stopTyping", onStopTyping);

    return () => {
      socket.off("newMessage", onNewMessage);
      socket.off("messageSent", onMessageSent);
      socket.off("messagesDelivered", onMessagesDelivered);
      socket.off("messagesRead", onMessagesRead);
      socket.off("typing", onTyping);
      socket.off("stopTyping", onStopTyping);
    };
  }, [socket, activeChat, myUserId, markChatRead]);

  // Open a chat (per partner)
  const openChat = useCallback(
    async (partnerId) => {
      setActiveChat({ partnerId });
      setMessages([]);
      setPartnerTyping(false);
      setShowEmoji(false);

      setThreads((prev) =>
        prev.map((t) =>
          t.partner && String(t.partner._id) === String(partnerId)
            ? { ...t, unreadCount: 0 }
            : t
        )
      );

      try {
        await markChatRead(partnerId);
      } catch {
        /* ignore */
      }
      if (socket) socket.emit("markRead", { partnerId });

      try {
        const res = await fetch(
          `${import.meta.env.VITE_APP_BACKEND_URL}/chat/${partnerId}`,
          { credentials: "include" }
        );
        const data = await res.json();
        setMessages(data.messages || []);
        refreshUnreadChats();
      } catch {
        /* ignore */
      }
    },
    [markChatRead, socket, refreshUnreadChats]
  );

  // Send a message — taskId is optional context, omitted in plain chat
  const sendMessage = async () => {
    if (!input.trim() || !activeChat) return;

    const text = input;
    const tempMessage = {
      _id: `tmp-${Date.now()}`,
      sender: { _id: myUserId },
      receiver: { _id: activeChat.partnerId },
      message: text,
      delivered: false,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInput("");
    setShowEmoji(false);

    if (socket) {
      socket.emit("stopTyping", { to: activeChat.partnerId });
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/chat/${activeChat.partnerId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        }
      );
      const data = await res.json();
      if (data?.newMessage) {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempMessage._id ? data.newMessage : m))
        );
      }
    } catch {
      /* keep optimistic message */
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socket || !activeChat) return;

    socket.emit("typing", { to: activeChat.partnerId });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("stopTyping", { to: activeChat.partnerId });
    }, 1500);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleEmojiPick = (emojiData) => {
    const sym = emojiData.emoji || "";
    setInput((prev) => prev + sym);
    inputRef.current?.focus();
  };

  const activePartner = useMemo(() => {
    if (!activeChat) return null;
    const t = threads.find(
      (t) => t.partner && String(t.partner._id) === String(activeChat.partnerId)
    );
    return t?.partner || { _id: activeChat.partnerId };
  }, [activeChat, threads]);

  const partnerPresence = activeChat
    ? onlineUsers[String(activeChat.partnerId)]
    : null;

  if (!myUserId)
    return (
      <p className="p-5 text-[var(--text-secondary)] text-center">Loading...</p>
    );

  return (
    <div
      className="flex bg-[var(--surface-bg)]"
      style={{ height: "calc(100dvh - var(--navbar-height))" }}
    >
      {/* SIDEBAR */}
      <div
        className={`${
          activeChat ? "hidden md:flex" : "flex"
        } w-full md:w-[320px] lg:w-[360px] flex-col
        border-r border-[var(--surface-border)] bg-[var(--surface-white)] overflow-y-auto`}
      >
        <h3 className="px-4 py-4 text-base font-bold text-[var(--text-primary)] border-b border-[var(--surface-border)] sticky top-0 bg-[var(--surface-white)] z-10">
          Chats
        </h3>

        {threads.length === 0 && (
          <p className="px-4 py-6 text-sm text-[var(--text-muted)] italic text-center">
            No conversations yet
          </p>
        )}

        {threads.map((t) => {
          if (!t.partner) return null;
          const partner = t.partner;
          const isActive =
            activeChat && String(activeChat.partnerId) === String(partner._id);
          const presence = onlineUsers[String(partner._id)];
          const latest = t.latestMessage;

          return (
            <div
              key={partner._id}
              onClick={() => openChat(partner._id)}
              className={`px-4 py-3 cursor-pointer border-b border-[var(--surface-border)] transition
                ${
                  isActive
                    ? "bg-[var(--color-brand-primary-pale)] border-l-[3px] border-l-[var(--color-brand-primary)]"
                    : "hover:bg-gray-50"
                }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-brand-primary-pale)] text-[var(--color-brand-primary)] font-semibold text-sm flex-shrink-0">
                    {partner.name?.[0]?.toUpperCase() || "?"}
                    {presence?.online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                    )}
                  </span>
                  <strong className="text-sm text-[var(--text-primary)] truncate">
                    {partner.name}
                  </strong>
                </span>
                {t.unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-semibold flex-shrink-0">
                    {t.unreadCount}
                  </span>
                )}
              </div>
              <p className="mt-1 ml-11 text-xs text-[var(--text-secondary)] truncate">
                {latest?.message || ""}
              </p>
            </div>
          );
        })}
      </div>

      {/* CHAT WINDOW */}
      <div
        className={`${
          activeChat ? "flex" : "hidden md:flex"
        } flex-1 flex-col bg-[var(--surface-bg)]`}
      >
        {activeChat ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--surface-border)] bg-[var(--surface-white)] sticky top-0 z-10">
              <button
                type="button"
                onClick={() => setActiveChat(null)}
                className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full
                           text-[var(--text-secondary)] hover:bg-gray-100 transition"
                aria-label="Back to chats"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5"></path>
                  <path d="M12 19l-7-7 7-7"></path>
                </svg>
              </button>
              <div className="relative">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-brand-primary-pale)] text-[var(--color-brand-primary)] font-semibold text-base">
                  {activePartner?.name?.[0]?.toUpperCase() || "?"}
                </div>
                {partnerPresence?.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {activePartner?.name || "Chat"}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {partnerTyping
                    ? "typing..."
                    : partnerPresence?.online
                    ? "online"
                    : formatLastSeen(partnerPresence?.lastSeen)}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 bg-[var(--surface-bg)]">
              {messages.map((m) => {
                const senderId = m.sender?._id || m.sender;
                const isMine = String(senderId) === String(myUserId);
                let tickState = "sent";
                if (m.read) tickState = "read";
                else if (m.delivered) tickState = "delivered";
                const taskTitle = m.task?.title;

                return (
                  <div
                    key={m._id}
                    className={`mb-2 flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span
                      className={`relative inline-flex flex-col px-3 py-2 rounded-2xl max-w-[78%] text-sm leading-relaxed break-words shadow-sm
                        ${
                          isMine
                            ? "bg-[var(--color-brand-primary)] text-white rounded-br-md"
                            : "bg-[var(--surface-white)] text-[var(--text-primary)] border border-[var(--surface-border)] rounded-bl-md"
                        }`}
                    >
                      {taskTitle && <TaskChip title={taskTitle} mine={isMine} />}
                      <span className="whitespace-pre-wrap">{m.message}</span>
                      <span
                        className={`flex items-center gap-1 mt-1 text-[10px] self-end ${
                          isMine ? "text-white/70" : "text-[var(--text-muted)]"
                        }`}
                      >
                        <span>{formatTime(m.createdAt)}</span>
                        {isMine && <TickIcon state={tickState} />}
                      </span>
                    </span>
                  </div>
                );
              })}
              {partnerTyping && (
                <div className="mb-2 flex justify-start">
                  <span className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-[var(--surface-white)] border border-[var(--surface-border)] text-[var(--text-muted)] text-xs italic">
                    typing
                    <span className="inline-flex gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-1 h-1 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-1 h-1 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </span>
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="relative border-t border-[var(--surface-border)] bg-[var(--surface-white)]">
              {showEmoji && (
                <div className="absolute bottom-full left-2 right-2 sm:right-auto z-20 mb-2">
                  <EmojiPicker
                    onEmojiClick={handleEmojiPick}
                    width="100%"
                    height={360}
                    searchDisabled={false}
                    skinTonesDisabled
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => setShowEmoji((p) => !p)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full text-[var(--text-muted)] hover:text-[var(--color-brand-primary)] hover:bg-gray-100 transition flex-shrink-0"
                  aria-label="Toggle emoji picker"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                </button>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  onKeyDown={onKeyDown}
                  className="flex-1 px-4 py-2.5 text-sm rounded-full
                             border border-[var(--surface-border)]
                             text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                             transition focus:outline-none
                             focus:border-[var(--color-brand-primary)]
                             focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full text-white
                             bg-[var(--color-brand-primary)]
                             hover:bg-[var(--color-brand-primary-dark)]
                             shadow-[0_2px_8px_rgba(91,91,255,0.25)]
                             transition flex-shrink-0
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"></path>
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-[var(--text-muted)] text-sm">
              Select a chat to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatPage;
