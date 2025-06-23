export const analyzeAudio = async (
  audioBuffer: AudioBuffer, 
  slices: number
): Promise<Uint8Array[]> => {
  const duration = audioBuffer.duration;
  const fftSize = 256; // A reasonable FFT size for a summary view
  const frequencyData: Uint8Array[] = [];

  // The number of frames needed to get one frequency snapshot.
  const frameCount = fftSize;

  for (let i = 0; i < slices; i++) {
    // Calculate the start time for this slice
    const startTime = (i / slices) * duration;

    // Create a temporary offline context to process a tiny chunk of the audio
    const offlineCtx = new OfflineAudioContext(1, frameCount, audioBuffer.sampleRate);
    const analyser = offlineCtx.createAnalyser();
    analyser.fftSize = fftSize;

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);

    // Start playing from the calculated time offset within the buffer
    source.start(0, startTime);

    // Render the audio chunk and capture the frequency data
    await offlineCtx.startRendering();

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    frequencyData.push(dataArray);
  }

  return frequencyData;
};
