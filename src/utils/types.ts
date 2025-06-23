export type CellState = 0 | 1 | 2;

export type BoardState = (0 | 1 | 2)[][];

export interface Panel {
  timestamp: number;
  board: BoardState;
}
