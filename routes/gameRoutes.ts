import express, { NextFunction, Request, Response } from "express";
import {
  getLeaderboard,
  saveGameController,
} from "../controllers/gameControllers";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import User from "../models/userSchema";
import { IJWTPayload } from "../services/interfaces";

const router = express.Router();

const gameLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000000,
  message: { message: "too many save game attemps, please try again later" },
});

const authenticateTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { token } = req.cookies;

  if (!token) {
    res.status(400).send("Token not found.");
    return;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;

  if (!decoded) {
    res.status(401).send("Invalid token.");
    return;
  }

  const { id } = decoded;

  const user = await User.findOne({ _id: id });

  if (!user) {
    res.status(404).send("User not found.");
    return;
  }

  next();
};

router.post(
  "/save",
  gameLimiter,
  authenticateTokenMiddleware,
  saveGameController
);

router.get(
  "/leader_board",
  gameLimiter,
  authenticateTokenMiddleware,
  getLeaderboard
);

export default router;
