import React, { useState } from "react";
import { useHttpClient } from "../hooks/http-hook.js";
import { showSuccess } from "../lib/toastHelper";

const Signup = ({ setShowLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { sendRequest } = useHttpClient();
  

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const responseData = await sendRequest(
        `${import.meta.env.VITE_APP_BACKEND_URL}/users/signup`,
        "POST",
        JSON.stringify({ name, email, password }),
        { "Content-Type": "application/json" }
      );

      if (responseData) {
         showSuccess("Signup successful! A confirmation email has been sent.");
         setShowLogin(true)
       }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-[var(--surface-bg)]">
      <div className="w-full max-w-md bg-[var(--surface-white)] p-8 sm:p-10
                      rounded-2xl border border-[var(--surface-border)] shadow-card">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-[var(--text-primary)] mb-8 tracking-tight">
          Create Your Account
        </h2>

        <form onSubmit={handleRegisterSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              className="w-full px-4 py-2.5 text-sm rounded-lg
                         border border-[var(--surface-border)]
                         text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                         transition focus:outline-none
                         focus:border-[var(--color-brand-primary)]
                         focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="emailReg" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Email
            </label>
            <input
              id="emailReg"
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
            <label htmlFor="passwordReg" className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Password
            </label>
            <input
              id="passwordReg"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create your password"
              required
              className="w-full px-4 py-2.5 text-sm rounded-lg
                         border border-[var(--surface-border)]
                         text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                         transition focus:outline-none
                         focus:border-[var(--color-brand-primary)]
                         focus:ring-2 focus:ring-[var(--color-brand-primary)]/20"
            />
          </div>

          {/* Register Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold text-white text-base
                       bg-[var(--color-brand-primary)]
                       hover:bg-[var(--color-brand-primary-dark)]
                       hover:-translate-y-0.5 active:translate-y-0
                       shadow-[0_4px_12px_rgba(91,91,255,0.25)]
                       transition"
          >
            Register
          </button>
        </form>

        {/* Links */}
        <div className="mt-8 text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{" "}
          <span
            className="text-[var(--color-brand-primary)] font-semibold cursor-pointer hover:underline"
            onClick={() => setShowLogin(true)}
          >
            Back to Login
          </span>
        </div>
      </div>
    </div>
  );
};

export default Signup;
