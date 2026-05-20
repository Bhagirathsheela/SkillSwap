const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const mongoose = require("mongoose");
const HttpError = require("./models/http-error");

const usersRoutes = require("./routes/users-routes");
const tasksRoutes = require("./routes/tasks-routes");
const chatRoutes = require("./routes/chat-routes");
const notificationRoutes = require("./routes/notifications-routes");

const app = express();

app.use(bodyParser.json());
app.use(cookieParser());
app.use("/uploads/images", express.static(path.join("uploads", "images")));

// ✅ CORS — echo the incoming Origin back when it's allowed.
// Allowlist comes from FRONTEND_URL (comma-separated supported) plus
// any localhost:* origin in non-production. See utils/cors-helper.js.
const { isAllowedOrigin } = require("./utils/cors-helper");

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Short-circuit preflight: no need to route OPTIONS into the rest of the app.
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use("/api/users", usersRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);

// 404 Handler
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

// Global Error Handler
app.use((error, req, res, next) => {
  if (req.file) fs.unlink(req.file.path, () => {});
  if (res.headerSent) return next(error);
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

// MongoDB connection + Server startup
const PORT = process.env.PORT || 5000;

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bxc5w.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`
  )
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

    // ✅ Initialize socket here
    const { initSocket } = require("./socket");
    initSocket(server);
  })
  .catch((err) => console.log("❌ Server not connected", err));
