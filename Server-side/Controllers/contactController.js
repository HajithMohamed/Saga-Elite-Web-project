const ContactInquiry = require("../Models/ContactInquiry");
const catchAsync = require("../Utils/catchAsync");
const AppError = require("../Utils/appError");
const filterObj = require("../Utils/filter-object");
const sendEmail = require("../Utils/send-mail");
const buildEmailTemplate = require("../Utils/email-template");
const logger = require("../Utils/logger");

const escapeHtml = (value = "") =>
  value.replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char] || char;
  });

const submitContactInquiry = catchAsync(async (req, res, next) => {
  const payload = filterObj(req.body, "name", "email", "subject", "message");
  const { name, email, subject, message } = payload;

  if (!name || !email || !subject || !message) {
    return next(new AppError("All fields are required.", 400));
  }

  if (message.length > 500) {
    return next(new AppError("Message must be 500 characters or fewer.", 400));
  }

  const inquiry = await ContactInquiry.create({
    ...payload,
    ipAddress: req.ip,
  });

  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL;

  try {
    if (adminEmail) {
      await sendEmail({
        email: adminEmail,
        subject: `New contact inquiry: ${subject}`,
        html: buildEmailTemplate(
          "New Contact Inquiry",
          `<p><strong>Name:</strong> ${escapeHtml(name)}</p>
           <p><strong>Email:</strong> ${escapeHtml(email)}</p>
           <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
           <p><strong>Message:</strong><br />${safeMessage}</p>
           <p><strong>IP:</strong> ${escapeHtml(req.ip || "Unknown")}</p>`
        ),
      });
    }

    await sendEmail({
      email,
      subject: "We received your message",
      html: buildEmailTemplate(
        "Thanks for contacting Saga Elite",
        `<p>Hi ${escapeHtml(name)},</p>
         <p>Thank you for reaching out. Our team has received your message and will reply shortly.</p>
         <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
         <p><strong>Your message:</strong><br />${safeMessage}</p>
         <p>For urgent matters, reply to this email with additional details.</p>`
      ),
    });
  } catch (error) {
    logger.error("Contact email delivery failed", { error: error.message });
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
