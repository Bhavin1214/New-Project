import express from "express"
import authController from "./authController.js"

const router = express.Router();

router.post("/signup",authController.signup);
router.post("/login",authController.login);
router.put("/updateProfile",authController.updateProfile);
router.get("/sendOtpEmailVerify",authController.sendOtpEmailVerify)
router.post("/varifyEmail",authController.varifyEmail)
router.get("/sendOtpPhone",authController.sendOtpPhone)
router.post("/varifyPhone",authController.varifyPhone)
router.get("/logout",authController.logout)
router.post("/forgotPassword",authController.forgotPassword)
router.post("/resetPassword",authController.resetPassword)

export default router;  