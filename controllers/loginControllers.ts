import { Response, Request } from "express";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/userSchema";
import axios from "axios";
import {
  IGoogleTokenDecoded,
  IGoogleTokenResposne,
  IJWTPayload,
} from "../services/interfaces";
import { AxiosResponse } from "axios";

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

    const userInfo = await User.findOne({ email: email });

    res.status(200).send({ userInfo: userInfo });
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;

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

const generateUsername = async (name: string, sub: string) => {
  try {
    const baseUsername = name;
    let suffix = parseInt(sub.slice(sub.length - 4, sub.length));

    // indefinite loop untill we find a unique username
    while (suffix) {
      const username = `${baseUsername}#${suffix}`;
      const user = await User.findOne({ username: username });

      // we found unique username
      if (!user) {
        return username;
      }

      suffix++;
    }
  } catch (err) {
    console.error(err);
  }
};

export const loginGoogle = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code || code.length === 0) {
      res.status(400).send("Bad request. Missing code.");
      return;
    }

    // get the info from goole using code, decode id_token, get user info and match with db
    // if db doesn't have the particular user insert them otherwise just login
    const response: AxiosResponse<IGoogleTokenResposne> = await axios({
      method: "post",
      url: `${process.env.GOOGLE_TOKEN_URI}`,
      data: {
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: "postmessage",
        grant_type: "authorization_code",
      },
    });

    if (!(response.status === 200)) {
      res.status(404).send("Invalid user");
      return;
    }

    const userToken = response.data.id_token;

    const decoded = jwt.decode(userToken) as IGoogleTokenDecoded;

    if (!decoded) {
      res.status(400).send("Invalid token.");
      return;
    }

    const { email, name, picture, given_name, family_name, sub } = decoded;

    // if an account with that particular email already exist it is a succesfull login and return ok
    const user = await User.findOne({ email: email });

    if (user) {
      // set token in cookies
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          username: user.username,
        },
        process.env.JWT_SECRET!,
        {
          expiresIn: "1d",
        }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      res.status(200).send({ userInfo: user });
      return;
    }

    // create a unique username
    const username = await generateUsername(given_name, sub);

    if (!username) {
      res.status(401).send("Cannot generate username.Server error.");
      return;
    }

    // create new user
    const newUser = new User({
      email: email,
      username: username,
      password: sub,
      isGoogleUser: true,
      googleInfo: {
        name: name,
        picture: picture,
        given_name: given_name,
        family_name: family_name,
      },
      isVerified: true,
    });

    await newUser.save();

    const userInfo = await User.findOne({ email: email });

    if (!userInfo) {
      res.status(404).send("User not found");
      return;
    }

    // set token in cookies
    const token = jwt.sign(
      { id: userInfo._id, email: userInfo.email, username: userInfo.username },
      process.env.JWT_SECRET!,
      {
        expiresIn: "1d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).send({ userInfo: userInfo });
  } catch (err) {
    res.status(500).send("Internal server error");
    console.error(err);
  }
};
