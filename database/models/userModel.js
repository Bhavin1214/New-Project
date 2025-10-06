import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        unique: true,
        trim: true
    },

    signupType: {
        type: String,
        enum: ['N', 'G', 'F'],
        default: 'N'
    },

    socialId: {
        type: String,
        sparse: true 
    },

    profile: {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        dob: { type: Date },
        gender: { type: String, enum: ['male', 'female', 'other'] },
        bio: { type: String },
        avatarUrl: { type: String }
    },

    auth: {
        password: { type: String, minlength: 6, select: false },
        passwordResetToken: { type: String, select: false },
        passwordResetExpires: Date,
        passwordChangedAt: Date,
        OTP: { type: String, select: false },
        otpExpiry: Date,
        token: { type: String, select: false },
        loginStatus:{type:String, default:false},
        lastlogin:Date,
    },

    flags: {
        isProfileComplete: { type: Boolean, default: false },
        isEmailVerified: { type: Boolean, default: false },
        isPhoneVerified: { type: Boolean, default: false }
    },

    status: {
        type: String,
        enum: ['active', 'suspended', 'deleted', 'pending'],
        default: 'pending'
    },

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

userSchema.virtual("addresses", {
    ref: "Address",
    localField: "_id",
    foreignField: "userId",
});

userSchema.virtual('fullName').get(function() {
    return `${this.profile.firstName} ${this.profile.lastName}`;
});

userSchema.pre("save", async function(next) {
    if (this.signupType !== 'N') return next();
    if (!this.isModified("auth.password")) return next();

    this.auth.password = await bcrypt.hash(
        this.auth.password,12
    );
    this.auth.passwordChangedAt = Date.now() - 1000;
    next();
});

userSchema.methods.comparePassword = async function(password) {
    if (this.signupType !== 'N') return false;
    
    return bcrypt.compare(password, this.auth.password);
};

const userModel = mongoose.model("User", userSchema);
export default userModel;

