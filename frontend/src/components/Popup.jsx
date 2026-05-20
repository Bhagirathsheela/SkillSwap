import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { usePopup } from "../contexts/PopupContext";
//import { FaTimes } from "react-icons/fa";

const Popup = () => {
  const { popup, closePopup } = usePopup();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") closePopup();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closePopup]);
 
  useEffect(() => {
    const rootEl = document.getElementById("root");
    if (popup) {
      rootEl.classList.add('blur-background');
    } else {
      rootEl.classList.remove('blur-background');
    }
  }, [popup]);
  if (!popup) return null;

  const { title, body } = popup;
const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePopup();
      }}
    >
      <div className="bg-[var(--surface-white)] rounded-t-2xl sm:rounded-2xl
                      shadow-[0_20px_60px_rgba(0,0,0,0.25)]
                      max-w-md w-full overflow-hidden
                      max-h-[90vh] flex flex-col
                      animate-[dropIn_0.18s_cubic-bezier(0.4,0,0.2,1)]">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-[var(--surface-border)]">
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-0 tracking-tight">{title}</h2>
          <button
            type="button"
            className="inline-flex items-center justify-center w-9 h-9 rounded-full
                       text-[var(--text-muted)] hover:text-[var(--text-primary)]
                       hover:bg-gray-100 transition"
            onClick={closePopup}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto">{body}</div>

      </div>
    </div>,
    document.body
  );
};

export default Popup;
