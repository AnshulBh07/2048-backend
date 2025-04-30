import nodemailer from "nodemailer";
import dotenv from "dotenv";

const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: envFile });

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_MAIL,
    pass: process.env.NODEMAILER_PASS,
  },
});

export const sendMail = async (mailOptions: any) => {
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error(err);
  }
};
