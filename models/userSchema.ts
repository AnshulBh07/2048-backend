import mongoose from "mongoose";
import bcrypt from "bcrypt";
const Schema = mongoose.Schema;

const coordinateSchema = new Schema(
  {
    x: { type: Number },
    y: { type: Number },
  },
  { _id: false }
);

const positionSchema = new Schema(
  {
    isMerged: { type: Boolean },
    value: { type: Number },
    initialCoords: { type: coordinateSchema },
    finalCoords: { type: coordinateSchema },
  },
  { _id: false }
);

const gameSchema = new Schema(
  {
    prevMatrix: { type: [[Number]] },
    matrix: { type: [[Number]] },
    maxScore: { type: Number },
    currScore: { type: Number },
    moves: { type: Number, default: 0 },
    gameStatus: { type: String },
    bestScore: { type: Number },
    rows: { type: Number },
    columns: { type: Number },
    undo: { type: Boolean },
    newTileCoords: { type: [coordinateSchema] },
    positionsArr: { type: [positionSchema] },
  },
  { _id: false }
);

const googleInfoSchema = new Schema(
  {
    name: { type: String, default: "" },
    picture: { type: String, default: "" },
    given_name: { type: String, default: "" },
    family_name: { type: String, default: "" },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, default: "" },
    email: { type: String, required: true, unique: true },
    isGoogleUser: { type: Boolean, required: true, default: false },
    googleInfo: { type: googleInfoSchema },
    highScore: { type: Number, required: true, default: 0 },
    otp: { type: String, default: "" },
    otpCreatedAt: { type: Date, default: new Date(Date.now()) },
    otpExpiry: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000),
    },
    isVerified: { type: Boolean, default: false },
    gameState: { type: gameSchema },
  },
  { timestamps: true }
);

// pre-save hook to hash the password
// read differences between arrow functions and normal functions online
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(this.password, salt);

    this.password = hashedPass;
    next();
  } catch (err) {
    next(err as Error);
  }
});

const User = mongoose.model("User", userSchema);

export default User;
