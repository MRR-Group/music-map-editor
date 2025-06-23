import React, { useState, useEffect, useRef } from "react";
import { type Panel, type BoardState, type CellState } from "../utils/types";

interface ThreeDBoardViewerProps {
  panels: Panel[];
  activePanelIndex: number;
  onPanelSelect: (index: number) => void;
}

const MiniBoard: React.FC<{
  board: BoardState;
  isHighlighted: boolean;
  onClick: () => void;
  panelIndex: number;
  timestamp: number;
}> = ({ board, isHighlighted, onClick, panelIndex, timestamp }) => {
  const cellColor = (state: CellState) => {
    switch (state) {
      case 1:
        return "bg-gray-900";
      case 2:
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer p-2 rounded-lg transition-all duration-200 ${isHighlighted ? "bg-pink-600 shadow-lg scale-105" : "bg-gray-700 hover:bg-gray-600"}`}
    >
      <p
        className={`text-center font-bold mb-2 ${isHighlighted ? "text-white" : "text-gray-300"}`}
      >
        #{panelIndex}
      </p>
      <div className="grid grid-cols-4 gap-1">
        {board.flat().map((cell, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded-sm ${cellColor(cell)} border-2 ${isHighlighted ? "border-pink-300" : "border-gray-600"}`}
          />
        ))}
      </div>
      <p
        className={`text-center text-xs mt-2 font-semibold ${isHighlighted ? "text-white" : "text-gray-400"}`}
      >
        {timestamp.toFixed(2)}s
      </p>
    </div>
  );
};

export const BoardsViewer: React.FC<ThreeDBoardViewerProps> = ({
  panels,
  activePanelIndex,
  onPanelSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelsToShow, setPanelsToShow] = useState(5);

  useEffect(() => {
    const calculatePanels = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const panelWidth = 140;
        const numPanels = Math.floor(containerWidth / panelWidth);

        setPanelsToShow(numPanels);
      }
    };

    const observer = new ResizeObserver(calculatePanels);
    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
      calculatePanels();
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const half = Math.floor(panelsToShow / 2);

  let startIndex = Math.max(0, activePanelIndex - half);
  if (startIndex + panelsToShow > panels.length) {
    startIndex = Math.max(0, panels.length - panelsToShow);
  }

  const panelIndicesToShow = Array.from(
    { length: Math.min(panelsToShow, panels.length) },
    (_, i) => startIndex + i,
  );

  if (panels.length === 0) {
    return (
      <div className="w-full bg-gray-800 p-4 rounded-lg text-center text-gray-400">
        No panels to display. Load a WAV file to start.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full bg-gray-800 p-4 rounded-lg shadow-inner"
    >
      <h3 className="text-xl font-bold text-white mb-6 text-center tracking-wider">
        Board Timeline
      </h3>
      <div className="flex justify-center items-center gap-4">
        {panelIndicesToShow.map((panelIndex) => {
          const panel = panels[panelIndex];
          if (!panel) return null;
          return (
            <MiniBoard
              key={panelIndex}
              panelIndex={panelIndex}
              board={panel.board}
              timestamp={panel.timestamp}
              isHighlighted={panelIndex === activePanelIndex}
              onClick={() => onPanelSelect(panelIndex)}
            />
          );
        })}
      </div>
    </div>
  );
};
