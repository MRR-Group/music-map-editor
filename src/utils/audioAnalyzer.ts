export const analyzeAudio = async (
  audioBuffer: AudioBuffer,
  slices: number,
): Promise<Uint8Array[]> => {
  const duration = audioBuffer.duration;
  const fftSize = 256;
  const frequencyData: Uint8Array[] = [];

  const frameCount = fftSize;

  for (let i = 0; i < slices; i++) {
    const startTime = (i / slices) * duration;

    const offlineCtx = new OfflineAudioContext(
      1,
      frameCount,
      audioBuffer.sampleRate,
    );
    const analyser = offlineCtx.createAnalyser();
    analyser.fftSize = fftSize;

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);

    source.start(0, startTime);

    await offlineCtx.startRendering();

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    frequencyData.push(dataArray);
  }

  return frequencyData;
};
