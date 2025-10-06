import dotenv from "dotenv"
dotenv.config({ quiet: true })

const GLOBLES = {
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI,
    KEY: process.env.KEY,
    IV: process.env.IV,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    EMAIL_ID: process.env.EMAIL_ID,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    YOUR_ACCOUNT_SID: process.env.YOUR_ACCOUNT_SID,
    YOUR_AUTH_TOKEN: process.env.YOUR_AUTH_TOKEN,
    TWILIONUMBER: process.env.TWILIONUMBER,
}

export default GLOBLES