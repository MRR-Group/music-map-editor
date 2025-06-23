import React from "react";
import { type BoardState, type CellState } from "../utils/types";

const getCellColor = (state: CellState): string => {
  switch (state) {
    case 0:
      return "#374151";
    case 1:
      return "#1F2937";
    case 2:
      return "#9333EA";
    default:
      return "#374151";
  }
};

interface BoardEditorProps {
  boardState: BoardState;
  onCellClick: (rowIndex: number, colIndex: number) => void;
  disabled?: boolean;
}

export const BoardEditor: React.FC<BoardEditorProps> = ({
  boardState,
  onCellClick,
  disabled,
}) => {
  return (
    <div
      className={`flex flex-col items-center bg-gray-800 p-4 rounded-lg shadow-xl ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <h3 className="text-xl font-semibold text-white mb-4">
        Current Board Editor
      </h3>
      <div className="grid grid-rows-2 grid-cols-4 gap-1 p-2 bg-gray-900 rounded-md">
        {boardState.map((row, rowIndex) =>
          row.map((cellState, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`w-12 h-12 rounded-md flex items-center justify-center cursor-pointer
                         transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 shadow-md ${disabled ? "cursor-not-allowed" : ""}`}
              style={{ backgroundColor: getCellColor(cellState) }}
              onClick={() => !disabled && onCellClick(rowIndex, colIndex)}
              title={`Row ${rowIndex + 1}, Col ${colIndex + 1}`}
            ></div>
          )),
        )}
      </div>
    </div>
  );
};
