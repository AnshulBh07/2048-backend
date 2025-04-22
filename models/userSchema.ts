import mongoose from "mongoose";
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
    gameStatus: { type: String },
    bestScore: { type: Number },
    rows: { type: Number },
    columns: { type: Number },
    undo: { type: Boolean },
    scoreAnimate: { type: Boolean },
    slide: { type: Boolean },
    newTileCoords: { type: [coordinateSchema] },
    mergeTileCoords: { type: [coordinateSchema] },
    positionArr: { type: [positionSchema] },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    highScore: { type: Number, required: true, default: 0 },
    gameState: { type: gameSchema, required: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
