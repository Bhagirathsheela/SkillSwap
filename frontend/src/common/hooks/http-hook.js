import { useCallback } from "react";
import { useLoader } from "../context/LoaderContext.jsx";
import { showError } from "../toastHelper.js";

// URLs whose failures should NOT surface an error toast to the user.
// These are passive reads where a failure is expected (e.g. no active
// session) or doesn't need user-facing feedback.
const SILENT_URL_PATTERNS = ["/users/me", "/tasks?status=open"];

const shouldSuppressToast = (url) =>
  SILENT_URL_PATTERNS.some((p) => url.includes(p));

export const useHttpClient = () => {
  const { setLoading } = useLoader();

  const sendRequest = useCallback(
    async (url, method = "GET", body = null, headers = {}) => {
      setLoading(true);
      const silent = shouldSuppressToast(url);
      try {
        let requestHeaders = { ...headers };
        let requestBody = body;

        if (body && !(body instanceof FormData) && typeof body !== "string") {
          requestBody = JSON.stringify(body);
          if (!requestHeaders["Content-Type"]) {
            requestHeaders["Content-Type"] = "application/json";
          }
        }

        const response = await fetch(url, {
          method,
          body: method !== "GET" && method !== "HEAD" ? requestBody : null,
          headers: requestHeaders,
          credentials: "include",
        });

        const text = await response.text();
        const responseData = text ? JSON.parse(text) : {};

        if (!response.ok) {
          if (!silent) {
            showError(responseData.message || "Request failed!");
          }
          throw new Error(responseData.message || "Request failed!");
        }

        return responseData;
      } catch (err) {
        if (!silent) {
          showError(err.message || "Something went wrong!");
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setLoading]
  );

  return { sendRequest };
};
