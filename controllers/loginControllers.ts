import { Response, Request } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userSchema";

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password, remember } = req.body;

    if (
      typeof username === "undefined" ||
      typeof email === "undefined" ||
      typeof password === "undefined" ||
      password === ""
    ) {
      res.status(400).send("Bad request");
      return;
    }

    const user = await User.findOne({
      $or: [{ email: email }, { username: username }],
    });

    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).send("Invalid credentials");
      return;
    }

    // everything is ok
    // create token and use cookies for stateless authentication
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: remember ? "30d" : "1d" }
    );

    if (remember) {
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    } else {
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
    }

    res.status(200).send("ok");
  } catch (err) {
    res.status(500).send("Internal server error.");
    console.error(err);
  }
};

export const autoLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      res.status(404).send("Token not found. Please login again.");
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };

    const user = await User.findOne({ _id: decoded.id }).select(
      "-password -otp -optCreatedAt -otpExpiry"
    );

    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    res.status(200).send({ userInfo: user });
  } catch (err) {
    res.status(500).send("Internal server error");
    console.error(err);
  }
};
