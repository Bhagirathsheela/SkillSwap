/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import { useAuthContext } from "./auth-context.jsx";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isLoggedIn, user } = useAuthContext();
  const userId = user?.id || user?._id || null;

  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  // Realtime state surfaced to the UI
  const [unreadChats, setUnreadChats] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({}); // { userId: { online, lastSeen } }

  // Helper to re-fetch the unread counts from REST (used as source of truth)
  const refreshUnreadChats = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/chat/count`,
        { credentials: "include" }
      );
      if (!res.ok) return;
      const data = await res.json();
      setUnreadChats(data.unreadCount || 0);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/notifications`,
        { credentials: "include" }
      );
      if (!res.ok) return;
      const data = await res.json();
      const list = data.notifications || [];
      setNotifications(list);
      setUnreadNotifications(list.filter((n) => !n.read).length);
    } catch {
      /* ignore */
    }
  }, []);

  // Connect / disconnect based on auth state
  useEffect(() => {
    if (!isLoggedIn || !userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      setUnreadChats(0);
      setUnreadNotifications(0);
      setNotifications([]);
      setOnlineUsers({});
      return;
    }

    const s = io(import.meta.env.VITE_APP_BACKEND_URL.replace(/\/api$/, ""), {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => {
      setConnected(true);
    });
    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", (err) => {
      console.warn("Socket connect_error:", err.message);
    });

    // ── Chat events ──────────────────────────────────────────
    s.on("newMessage", () => {
      // A message landed for me — bump unread count
      setUnreadChats((c) => c + 1);
    });

    s.on("unreadChatsChanged", () => {
      // Server hint to re-sync (e.g. after markRead)
      refreshUnreadChats();
    });

    // ── Notification events ──────────────────────────────────
    s.on("newNotification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadNotifications((c) => c + 1);
    });

    s.on("notificationsRead", () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadNotifications(0);
    });

    s.on("notificationsCleared", () => {
      setNotifications([]);
      setUnreadNotifications(0);
    });

    // ── Presence events ──────────────────────────────────────
    s.on("userOnline", ({ userId: uid }) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [uid]: { online: true, lastSeen: null },
      }));
    });

    s.on("userOffline", ({ userId: uid, lastSeen }) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [uid]: { online: false, lastSeen: lastSeen || null },
      }));
    });

    // Initial sync of counts/list
    refreshUnreadChats();
    refreshNotifications();

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [isLoggedIn, userId, refreshUnreadChats, refreshNotifications]);

  // Mark notifications read (also tells server)
  const markAllNotificationsRead = useCallback(async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/notifications/mark-read`,
        { method: "POST", credentials: "include" }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadNotifications(0);
    } catch {
      /* ignore */
    }
  }, []);

  // Clear (hard-delete) all notifications for the logged-in user
  const clearAllNotifications = useCallback(async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/notifications/clear`,
        { method: "DELETE", credentials: "include" }
      );
      setNotifications([]);
      setUnreadNotifications(0);
    } catch {
      /* ignore */
    }
  }, []);

  // Mark chats with a partner as read (UI side)
  const markChatRead = useCallback(
    async (partnerId) => {
      try {
        await fetch(
          `${import.meta.env.VITE_APP_BACKEND_URL}/chat/read/${partnerId}`,
          { method: "PUT", credentials: "include" }
        );
        refreshUnreadChats();
      } catch {
        /* ignore */
      }
    },
    [refreshUnreadChats]
  );

  // Presence query for a list of user ids
  const queryPresence = useCallback((userIds, cb) => {
    if (!socketRef.current) return cb && cb({});
    socketRef.current.emit("getPresence", { userIds }, (result) => {
      if (cb) cb(result || {});
      if (result) {
        setOnlineUsers((prev) => {
          const next = { ...prev };
          for (const [uid, v] of Object.entries(result)) {
            next[uid] = { ...(next[uid] || {}), ...v };
          }
          return next;
        });
      }
    });
  }, []);

  const value = {
    socket,
    connected,
    unreadChats,
    setUnreadChats,
    unreadNotifications,
    notifications,
    setNotifications,
    onlineUsers,
    refreshUnreadChats,
    refreshNotifications,
    markAllNotificationsRead,
    clearAllNotifications,
    markChatRead,
    queryPresence,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const ctx = useContext(SocketContext);
  if (!ctx)
    throw new Error("useSocketContext must be used inside SocketProvider");
  return ctx;
};
