import CryptLib from "cryptlib"
import jwt from "jsonwebtoken"
import localizify from "localizify";
import english from "../language/en.js";
import hindi from "../language/hi.js";
import gujarati from "../language/gu.js";
import nodemailer from 'nodemailer';
import mongoose from "mongoose";
import twilio from "twilio"


import GLOBLES from "../config/constants.js"
import userModel from "../database/models/userModel.js";



export const checkValidationRules = (req, rules) => {
    try {
        const { error, value } = rules.validate(req, { abortEarly: false })
        if (error) {
            const messages = error.details.map(d => d.message);
            return { valid: false, message: messages }
        } else {
            return { valid: true, value }
        }
    } catch (error) {
        console.error(error);
    }
}

const { default: local } = localizify;
const { t } = localizify;
const dictionaries = {
    en: english,
    hi: hindi,
    gu: gujarati
};
export const getMessage = (requestLanguage, keywords, components, callback) => {
    try {
        const lang = requestLanguage && dictionaries[requestLanguage] ? requestLanguage : "en";
        const dictionary = dictionaries[requestLanguage]

        local.add(requestLanguage, dictionary).setLocale(requestLanguage);

        const returnMessage = t(keywords, components);
        callback(returnMessage);
    } catch (error) {
        console.error(error);
    }
};

export const extractHeaderLanguage = (req, callback) => {
    const language = req.headers['accept-language'] && req.headers['accept-language'].trim() !== ''
        ? req.headers['accept-language'].trim()
        : 'en';

    req.lang = language;

    if (typeof callback === 'function') {
        callback(req);
    }
};

const shaKey = CryptLib.getHashSha256(GLOBLES.KEY, 32);
export const encryption = (req, callback) => {
    try {
        var response;
        response = CryptLib.encrypt(
            JSON.stringify(req, (_, v) => (typeof v === 'bigint' ? parseInt(v) : v)),
            shaKey,
            GLOBLES.IV
        )
        callback(response.toString());
    } catch (error) {
        console.error(error);
        callback({});
    }
}

export const decryption = (req, callback) => {
    try {
        let request
        if (req.body != undefined && Object.keys(req.body).length != 0) {
            request = JSON.parse(CryptLib.decrypt(req.body, shaKey, GLOBLES.IV));
            req.body = request
            callback(req);
        } else {
            req.body = {}
            callback(req);
        }
    } catch (error) {
        console.error(error);
        req.body = {};
        callback(req);
    }
}

export const decString = (data) => {
    try {
        if (!data) return null;
        return CryptLib.decrypt(data, shaKey, GLOBLES.IV);
    } catch (err1) {
        try {
            let normalized = String(data).trim();
            try { normalized = decodeURIComponent(normalized); } catch (_) { }
            normalized = normalized.replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/');
            const pad = normalized.length % 4;
            if (pad) normalized += '='.repeat(4 - pad);
            return CryptLib.decrypt(normalized, shaKey, GLOBLES.IV);
        } catch (err2) {
            console.log("dec string error--", err2);
            return null;
        }
    }
};

export const sendApiResponse = (req, res, statusCode, responseMessage, responseData = null) => {
    try {
        let formedMsg;
        getMessage(req.lang, responseMessage.keyword, responseMessage.components, (msg) => {
            formedMsg = msg;
        })

        let responsePayload = {
            Code: statusCode,
            message: formedMsg
        }
        if (responseData !== null) {
            responsePayload.data = responseData;
        }
        encryption(responsePayload, (response) => {
            return res.status(statusCode).send(response)
        })
    } catch (error) {
        console.error(error);
    }
}

export const validateHeaderToken = async (req) => {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

        const token = authHeader.split(" ")[1];
        if (!token) return null;

        const decoded = jwt.verify(token, GLOBLES.JWT_SECRET);

        if (!isValidObjectId(decoded.id)) return null;

        const user = await userModel.findById(decoded.id)
            .select("auth.passwordChangedAt status auth.token auth.passwordResetToken");

        if (user.auth.token !== token) {
            if (user.auth.passwordResetToken !== token) {
                return null;
            }
        }
        if (!user || user.status === "deleted" || user.status === "suspended") {
            return null;
        }

        if (decoded.signupType === "N" && user.auth.passwordChangedAt) {
            const passwordChangedAtSec = parseInt(user.auth.passwordChangedAt.getTime() / 1000);
            if (decoded.iat < passwordChangedAtSec) {
                return null;
            }
        }

        return decoded;

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            console.warn("JWT expired:", error.message);
            return null;
        }
        if (error.name === "JsonWebTokenError") {
            console.warn("Invalid JWT:", error.message);
            return null;
        }
        console.error("Token validation error:", error.message);
        return null;
    }
};


export const send_email = (sub, toEmail, message) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: GLOBLES.EMAIL_ID,
                pass: GLOBLES.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: GLOBLES.EMAIL_ID,
            to: toEmail,
            subject: sub,
            html: message,
        };

        return transporter.sendMail(mailOptions);
    } catch (error) {
        return error;
    }
}

export const generateToken = (data) => {
    return jwt.sign(
        {
            id: data._id,
            email: data.email,
            signupType: data.signupType || "N",
            isProfileComplete: data.flags?.isProfileComplete || false
        },
        GLOBLES.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

export const generateOTP = (length = 6) => {
    const OTP = Math.floor(10 ** (length - 1) + Math.random() * 9 * 10 ** (length - 1)).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    return { OTP, expiresAt }
}

export const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const accountSid = GLOBLES.YOUR_ACCOUNT_SID
const authToken = GLOBLES.YOUR_AUTH_TOKEN
const twilioNumber = GLOBLES.TWILIONUMBER
const client = twilio(accountSid, authToken);
export const send_sms = async (to, message) => {
    try {
        const response = await client.messages.create({
            body: message,
            from: twilioNumber,
            to: to,
        })
        return response.sid;
    } catch (error) {
        return error
    }
}