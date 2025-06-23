import React from 'react';
import { type BoardState, type CellState } from '../utils/types'; // Import types

// Helper function to get the background color for a board cell based on its state
const getCellColor = (state: CellState): string => {
  switch (state) {
    case 0: return '#374151'; // Blank (gray-700 for dark theme)
    case 1: return '#1F2937'; // Black (gray-800 for dark theme)
    case 2: return '#9333EA'; // Purple (purple-600 for dark theme)
    default: return '#374151'; // Default to blank if state is unexpected
  }
};

interface BoardEditorProps {
  boardState: BoardState; // The current 2x4 board state to display and edit
  onCellClick: (rowIndex: number, colIndex: number) => void; // Callback for when a cell is clicked
}

export const BoardEditor: React.FC<BoardEditorProps> = ({ boardState, onCellClick }) => {
  return (
    <div className="flex flex-col items-center bg-gray-800 p-4 rounded-lg shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-4">Current Board Editor</h3>
      <div className="grid grid-rows-2 grid-cols-4 gap-1 p-2 bg-gray-900 rounded-md">
        {/* Iterate over rows and columns to render each cell */}
        {boardState.map((row, rowIndex) => (
          row.map((cellState, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`} // Unique key for each cell
              className="w-12 h-12 rounded-md flex items-center justify-center cursor-pointer
                         transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 shadow-md"
              style={{ backgroundColor: getCellColor(cellState) }} // Dynamic background color
              onClick={() => onCellClick(rowIndex, colIndex)} // Handle cell click
              title={`Row ${rowIndex + 1}, Col ${colIndex + 1}`} // Tooltip for accessibility
            >
            </div>
          ))
        ))}
      </div>
    </div>
  );
};