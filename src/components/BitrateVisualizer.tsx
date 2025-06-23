import React, { useRef, useEffect, useCallback, useMemo } from 'react';

interface BitrateVisualizerProps {
  bitrateData: number[];
  currentBoardIndex: number;
  onSeekByIndex: (index: number) => void;
  duration: number;
}

export const BitrateVisualizer: React.FC<BitrateVisualizerProps> = ({ bitrateData, currentBoardIndex, onSeekByIndex, duration }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null); // Ref to the canvas element

  const { minBitrate, maxBitrate } = useMemo(() => {
    if (bitrateData.length === 0) return { minBitrate: 0, maxBitrate: 0 };
    const max = Math.max(...bitrateData);
    const min = Math.min(...bitrateData);
    return { minBitrate: min, maxBitrate: max };
  }, [bitrateData]);

  // Callback to draw the visualizer bars on the canvas
  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Ensure canvas element exists
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // Ensure 2D context is available

    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height); // Clear previous drawings

    if (bitrateData.length === 0) return; // Nothing to draw if no data

    // Background gradient for the visualizer
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1F2937'); // Dark gray
    gradient.addColorStop(1, '#374151'); // Lighter dark gray
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const barsToShow = 15;
    const halfBars = Math.floor(barsToShow / 2);
    
    const barWidth = width / barsToShow;
    const barGap = 2; // 2px gap
    const drawnBarWidth = barWidth - barGap;

    const timelineHeight = 20;
    const chartHeight = height - timelineHeight;

    // Draw each bitrate bar
    for (let i = 0; i < barsToShow; i++) {
      const dataIndex = currentBoardIndex - halfBars + i;

      if (dataIndex < 0 || dataIndex >= bitrateData.length) {
        continue; // Don't draw bars for out-of-bounds indices
      }

      const bitrate = bitrateData[dataIndex];
      // Normalize bitrate to canvas height (0-1 range)
      const normalizedBitrate = (maxBitrate - minBitrate) === 0 ? 1 : (bitrate - minBitrate) / (maxBitrate - minBitrate);
      // Ensure bars have a minimum visible height
      const barHeight = normalizedBitrate * chartHeight * 0.9 + chartHeight * 0.1; // Scale from 10% to 100%

      const x = i * barWidth;
      const y = chartHeight - barHeight; // Draw from bottom up

      // Set bar color based on whether it's the active board index
      ctx.fillStyle = i === halfBars ? '#EC4899' : '#8B5CF6'; // Pink for active, purple for others
      ctx.fillRect(x, y, drawnBarWidth, barHeight);

      // Draw the frame number, rotated
      ctx.save();
      ctx.font = '10px Inter';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const textX = x + drawnBarWidth / 2;
      const textY = chartHeight - barHeight / 2;

      ctx.translate(textX, textY);
      ctx.rotate(-Math.PI / 2); // Rotate -90 degrees
      ctx.fillText(dataIndex.toString(), 0, 0);
      ctx.restore();
    }

    // Draw timeline with second markers
    if (duration > 0) {
      ctx.font = '10px Inter';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';

      const timelineBaseY = chartHeight;
      const startDataIndex = currentBoardIndex - halfBars;
      
      const startTime = (startDataIndex / bitrateData.length) * duration;
      const endTime = ((startDataIndex + barsToShow) / bitrateData.length) * duration;

      const firstVisibleSecond = Math.ceil(startTime);
      const lastVisibleSecond = Math.floor(endTime);

      for (let sec = firstVisibleSecond; sec <= lastVisibleSecond; sec++) {
        if (sec < 0) continue;
        const dataIndexForSecond = (sec / duration) * bitrateData.length;
        const positionInWindow = dataIndexForSecond - startDataIndex;
        const x = positionInWindow * barWidth;

        if (x >= 0 && x <= width) {
          
          ctx.fillText(`${sec}s`, x, timelineBaseY + 15);
        }
      }
    }
  }, [bitrateData, currentBoardIndex, minBitrate, maxBitrate, duration]);

  // Effect to handle canvas resizing and initial drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use ResizeObserver to redraw when canvas element size changes
    const observer = new ResizeObserver(() => {
      if (canvas) {
        canvas.width = canvas.offsetWidth; // Set internal canvas resolution to match display size
        canvas.height = canvas.offsetHeight;
        drawVisualizer(); // Redraw on resize
      }
    });
    
    observer.observe(canvas); // Start observing the canvas element

    drawVisualizer(); // Initial draw when component mounts or dependencies change

    // Cleanup function for ResizeObserver
    return () => {
      observer.unobserve(canvas);
    };
  }, [drawVisualizer]);

  // Callback for clicking on the visualizer to seek to a specific time/board
  const handleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration === 0 || bitrateData.length === 0) return;

    const barsToShow = 15;
    const halfBars = Math.floor(barsToShow / 2);

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left; // Get click X position relative to canvas
    const width = canvas.width;

    const clickedBarInWindow = Math.floor((x / width) * barsToShow);
    const clickedIndex = currentBoardIndex - halfBars + clickedBarInWindow;

    if (clickedIndex >= 0 && clickedIndex < bitrateData.length) {
      onSeekByIndex(clickedIndex);
    }
  }, [bitrateData.length, onSeekByIndex, currentBoardIndex]);

  return (
    <div className="w-full h-32 bg-gray-900 rounded-lg overflow-hidden cursor-pointer shadow-inner">
      <canvas ref={canvasRef} onClick={handleClick} className="w-full h-full"></canvas>
    </div>
  );
};
