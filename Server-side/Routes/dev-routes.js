// Dev-only routes for testing flows without real money / real banks. The
// router itself is wired in server.js but every handler hard-blocks
// production at the top, so accidentally enabling this in prod is
// non-destructive — requests just 404. Belt-and-braces: the parent mount
// also no-ops when NODE_ENV === "production".
//
// Currently exposes:
//   POST /simulate-bank-credit
//     Pretend a bank notification arrived for {referenceNumber, amount}.
//     Runs the same processBankNotification path as the IMAP watcher and
//     SMS webhook, so the end-state (status, order, sockets, emails) is
//     identical to a real confirmation. Use this from the admin UI or
//     curl during testing.

const express = require("express");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const authMiddleware = require("../Middlewares/auth-middleware");
const { requireAdmin } = require("../Middlewares/admin-middleware");
const { processBankNotification } = require("../Utils/bank-email-watcher");
const ManualPayment = require("../Models/ManualPayment");
const logger = require("../Utils/logger");

const router = express.Router();

const isProductionEnv = () => String(process.env.NODE_ENV || "").toLowerCase() === "production";

// Hard guard at the top of every handler — defense in depth alongside the
// mount-time check in server.js.
const requireNonProduction = (req, res, next) => {
  if (isProductionEnv()) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  return next();
};

router.post(
  "/simulate-bank-credit",
  requireNonProduction,
  authMiddleware,
  requireAdmin,
  catchAsync(async (req, res, next) => {
    const {
      referenceNumber,
      amount,
      bankName = "Sampath Bank (simulated)",
      transactionId,
      fromAddress = "dev-simulator@local",
    } = req.body || {};

    if (!referenceNumber || !String(referenceNumber).trim()) {
      return next(new AppError("referenceNumber is required", 400));
    }

    const reference = String(referenceNumber).trim().toUpperCase();
    let resolvedAmount = Number(amount);

    // If amount wasn't passed, default to the order amount so the test
    // produces a clean auto-verify (matched amount). The whole point of
    // having an amount field is to also be able to test mismatch flows by
    // passing a wrong number.
    if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
      const payment = await ManualPayment.findOne({ referenceNumber: reference }).select("amount");
      if (!payment) {
        return next(new AppError(`No ManualPayment found for reference ${reference}`, 404));
      }
      resolvedAmount = Number(payment.amount);
    }

    const messageId = `dev-simulator-${reference}-${Date.now()}`;
    const snippet =
      `[DEV-SIMULATED] Credit Alert: LKR ${resolvedAmount.toFixed(2)} ` +
      `credited to merchant account. Ref: ${reference}. ` +
      `Txn: ${transactionId || "DEV-" + Date.now()}.`;

    logger.info("Simulating bank credit", { reference, amount: resolvedAmount });

    const ok = await processBankNotification({
      messageId,
      source: "imap", // pretend it came via the email watcher for clean audit
      fromAddress,
      subject: "[DEV] Simulated bank credit notification",
      parsed: {
        reference,
        amount: resolvedAmount,
        transactionId: transactionId || `DEV-${Date.now()}`,
      },
      parser: { bankName },
      snippet,
      notificationDate: new Date(),
    });

    if (!ok) {
      return next(new AppError("Simulator could not process the notification", 500));
    }

    const updated = await ManualPayment.findOne({ referenceNumber: reference })
      .populate("orderId", "_id status paymentStatus")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Simulated bank credit processed",
      data: {
        payment: updated,
        simulated: {
          reference,
          amount: resolvedAmount,
          messageId,
          bankName,
        },
      },
    });
  })
);

module.exports = router;
