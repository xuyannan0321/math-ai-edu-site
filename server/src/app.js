const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const authRoutes = require("./routes/auth.routes");
const solveRoutes = require("./routes/solve.routes");
const solveImageRoutes = require("./routes/solveImage.routes");
const solveRecordsRoutes = require("./routes/solveRecords.routes");
const modelStatusRoutes = require("./routes/modelStatus.routes");
const { env } = require("./config/env");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.length === 0 || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin is not allowed."));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      service: "math-ai-edu-server",
      timestamp: new Date().toISOString(),
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", modelStatusRoutes);
app.use("/api", solveRoutes);
app.use("/api", solveImageRoutes);
app.use("/api", solveRecordsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
