import express from "express";
import { v4 as uuidv4 } from "uuid";
import { receiptDatabase } from "../../db/receiptDatabase.js";
import { isAlphanumeric } from "../../utils/stringUtils.js";

export const receiptController = {};

receiptController.createId = (req, res) => {
  const receipt = req.body;

  let uniqueId;
  do {
    uniqueId = uuidv4();
  } while (receiptDatabase.has(uniqueId));

  receiptController.calculatePoints(receipt, uniqueId);

  res.status(201).json({ id: uniqueId });
};

/*
One point for every alphanumeric character in the retailer name.
50 points if the total is a round dollar amount with no cents.
25 points if the total is a multiple of 0.25.
5 points for every two items on the receipt.
If the trimmed length of the item description is a multiple of 3, multiply the price by 0.2 and round up to the nearest integer. The result is the number of points earned.
6 points if the day in the purchase date is odd.
10 points if the time of purchase is after 2:00pm and before 4:00pm.
*/

receiptController.calculatePoints = async (receipt, uniqueId) => {
  const { retailer, purchaseDate, purchaseTime, total, items } = receipt;
  let points = 0;

  const calculations = [
    new Promise((resolve, reject) => {
      let count = 0;
    }),
  ];

  for (const char of retailer) {
    if (isAlphanumeric(char)) {
      console.log(`adding point for ${char}`);
      points++;
    }
  }

  if (total.slice(-2) == "00") {
    points += 50;
    console.log("adding 50 for even. Points: ", points);
  }

  if (Number(total) % 0.25 === 0) {
    points += 25;
    console.log("adding 25! Points: ", points);
  }

  points += Math.floor(items.length / 2) * 5;

  console.log(
    "adding for item length: ",
    Math.floor(items.length / 2),
    " points: ",
    points
  );

  for (const item of items) {
    if (item.shortDescription.trim().length % 3 === 0) {
      const value = Math.ceil(item.price * 0.2);
      points += value;
      console.log(`adding ${value} to points. New total: ${points}`);
    }
  }

  if (Number(purchaseDate.slice(-2)) % 2 !== 0) {
    points += 6;
    console.log("Date is odd, adding 6. Total: ", points);
  }
  const hour = Number(purchaseTime.slice(0, 2));
  if (hour > 13 && hour < 16) {
    points += 10;
    console.log("happy hour! Points: ", points);
  }

  console.log("points: ", points);
};

receiptController.getPointsById = (req, res) => {
  let points = 0;
};
