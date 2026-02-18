const mongoose = require("mongoose");
const validator = require("validator")
const bcrypt = require("bcryptjs")



const userSchema = new mongoose.Schema(
    {
        email : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
            validator : [validator.isEmail,"provide a valid email address"]
        },
        password : {
            type : String,
            required : true,
            minlength : 8,
            select : false,
            validate : {
                validator : function(value){
                    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
                },
                message:
                    "Password must contain at least 8 characters, including uppercase, lowercase, number and special character",
            }
        },
        role : {
            type : String,
            enum : ["admin", "superadmin", "user"],
            default : "user"
        },
        
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

        resetPasswordOtpVerified: {
            type: Boolean,
            default: false,
        },

        changePasswordOtp: String,
        changePasswordOtpExpires: Date,

        changePasswordOtpVerified: {
            type: Boolean,
            default: false,
        },
    },{timestamps : true}
)

userSchema.pre("save",async function (next){
    if(!this.isModified("password")){
        return next();
    }

    this.password = await bcrypt.hash(this.password, 12)
    next();
})

userSchema.method.correctedPassword = async function(candidatePassword, userPassword){
    return bcrypt.compare(candidatePassword, userPassword);
}

module.exports = mongoose.model("User",userSchema);


