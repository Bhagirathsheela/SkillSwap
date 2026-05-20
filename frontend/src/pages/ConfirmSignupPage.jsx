import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useHttpClient } from "../hooks/http-hook.js";
import { showSuccess, showError } from "../lib/toastHelper";

const ConfirmSignupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sendRequest } = useHttpClient();

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  // Get token from query params
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  useEffect(() => {
    const confirmSignup = async () => {
      try {
        const responseData = await sendRequest(
          `${import.meta.env.VITE_APP_BACKEND_URL}/users/confirm-signup-email/${token}`
        );

        if (responseData) {
          setMessage("🎉 Your account has been successfully confirmed!");
          showSuccess("Account confirmed! Redirecting to login...");
          setSuccess(true);

          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        }
      } catch (error) {
        setMessage("❌ Confirmation failed. Please try again or contact support.");
        showError(error.message || "Something went wrong, please try again.");
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    if (token) confirmSignup();
  }, [sendRequest, token, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-[var(--surface-bg)]">
      <div className="w-full max-w-md bg-[var(--surface-white)] rounded-2xl
                      border border-[var(--surface-border)] shadow-card
                      p-8 sm:p-10 text-center">
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4
                            border-4 border-[var(--color-brand-primary)] border-t-transparent"></div>
            <p className="text-[var(--text-secondary)] text-base">Confirming your account...</p>
          </>
        ) : (
          <>
            <h2
              className={`text-2xl font-bold mb-4 tracking-tight ${
                success ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {success ? "Success!" : "Oops!"}
            </h2>
            <p className="text-[var(--text-primary)] text-base mb-4 leading-relaxed">{message}</p>
            {success && (
              <p className="text-[var(--text-muted)] text-sm">
                Redirecting to login page in 3 seconds...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ConfirmSignupPage;
