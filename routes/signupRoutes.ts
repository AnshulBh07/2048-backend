import express from "express";
import {
  addUser,
  resendOTP,
  verifyUser,
} from "../controllers/signupControllers";
import rateLimit from "express-rate-limit";
const router = express.Router();

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "too many signup attemps, please try again later" },
});

router.post("/", signupLimiter, addUser);

router.post("/verifyOTP", signupLimiter, verifyUser);

router.patch("/resendOTP", signupLimiter, resendOTP);

export default router;
