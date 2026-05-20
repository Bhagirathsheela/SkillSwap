import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHttpClient } from "../hooks/http-hook";
import { showSuccess, showError } from "../lib/toastHelper";

const EyeIcon = ({ open }) =>
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.51 10.51 0 0 1 12 20c-7 0-11-8-11-8a18.51 18.51 0 0 1 6.55-5.32"></path>
      <path d="M2 2l20 20"></path>
      <path d="M21 12c-1 4-6 8-11 8a12.92 12.92 0 0 1-2.91-.95"></path>
      <path d="M15.46 15.46a3.5 3.5 0 0 1-5.01-5.01"></path>
      <path d="M9.45 4.95A10.51 10.51 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-6.55 5.32"></path>
    </svg>
  );

const ChangePassword = () => {
  const { sendRequest } = useHttpClient();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (oldPassword === newPassword) {
      setError("New password must be different from the current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setSubmitting(true);
      const responseData = await sendRequest(
        `${import.meta.env.VITE_APP_BACKEND_URL}/users/change-password`,
        "POST",
        JSON.stringify({ oldPassword, newPassword }),
        { "Content-Type": "application/json" }
      );

      if (responseData) {
        showSuccess("Password changed successfully!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => navigate("/profileview"), 1200);
      }
    } catch (err) {
      showError(err.message || "Failed to change password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase =
    "w-full px-4 py-2.5 pr-11 text-sm rounded-lg " +
    "border border-[var(--surface-border)] " +
    "text-[var(--text-primary)] placeholder:text-[var(--text-muted)] " +
    "transition focus:outline-none " +
    "focus:border-[var(--color-brand-primary)] " +
    "focus:ring-2 focus:ring-[var(--color-brand-primary)]/20";

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-[var(--surface-bg)]">
      <div className="w-full max-w-md bg-[var(--surface-white)] p-8 sm:p-10
                      rounded-2xl border border-[var(--surface-border)] shadow-card">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-[var(--text-primary)] tracking-tight">
          Change Password
        </h2>
        <p className="text-sm text-center text-[var(--text-secondary)] mb-7">
          Keep your account secure by using a strong, unique password.
        </p>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center bg-red-50 border border-red-200 rounded-lg py-2 px-3">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Current Password */}
          <div className="relative">
            <label
              htmlFor="oldPassword"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Current Password
            </label>
            <input
              id="oldPassword"
              type={showOld ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => {
                setOldPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter your current password"
              className={inputBase}
              autoComplete="current-password"
            />
            <span
              className="absolute right-3 top-[38px] text-[var(--text-muted)] hover:text-[var(--color-brand-primary)] cursor-pointer transition"
              onClick={() => setShowOld((p) => !p)}
              aria-label={showOld ? "Hide current password" : "Show current password"}
              role="button"
              tabIndex={0}
            >
              <EyeIcon open={showOld} />
            </span>
          </div>

          {/* New Password */}
          <div className="relative">
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
            >
              New Password
            </label>
            <input
              id="newPassword"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError("");
              }}
              placeholder="At least 6 characters"
              className={inputBase}
              autoComplete="new-password"
            />
            <span
              className="absolute right-3 top-[38px] text-[var(--text-muted)] hover:text-[var(--color-brand-primary)] cursor-pointer transition"
              onClick={() => setShowNew((p) => !p)}
              aria-label={showNew ? "Hide new password" : "Show new password"}
              role="button"
              tabIndex={0}
            >
              <EyeIcon open={showNew} />
            </span>
          </div>

          {/* Confirm New Password */}
          <div className="relative">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              placeholder="Re-enter the new password"
              className={inputBase}
              autoComplete="new-password"
            />
            <span
              className="absolute right-3 top-[38px] text-[var(--text-muted)] hover:text-[var(--color-brand-primary)] cursor-pointer transition"
              onClick={() => setShowConfirm((p) => !p)}
              aria-label={showConfirm ? "Hide confirmation" : "Show confirmation"}
              role="button"
              tabIndex={0}
            >
              <EyeIcon open={showConfirm} />
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={submitting}
              className="px-4 py-2.5 text-sm font-medium rounded-lg
                         border border-[var(--surface-border)]
                         bg-white text-[var(--text-primary)]
                         hover:bg-gray-50 transition
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-semibold rounded-lg text-white
                         bg-[var(--color-brand-primary)]
                         hover:bg-[var(--color-brand-primary-dark)]
                         hover:-translate-y-0.5 active:translate-y-0
                         shadow-[0_4px_12px_rgba(91,91,255,0.25)]
                         transition
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {submitting ? "Updating..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
