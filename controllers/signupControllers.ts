import { Request, Response } from "express";
import User from "../models/userSchema";
import { sendMail } from "../mail/mailService";

export const addUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // check for invalid request bodies
    if (
      typeof username === "undefined" ||
      username === "" ||
      typeof email === "undefined" ||
      email === "" ||
      typeof password === "undefined" ||
      password === ""
    ) {
      res.status(400).send("Bad request");
      return;
    }

    //   check if user with same username already exists
    let user = await User.findOne({ username: username });

    if (user) {
      res
        .status(409)
        .send("Username is taken. Please use a different username.");
      return;
    }

    user = await User.findOne({ email: email });

    if (user) {
      res.status(409).send("User already exists.");
      return;
    }

    // now generate a random 6 digit otp and send a mail using nodemailer to provided email
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const options = {
      from: process.env.NODEMAILER_MAIL,
      to: email,
      subject: "OTP for registration.",
      html: `
      <h2>Your One-Time Password (OTP)</h2>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>Please use this OTP to verify your account.</p>
    `,
    };

    const newUser = new User({
      username: username,
      password: password,
      otp: otp,
      email: email,
    });

    await newUser.save();

    await sendMail(options);

    res.status(200).send("ok");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error!");
  }
};

// controller to verify otp
export const verifyUser = async (req: Request, res: Response) => {
  try {
    const { otp, email } = req.body;

    if (
      typeof email === "undefined" ||
      email === "" ||
      typeof otp === "undefined" ||
      otp === ""
    ) {
      res.status(400).send("Bad request.");
      return;
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      res.status(404).send("User not found.");
      return;
    }

    // if the otp is expired
    if (new Date() > user.otpExpiry) {
      res.status(410).send("OTP expired, please try again.");
      return;
    }

    if (otp !== user.otp) {
      res.status(403).send("Invalid OTP.");
      return;
    }

    // otp matches and user is verified
    await User.updateOne({ email: email }, { isVerified: true });
    res.status(200).send("ok");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
};

export const resendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (typeof email === "undefined" || email === "") {
      res.status(400).send("Bad request");
      return;
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const createdDate = new Date();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await User.updateOne(
      { email: email },
      { otp: newOtp, otpCreatedAt: createdDate, otpExpiry: expiry }
    );

    const options = {
      from: process.env.NODEMAILER_MAIL,
      to: email,
      subject: "OTP for registration.",
      html: `
      <h2>Your One-Time Password (OTP)</h2>
      <p>Your OTP is: <strong>${newOtp}</strong></p>
      <p>Please use this OTP to verify your account.</p>
    `,
    };

    await sendMail(options);

    res.status(200).send("ok");
  } catch (err) {
    res.status(500).send("Internal server error.");
    console.error(err);
  }
};
