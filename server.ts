import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 3001;

app.get("/", (req: Request, res: Response) => {
  try {
    res.status(200).send("on the server!");
  } catch (err) {
    console.error(err);
    res.status(500).send("internal server error");
  }
});

const main = async () => {
  try {
    await mongoose.connect(process.env.ATLAS_URI || "");
    app.listen(port, () => console.log(`server started on port ${port}`));
  } catch (err) {
    console.log("Some error occured while connecting to database");
    console.error(err);
  }
};

main();
