const ContactInquiry = require("../Models/ContactInquiry");
const SiteConfig = require("../Models/SiteConfig");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const filterObj = require("../Utils/filter-object");
const sendEmail = require("../Utils/send-mail");
const buildEmailTemplate = require("../Utils/email-template");
const logger = require("../Utils/logger");

const DEFAULT_FORM_SETTINGS = {
  enabled: true,
  recipientEmail: "",
  autoResponseSubject: "We received your message",
  autoResponseBody:
    "Thanks for reaching out. Our team has received your message and will reply shortly.",
};

const CONFIG_KEYS = [
  "contact_form_settings",
  "shop_support_email",
  "shop_contact_email",
];

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char] || char;
  });

const nl2br = (value = "") => escapeHtml(value).replace(/\n/g, "<br />");

const normalizeRecipientEmails = (value = "") =>
  String(value)
    .split(/[;,]/)
    .map((email) => email.trim())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    .join(",");

const loadContactMailSettings = async () => {
  const docs = await SiteConfig.find({ key: { $in: CONFIG_KEYS } }).lean();
  const config = {};
  docs.forEach((doc) => {
    config[doc.key] = doc.value;
  });

  const formSettings = {
    ...DEFAULT_FORM_SETTINGS,
    ...(config.contact_form_settings || {}),
  };

  const recipientEmail =
    normalizeRecipientEmails(formSettings.recipientEmail) ||
    normalizeRecipientEmails(config.shop_support_email) ||
    normalizeRecipientEmails(config.shop_contact_email) ||
    normalizeRecipientEmails(process.env.ADMIN_EMAIL || process.env.EMAIL);

  return { formSettings, recipientEmail };
};

const submitContactInquiry = catchAsync(async (req, res, next) => {
  const payload = filterObj(req.body, "name", "email", "subject", "message");
  const { name, email, subject, message } = payload;

  if (!name || !email || !subject || !message) {
    return next(new AppError("All fields are required.", 400));
  }

  if (message.length > 500) {
    return next(new AppError("Message must be 500 characters or fewer.", 400));
  }

  const { formSettings, recipientEmail } = await loadContactMailSettings();
  if (formSettings.enabled === false) {
    return next(new AppError("The contact form is currently unavailable.", 503));
  }

  const inquiry = await ContactInquiry.create({
    ...payload,
    ipAddress: req.ip,
  });

  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

  try {
    if (recipientEmail) {
      await sendEmail({
        email: recipientEmail,
        subject: `New contact inquiry: ${subject}`,
        replyTo: email,
        html: buildEmailTemplate(
          "New Contact Inquiry",
          `<p><strong>Name:</strong> ${escapeHtml(name)}</p>
           <p><strong>Email:</strong> ${escapeHtml(email)}</p>
           <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
           <p><strong>Message:</strong><br />${safeMessage}</p>
           <p><strong>IP:</strong> ${escapeHtml(req.ip || "Unknown")}</p>`
        ),
      });
    } else {
      logger.warn("Contact inquiry saved without admin email recipient", {
        inquiryId: inquiry._id,
      });
    }
  } catch (error) {
    logger.error("Contact admin email delivery failed", {
      inquiryId: inquiry._id,
      error: error.message,
    });
  }

  try {
    const autoResponseBody = nl2br(formSettings.autoResponseBody);
    await sendEmail({
      email,
      subject: formSettings.autoResponseSubject || DEFAULT_FORM_SETTINGS.autoResponseSubject,
      html: buildEmailTemplate(
        "Thanks for contacting Saga Elite",
        `<p>Hi ${escapeHtml(name)},</p>
         <p>${autoResponseBody}</p>
         <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
         <p><strong>Your message:</strong><br />${safeMessage}</p>
         <p>For urgent matters, reply to this email with additional details.</p>`
      ),
    });
  } catch (error) {
    logger.error("Contact auto-response email delivery failed", {
      inquiryId: inquiry._id,
      error: error.message,
    });
  }

  return res.status(201).json({
    status: "success",
    message: "Your message has been received. We will respond shortly.",
    data: { inquiryId: inquiry._id },
  });
});

const getContactInquiries = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const inquiries = await ContactInquiry.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: inquiries.length,
    data: { inquiries },
  });
});

const updateContactInquiry = catchAsync(async (req, res, next) => {
  const updates = filterObj(req.body, "status", "respondedAt");

  if (!Object.keys(updates).length) {
    return next(new AppError("No updates provided.", 400));
  }

  if (updates.status === "resolved" && !updates.respondedAt) {
    updates.respondedAt = new Date();
  }

  const inquiry = await ContactInquiry.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );

  if (!inquiry) {
    return next(new AppError("Contact inquiry not found.", 404));
  }

  res.status(200).json({
    status: "success",
    data: { inquiry },
  });
});

module.exports = {
  submitContactInquiry,
  getContactInquiries,
  updateContactInquiry,
};
