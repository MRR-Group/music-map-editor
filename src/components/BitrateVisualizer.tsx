import React, { useRef, useEffect, useCallback } from "react";
import type { Panel } from "../utils/types";

interface BitrateVisualizerProps {
  panels: Panel[];
  activePanelIndex: number;
  onSeekByPanelIndex: (index: number) => void;
  duration: number;
}

export const BitrateVisualizer: React.FC<BitrateVisualizerProps> = ({
  panels,
  activePanelIndex,
  onSeekByPanelIndex,
  duration,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);

    if (panels.length === 0) {
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#1F2937");
    gradient.addColorStop(1, "#374151");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const barsToShow = 15;
    const halfBars = Math.floor(barsToShow / 2);

    const barWidth = width / barsToShow;
    const barGap = 2;
    const drawnBarWidth = barWidth - barGap;

    const timelineHeight = 20;
    const chartHeight = height - timelineHeight;

    for (let i = 0; i < barsToShow; i++) {
      const panelIndex = activePanelIndex - halfBars + i;

      if (panelIndex < 0 || panelIndex >= panels.length) {
        continue;
      }

      const barHeight = chartHeight * 0.9;

      const x = i * barWidth;
      const y = chartHeight - barHeight;

      ctx.fillStyle = i === halfBars ? "#EC4899" : "#8B5CF6";
      ctx.fillRect(x, y, drawnBarWidth, barHeight);

      ctx.save();
      ctx.font = "10px Inter";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const textX = x + drawnBarWidth / 2;
      const textY = chartHeight - barHeight / 2;

      ctx.translate(textX, textY);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(panelIndex.toString(), 0, 0);
      ctx.restore();
    }

    if (duration > 0) {
      ctx.font = "10px Inter";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";

      const timelineBaseY = chartHeight;
      const firstVisiblePanelIndex = activePanelIndex - halfBars;

      const startPanelIndex = Math.max(0, firstVisiblePanelIndex);
      const endPanelIndexInView = activePanelIndex - halfBars + barsToShow - 1;
      const endPanelIndex = Math.min(panels.length - 1, endPanelIndexInView);

      if (startPanelIndex >= panels.length) return;

      const startTime = panels[startPanelIndex]?.timestamp ?? 0;
      const endTime = panels[endPanelIndex]?.timestamp ?? duration;

      const firstVisibleSecond = Math.ceil(startTime);
      const lastVisibleSecond = Math.floor(endTime);

      for (let sec = firstVisibleSecond; sec <= lastVisibleSecond; sec++) {
        if (sec < 0) continue;

        let panelIndexBefore = -1;
        for (let i = panels.length - 1; i >= 0; i--) {
          if (panels[i].timestamp <= sec) {
            panelIndexBefore = i;
            break;
          }
        }

        if (panelIndexBefore === -1) continue;

        const panelBefore = panels[panelIndexBefore];
        const panelAfter = panels[panelIndexBefore + 1];

        let timeFraction = 0;
        if (panelAfter) {
          const timeDiff = panelAfter.timestamp - panelBefore.timestamp;
          if (timeDiff > 0) {
            timeFraction = (sec - panelBefore.timestamp) / timeDiff;
          }
        }

        const panelIndexForSecond = panelIndexBefore + timeFraction;
        const positionInWindow = panelIndexForSecond - firstVisiblePanelIndex;
        const x = positionInWindow * barWidth;

        if (x >= 0 && x <= width) {
          ctx.fillText(`${sec}s`, x, timelineBaseY + 15);
        }
      }
    }
  }, [panels, activePanelIndex, duration]);

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
      if (!canvas || duration === 0 || panels.length === 0) return;

      const barsToShow = 15;
      const halfBars = Math.floor(barsToShow / 2);

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const width = canvas.width;

      const clickedBarInWindow = Math.floor((x / width) * barsToShow);
      const clickedIndex = activePanelIndex - halfBars + clickedBarInWindow;

      if (clickedIndex >= 0 && clickedIndex < panels.length) {
        onSeekByPanelIndex(clickedIndex);
      }
    },
    [panels.length, onSeekByPanelIndex, activePanelIndex, duration],
  );

  return (
    <div className="w-full h-32 bg-gray-900 rounded-lg overflow-hidden cursor-pointer shadow-inner">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="w-full h-full"
      ></canvas>
    </div>
  );
};
