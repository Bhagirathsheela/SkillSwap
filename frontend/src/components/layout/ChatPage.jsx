import React, { useEffect, useRef, useState } from "react";

function ChatPage() {
  const [myUserId, setMyUserId] = useState(null);
  const [threads, setThreads] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  /* =========================
     AUTO SCROLL
  ========================== */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =========================
     FETCH LOGGED-IN USER
  ========================== */
  useEffect(() => {
    const fetchMe = async () => {
      const res = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/users/me`,
        { credentials: "include" }
      );
      const data = await res.json();
      setMyUserId(data?.user?._id || null);
    };
    fetchMe();
  }, []);

  /* =========================
     FETCH CHAT THREADS
  ========================== */
  useEffect(() => {
    if (!myUserId) return;

    fetch(`${import.meta.env.VITE_APP_BACKEND_URL}/chat/threads`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => setThreads(d.threads || []));
  }, [myUserId]);

  /* =========================
     WEBSOCKET
  ========================== */
  useEffect(() => {
    if (!myUserId) return;

    socketRef.current = new WebSocket(
      `${import.meta.env.VITE_APP_WS_URL}/ws?userId=${myUserId}`
    );

    socketRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type !== "NEW_MESSAGE") return;

      const msg = data.message;
      const senderId = msg.sender?._id || msg.sender;
      const taskId = msg.task?._id || msg.task;

      // Update messages if active chat
      if (
        activeChat &&
        activeChat.partnerId === senderId &&
        activeChat.taskId === taskId
      ) {
        setMessages((prev) =>
          prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
        );

        // Mark read immediately
        fetch(
          `${import.meta.env.VITE_APP_BACKEND_URL}/chat/read/${senderId}`,
          { method: "PUT", credentials: "include" }
        );
      }

      // Update sidebar threads
      setThreads((prev) =>
        prev.map((t) =>
          t._id.task === taskId
            ? {
                ...t,
                latestMessage: msg,
                unreadCount:
                  activeChat &&
                  activeChat.partnerId === senderId &&
                  activeChat.taskId === taskId
                    ? 0
                    : t.unreadCount + (senderId !== myUserId ? 1 : 0),
              }
            : t
        )
      );
    };

    return () => socketRef.current?.close();
  }, [myUserId, activeChat]);

  /* =========================
     OPEN CHAT
  ========================== */
  const openChat = async (partnerId, taskId) => {
    setActiveChat({ partnerId, taskId });
    setMessages([]);

    // Clear unread locally
    setThreads((prev) =>
      prev.map((t) =>
        t._id.task === taskId ? { ...t, unreadCount: 0 } : t
      )
    );

    // Mark read in backend
    fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}/chat/read/${partnerId}`,
      { method: "PUT", credentials: "include" }
    );

    const res = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}/chat/${partnerId}/${taskId}`,
      { credentials: "include" }
    );
    const data = await res.json();
    setMessages(data.messages || []);
  };

  /* =========================
     SEND MESSAGE
  ========================== */
  const sendMessage = async () => {
    if (!input.trim() || !activeChat) return;

    const tempMessage = {
      _id: `tmp-${Date.now()}`,
      sender: { _id: myUserId },
      message: input,
    };

    // Optimistic UI
    setMessages((prev) => [...prev, tempMessage]);
    setInput("");

    const res = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}/chat/${activeChat.partnerId}/${activeChat.taskId}`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: tempMessage.message }),
      }
    );

    const data = await res.json();
    if (data?.message) {
      setMessages((prev) =>
        prev.map((m) => (m._id === tempMessage._id ? data.message : m))
      );
    }
  };

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
          const latest = t.latestMessage;
          if (!latest?.sender || !latest?.receiver) return null;

          const taskId = t._id.task;
          const partner =
            latest.sender._id === myUserId ? latest.receiver : latest.sender;
          const isActive = activeChat?.partnerId === partner._id;

          return (
            <div
              key={taskId + partner._id}
              onClick={() => openChat(partner._id, taskId)}
              className={`px-4 py-3 cursor-pointer border-b border-[var(--surface-border)] transition
                ${
                  isActive
                    ? "bg-[var(--color-brand-primary-pale)] border-l-[3px] border-l-[var(--color-brand-primary)]"
                    : "hover:bg-gray-50"
                }`}
            >
              <div className="flex items-start justify-between gap-2">
                <strong className="text-sm text-[var(--text-primary)] truncate">
                  {partner.name}
                </strong>
                {t.unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-semibold flex-shrink-0">
                    {t.unreadCount}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)] truncate">
                {latest.message}
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
            {/* Chat header (mobile back button + partner) */}
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
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-brand-primary-pale)] text-[var(--color-brand-primary)] font-semibold text-sm">
                {(threads.find(
                  (t) => t._id.task === activeChat.taskId
                )?.latestMessage?.sender?._id === myUserId
                  ? threads.find((t) => t._id.task === activeChat.taskId)
                      ?.latestMessage?.receiver?.name
                  : threads.find((t) => t._id.task === activeChat.taskId)
                      ?.latestMessage?.sender?.name)?.[0]?.toUpperCase() || "•"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {(() => {
                    const t = threads.find(
                      (t) => t._id.task === activeChat.taskId
                    );
                    if (!t?.latestMessage) return "Chat";
                    return t.latestMessage.sender?._id === myUserId
                      ? t.latestMessage.receiver?.name
                      : t.latestMessage.sender?.name;
                  })()}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-[var(--surface-bg)]">
              {messages.map((m) => {
                const isMine = m.sender?._id === myUserId;
                return (
                  <div
                    key={m._id}
                    className={`mb-2 flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <span
                      className={`inline-block px-4 py-2.5 rounded-2xl max-w-[78%] text-sm leading-relaxed break-words shadow-sm
                        ${
                          isMine
                            ? "bg-[var(--color-brand-primary)] text-white rounded-br-md"
                            : "bg-[var(--surface-white)] text-[var(--text-primary)] border border-[var(--surface-border)] rounded-bl-md"
                        }`}
                    >
                      {m.message}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="flex items-center gap-2 px-3 py-3 border-t border-[var(--surface-border)] bg-[var(--surface-white)]">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 px-4 py-2.5 text-sm rounded-full
                           border border-[var(--surface-border)]
                           text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                           transition focus:outline-none
                           focus:border-[var(--color-brand-primary)]
                           focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
              />
              <button
                onClick={sendMessage}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-white
                           bg-[var(--color-brand-primary)]
                           hover:bg-[var(--color-brand-primary-dark)]
                           shadow-[0_2px_8px_rgba(91,91,255,0.25)]
                           transition whitespace-nowrap"
              >
                Send
              </button>
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
