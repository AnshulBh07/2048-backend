import express from "express";
import rateLimit from "express-rate-limit";
import { autoLogin, loginUser } from "../controllers/loginControllers";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "too many signup attemps, please try again later" },
});

router.post("/", loginLimiter, loginUser);

router.get("/me", loginLimiter, autoLogin);

export default router;
