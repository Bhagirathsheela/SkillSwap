
import React from "react";
import { useLoader } from "../contexts/LoaderContext.jsx";

const Loader = () => {
  const { loading } = useLoader();
  if (!loading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div
        className="loader rounded-full w-14 h-14 animate-spin"
        style={{
          border: "4px solid rgba(255,255,255,0.25)",
          borderTopColor: "var(--color-brand-primary)",
        }}
      ></div>
    </div>
  );
};

export default Loader;
