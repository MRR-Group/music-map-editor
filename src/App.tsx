import React, { useState, useEffect, useCallback, useRef } from "react";
import { AudioPlayer } from "./components/AudioPlayer";
import { BitrateVisualizer } from "./components/BitrateVisualizer";
import { BoardEditor } from "./components/BoardEditor";
import { BoardsViewer } from "./components/BoardsViewer";
import { FrequencyVisualizer } from "./components/FrequencyVisualizer";
import { type Panel, type CellState, type BoardState } from "./utils/types";
import { detectBeats } from "./utils/wavParser";
import { FileDropzone } from "./components/FileDropzone";
import { analyzeAudio } from "./utils/audioAnalyzer";

const App: React.FC = () => {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [currentSongTime, setCurrentSongTime] = useState<number>(0);
  const [songDuration, setSongDuration] = useState<number>(0);
  const [activePanelIndex, setActivePanelIndex] = useState<number>(-1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [frequencyData, setFrequencyData] = useState<Uint8Array[]>([]);
  const [loadingStep, setLoadingStep] = useState("");
  const [ctrlPressed, setCtrlPressed] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImport = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      const importedPanels: Panel[] = [];
      const blocks = content.trim().split(/\n\s*\n/);

      for (const block of blocks) {
        const lines = block.trim().split("\n");
        if (lines.length < 3) continue;

        const timestamp = parseFloat(lines[0]);
        const row1 = lines[1].trim().split("").map(Number) as CellState[];
        const row2 = lines[2].trim().split("").map(Number) as CellState[];

        if (!isNaN(timestamp) && row1.length === 4 && row2.length === 4) {
          importedPanels.push({
            timestamp,
            board: [row1, row2] as BoardState,
          });
        }
      }
      setPanels(importedPanels);
    };
    reader.readAsText(file);
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (file && file.type === "audio/wav") {
        const url = URL.createObjectURL(file);
        setAudioUrl(url);
        setFrequencyData([]);
        setPanels([]);
        setCurrentSongTime(0);
        setSongDuration(0);
        setLoadingStep("Decoding audio file...");

        if (!audioContextRef.current) {
          audioContextRef.current = new window.AudioContext();
        }

        const arrayBuffer = await file.arrayBuffer();

        audioContextRef.current.decodeAudioData(arrayBuffer, async (buffer) => {
          setSongDuration(buffer.duration);
          setLoadingStep("Analyzing frequency data...");

          const slices = Math.floor(buffer.duration * 20);
          const freqData = await analyzeAudio(buffer, slices);

          setFrequencyData(freqData);

          setLoadingStep("Detecting beats...");

          const beats = await detectBeats(buffer);
          const initialPanels: Panel[] = beats.map((timestamp) => ({
            timestamp,
            board: [
              [0, 0, 0, 0],
              [0, 0, 0, 0],
            ],
          }));

          setPanels(initialPanels);
          setLoadingStep("");
        });
      } else if (file.name.endsWith(".txt")) {
        await handleImport(file);
      }
    },
    [handleImport],
  );

  useEffect(() => {
    if (songDuration > 0 && panels.length > 0) {
      let newActiveIndex = -1;
      for (let i = panels.length - 1; i >= 0; i--) {
        if (currentSongTime >= panels[i].timestamp) {
          newActiveIndex = i;
          break;
        }
      }
      setActivePanelIndex(newActiveIndex);
    } else {
      setActivePanelIndex(-1);
    }
  }, [currentSongTime, songDuration, panels]);

  const handleBoardCellClick = useCallback(
    (rowIndex: number, colIndex: number) => {
      if (activePanelIndex === -1) {
        return;
      }

      setPanels((prevPanels) => {
        const newPanels = [...prevPanels];
        if (newPanels[activePanelIndex]) {
          const newBoard = JSON.parse(
            JSON.stringify(newPanels[activePanelIndex].board),
          );
          newBoard[rowIndex][colIndex] = ((newBoard[rowIndex][colIndex] + 1) %
            3) as CellState;
          newPanels[activePanelIndex] = {
            ...newPanels[activePanelIndex],
            board: newBoard,
          };
        }
        return newPanels;
      });
    },
    [activePanelIndex],
  );

  const handleSeekByPanelIndex = useCallback(
    (index: number) => {
      if (panels[index]) {
        const newTime = panels[index].timestamp;
        setCurrentSongTime(newTime);
        if (audioPlayerRef.current) {
          audioPlayerRef.current.currentTime = newTime;
        }
      }
    },
    [panels],
  );

  const handleAddPanel = useCallback(() => {
    const newPanel: Panel = {
      timestamp: currentSongTime,
      board: [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    };

    setPanels((prevPanels) => {
      const newPanels = [...prevPanels, newPanel];
      newPanels.sort((a, b) => a.timestamp - b.timestamp);
      return newPanels;
    });
  }, [currentSongTime]);

  const handleRemovePanel = useCallback(() => {
    if (activePanelIndex === -1) return;
    setPanels((prevPanels) =>
      prevPanels.filter((_, index) => index !== activePanelIndex),
    );
  }, [activePanelIndex]);

  const handleNudgePanel = useCallback(
    (offset: number) => {
      if (activePanelIndex === -1) return;
      setPanels((prevPanels) => {
        const newPanels = [...prevPanels];
        const panelToNudge = newPanels[activePanelIndex];
        if (panelToNudge) {
          newPanels[activePanelIndex] = {
            ...panelToNudge,
            timestamp: Math.max(0, panelToNudge.timestamp + offset),
          };
          newPanels.sort((a, b) => a.timestamp - b.timestamp);
        }
        return newPanels;
      });
    },
    [activePanelIndex],
  );

  const handleExport = useCallback(() => {
    if (panels.length === 0) {
      alert("No panels to export.");
      return;
    }
    const content = panels
      .map((p) => {
        const timestamp = p.timestamp.toFixed(2);
        const row1 = p.board[0].join("");
        const row2 = p.board[1].join("");
        return `${timestamp}\n${row1}\n${row2}`;
      })
      .join("\n\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "music-map.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [panels]);

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control") setCtrlPressed(true);
      if (e.key === "Shift") setShiftPressed(true);

      if (!audioUrl) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (audioPlayerRef.current) {
            if (isPlaying) {
              audioPlayerRef.current.pause();
            } else {
              audioPlayerRef.current.play();
            }
            setIsPlaying(!isPlaying);
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          handleSeekByPanelIndex(activePanelIndex + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          handleSeekByPanelIndex(activePanelIndex - 1);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control") setCtrlPressed(false);
      if (e.key === "Shift") setShiftPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    isPlaying,
    audioUrl,
    songDuration,
    handleSeekByPanelIndex,
    activePanelIndex,
  ]);

  const getMoveAmount = () => {
    if (ctrlPressed) return 0.5;
    if (shiftPressed) return 0.05;
    return 0.1;
  };

  const isAnalyzing = loadingStep !== "";

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-inter flex flex-col items-center">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
          }
        `}
      </style>
      <h1 className="text-4xl font-bold mb-8 text-white">
        Music Game Board Editor
      </h1>

      {!audioUrl ? (
        <FileDropzone onFileDrop={handleFileSelect} />
      ) : (
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="flex flex-col space-y-8">
            <AudioPlayer
              ref={audioPlayerRef}
              onTimeUpdate={setCurrentSongTime}
              onDurationChange={setSongDuration}
              onSeek={setCurrentSongTime}
              currentTime={currentSongTime}
              duration={songDuration}
              audioUrl={audioUrl}
              isPlaying={isPlaying}
              onIsPlayingChange={setIsPlaying}
            />
            <BitrateVisualizer
              panels={panels}
              activePanelIndex={activePanelIndex}
              onSeekByPanelIndex={handleSeekByPanelIndex}
              duration={songDuration}
            />
            <FrequencyVisualizer
              frequencyData={frequencyData}
              panels={panels}
              activePanelIndex={activePanelIndex}
              duration={songDuration}
              onSeek={setCurrentSongTime}
              isLoading={isAnalyzing}
            />
          </div>

          <div className="flex flex-col space-y-8">
            <BoardEditor
              boardState={
                panels[activePanelIndex]?.board || [
                  [0, 0, 0, 0],
                  [0, 0, 0, 0],
                ]
              }
              onCellClick={handleBoardCellClick}
              disabled={isAnalyzing}
            />
            {isAnalyzing && (
              <div className="bg-gray-800 p-4 rounded-lg shadow-xl text-center">
                <p className="text-lg font-semibold text-white">
                  Processing Audio...
                </p>
                <p className="text-gray-400">{loadingStep}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-4">
              <button
                onClick={handleAddPanel}
                disabled={isAnalyzing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                Add Panel
              </button>
              <button
                onClick={handleRemovePanel}
                disabled={activePanelIndex === -1 || isAnalyzing}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                Remove Panel
              </button>
              <button
                onClick={handleImportClick}
                disabled={isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                Import
              </button>
              <input
                type="file"
                ref={importInputRef}
                className="hidden"
                accept=".txt"
                onChange={(e) =>
                  e.target.files && handleImport(e.target.files[0])
                }
              />
              <button
                onClick={handleExport}
                disabled={panels.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                Export
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleNudgePanel(-getMoveAmount())}
                disabled={activePanelIndex === -1 || isAnalyzing}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
                title="Move Left. Shift: 0.05s, Ctrl: 0.5s"
              >
                {`Move Left (-${getMoveAmount()}s)`}
              </button>
              <button
                onClick={() => handleNudgePanel(getMoveAmount())}
                disabled={activePanelIndex === -1 || isAnalyzing}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
                title="Move Right. Shift: +0.05s, Ctrl: +0.5s"
              >
                {`Move Right (+${getMoveAmount()}s)`}
              </button>
            </div>
          </div>
          <div className="w-full max-w-7xl md:col-span-2">
            <BoardsViewer
              panels={panels}
              activePanelIndex={activePanelIndex}
              onPanelSelect={handleSeekByPanelIndex}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
