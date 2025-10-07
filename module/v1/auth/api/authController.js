import authModule from "./authModule.js";
import {
    changePasswordValidation,
    forgotPasswordValidation,
    loginValidation,
    otpValidation,
    resetPasswordValidation,
    signupValidation,
    updateProfileValidation
} from "../validationRules.js"
import {
    checkValidationRules,
    decryption,
    extractHeaderLanguage,
    sendApiResponse,
    validateHeaderToken
} from "../../../../middleware/headerVarification.js"
import statusCode from "../../../../config/statusCode.js";

const authController = {

    signup: (req, res) => {
        try {
            extractHeaderLanguage(req, (req) => {
                decryption(req, (req) => {
                    const validate = checkValidationRules(req.body, signupValidation)
                    if (validate.valid) {
                        authModule.signup(req, res);
                    } else {
                        return sendApiResponse(
                            req, res,
                            statusCode.BAD_REQUEST,
                            { keyword: "VALIDATION_ERROR", components: [] },
                            validate.message
                        )
                    }
                })
            })
        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: [] }
            )
        }
    },

    login: (req, res) => {
        try {
            extractHeaderLanguage(req, (req) => {
                decryption(req, (req) => {
                    const validate = checkValidationRules(req.body, loginValidation)
                    if (validate.valid) {
                        authModule.login(req, res);
                    } else {
                        return sendApiResponse(
                            req, res,
                            statusCode.BAD_REQUEST,
                            { keyword: "VALIDATION_ERROR", components: [] },
                            validate.message
                        )
                    }
                })
            })
        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: [] }
            )
        }
    },

    sendOtpEmailVerify: (req, res) => {
        try {
            extractHeaderLanguage(req, async (req) => {
                req.user = await validateHeaderToken(req)
                if (!req.user) {
                    return sendApiResponse(
                        req, res,
                        statusCode.UNAUTHORIZED,
                        { keyword: "TOKEN_INVALID", components: [] }
                    )
                }
                authModule.sendOtpEmail(req, res)
            })
        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: [] }
            )
        }
    },

    varifyEmail: (req, res) => {
        try {
            extractHeaderLanguage(req, async (req) => {
                req.user = await validateHeaderToken(req);
                if (!req.user) {
                    return sendApiResponse(
                        req, res,
                        statusCode.UNAUTHORIZED,
                        { keyword: "TOKEN_INVALID", components: [] }
                    )
                }
                decryption(req, (req) => {
                    const validate = checkValidationRules(req.body, otpValidation)
                    if (validate.valid) {
                        authModule.varifyEmail(req, res);
                    } else {
                        return sendApiResponse(
                            req, res,
                            statusCode.BAD_REQUEST,
                            { keyword: "VALIDATION_ERROR", components: [] },
                            validate.message
                        )
                    }
                })
            })
        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: { error } }
            )
        }
    },

    sendOtpPhone: (req, res) => {
        try {
            extractHeaderLanguage(req, async (req) => {
                req.user = await validateHeaderToken(req)
                if (!req.user) {
                    return sendApiResponse(
                        req, res,
                        statusCode.UNAUTHORIZED,
                        { keyword: "TOKEN_INVALID", components: [] }
                    )
                }

                authModule.sendOtpPhone(req, res)
            })
        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: { error } }
            )
        }
    },

    varifyPhone: (req, res) => {
        try {
            extractHeaderLanguage(req, async (req) => {
                req.user = await validateHeaderToken(req);
                if (!req.user) {
                    return sendApiResponse(
                        req, res,
                        statusCode.UNAUTHORIZED,
                        { keyword: "TOKEN_INVALID", components: [] }
                    )
                }
                decryption(req, (req) => {
                    const validate = checkValidationRules(req.body, otpValidation)
                    if (validate.valid) {
                        authModule.varifyPhone(req, res);
                    } else {
                        return sendApiResponse(
                            req, res,
                            statusCode.BAD_REQUEST,
                            { keyword: "VALIDATION_ERROR", components: [] },
                            validate.message
                        )
                    }
                })
            })
        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: { error } }
            )
        }
    },

    updateProfile: (req, res) => {
        try {
            extractHeaderLanguage(req, async (req) => {
                req.user = await validateHeaderToken(req)

                if (!req.user) {
                    return sendApiResponse(
                        req, res,
                        statusCode.UNAUTHORIZED,
                        { keyword: "TOKEN_INVALID", components: [] }
                    )
                }
                decryption(req, (req) => {
                    const validate = checkValidationRules(req.body, updateProfileValidation);
                    if (validate.valid) {
                        authModule.updateProfile(req, res)
                    } else {
                        return sendApiResponse(
                            req, res,
                            statusCode.BAD_REQUEST,
                            { keyword: "VALIDATION_ERROR", components: [] },
                            validate.message
                        )
                    }
                })
            })
        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: [] }
            )
        }
    },

    logout: (req, res) => {
        try {
            extractHeaderLanguage(req, async (req) => {
                req.user = await validateHeaderToken(req)
                if (!req.user) {
                    return sendApiResponse(
                        req, res,
                        statusCode.UNAUTHORIZED,
                        { keyword: "TOKEN_INVALID", components: [] }
                    )
                }

                authModule.logout(req, res);
            })
        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: [] }
            )
        }
    },

    forgotPassword: (req, res) => {
        try {
            extractHeaderLanguage(req, async (req) => {
                decryption(req, (req) => {
                    const validate = checkValidationRules(req.body, forgotPasswordValidation);
                    if (validate.valid) {
                        authModule.forgotPassword(req, res)
                    } else {
                        return sendApiResponse(
                            req, res,
                            statusCode.BAD_REQUEST,
                            { keyword: "VALIDATION_ERROR", components: [] },
                            validate.message
                        )
                    }
                })
            })
        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: [] }
            )
        }
    },

    resetPassword: (req, res) => {
        try {
            extractHeaderLanguage(req, async (req) => {
                req.user = await validateHeaderToken(req)

                if (!req.user) {
                    return sendApiResponse(
                        req, res,
                        statusCode.UNAUTHORIZED,
                        { keyword: "TOKEN_INVALID", components: [] }
                    )
                }
                decryption(req, (req) => {
                    const validate = checkValidationRules(req.body, resetPasswordValidation);
                    if (validate.valid) {
                        authModule.resetPassword(req, res)
                    } else {
                        return sendApiResponse(
                            req, res,
                            statusCode.BAD_REQUEST,
                            { keyword: "VALIDATION_ERROR", components: [] },
                            validate.message
                        )
                    }
                })
            })
        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: [] }
            )
        }
    },

    changePassword: (req, res) => {
        try {
            extractHeaderLanguage(req, async (req) => {
                req.user = await validateHeaderToken(req);
                if (!req.user) {
                    return sendApiResponse(
                        req, res,
                        statusCode.UNAUTHORIZED,
                        { keyword: "TOKEN_INVALID", components: [] }
                    )
                }

                decryption(req, (req) => {
                    const validate = checkValidationRules(req.body, changePasswordValidation);

                    if (validate.valid) {
                        authModule.changePassword(req, res)
                    } else {
                        return sendApiResponse(
                            req, res,
                            statusCode.BAD_REQUEST,
                            { keyword: "VALIDATION_ERROR", components: [] },
                            validate.message
                        )
                    }
                })
            })

        } catch (error) {
            console.log(error);
            return sendApiResponse(
                req, res,
                statusCode.INTERNAL_SERVER_ERROR,
                { keyword: "INTERNAL_SERVER_ERROR", components: { error } }
            )
        }
    }


}

export default authController