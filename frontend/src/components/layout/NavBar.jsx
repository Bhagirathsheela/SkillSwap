import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../common/context/auth-context.jsx";
import { FaUser, FaBell, FaComments } from "react-icons/fa";

function NavBar() {
  const [dropdownOpen, setDropdownOpen]     = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications]   = useState([]);
  const [notifOpen, setNotifOpen]           = useState(false);

  const navRef      = useRef(null);
  const dropdownRef = useRef(null);
  const notifRef    = useRef(null);
  const chatRef     = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuthContext();

  // ── Close everything on outside click ─────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
        setDropdownOpen(false);
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Close everything on route change ──────────────────────────────────────
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  // ── Poll notifications ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_APP_BACKEND_URL}/notifications`,
          { method: "GET", credentials: "include" }
        );
        if (!res.ok) return;
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Poll unread chats ─────────────────────────────────────────────────────
  const [chats, setChats]       = useState([]);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchChats = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_APP_BACKEND_URL}/chat/count`,
          { method: "GET", credentials: "include" }
        );
        if (!res.ok) return;
        const data = await res.json();
        setChats(new Array(data.unreadCount).fill({}));
      } catch (err) {
        console.error("Failed to fetch unread chats", err);
      }
    };
    fetchChats();
    const interval = setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const unreadChats = chats.length;

  // ── Notification bell toggle — closes drawer when opening ────────────────
  const handleNotifClick = async () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    // Always close drawer when notif panel opens, and vice versa
    if (opening) {
      setMobileMenuOpen(false);
      setDropdownOpen(false);
    }
    if (opening) {
      try {
        await fetch(
          `${import.meta.env.VITE_APP_BACKEND_URL}/notifications/mark-read`,
          { method: "POST", credentials: "include" }
        );
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch (err) {
        console.error("Failed to mark notifications as read", err);
      }
    }
  };

  // ── Hamburger toggle — always closes notif panel ─────────────────────────
  const handleHamburgerClick = () => {
    const opening = !mobileMenuOpen;
    setMobileMenuOpen(opening);
    // Close any open panels — only one thing open at a time
    setNotifOpen(false);
    setDropdownOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_APP_BACKEND_URL}/users/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed", err);
    }
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  // ──────────────────────────────────────────────────────────────────────────
  //  LAYOUT
  //
  //  Desktop logged-out:  Logo | Home  Create Swap  Requests | [Login/Signup]
  //  Desktop logged-in:   Logo | Home  Create Swap  Requests | [🔔] [💬] [👤▾]
  //
  //  Mobile logged-out:   Header: Logo | [Login] [☰]
  //                       Drawer: Home, Create Swap, Requests
  //
  //  Mobile logged-in:    Header: Logo | [🔔] [💬] [☰]
  //                       Drawer: Home, Create Swap, Requests,
  //                               ── Profile, My Tasks, Change Password,
  //                                  Settings, Logout
  //
  //  NOTE: No separate avatar button on mobile — the ☰ opens the drawer which
  //  contains all account actions. Bell+Chat are sufficient logged-in signals.
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <nav className="navbar" ref={navRef}>

      {/* ── Logo ── */}
      <div className="logo-section">
        <Link to="/" className="logo">
          Skill<span className="logo-accent">Swap</span>
        </Link>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          DESKTOP NAV  (display:none on mobile)
      ════════════════════════════════════════════════════════════════ */}
      <div className="navbar-desktop">
        <nav className="navbar-page-links" aria-label="Primary navigation">
          <Link to="/"            className={`nav-link${isActive("/")            ? " active-link" : ""}`}>Home</Link>
          <Link to="/create-swap" className={`nav-link${isActive("/create-swap") ? " active-link" : ""}`}>Create Swap</Link>
          <Link to="/requests"    className={`nav-link${isActive("/requests")    ? " active-link" : ""}`}>Requests</Link>
        </nav>

        <div className="navbar-actions">
          {isLoggedIn ? (
            <>
              {/* 🔔 Bell */}
              <div className="notification_dropdown" ref={notifRef}>
                <button
                  type="button"
                  className="notification_link icon-btn"
                  onClick={handleNotifClick}
                  aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                  aria-expanded={notifOpen}
                  aria-haspopup="true"
                >
                  <FaBell size={16} />
                  {unreadCount > 0 && (
                    <span className="badge badge--red" aria-hidden="true">{unreadCount}</span>
                  )}
                </button>
                {notifOpen && (
                  <div className="dropdown notif-dropdown" role="menu">
                    <div className="dropdown-header">Notifications</div>
                    {notifications.length === 0 ? (
                      <div className="drop_item drop_item--empty">No new notifications</div>
                    ) : notifications.map((n, idx) => (
                      <div key={idx} className={`drop_item${!n.read ? " drop_item--unread" : ""}`}>
                        {n.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 💬 Chat */}
              <div className="chat_dropdown" ref={chatRef}>
                <button
                  type="button"
                  className="chat_link icon-btn"
                  onClick={() => { setChatOpen(!chatOpen); navigate("/chats"); }}
                  aria-label={unreadChats > 0 ? `Messages, ${unreadChats} unread` : "Messages"}
                >
                  <FaComments size={16} />
                  {unreadChats > 0 && (
                    <span className="badge badge--blue" aria-hidden="true">{unreadChats}</span>
                  )}
                </button>
              </div>

              {/* 👤 Avatar dropdown */}
              <div className="profile_dropdown" ref={dropdownRef}>
                <button
                  type="button"
                  className="profile_link"
                  onClick={() => setDropdownOpen((p) => !p)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-label="Account menu"
                >
                  <span className="profile_icon" aria-hidden="true"><FaUser /></span>
                </button>
                {dropdownOpen && (
                  <div className="dropdown" role="menu">
                    <div className="dropdown-header">My Account</div>
                    <div className="drop_item" onClick={() => setDropdownOpen(false)}>
                      <Link to="/profileview" className="dropdown-text">Profile</Link>
                    </div>
                    <div className="drop_item" onClick={() => setDropdownOpen(false)}>
                      <Link to="/my-tasks" className="dropdown-text">My Tasks</Link>
                    </div>
                    <div className="drop_item" onClick={() => setDropdownOpen(false)}>
                      <Link to="/change_password" className="dropdown-text">Change Password</Link>
                    </div>
                    <div className="drop_item" onClick={() => setDropdownOpen(false)}>
                      <Link to="/settings" className="dropdown-text">Settings</Link>
                    </div>
                    <div className="drop_item drop_item--danger" onClick={handleLogout}>
                      Logout
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="navbar-login-btn">Login / Signup</Link>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MOBILE HEADER  (display:none on desktop)
          Logged-in:  [🔔] [💬] [☰]
          Logged-out: [Login] [☰]
          No avatar button — ☰ opens drawer containing all account actions.
      ════════════════════════════════════════════════════════════════ */}
      <div className="navbar-mobile-header">

        {isLoggedIn ? (
          <>
            {/* 🔔 Bell — always visible, notification panel is full-width below header */}
            <div className="notification_dropdown notification_dropdown--mobile" ref={notifRef}>
              <button
                type="button"
                className="notification_link icon-btn"
                onClick={handleNotifClick}
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                aria-expanded={notifOpen}
                aria-haspopup="true"
              >
                <FaBell size={15} />
                {unreadCount > 0 && (
                  <span className="badge badge--red" aria-hidden="true">{unreadCount}</span>
                )}
              </button>
              {/* Panel rendered outside nav flow via portal-like fixed positioning */}
              {notifOpen && (
                <div className="dropdown notif-dropdown notif-dropdown--mobile" role="menu">
                  <div className="dropdown-header">Notifications</div>
                  {notifications.length === 0 ? (
                    <div className="drop_item drop_item--empty">No new notifications</div>
                  ) : notifications.map((n, idx) => (
                    <div key={idx} className={`drop_item${!n.read ? " drop_item--unread" : ""}`}>
                      {n.message}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 💬 Chat */}
            <button
              type="button"
              className="chat_link icon-btn"
              onClick={() => { setChatOpen(!chatOpen); navigate("/chats"); }}
              aria-label={unreadChats > 0 ? `Messages, ${unreadChats} unread` : "Messages"}
            >
              <FaComments size={15} />
              {unreadChats > 0 && (
                <span className="badge badge--blue" aria-hidden="true">{unreadChats}</span>
              )}
            </button>
          </>
        ) : (
          <Link to="/login" className="navbar-login-btn navbar-login-btn--mobile">Login</Link>
        )}

        {/* ── Hamburger — closes notif panel when opening drawer ── */}
        <button
          type="button"
          className={`hamburger${mobileMenuOpen ? " hamburger--open" : ""}`}
          onClick={handleHamburgerClick}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-drawer"
        >
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
          <span className="hamburger-bar" />
        </button>
      </div>

      {/* ── Backdrop — closes drawer OR notification panel ── */}
      {(mobileMenuOpen || notifOpen) && (
        <div
          className="mobile-overlay"
          onClick={() => { setMobileMenuOpen(false); setNotifOpen(false); }}
          aria-hidden="true"
        />
      )}

      {/* ════════════════════════════════════════════════════════════════
          MOBILE DRAWER
      ════════════════════════════════════════════════════════════════ */}
      <ul
        id="mobile-drawer"
        className={`nav_links${mobileMenuOpen ? " open" : ""}`}
        aria-label="Mobile navigation"
      >
        <li>
          <Link to="/" className={`drawer-link${isActive("/") ? " active-link" : ""}`}
            onClick={() => setMobileMenuOpen(false)}>Home</Link>
        </li>
        <li>
          <Link to="/create-swap" className={`drawer-link${isActive("/create-swap") ? " active-link" : ""}`}
            onClick={() => setMobileMenuOpen(false)}>Create Swap</Link>
        </li>
        <li>
          <Link to="/requests" className={`drawer-link${isActive("/requests") ? " active-link" : ""}`}
            onClick={() => setMobileMenuOpen(false)}>Requests</Link>
        </li>

        {isLoggedIn && (
          <>
            <li className="drawer-divider" aria-hidden="true" />
            <li>
              <Link to="/profileview" className="drawer-link"
                onClick={() => setMobileMenuOpen(false)}>Profile</Link>
            </li>
            <li>
              <Link to="/my-tasks" className="drawer-link"
                onClick={() => setMobileMenuOpen(false)}>My Tasks</Link>
            </li>
            <li>
              <Link to="/change_password" className="drawer-link"
                onClick={() => setMobileMenuOpen(false)}>Change Password</Link>
            </li>
            <li>
              <Link to="/settings" className="drawer-link"
                onClick={() => setMobileMenuOpen(false)}>Settings</Link>
            </li>
            <li>
              <button
                type="button"
                className="drawer-link drawer-link--danger drawer-logout"
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
              >
                Logout
              </button>
            </li>
          </>
        )}
      </ul>

    </nav>
  );
}

export default NavBar;