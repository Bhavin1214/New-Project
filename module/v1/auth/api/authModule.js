import UserModel from "../../../../database/models/userModel.js"
import UserDeviceModel from "../../../../database/models/userDeviceModel.js";
import {
    generateOTP,
    generateToken,
    send_email,
    send_sms,
    sendApiResponse
} from "../../../../middleware/headerVarification.js"
import statusCode from "../../../../config/statusCode.js"
import {
    getEmailTemplate
} from "../../../../config/templetes.js";

const authModule = {
    signup: async (req, res) => {
        try {
            const {
                signupType,
                socialId,
                email,
                phone,
                firstName,
                lastName,
                password
            } = req.body.userData;

            const userDeviceData = req.body.userDeviceData;

            if (signupType === "N") {
                if (!password) {
                    return sendApiResponse(
                        req, res,
                        statusCode.BAD_REQUEST,
                        { keyword: "VALIDATION_ERROR", components: [] }
                    );
                }
            } else if (signupType === "G" || signupType === "F") {
                if (!socialId) {
                    return sendApiResponse(
                        req, res,
                        statusCode.BAD_REQUEST,
                        { keyword: "VALIDATION_ERROR", components: [] }
                    );
                }
            } else {
                return sendApiResponse(
                    req, res,
                    statusCode.BAD_REQUEST,
                    { keyword: "VALIDATION_ERROR", components: [] }
                );
            }

            const userExist = await UserModel.findOne({
                $or: [
                    { email },
                    { phone }
                ]
            });

            if (userExist) {
                if (userExist.email === email) {
                    return sendApiResponse(
                        req, res,
                        statusCode.CONFLICT,
                        { keyword: "EMAIL_ALREADY_EXIST", components: [] }
                    );
                }

                if (userExist.phone === phone) {
                    return sendApiResponse(
                        req, res,
                        statusCode.CONFLICT,
                        { keyword: "PHONE_ALREADY_EXIST", components: [] }
                    );
                }
            }

            const newUser = new UserModel({
                signupType,
                socialId: signupType === "N" ? undefined : socialId,
                email,
                phone,
                profile: { firstName, lastName },
                auth: signupType === "N" ? { password } : undefined
            });

            await newUser.save();

            userDeviceData.userId = newUser._id;
            await UserDeviceModel.create(userDeviceData);

            const token = generateToken(newUser);
            const userResponse = newUser.toObject();

            return sendApiResponse(
                req, res,
                statusCode.OK,
                { keyword: "USER_CREATED", components: [] },
                { userResponse, token }
            );

        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: [] }
            );
        }
    },

    login: async (req, res) => {
        try {
            const { email, phone, password, signupType, socialId } = req.body;
            let user;
            if (signupType === "N") {
                if (!email && !phone) {
                    return sendApiResponse(
                        req, res,
                        statusCode.BAD_REQUEST,
                        { keyword: "MISSING_EMAIL_OR_PHONE", components: [] }
                    );
                }
                user = email
                    ? await UserModel.findOne({ email }).select("+auth.password")
                    : await UserModel.findOne({ phone }).select("+auth.password")
                if (!user) {
                    return sendApiResponse(
                        req, res,
                        statusCode.UNAUTHORIZED,
                        { keyword: "INVALID_CREDENTIALS", components: [] }
                    );
                }
                const isMatch = await user.comparePassword(password)
                if (!isMatch) {
                    return sendApiResponse(
                        req, res,
                        statusCode.UNAUTHORIZED,
                        { keyword: "INVALID_CREDENTIALS", components: [] }
                    );
                }
            }

            if (signupType === "G" || signupType === "F") {
                if (!socialId) {
                    return sendApiResponse(
                        req, res,
                        statusCode.BAD_REQUEST,
                        { keyword: "MISSING_SOCIAL_ID", components: [] }
                    );
                }
                user = await UserModel.findOne({ socialId, signupType });
                if (!user) {
                    return sendApiResponse(
                        req, res,
                        statusCode.NOT_FOUND,
                        { keyword: "USER_NOT_FOUND", components: [] }
                    )
                }
            }
            const token = generateToken(user)
            user.auth.token = token;
            user.auth.lastlogin = new Date();
            user.auth.loginStatus = true;
            await user.save();
            const userResponse = user.toObject();
            delete userResponse.auth;
            return sendApiResponse(
                req, res,
                statusCode.OK,
                { keyword: "LOGIN_SUCCESS", components: [] },
                { userResponse, token }
            );

        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: [] }
            );
        }
    },

    sendOtpEmail: async (req, res) => {
        try {
            const { email } = req.user;
            if (!email) {
                return sendApiResponse(
                    req, res,
                    statusCode.NOT_FOUND,
                    { keyword: "EMAIL_NOT_FOUND", components: [] }
                )
            }
            const user = await UserModel.findOne({ email: email });
            if (!user) {
                return sendApiResponse(
                    req, res,
                    statusCode.NOT_FOUND,
                    { keyword: "USER_NOT_FOUND", components: [] }
                )
            }
            const { OTP, expiresAt } = generateOTP()
            const emailData = {
                subject: "verify Email",
                fullName: user.fullName,
                message: "Please use the following OTP to verify your account:",
                OTP: OTP
            }
            user.auth.OTP = emailData.OTP;
            user.auth.otpExpiry = expiresAt;
            user.save();
            const message = getEmailTemplate(emailData);

            send_email(emailData.subject, user.email, message);
            return sendApiResponse(
                req, res,
                statusCode.OK,
                { keyword: "OTP_SENT_EMAIL", components: [] }
            )
        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: { error } }
            )
        }
    },

    varifyEmail: async (req, res) => {
        try {
            const { OTP } = req.body;
            const userId = req.user.id;

            const user = await UserModel.findById(userId).select("auth.OTP flags");
            if (!user) {
                return sendApiResponse(
                    req, res,
                    statusCode.NOT_FOUND,
                    { keyword: "USER_NOT_FOUND", components: [] }
                )
            }

            if (user.flags.isEmailVerified) {
                return sendApiResponse(
                    req, res,
                    statusCode.BAD_REQUEST,
                    { keyword: "EMAIL_ALREADY_VERIFYED", components: {} }
                )
            }

            if (user.auth.OTP !== OTP) {
                return sendApiResponse(
                    req, res,
                    statusCode.BAD_REQUEST,
                    { keyword: "INVALID_OTP", components: [] }
                );
            }

            if (user.auth.otpExpiry < new Date()) {
                return sendApiResponse(
                    req, res,
                    statusCode.BAD_REQUEST,
                    { keyword: "OTP_EXPIRED", components: [] }
                );
            }

            user.flags.isEmailVerified = true

            if (user.flags.isEmailVerified && user.flags.isPhoneVerified) {
                user.flags.isProfileComplete = true;
                user.status = "active";
            }

            user.auth.OTP = null;
            user.auth.otpExpiry = null;
            await user.save();

            return sendApiResponse(
                req, res,
                statusCode.OK,
                { keyword: "OTP_VERIFIED" }
            );

        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: { error } }
            )
        }
    },

    sendOtpPhone: async (req, res) => {
        try {
            const { email } = req.user;
            const user = await UserModel.findOne({ email: email });
            if (!user) {
                return sendApiResponse(
                    req, res,
                    statusCode.NOT_FOUND,
                    { keyword: "USER_NOT_FOUND", components: [] }
                )
            }
            const { OTP, expiresAt } = generateOTP()
            const phone = user.phone;
            user.auth.OTP = OTP;
            user.auth.otpExpiry = expiresAt;
            user.save();

            const message = `verify your account using this OTP:${OTP}`
            send_sms(phone, message);

            return sendApiResponse(
                req, res,
                statusCode.OK,
                { keyword: "OTP_SEND_NUMBER", components: {} }
            )
        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: { error } }
            )
        }
    },

    varifyPhone: async (req, res) => {
        try {
            const { OTP } = req.body;
            const userId = req.user.id;

            const user = await UserModel.findById(userId).select("auth.OTP flags");
            if (!user) {
                return sendApiResponse(
                    req, res,
                    statusCode.NOT_FOUND,
                    { keyword: "USER_NOT_FOUND", components: [] }
                )
            }

            if (user.flags.isPhoneVerified) {
                return sendApiResponse(
                    req, res,
                    statusCode.BAD_REQUEST,
                    { keyword: "PHONE_ALREADY_VERIFYED", components: {} }
                )
            }

            if (user.auth.OTP !== OTP) {
                return sendApiResponse(
                    req, res,
                    statusCode.BAD_REQUEST,
                    { keyword: "INVALID_OTP", components: [] }
                );
            }

            if (user.auth.otpExpiry < new Date()) {
                return sendApiResponse(
                    req, res,
                    statusCode.BAD_REQUEST,
                    { keyword: "OTP_EXPIRED", components: [] }
                );
            }

            user.flags.isPhoneVerified = true

            if (user.flags.isEmailVerified && user.flags.isPhoneVerified) {
                user.flags.isProfileComplete = true;
                user.status = "active";
            }

            user.auth.OTP = null;
            user.auth.otpExpiry = null;
            await user.save();

            return sendApiResponse(
                req, res,
                statusCode.OK,
                { keyword: "OTP_VERIFIED" }
            );
        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: { error } }
            )
        }
    },

    updateProfile: async (req, res) => {
        try {
            const {
                firstName,
                lastName,
                dob,
                gender,
                bio,
                avatarUrl
            } = req.body

            const existUser = await UserModel.findByIdAndUpdate(req.user.id, {
                profile: {
                    firstName,
                    lastName,
                    dob,
                    gender,
                    bio,
                    avatarUrl
                }
            }, { new: true });
            if (!existUser) {
                return sendApiResponse(
                    req, res,
                    statusCode.NOT_FOUND,
                    { keyword: "USER_NOT_FOUND", components: [] }
                )
            }
            const responese = existUser.toObject();
            delete responese.auth;
            return sendApiResponse(
                req, res,
                statusCode.OK,
                { keyword: "UPDATE_SUCCESS", components: [] },
                responese
            )
        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: { error } }
            )
        }
    },

    logout: async (req, res) => {
        try {
            const userId = req.user.id;
            const user = await UserModel.findById(userId).select("auth.token");
            if (!user) {
                return sendApiResponse(
                    req, res,
                    statusCode.NOT_FOUND,
                    { keyword: "USER_NOT_FOUND", components: {} }
                )
            }

            user.auth.loginStatus = false,
                user.auth.token = null

            await user.save();
            sendApiResponse(
                req, res,
                statusCode.OK,
                { keyword: "LOGOUT_SUCCESS", components: {} }
            )
        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: { error } }
            )
        }
    },

    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body
            if (!email) {
                return sendApiResponse(
                    req, res,
                    statusCode.NOT_FOUND,
                    { keyword: "EMAIL_NOT_FOUND", components: [] }
                )
            }
            const user = await UserModel.findOne({ email: email });
            if (!user) {
                return sendApiResponse(
                    req, res,
                    statusCode.NOT_FOUND,
                    { keyword: "USER_NOT_FOUND", components: [] }
                )
            }
            const token = generateToken(user)
            const emailData = {
                subject: "forgot password request",
                fullName: user.fullName,
                message: "Please use the following token to reset your password:",
                token: token
            }
            user.auth.passwordResetToken = emailData.token
            user.auth.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
            user.save();
            const message = getEmailTemplate(emailData);

            send_email(emailData.subject, user.email, message);
            return sendApiResponse(
                req, res,
                statusCode.OK,
                { keyword: "SENT_EMAIL", components: [] }
            )
        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: [] }
            )
        }
    },

    resetPassword: async (req, res) => {
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
        const token = authHeader.split(" ")[1];

        const { newPassword } = req.body;

        const userId = req.user.id;
        const user = await UserModel.findById(userId).select("+auth.password +auth.passwordResetToken")

        if (!user) {
            return sendApiResponse(
                req, res,
                statusCode.NOT_FOUND,
                { keyword: "USER_NOT_FOUND", components: {} }
            )
        }

        if (token !== user.auth.passwordResetToken) {
            return sendApiResponse(
                req, res,
                statusCode.NOT_FOUND,
                { keyword: "INVALID_RESETPASS_TOKEN", components: {} }
            )
        }

        if (user.auth.passwordResetExpires < new Date()) {
            return sendApiResponse(
                req, res,
                statusCode.NOT_FOUND,
                { keyword: "RESETPASS_TOKEN_EXPIRED", components: {} }
            )
        }

        user.auth.password = newPassword;
        user.auth.passwordResetExpires = null
        user.auth.passwordResetToken = null
        await user.save()

        return sendApiResponse(
            req,res,
            statusCode.OK,
            {keyword:"PASS_RESET_SUCCESS",components:{}}
        )
    },


}

export default authModule;
