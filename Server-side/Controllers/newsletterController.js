const Subscriber = require("../Models/NewsletterSubscriber");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const sendEmail = require("../Utils/send-mail");
const buildEmailTemplate = require("../Utils/email-template");
const logger = require("../Utils/logger");

const clientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

exports.subscribe = catchAsync(async (req, res, next) => {
  const email = String(req.body.email || "")
    .toLowerCase()
    .trim();

  if (!email || !/.+@.+\..+/.test(email)) {
    return next(new AppError("A valid email is required.", 400));
  }

  const source = String(req.body.source || "homepage").trim().slice(0, 120) || "homepage";

  const existing = await Subscriber.findOne({ email });
  let isNew = false;

  if (!existing) {
    await Subscriber.create({ email, source, isActive: true });
    isNew = true;
  } else {
    existing.isActive = true;
    existing.source = source;
    await existing.save({ validateModifiedOnly: true });
  }

  if (isNew) {
    try {
      await sendEmail({
        email,
        subject: "Welcome to Saga Elite — you're on the list!",
        html: buildEmailTemplate(
          "You're in!",
          `<p>Hi there,</p>
           <p>Thanks for subscribing to Saga Elite!</p>
           <p>You'll be the first to know about new drops, exclusive deals, and everything fresh from Saga Elite.</p>
           <p>In the meantime, check out what's available now:</p>
           <p style="text-align:center;margin:24px 0;">
             <a href="${clientUrl()}/shopping/product-list"
               style="background:#D4AF37;color:#000;padding:12px 28px;border-radius:6px;font-weight:bold;text-decoration:none;display:inline-block;font-size:14px;letter-spacing:1px;text-transform:uppercase;">
               Shop Now
             </a>
           </p>
           <p>Stay rare,<br/><strong>The Saga Elite Team</strong></p>`
        ),
      });
    } catch (emailErr) {
      logger.error("[newsletter] Welcome email failed", { email, error: emailErr.message });
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL;
    if (adminEmail) {
      sendEmail({
        email: adminEmail,
        subject: `New newsletter subscriber: ${email}`,
        html: buildEmailTemplate("New Subscriber", `<p>Email: <strong>${email}</strong></p><p>Source: ${source}</p>`),
      }).catch(() => {});
    }
  }

  res.status(isNew ? 201 : 200).json({
    status: "success",
    message: isNew ? "Subscribed successfully!" : "You're already subscribed.",
  });
});

exports.getSubscribers = catchAsync(async (_req, res) => {
  const subscribers = await Subscriber.find({ isActive: true }).sort({ subscribedAt: -1 });
  res.status(200).json({
    status: "success",
    results: subscribers.length,
    data: { subscribers },
  });
});
