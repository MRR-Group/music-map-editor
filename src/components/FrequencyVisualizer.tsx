import React, { useRef, useEffect, useCallback } from "react";
import type { Panel } from "../utils/types";

interface FrequencyVisualizerProps {
  frequencyData: Uint8Array[];
  panels: Panel[];
  activePanelIndex: number;
  duration: number;
  onSeek: (time: number) => void;
  isLoading: boolean;
}

export const FrequencyVisualizer: React.FC<FrequencyVisualizerProps> = ({
  frequencyData,
  panels,
  activePanelIndex,
  duration,
  onSeek,
  isLoading,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || frequencyData.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#1F2937");
    gradient.addColorStop(1, "#374151");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const timelineHeight = 20;
    const chartHeight = height - timelineHeight;

    const activePanel = panels[activePanelIndex];
    const currentTime = activePanel ? activePanel.timestamp : 0;
    const currentSliceIndex =
      duration > 0
        ? Math.floor((currentTime / duration) * frequencyData.length)
        : 0;

    const slicesToShow = 70;
    const halfSlices = Math.floor(slicesToShow / 2);

    let startIndex = Math.max(0, currentSliceIndex - halfSlices);
    startIndex = Math.min(
      startIndex,
      Math.max(0, frequencyData.length - slicesToShow),
    );

    const endIndex = Math.min(frequencyData.length, startIndex + slicesToShow);
    const visibleSlices = frequencyData.slice(startIndex, endIndex);

    const sliceWidth = width / slicesToShow;

    const panelSliceIndices = new Map<number, number>();
    if (panels.length > 0 && duration > 0) {
      for (let i = 0; i < panels.length; i++) {
        const panel = panels[i];
        const sliceIndex = Math.floor(
          (panel.timestamp / duration) * frequencyData.length,
        );
        if (!panelSliceIndices.has(sliceIndex)) {
          panelSliceIndices.set(sliceIndex, i);
        }
      }
    }

    visibleSlices.forEach((dataArray, index) => {
      const originalIndex = startIndex + index;
      const average =
        dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const barHeight = (average / 128) * chartHeight * 0.9 + chartHeight * 0.1;

      const x = index * sliceWidth;
      const y = chartHeight - barHeight;

      const isPanelStart = panelSliceIndices.has(originalIndex);

      if (originalIndex === currentSliceIndex) {
        ctx.fillStyle = "#EC4899";
      } else if (isPanelStart) {
        ctx.fillStyle = "white";
      } else {
        ctx.fillStyle = "#8B5CF6";
      }

      ctx.fillRect(x, y, sliceWidth - 2, barHeight);

      if (isPanelStart) {
        const panelIndex = panelSliceIndices.get(originalIndex)!;
        ctx.fillStyle = "white";
        ctx.font = "10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(panelIndex), x + (sliceWidth - 2) / 2, 15);
      }
    });

    if (duration > 0) {
      ctx.font = "10px Inter, sans-serif";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";

      const timelineBaseY = chartHeight;

      const timePerSlice = duration / frequencyData.length;
      const firstVisibleTime = startIndex * timePerSlice;
      const lastVisibleTime = endIndex * timePerSlice;

      const firstVisibleSecond = Math.ceil(firstVisibleTime);
      const lastVisibleSecond = Math.floor(lastVisibleTime);

      for (let sec = firstVisibleSecond; sec <= lastVisibleSecond; sec++) {
        const timeRatio = sec / duration;
        const sliceIndexForSecond = timeRatio * frequencyData.length;

        if (
          sliceIndexForSecond >= startIndex &&
          sliceIndexForSecond < endIndex
        ) {
          const positionInWindow = sliceIndexForSecond - startIndex;
          const x = positionInWindow * sliceWidth;
          ctx.fillText(`${sec}s`, x, timelineBaseY + 15);
        }
      }
    }
  }, [frequencyData, panels, activePanelIndex, duration]);

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
      observer.unobserve(canvas);
    };
  }, [drawVisualizer]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || duration === 0 || frequencyData.length === 0) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;

      const slicesToShow = 70;
      const halfSlices = Math.floor(slicesToShow / 2);

      const activePanel = panels[activePanelIndex];
      const currentTime = activePanel ? activePanel.timestamp : 0;
      const currentSliceIndex =
        duration > 0
          ? Math.floor((currentTime / duration) * frequencyData.length)
          : 0;

      let startIndex = Math.max(0, currentSliceIndex - halfSlices);
      startIndex = Math.min(
        startIndex,
        Math.max(0, frequencyData.length - slicesToShow),
      );

      const clickedSliceInWindow = Math.floor(
        (x / canvas.width) * slicesToShow,
      );
      const clickedSliceOverall = startIndex + clickedSliceInWindow;

      const time = (clickedSliceOverall / frequencyData.length) * duration;
      onSeek(time);
    },
    [duration, onSeek, frequencyData.length, activePanelIndex, panels],
  );

  return (
    <div className="w-full h-48 bg-gray-900 rounded-lg overflow-hidden cursor-pointer shadow-inner relative">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="w-full h-full"
      ></canvas>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
          <p className="text-white text-lg">Loading audio data...</p>
        </div>
      )}
    </div>
  );
};
