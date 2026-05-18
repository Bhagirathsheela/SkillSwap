import React, { useState } from "react";
import { useHttpClient } from "../../common/hooks/http-hook";
import { usePopup } from "../../common/context/PopupContext";
import { showSuccess,showError } from "../../common/toastHelper";
const ResetPwdPopupForm = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const { sendRequest } = useHttpClient();
  const { closePopup } = usePopup();
  const validateEmail = (email) =>
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/.test(email);

  const handleReset = async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    } else if (!validateEmail(email)) {
      setError("Invalid email address");
      return;
    }

    try {
      const responseData = await sendRequest(
        `${import.meta.env.VITE_APP_BACKEND_URL}/users/reset-password`,
        "POST",
        JSON.stringify({
          email: email,
        }),
        { "Content-Type": "application/json" }
      );

      closePopup();
      if (responseData) {
        showSuccess("A password reset link is sent, please check your email");
      }
    } catch (error) {
      showError(error.message || "Something went wrong, please try again.");
    }
  };

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Enter your email and we’ll send you a reset link.
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          placeholder="Email address"
          className="w-full px-4 py-2.5 text-sm rounded-lg
                     border border-[var(--surface-border)]
                     text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                     transition focus:outline-none
                     focus:border-[var(--color-brand-primary)]
                     focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 py-3 border-t border-[var(--surface-border)] mt-8">
        <button
          onClick={closePopup}
          className="px-4 py-2 text-sm font-medium rounded-lg
                     border border-[var(--surface-border)]
                     bg-white text-[var(--text-primary)]
                     hover:bg-gray-50 transition"
        >
          Close
        </button>

        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-semibold rounded-lg text-white
                     bg-[var(--color-brand-primary)]
                     hover:bg-[var(--color-brand-primary-dark)]
                     shadow-[0_2px_8px_rgba(91,91,255,0.25)]
                     transition"
        >
          Confirm
        </button>
      </div>
    </>
  );
};

export default ResetPwdPopupForm;
