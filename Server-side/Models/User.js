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
        validate: [validator.isEmail, "Provide a valid email address"]
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
        }
    },

    role: {
        type: String,
        enum: ["admin", "superadmin", "user"],
        default: "user"
    },

    provider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },

    googleId: {
        type: String,
        unique: true,
        sparse: true
    },

    profilePicture: String,

    isVerified: {
        type: Boolean,
        default: false
    },

    isActive: {
        type: Boolean,
        default: true
    },

    otp: String,
    otpExpires: Date,

    resetPasswordOtp: String,
    resetPasswordOtpExpires: Date,
    resetPasswordOtpVerified: {
        type: Boolean,
        default: false
    },

    changePasswordOtp: String,
    changePasswordOtpExpires: Date,
    changePasswordOtpVerified: {
        type: Boolean,
        default: false
    }

},
{ timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.password) return next();
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.index({ googleId: 1 });

module.exports = mongoose.model("User", userSchema);