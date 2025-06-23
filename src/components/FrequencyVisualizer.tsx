import React, { useRef, useEffect, useCallback } from 'react';

interface FrequencyVisualizerProps {
  frequencyData: Uint8Array[];
  bitrateData: number[];
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isLoading: boolean;
}

export const FrequencyVisualizer: React.FC<FrequencyVisualizerProps> = ({
  frequencyData,
  bitrateData,
  currentTime,
  duration,
  onSeek,
  isLoading,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || frequencyData.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1F2937'); // Dark gray
    gradient.addColorStop(1, '#374151'); // Lighter dark gray
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const timelineHeight = 20;
    const chartHeight = height - timelineHeight;

    const currentSliceIndex = Math.floor((currentTime / duration) * frequencyData.length);

    const slicesToShow = 70;
    const halfSlices = Math.floor(slicesToShow / 2);

    let startIndex = Math.max(0, currentSliceIndex - halfSlices);
    startIndex = Math.min(startIndex, Math.max(0, frequencyData.length - slicesToShow));

    const endIndex = Math.min(frequencyData.length, startIndex + slicesToShow);
    const visibleSlices = frequencyData.slice(startIndex, endIndex);

    const sliceWidth = width / slicesToShow;

    const bitrateFrameStartSliceIndices = new Map<number, number>();
    if (bitrateData.length > 0) {
      for (let i = 0; i < bitrateData.length; i++) {
        const sliceIndex = Math.floor((i / bitrateData.length) * frequencyData.length);
        if (!bitrateFrameStartSliceIndices.has(sliceIndex)) {
          bitrateFrameStartSliceIndices.set(sliceIndex, i);
        }
      }
    }

    visibleSlices.forEach((dataArray, index) => {
      const originalIndex = startIndex + index;
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const barHeight = (average / 128) * chartHeight * 0.9 + chartHeight * 0.1; // Scale from 10% to 100%

      const x = index * sliceWidth;
      const y = chartHeight - barHeight;

      const isBitrateFrameStart = bitrateFrameStartSliceIndices.has(originalIndex);

      if (originalIndex === currentSliceIndex) {
        ctx.fillStyle = '#EC4899';
      } 
      else if (isBitrateFrameStart) {
        ctx.fillStyle = 'white';
      } 
      else {
        ctx.fillStyle = '#8B5CF6';
      }

      ctx.fillRect(x, y, sliceWidth - 2, barHeight);

      if (isBitrateFrameStart) {
        const frameNumber = bitrateFrameStartSliceIndices.get(originalIndex)!;
        ctx.fillStyle = 'white';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(frameNumber), x + (sliceWidth - 2) / 2, 15);
      }
    });

    // Draw timeline with second markers
    if (duration > 0) {
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';

      const timelineBaseY = chartHeight;
      const startDataIndex = startIndex;
      
      const startTime = (startDataIndex / frequencyData.length) * duration;
      const endTime = ((startDataIndex + slicesToShow) / frequencyData.length) * duration;

      const firstVisibleSecond = Math.ceil(startTime);
      const lastVisibleSecond = Math.floor(endTime);

      for (let sec = firstVisibleSecond; sec <= lastVisibleSecond; sec++) {
        if (sec < 0) continue;
        const dataIndexForSecond = (sec / duration) * frequencyData.length;
        const positionInWindow = dataIndexForSecond - startDataIndex;
        const x = positionInWindow * sliceWidth;

        if (x >= 0 && x <= width) {
          ctx.fillText(`${sec}s`, x, timelineBaseY + 15);
        }
      }
    }
  }, [frequencyData, currentTime, duration, bitrateData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        drawVisualizer();
      }
    });
    observer.observe(canvas);
    drawVisualizer();
    return () => {
      if (canvas) {
        observer.unobserve(canvas);
      }
    };
  }, [drawVisualizer, isLoading]);

  const handleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration === 0 || frequencyData.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    
    const slicesToShow = 70;
    const halfSlices = Math.floor(slicesToShow / 2);
    const currentSliceIndex = Math.floor((currentTime / duration) * frequencyData.length);
    let startIndex = Math.max(0, currentSliceIndex - halfSlices);
    startIndex = Math.min(startIndex, Math.max(0, frequencyData.length - slicesToShow));

    const clickedSliceInWindow = Math.floor((x / canvas.width) * slicesToShow);
    const clickedSliceIndex = startIndex + clickedSliceInWindow;

    if (clickedSliceIndex >= 0 && clickedSliceIndex < frequencyData.length) {
      const newTime = (clickedSliceIndex / frequencyData.length) * duration;
      onSeek(newTime);
    }
  }, [frequencyData.length, duration, onSeek, currentTime]);

  if (isLoading) {
    return (
      <div className="w-full h-32 bg-gray-900 rounded-lg flex items-center justify-center shadow-inner mt-8 text-white">
        <div className="text-center">
          <p className="font-semibold">Analyzing Frequencies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-32 bg-gray-900 rounded-lg overflow-hidden cursor-pointer shadow-inner mt-8">
      <canvas ref={canvasRef} onClick={handleClick} className="w-full h-full"></canvas>
    </div>
  );
};
