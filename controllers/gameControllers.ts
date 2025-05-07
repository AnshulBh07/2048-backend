import { Request, Response } from "express";
import { IGameState, IJWTPayload, position } from "../services/interfaces";
import jwt from "jsonwebtoken";
import User from "../models/userSchema";

export const saveGameController = async (req: Request, res: Response) => {
  try {
    const requiredFields = [
      "prevMatrix",
      "matrix",
      "maxScore",
      "currScore",
      "status",
      "best",
      "rows",
      "columns",
      "undo",
      "newTileCoords",
      "positionsArr",
      "moves",
      "max_tile",
    ];

    // perform a dynamic field check for large number of fields
    for (const field of requiredFields) {
      if (typeof req.body[field] === "undefined") {
        res.status(400).send(`Missing or undefined field: ${field}`);
        return;
      }
    }

    const { token } = req.cookies;

    const { email } = jwt.verify(token, process.env.JWT_SECRET!) as IJWTPayload;

    const checkUser = await User.findOne({ email: email });

    if (!checkUser) {
      res.status(404).send("User not found.");
      return;
    }

    const positionSchemaArr = req.body.positionsArr.map((pos: position) => {
      return {
        isMerged: pos.isMerged,
        value: pos.value,
        initialCoords: {
          x: pos.initialCoords.row,
          y: pos.initialCoords.column,
        },
        finalCoords: { x: pos.finalCoords.row, y: pos.finalCoords.column },
      };
    });

    const gameState: IGameState = {
      prevMatrix: req.body.prevMatrix,
      matrix: req.body.matrix,
      maxScore: req.body.maxScore,
      currScore: req.body.currScore,
      bestScore: req.body.best,
      moves: req.body.moves,
      max_tile: req.body.max_tile,
      gameStatus: req.body.status,
      rows: req.body.rows,
      columns: req.body.columns,
      undo: req.body.undo,
      positionsArr: positionSchemaArr,
      newTileCoords: req.body.newTileCoords.map((subArr: number[]) => {
        return { x: subArr[0], y: subArr[1] };
      }),
    };

    // update user
    await User.updateOne(
      { email: email },
      { gameState: gameState, highScore: req.body.best }
    );

    res.status(200).send("ok");
  } catch (err) {
    console.error("Error saving game:", err);
    res.status(500).send("Internal server error.");
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const topUsers = await User.find()
      .sort({ highScore: -1, "gameState.moves": 1 })
      .limit(20);

    if (!topUsers) {
      res.status(400).send("Bad request.");
      return;
    }

    const users = topUsers
      .filter((user) => {
        return user.gameState && user.highScore > 0;
      })
      .map((user) => {
        return {
          username: user.username,
          score: user.highScore,
          max_tile: user.gameState?.max_tile,
        };
      });

    res.status(200).send({ users: users });
  } catch (err) {
    res.status(500).send("Internal server error.");
    console.error(err);
  }
};
