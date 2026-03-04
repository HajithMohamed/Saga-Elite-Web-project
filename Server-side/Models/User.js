const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Provide a valid email address"],
    },

    password: {
      type: String,
      minlength: 8,
      select: false,
      validate: {
        validator: function (value) {
          if (this.provider === "google") return true;
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
        },
        message:
          "Password must contain at least 8 characters, including uppercase, lowercase, number and special character",
      },
    },

    role: {
      type: String,
      enum: ["admin", "superadmin", "user"],
      default: "user",
    },

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    profilePicture: String,

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    otp: String,
    otpExpires: Date,

    resetPasswordOtp: String,
    resetPasswordOtpExpires: Date,
  },
  { timestamps: true }
);

// ── Fixed pre-save hook (Mongoose 9.x style) ──
userSchema.pre("save", async function () {
  // Skip if no password or not modified
  if (!this.password || !this.isModified("password")) {
    return; // ← just return — Mongoose continues automatically
  }

  // Hash the password
  this.password = await bcrypt.hash(this.password, 12);
  // No need for next() — async function resolves → save proceeds
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// userSchema.index({ googleId: 1 }); // Removed duplicate index

module.exports = mongoose.model("User", userSchema);