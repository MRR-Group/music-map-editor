import React, {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";

interface AudioPlayerProps {
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onSeek: (time: number) => void;
  currentTime: number;
  duration: number;
  audioUrl: string | null;
  isPlaying: boolean;
  onIsPlayingChange: (isPlaying: boolean) => void;
}

export const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(
  (
    {
      onTimeUpdate,
      onDurationChange,
      onSeek,
      currentTime,
      duration,
      audioUrl,
      isPlaying,
      onIsPlayingChange,
    },
    ref,
  ) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    useImperativeHandle(ref, () => audioRef.current!);

    useEffect(() => {
      if (
        audioRef.current &&
        Math.abs(audioRef.current.currentTime - currentTime) > 0.1
      ) {
        audioRef.current.currentTime = currentTime;
      }
    }, [currentTime]);

    useEffect(() => {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current
            .play()
            .catch((e) => console.error("Error playing audio:", e));
        } else {
          audioRef.current.pause();
        }
      }
    }, [isPlaying]);

    const handlePlayPause = useCallback(() => {
      onIsPlayingChange(!isPlaying);
    }, [isPlaying, onIsPlayingChange]);

    const handleTimeUpdate = useCallback(() => {
      if (audioRef.current) {
        onTimeUpdate(audioRef.current.currentTime);
      }
    }, [onTimeUpdate]);

    const handleLoadedMetadata = useCallback(() => {
      if (audioRef.current) {
        onDurationChange(audioRef.current.duration);
      }
    }, [onDurationChange]);

    const handleProgressClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (audioRef.current && duration > 0) {
          const progressBar = e.currentTarget;
          const clickX = e.clientX - progressBar.getBoundingClientRect().left;
          const newTime = (clickX / progressBar.offsetWidth) * duration;
          onSeek(newTime);
        }
      },
      [duration, onSeek],
    );

    const skipTime = useCallback(
      (delta: number) => {
        if (audioRef.current) {
          const newTime = Math.max(
            0,
            Math.min(duration, audioRef.current.currentTime + delta),
          );
          onSeek(newTime);
          audioRef.current.currentTime = newTime;
        }
      },
      [duration, onSeek],
    );

    const formatTime = (time: number): string => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
      <div className="w-full bg-gray-800 rounded-lg shadow-lg p-4">
        <audio
          ref={audioRef}
          src={audioUrl || ""}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => onIsPlayingChange(false)}
          preload="metadata"
        ></audio>
        <div className="flex items-center justify-between mb-4">
          {/* Skip backward button */}
          <button
            onClick={() => skipTime(-0.5)}
            className="p-2 bg-purple-600 text-white rounded-full shadow-md hover:bg-purple-700 transition-colors"
            title="Go back 0.5 seconds"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
              ></path>
            </svg>
          </button>
          <button
            onClick={handlePlayPause}
            className="p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors transform hover:scale-105"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            )}
          </button>
          <button
            onClick={() => skipTime(0.5)}
            className="p-2 bg-purple-600 text-white rounded-full shadow-md hover:bg-purple-700 transition-colors"
            title="Jump forward 0.5 seconds"
          >
            <svg
              className="w-5 h-5 rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
              ></path>
            </svg>
          </button>
        </div>
        <div
          className="w-full h-2 bg-gray-700 rounded-full cursor-pointer overflow-hidden relative group"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
          ></div>
          <div
            className="absolute top-0 left-0 h-full bg-purple-400 opacity-0 group-hover:opacity-50 transition-opacity"
            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
          ></div>
        </div>
        <div className="text-gray-400 text-sm mt-2">
          {formatTime(currentTime)} /&nbsp;{formatTime(duration)}
        </div>
      </div>
    );
  },
);
