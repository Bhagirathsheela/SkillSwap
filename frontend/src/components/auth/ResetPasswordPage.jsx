import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useHttpClient } from "../../common/hooks/http-hook";
import { showSuccess, showError } from "../../common/toastHelper";

const EyeIcon = ({ open }) => (
  open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.94 17.94A10.51 10.51 0 0 1 12 20c-7 0-11-8-11-8a18.51 18.51 0 0 1 6.55-5.32"></path>
      <path d="M2 2l20 20"></path>
      <path d="M21 12c-1 4-6 8-11 8a12.92 12.92 0 0 1-2.91-.95"></path>
      <path d="M15.46 15.46a3.5 3.5 0 0 1-5.01-5.01"></path>
      <path d="M9.45 4.95A10.51 10.51 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-6.55 5.32"></path>
    </svg>
  )
);

const ResetPasswordPage = () => {
  const { token } = useParams();
  const { sendRequest } = useHttpClient();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Both fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await sendRequest(
        `${import.meta.env.VITE_APP_BACKEND_URL}/users/new-password`,
        "POST",
        JSON.stringify({ token, newPassword: password }),
        { "Content-Type": "application/json" }
      );
      showSuccess("Password reset successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      showError(err.message || "Invalid or expired token.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-[var(--surface-bg)]">
      <div className="w-full max-w-md bg-[var(--surface-white)] p-8 sm:p-10
                      rounded-2xl border border-[var(--surface-border)] shadow-card">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-[var(--text-primary)] tracking-tight">
          Reset Password
        </h2>
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center bg-red-50 border border-red-200 rounded-lg py-2 px-3">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5 custom_input_label">
              New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              className="w-full px-4 py-2.5 pr-11 text-sm rounded-lg
                         border border-[var(--surface-border)]
                         text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                         transition focus:outline-none
                         focus:border-[var(--color-brand-primary)]
                         focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
            />
            <span
              className="absolute right-3 top-[38px] text-[var(--text-muted)] hover:text-[var(--color-brand-primary)] cursor-pointer transition"
              onClick={() => setShowPassword(prev => !prev)}
            >
              <EyeIcon open={showPassword} />
            </span>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5 custom_input_label">
              Confirm New Password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="w-full px-4 py-2.5 pr-11 text-sm rounded-lg
                         border border-[var(--surface-border)]
                         text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                         transition focus:outline-none
                         focus:border-[var(--color-brand-primary)]
                         focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
            />
            <span
              className="absolute right-3 top-[38px] text-[var(--text-muted)] hover:text-[var(--color-brand-primary)] cursor-pointer transition"
              onClick={() => setShowConfirmPassword(prev => !prev)}
            >
              <EyeIcon open={showConfirmPassword} />
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold text-white text-base
                       bg-[var(--color-brand-primary)]
                       hover:bg-[var(--color-brand-primary-dark)]
                       hover:-translate-y-0.5 active:translate-y-0
                       shadow-[0_4px_12px_rgba(91,91,255,0.25)]
                       transition"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
