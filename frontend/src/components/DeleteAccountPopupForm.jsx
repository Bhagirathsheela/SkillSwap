import React, { useState } from "react";
import { useHttpClient } from "../hooks/http-hook";
import { usePopup } from "../contexts/PopupContext";
import { showSuccess, showError } from "../lib/toastHelper";
import { useNavigate } from "react-router-dom";

const DeleteAccountPopupForm = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { sendRequest } = useHttpClient();
  const { closePopup } = usePopup();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    try {
      const responseData= await sendRequest(
        `${import.meta.env.VITE_APP_BACKEND_URL}/users/delete-account`,
        "DELETE",
        JSON.stringify({
          password
        }),
        { "Content-Type": "application/json" }
      );
     if (responseData) {
      closePopup()
      navigate("/login");
      showSuccess("Your account has been deleted successfully");
     } 
     
    } catch (err) {
      showError(err.message||"Failed to delete account. Please try again.");
    }
  };

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          This action is{" "}
          <span className="text-red-500 font-semibold">permanent </span>
          and cannot be undone. Please confirm your email and password.
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          placeholder="Enter your password"
          className="w-full px-4 py-2.5 text-sm rounded-lg
                     border border-[var(--surface-border)]
                     text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                     transition focus:outline-none
                     focus:border-[var(--color-brand-primary)]
                     focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
        />

        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 py-3 border-t border-[var(--surface-border)] mt-8">
        <button
          onClick={closePopup}
          className="px-4 py-2 text-sm font-medium rounded-lg
                     border border-[var(--surface-border)]
                     bg-white text-[var(--text-primary)]
                     hover:bg-gray-50 transition"
        >
          Cancel
        </button>

        <button
          onClick={handleDelete}
          className="px-4 py-2 text-sm font-semibold rounded-lg text-white
                     bg-[var(--btn-reject-bg)]
                     hover:bg-[var(--btn-reject-bg-hover)]
                     shadow-[0_2px_8px_rgba(239,68,68,0.25)]
                     transition"
        >
          Delete Account
        </button>
      </div>
    </>
  );
};

export default DeleteAccountPopupForm;
