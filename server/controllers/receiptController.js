import { v4 as uuidv4 } from "uuid";
import { receiptDatabase } from "../../db/receiptDatabase.js";
import { isAlphanumeric } from "../../utils/stringUtils.js";

export const receiptController = {};

/**
 * Validates the receipt data.
 *
 * @param {Object} req - The request object containing the receipt data.
 * @param {Object} res - The response object to send the status and errors if validation fails.
 * @param {Function} next - The function to call the next middleware if validation passes.
 *
 * @returns {Object} res.status(400) with an error message if validation fails.
 * NOTE: error descriptions could be made to be more specific, they are currently
 * all "The receipt is invalid" to match OpenAPI schema.
 * Calls next() to continue processing the request if validation passes.
 */

receiptController.validateReceipt = (req, res, next) => {
  const { retailer, purchaseDate, purchaseTime, total, items } = req.body;

  if (
    !retailer ||
    typeof retailer !== "string" ||
    !/^[\w\s\-\\&]+$/.test(retailer)
  ) {
    return res.status(400).json({ description: "The receipt is invalid" });
  }
  if (!purchaseDate || !/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
    return res.status(400).json({ description: "The receipt is invalid" });
  }
  if (!purchaseTime || !/^\d{2}:\d{2}$/.test(purchaseTime)) {
    return res.status(400).json({ description: "The receipt is invalid" });
  }
  if (!total || isNaN(Number(total))) {
    return res.status(400).json({ description: "The receipt is invalid" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ description: "The receipt is invalid" });
  }

  next();
};

/**
 * Generates a receiptId for the receipt.
 *
 * @param {Object} req - The request object containing the receipt data.
 * @param {Object} res - The response object to send the unique ID.
 *
 * @returns {Object} res.status(200).json with the unique ID of the receipt.
 * After generating a receiptId, this function calls calculatePoints and returns
 * the receiptId.
 */

receiptController.createReceiptId = (req, res) => {
  const receipt = req.body;

  let receiptId;
  do {
    receiptId = uuidv4();
  } while (receiptDatabase.has(receiptId));

  receiptController.calculatePoints(receipt, receiptId);

  res.status(200).json({ id: receiptId });
};

/**
 * Calculates and stores the points for the receipt based on below criteria.
 * Uses Promises to concurrently calculate points.
 *
 * @param {Object} receipt - The receipt object containing the retailer, purchase date, time, total, and items.
 * @param {string} uniqueId - The unique ID assigned to the receipt.
 *
 * This function calculates the points based on several conditions:
 * - One point for each alphanumeric character in the retailer name.
 * - 50 points for round dollar amounts.
 * - 25 points if the total is a multiple of 0.25.
 * - 5 points for every two items on the receipt.
 * - Item points based on the description's length (multiple of 3) and price.
 * - 6 points if the purchase day is odd.
 * - 10 points if the purchase time is between 2:00 PM and 4:00 PM.
 *
 * @returns {void} No returns, stores the receipt data and calculated points in the database.
 */

receiptController.calculatePoints = async (receipt, uniqueId) => {
  const { retailer, purchaseDate, purchaseTime, total, items } = receipt;
  let points = 0;

  const calculations = [
    new Promise((resolve, reject) => {
      let count = 0;
      for (const char of retailer) {
        if (isAlphanumeric(char)) {
          count++;
        }
      }
      resolve(count);
    }),

    new Promise((resolve, reject) => {
      if (total.slice(-2) == "00") {
        resolve(50);
      } else {
        resolve(0);
      }
    }),

    new Promise((resolve, reject) => {
      if (Number(total) % 0.25 === 0) {
        resolve(25);
      } else {
        resolve(0);
      }
    }),

    new Promise((resolve) => {
      resolve(Math.floor(items.length / 2) * 5);
    }),

    new Promise((resolve) => {
      let count = 0;
      for (const item of items) {
        if (item.shortDescription.trim().length % 3 === 0) {
          const value = Math.ceil(item.price * 0.2);
          count += value;
        }
      }
      resolve(count);
    }),

    new Promise((resolve) => {
      if (Number(purchaseDate.slice(-2)) % 2 !== 0) {
        resolve(6);
      } else {
        resolve(0);
      }
    }),

    new Promise((resolve) => {
      const hour = Number(purchaseTime.slice(0, 2));
      if (hour > 13 && hour < 16) {
        resolve(10);
      } else {
        resolve(0);
      }
    }),
  ];

  const results = await Promise.all(calculations);
  points = results.reduce((acc, cur) => acc + cur, 0);
  receiptDatabase.set(uniqueId, { points: points, receipt: receipt });
};

/**
 * Retrieves the points for a given receipt ID.
 *
 * @param {Object} req - The request object containing the receiptId parameter.
 * @param {Object} res - The response object to send the points or an error.
 *
 * @returns {Object} res.status(404) if no receipt is found for the given ID,
 * res.status(500) if there is an issue fetching from the database (NOTE: this is not in the
 * OpenAPI schema)
 * res.status(200) with the points if the receipt is found in the database.
 */
receiptController.getPointsById = async (req, res) => {
  const { receiptId } = req.params;
  if (!receiptDatabase.has(receiptId)) {
    res.status(404).json({ description: "No receipt found for that id" });
  }
  try {
    const result = await receiptDatabase.get(receiptId);
    const points = result.points;
    res.status(200).json({ points: points });
  } catch (error) {
    console.error(`Error fetching receipt: ${error}`);
    res
      .status(500)
      .json({ description: "Internal server error. Please try again later." });
  }
};
