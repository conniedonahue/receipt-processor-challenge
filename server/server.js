import express from "express";
import receiptRouter from "./routes/receiptRouter.js";

const app = express();
const port = 3000;

app.use("/receipts", receiptRouter);

// Send all other requests to 404 Error
app.use((req, res, next) => {
  const error = new Error("Route not found");
  error.status = 404;
  next(error);
});

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal Server Error",
    status: status,
  });
});

app.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});
