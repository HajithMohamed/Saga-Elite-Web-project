const mongoose = require("mongoose");
const validator = require("validator");

const contactInquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, "Provide a valid email address"],
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    trim: true,
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    maxlength: [500, "Message must be 500 characters or fewer"],
    trim: true,
  },
  status: {
    type: String,
    enum: ["new", "read", "resolved"],
    default: "new",
  },
  ipAddress: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  respondedAt: Date,
});

const ContactInquiry = mongoose.model("ContactInquiry", contactInquirySchema);

module.exports = ContactInquiry;
