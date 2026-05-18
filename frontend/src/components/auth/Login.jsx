import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useHttpClient } from "../../common/hooks/http-hook.js";
import { usePopup } from "../../common/context/PopupContext.jsx";
import ResetPwdPopupForm from "./ResetPwdPopupForm";
import { useAuthContext } from "../../common/context/auth-context.jsx";

const Login = ({ setShowLogin }) => {
  const { login } = useAuthContext();
  const { sendRequest } = useHttpClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { openPopup } = usePopup();
  const from = location.state?.from?.pathname || "/";

  /* const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const responseData = await sendRequest(
        `${import.meta.env.VITE_APP_BACKEND_URL}/users/login`,
        "POST",
        JSON.stringify({ email, password }),
        { "Content-Type": "application/json" }
      );

      if (responseData?.token) {
        login(responseData, responseData.token);
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  }; */

const handleLoginSubmit = async (e) => {
  e.preventDefault();
  try {
    // ✅ Call backend, cookie is automatically set in browser
    const responseData = await sendRequest(
      `${import.meta.env.VITE_APP_BACKEND_URL}/users/login`,
      "POST",
      { email, password }, // no need to stringify manually
      { "Content-Type": "application/json" }
    );

    // ✅ No token handling on frontend; cookie is already set
    if (responseData) {
      await login();
      navigate(from, { replace: true });
    }
    //navigate(from, { replace: true });
  } catch (err) {
    console.error("Login failed:", err);
  }
};

   const handleResetClick = () => {
    openPopup("pwdResetPopup", {
      title: "Reset Password",
      body: <ResetPwdPopupForm />,
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-[var(--surface-bg)]">
      <div
        className="w-full max-w-md bg-[var(--surface-white)] p-8 sm:p-10
                   rounded-2xl border border-[var(--surface-border)] shadow-card"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-[var(--text-primary)] mb-8 tracking-tight">
          Login to Your Account
        </h2>

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-2.5 text-sm rounded-lg
                         border border-[var(--surface-border)]
                         text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                         transition focus:outline-none
                         focus:border-[var(--color-brand-primary)]
                         focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full px-4 py-2.5 text-sm rounded-lg
                         border border-[var(--surface-border)]
                         text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                         transition focus:outline-none
                         focus:border-[var(--color-brand-primary)]
                         focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold text-white text-base
                       bg-[var(--color-brand-primary)]
                       hover:bg-[var(--color-brand-primary-dark)]
                       hover:-translate-y-0.5 active:translate-y-0
                       shadow-[0_4px_12px_rgba(91,91,255,0.25)]
                       transition"
          >
            Login
          </button>
        </form>

        {/* Links */}
        <div className="mt-8 text-center text-sm text-[var(--text-secondary)] space-y-2">
          <p>
            Don’t have an account?{" "}
            <span
              className="text-[var(--color-brand-primary)] font-semibold cursor-pointer hover:underline"
              onClick={() => setShowLogin(false)}
            >
              Register
            </span>
          </p>
          <p>
            Forgot Password?{" "}
            <span
              className="text-[var(--color-brand-primary)] font-medium cursor-pointer hover:underline"
              onClick={handleResetClick}
            >
              Click Here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
