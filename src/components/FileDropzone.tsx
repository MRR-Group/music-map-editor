import React, { useCallback, useRef } from "react";

interface FileDropzoneProps {
  onFileDrop: (file: File) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ onFileDrop }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file && file.type === "audio/wav") {
        onFileDrop(file);
      }
    },
    [onFileDrop],
  );

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file && file.type === "audio/wav") {
      onFileDrop(file);
    }
  };

  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="w-full max-w-6xl h-64 border-4 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer"
      onDrop={handleFileDrop}
      onDragOver={handleDragOver}
      onClick={handleDropzoneClick}
    >
      <p className="text-gray-400">
        Drag and drop a WAV file here, or click to select a file
      </p>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        accept="audio/wav"
      />
    </div>
  );
};
