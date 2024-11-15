import express from "express";
import { receiptController } from "../controllers/receiptController.js";

const router = express.Router();
router.use(express.json());

router.post(
  "/process",
  receiptController.validateReceipt,
  receiptController.createReceiptId
);
router.get("/:receiptId/points", receiptController.getPointsById);

export default router;
