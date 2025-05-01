import express from "express";
import { saveGameController } from "../controllers/gameControllers";
import rateLimit from "express-rate-limit";

const router = express.Router();

const gameLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "too many save game attemps, please try again later" },
});

router.post("/save", gameLimiter, saveGameController);

export default router;
