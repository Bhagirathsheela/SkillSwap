// Shared CORS origin allowlist used by both Express middleware and socket.io.
//
// FRONTEND_URL in .env can be:
//   - a single URL          → "https://skillswap.example.com"
//   - comma-separated list  → "https://app.example.com, https://staging.example.com"
//
// In non-production environments we additionally allow any
// localhost / 127.0.0.1 origin on any port so that Vite picking a
// different port (5173, 5174, 5175, …) doesn't break CORS.

const isProd = process.env.NODE_ENV === "production";

const allowlist = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const LOCALHOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // curl / Postman / same-origin: no Origin header
  if (allowlist.includes(origin)) return true;
  if (!isProd && LOCALHOST_RE.test(origin)) return true;
  return false;
};

module.exports = { isAllowedOrigin, allowlist };
