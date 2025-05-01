export type coordinates = { x: number; y: number };

export type position = {
  isMerged: boolean;
  value: number;
  initialCoords: { row: number; column: number };
  finalCoords: { row: number; column: number };
};

export type schemaPosition = {
  isMerged: boolean;
  value: number;
  initialCoords: coordinates;
  finalCoords: coordinates;
};

export interface IGameState {
  prevMatrix: number[][];
  matrix: number[][];
  maxScore: number;
  currScore: number;
  gameStatus: string;
  bestScore: number;
  moves: number;
  rows: number;
  columns: number;
  undo: boolean;
  newTileCoords: coordinates[];
  positionsArr: schemaPosition[]; //matrix that stores the initial and final position of each ele along with value
}

// user interface will store user details and game state along with high score
export interface IUser {
  username: string;
  password: string;
  email: string;
  highScore: number;
  gameState: IGameState;
  createdAt: Date;
  updatedAt: Date;
}
