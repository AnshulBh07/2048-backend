import { Request, Response } from "express";
import { IGameState, position } from "../services/interfaces";
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
    ];

    // perform a dynamic field check for large number of fields
    for (const field of requiredFields) {
      if (typeof req.body[field] === "undefined") {
        res.status(400).send(`Missing or undefined field: ${field}`);
        return;
      }
    }

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      res.status(404).send("User not found");
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
    await User.updateOne({ email: req.body.email }, { gameState: gameState });

    res.status(200).send("ok");
  } catch (err) {
    console.error("Error saving game:", err);
    res.status(500).send("Internal server error.");
  }
};
