import Joi from "joi";

export const signupValidation = Joi.object({
    userData: Joi.object({
        signupType: Joi.string()
            .valid("N", "G", "F")
            .required()
            .messages({
                "any.only": "signupType must be 'N', 'G', or 'F'",
                "string.empty": "signupType is required"
            }),
        socialId: Joi.alternatives()
            .conditional('signupType', {
                is: 'N',
                then: Joi.forbidden().messages({
                    "any.unknown": "Social ID should not be provided for normal signup"
                }),
                otherwise: Joi.string().required().messages({
                    "string.empty": "Social ID is required for social signup"
                })
            }),
        email: Joi.string().email().required().messages({
            "string.empty": "Email is required",
            "string.email": "Invalid email format"
        }),
        phone: Joi.string().pattern(/^\+?\d{10,15}$/).required().messages({
            "string.pattern.base": "Phone number must be valid"
        }),
        firstName: Joi.string().trim().required().messages({
            "string.empty": "First name is required"
        }),
        lastName: Joi.string().trim().required().messages({
            "string.empty": "Last name is required"
        }),
        password: Joi.alternatives()
            .conditional('signupType', {
                is: 'N',
                then: Joi.string().min(6).required().messages({
                    "string.empty": "Password is required",
                    "string.min": "Password must be at least 6 characters"
                }),
                otherwise: Joi.forbidden().messages({
                    "any.unknown": "Password should not be provided for social signup"
                })
            })
    }).required().messages({
        "object.base": "userData must be an object",
        "any.required": "userData is required"
    }),

    userDeviceData: Joi.object({
        deviceType: Joi.string().required().messages({ "string.empty": "Device type is required" }),
        deviceToken: Joi.string().required().messages({ "string.empty": "Device token is required" }),
        deviceName: Joi.string().required().messages({ "string.empty": "Device name is required" }),
        uuid: Joi.string().required().messages({ "string.empty": "UUID is required" }),
        osVersion: Joi.string().required().messages({ "string.empty": "OS version is required" }),
        modelName: Joi.string().required().messages({ "string.empty": "Model name is required" }),
        isActive: Joi.boolean().optional(),
        isDelete: Joi.boolean().optional()
    }).required().messages({
        "object.base": "userDeviceData must be an object",
        "any.required": "userDeviceData is required"
    })
});

export const loginValidation = Joi.object({
    signupType: Joi.string()
        .valid("N", "G", "F")
        .required()
        .messages({
            "any.only": "signupType must be 'N', 'G', or 'F'",
            "string.empty": "signupType is required",
        }),

    email: Joi.string()
        .email()
        .messages({
            "string.email": "Invalid email format",
        }),

    phone: Joi.string()
        .pattern(/^\+?\d{10,15}$/)
        .messages({
            "string.pattern.base": "Phone number must be valid",
        }),

    password: Joi.string()
        .min(6)
        .when("signupType", {
            is: "N",
            then: Joi.required().messages({
                "string.empty": "Password is required for normal login",
                "string.min": "Password must be at least 6 characters",
            }),
            otherwise: Joi.forbidden(),
        }),

    socialId: Joi.string()
        .when("signupType", {
            is: Joi.valid("G", "F"),
            then: Joi.required().messages({
                "string.empty": "Social ID is required for social login",
            }),
            otherwise: Joi.forbidden(),
        }),
})
    .when(Joi.object({ signupType: Joi.valid("N") }).unknown(), {
        then: Joi.object().xor("email", "phone").messages({
            "object.missing": "Either email or phone is required for normal login",
            "object.xor": "Provide either email or phone, not both"
        }),
    });

export const updateProfileValidation = Joi.object({
    firstName: Joi.string().trim().optional().messages({
        "string.empty": "First name cannot be empty"
    }),
    lastName: Joi.string().trim().optional().messages({
        "string.empty": "Last name cannot be empty"
    }),
    dob: Joi.date().iso().optional().messages({
        "date.base": "Date of birth must be a valid date",
        "date.format": "Date of birth must be in ISO format (YYYY-MM-DD)"
    }),
    gender: Joi.string().valid("male", "female", "other").optional().messages({
        "any.only": "Gender must be male, female, or other"
    }),
    bio: Joi.string().max(300).optional().messages({
        "string.max": "Bio cannot exceed 300 characters"
    }),
    avatarUrl: Joi.string().uri().optional().messages({
        "string.uri": "Avatar must be a valid URL"
    })
}).min(1).messages({
    "object.min": "At least one field must be provided to update"
});

export const otpValidation = Joi.object({
    OTP: Joi.string()
        .pattern(/^\d{6}$/)
        .required()
        .messages({
            "string.empty": "OTP is required",
            "string.pattern.base": "OTP must be a 6-digit number"
        })
});

export const forgotPasswordValidation = Joi.object({
    email: Joi.string()
        .email()
        .messages({
            "string.email": "Invalid email format",
        }),
})

export const resetPasswordValidation = Joi.object({
    newPassword: Joi.string()
        .min(6)
        .required()
        .messages({
            "string.empty": "Password is required",
            "string.min": "Password must be at least 6 characters"
        })
})

export const changePasswordValidation = Joi.object({
    oldPassword: Joi.string()
        .min(6)
        .required()
        .messages({
            "string.empty": "oldPassword is required",
            "string.min": "oldPassword must be at least 6 characters"
        }),

    newPassword: Joi.string()
        .min(6)
        .required()
        .messages({
            "string.empty": "newPassword is required",
            "string.min": "newPassword must be at least 6 characters"
        })
})