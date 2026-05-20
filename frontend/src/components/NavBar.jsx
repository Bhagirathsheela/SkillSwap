import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/auth-context.jsx";
import { useSocketContext } from "../contexts/SocketContext.jsx";
import { FaBell, FaComments } from "react-icons/fa";
import Avatar from "./Avatar";

function NavBar() {
  const [dropdownOpen, setDropdownOpen]     = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen]           = useState(false);

  const navRef      = useRef(null);
  const dropdownRef = useRef(null);
  const notifRef    = useRef(null);
  const chatRef     = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, logout, user } = useAuthContext();

  // 🚀 Realtime values from SocketContext — no more polling
  const {
    notifications,
    unreadNotifications: unreadCount,
    unreadChats,
    markAllNotificationsRead,
    clearAllNotifications,
  } = useSocketContext();

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



  const [chatOpen, setChatOpen] = useState(false);

  // ── Notification bell toggle — closes drawer when opening ────────────────
  const handleNotifClick = async () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    if (opening) {
      setMobileMenuOpen(false);
      setDropdownOpen(false);
      await markAllNotificationsRead();
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
                    <div className="flex items-center justify-between px-4 pt-2 pb-1">
                      <span className="text-[0.67rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Notifications
                      </span>
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); clearAllNotifications(); }}
                          className="text-[0.7rem] font-medium text-[var(--color-brand-primary)] hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="drop_item drop_item--empty">You're all caught up</div>
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
                  <Avatar name={user?.name} email={user?.email} imageUrl={user?.image ? `${import.meta.env.VITE_APP_ASSET_URL}/${user.image}` : null} size="sm" />
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
                  <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-[var(--surface-border)] sticky top-0 bg-[var(--surface-white)] z-10">
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      Notifications
                    </span>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearAllNotifications(); }}
                        className="text-xs font-semibold text-[var(--color-brand-primary)] active:scale-95 transition px-2 py-1 rounded-md"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="drop_item drop_item--empty py-8">You're all caught up</div>
                  ) : notifications.map((n, idx) => (
                    <div
                      key={idx}
                      className={`drop_item py-3${!n.read ? " drop_item--unread" : ""}`}
                      style={{ minHeight: 48 }}
                    >
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