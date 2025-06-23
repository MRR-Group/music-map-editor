import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AudioPlayer } from './components/AudioPlayer';
import { BitrateVisualizer } from './components/BitrateVisualizer';
import { BoardEditor } from './components/BoardEditor';
import { ThreeDBoardViewer } from './components/ThreeDBoardViewer';
import { FrequencyVisualizer } from './components/FrequencyVisualizer';
import { type BoardState, type CellState } from './utils/types';
import { parseFile } from './utils/wavParser';
import { FileDropzone } from './components/FileDropzone';
import { analyzeAudio } from './utils/audioAnalyzer'; 

const App: React.FC = () => {
  const [bitrateData, setBitrateData] = useState<number[]>([]);
  const [boardStates, setBoardStates] = useState<BoardState[]>([]);
  const [currentSongTime, setCurrentSongTime] = useState<number>(0);
  const [songDuration, setSongDuration] = useState<number>(0);
  const [activeBoardIndex, setActiveBoardIndex] = useState<number>(-1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null); // State for the audio URL
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [frequencyData, setFrequencyData] = useState<Uint8Array[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);


  // Handle file selection from the dropzone
  const handleFileSelect = useCallback(async (file: File) => {
    if (file && file.type === 'audio/wav') {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setFrequencyData([]);
      setBitrateData([]);
      setBoardStates([]);
      setCurrentSongTime(0);
      setSongDuration(0);
      setIsAnalyzing(true);

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const arrayBuffer = await file.arrayBuffer();
      audioContextRef.current.decodeAudioData(arrayBuffer, async (buffer) => {
        const slices = Math.floor(buffer.duration * 20); // 20 slices per second
        const freqData = await analyzeAudio(buffer, slices);
        setFrequencyData(freqData);
        setIsAnalyzing(false);
      });

      const parsedBitrate = await parseFile(file);
      setBitrateData(parsedBitrate);

      const initialBoardStates: BoardState[] = parsedBitrate.map(() => [
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]);
      setBoardStates(initialBoardStates);
    }
  }, []);

  // Update active board index when song time changes
  useEffect(() => {
    if (songDuration > 0 && bitrateData.length > 0) {
      // Calculate the active board index based on current song time and total duration
      const index = Math.floor((currentSongTime / songDuration) * bitrateData.length);
      setActiveBoardIndex(index);
      console.log(`Active board index updated to: ${index}`);
    } else {
      setActiveBoardIndex(-1); // No active board if duration or data is missing
    }
  }, [currentSongTime, songDuration, bitrateData.length]);

  // Handler for clicking a cell on the current board in the editor
  const handleBoardCellClick = useCallback((rowIndex: number, colIndex: number) => {
    if (activeBoardIndex === -1) return; // Do nothing if no board is active

    setBoardStates(prevStates => {
      const newStates = [...prevStates]; // Create a shallow copy of the board states array
      if (newStates[activeBoardIndex]) { // Ensure the board at the active index exists
        // Deep copy the specific board state to ensure immutability and proper React updates
        const newBoard: BoardState = JSON.parse(JSON.stringify(newStates[activeBoardIndex]));
        // Cycle the cell state: 0 -> 1 -> 2 -> 0
        newBoard[rowIndex][colIndex] = ((newBoard[rowIndex][colIndex] + 1) % 3) as CellState;
        newStates[activeBoardIndex] = newBoard; // Update the specific board in the new array
      }
      return newStates; // Return the new array to trigger a re-render
    });
  }, [activeBoardIndex]);

  const handleSeekByIndex = useCallback((index: number) => {
    if (songDuration > 0 && bitrateData.length > 0) {
      const newTime = (index / bitrateData.length) * songDuration;
      setCurrentSongTime(newTime);
    }
  }, [songDuration, bitrateData.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!audioUrl) return;

      switch (e.code) {
        case 'Space':
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
        case 'ArrowRight':
          e.preventDefault();
          setCurrentSongTime(t => Math.min(t + (e.ctrlKey ? 5 : e.shiftKey ? 0.5 : 1), songDuration));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentSongTime(t => Math.max(t - (e.ctrlKey ? 5 : e.shiftKey ? 0.5 : 1), 0));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, audioUrl, songDuration]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 font-inter flex flex-col items-center">
      {/* Styles for Inter font (Tailwind is assumed to be configured externally) */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
          }
        `}
      </style>
      <h1 className="text-4xl font-bold mb-8 text-white">Music Game Board Editor</h1>

      {!audioUrl ? (
        <FileDropzone onFileDrop={handleFileSelect} />
      ) : (
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Left Column: Audio Player & Bitrate Visualizer */}
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
              bitrateData={bitrateData}
              currentBoardIndex={activeBoardIndex}
              onSeekByIndex={handleSeekByIndex}
              duration={songDuration}
            />
            <FrequencyVisualizer
              frequencyData={frequencyData}
              bitrateData={bitrateData}
              currentTime={currentSongTime}
              duration={songDuration}
              onSeek={setCurrentSongTime}
              isLoading={isAnalyzing}
            />
          </div>

          {/* Right Column: Board Editor */}
          <div className="flex flex-col space-y-8">
            <BoardEditor
              // Pass the active board state to the editor, or a blank board if no board is active
              boardState={boardStates[activeBoardIndex] || [[0,0,0,0],[0,0,0,0]]}
              onCellClick={handleBoardCellClick}
            />
          </div>

          {/* Bottom Row: 3D Board Viewer */}
          <div className="w-full max-w-6xl">
            <ThreeDBoardViewer 
              boardStates={boardStates} 
              activeBoardIndex={activeBoardIndex} 
              currentTime={currentSongTime}
              duration={songDuration}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
