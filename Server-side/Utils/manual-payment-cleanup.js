const ManualPayment = require("../Models/ManualPayment");
const { createNotification } = require("./notification-service");
const sendEmail = require("./send-mail");
const buildEmailTemplate = require("./email-template");
const { cleanPhoneNumber, sendWhatsAppMessage } = require("./whatsapp-service");

let cleanupJobStarted = false;

const getCustomerEmail = (payment) => payment.orderId?.user?.email || payment.userId?.email || null;

const buildExpiryEmail = (payment) =>
  buildEmailTemplate(
    "Payment reference expired",
    `<p>Your bank transfer reference <strong>${payment.referenceNumber}</strong> expired because no proof was submitted within 24 hours.</p>
     <p>Please place a new bank transfer order if you still want to complete this purchase.</p>`
  );

const markExpiredManualPayments = async () => {
  const now = new Date();

  const expiringPayments = await ManualPayment.find({
    status: "pending_payment",
    expiresAt: { $lte: now },
  })
    .populate({
      path: "orderId",
      populate: {
        path: "user",
        select: "email role profilePicture",
      },
    })
    .populate("userId", "email role profilePicture");

  for (const payment of expiringPayments) {
    payment.status = "expired";
    payment.expiredAt = now;
    payment.adminNotes = payment.adminNotes || "Automatically expired after 24 hours without proof.";
    await payment.save({ validateModifiedOnly: true });

    const order = payment.orderId;

    if (order && order.status !== "confirmed") {
      order.status = "cancelled";
      order.paymentStatus = "failed";
      await order.save({ validateModifiedOnly: true });

      const customerUserId = order.user?._id || order.user;
      if (customerUserId) {
        await createNotification({
          userId: customerUserId,
          type: "order",
          title: "Payment reference expired",
          message: `Your payment reference ${payment.referenceNumber} expired because no proof was submitted within 24 hours.`,
          entityRef: order._id,
          entityType: "Order",
          meta: {
            orderId: order._id,
            referenceNumber: payment.referenceNumber,
            status: "expired",
          },
        });
      }

      const customerEmail = getCustomerEmail(payment);
      if (customerEmail) {
        try {
          await sendEmail({
            email: customerEmail,
            subject: "Your Saga Elite payment reference expired",
            html: buildExpiryEmail(payment),
          });
        } catch (emailError) {
          console.error("Failed to send manual payment expiry email:", emailError);
        }
      }

      const customerPhone = cleanPhoneNumber(order.contactNumber);
      if (customerPhone) {
        try {
          await sendWhatsAppMessage({
            to: customerPhone,
            message: `Saga Elite: your payment reference ${payment.referenceNumber} expired because no proof was submitted within 24 hours. Please place a new order if you still want to continue.`,
          });
        } catch (whatsAppError) {
          console.error("Failed to send manual payment expiry WhatsApp message:", whatsAppError);
        }
      }
    }
  }

  return expiringPayments.length;
};

const pruneExpiredManualPayments = async () => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await ManualPayment.deleteMany({
    status: "expired",
    expiredAt: { $lte: cutoff },
  });

  return result.deletedCount || 0;
};

const startManualPaymentCleanupJob = () => {
  if (cleanupJobStarted) {
    return;
  }

  cleanupJobStarted = true;

  const runSweep = async () => {
    try {
      await markExpiredManualPayments();
      await pruneExpiredManualPayments();
    } catch (error) {
      console.error("Manual payment cleanup job failed:", error);
    }
  };

  runSweep();
  setInterval(runSweep, 15 * 60 * 1000);
  setInterval(async () => {
    try {
      await pruneExpiredManualPayments();
    } catch (error) {
      console.error("Manual payment prune job failed:", error);
    }
  }, 24 * 60 * 60 * 1000);
};

module.exports = {
  markExpiredManualPayments,
  pruneExpiredManualPayments,
  startManualPaymentCleanupJob,
};