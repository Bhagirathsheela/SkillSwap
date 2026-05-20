import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/auth-context.jsx";
import Loader from "./components/Loader.jsx";
import { LoaderProvider } from "./contexts/LoaderContext.jsx";
import { Toaster } from "react-hot-toast";
import { PopupProvider } from "./contexts/PopupContext.jsx";
import Popup from "./components/Popup.jsx";
import { SocketProvider } from "./contexts/SocketContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LoaderProvider>
      <BrowserRouter>
        <PopupProvider>
          <AuthProvider>
            <SocketProvider>
              <App />
              <Toaster position="top-center" />
              <Loader />
              <Popup />
            </SocketProvider>
          </AuthProvider>
        </PopupProvider>
      </BrowserRouter>
    </LoaderProvider>
  </React.StrictMode>
);
