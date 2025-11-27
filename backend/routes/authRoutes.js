import express from "express";
import { registerUser, loginUser, refreshToken, logoutUser } from "../controllers/authController.js";
import { registerValidation, loginValidation } from '../utils/validation.js';

const router = express.Router();

router.post("/register", registerValidation, registerUser);
router.post("/login", loginValidation, loginUser);
router.post("/refresh", refreshToken);
router.post("/logout", logoutUser);

export default router;
