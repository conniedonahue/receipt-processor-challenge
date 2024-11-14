import express from "express";
import receiptRouter from "./routes/receiptRouter.js";

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/receipts", receiptRouter);

app.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});
