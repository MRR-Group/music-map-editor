export const detectBeats = async (
  audioBuffer: AudioBuffer,
): Promise<number[]> => {
  const sampleRate = audioBuffer.sampleRate;

  const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  const filter = offlineCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 150;
  filter.Q.value = 1;

  source.connect(filter);
  filter.connect(offlineCtx.destination);
  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  const channelData = renderedBuffer.getChannelData(0);

  const hopSizeInSeconds = 0.01;
  const hopSizeInFrames = Math.floor(hopSizeInSeconds * sampleRate);
  const energies: number[] = [];

  for (let i = 0; i < channelData.length; i += hopSizeInFrames) {
    let energy = 0;
    for (let j = i; j < i + hopSizeInFrames && j < channelData.length; j++) {
      energy += channelData[j] * channelData[j];
    }
    energies.push(energy);
  }

  const beats: number[] = [];
  const localAverageWindowSize = Math.floor(0.5 / hopSizeInSeconds);

  for (let i = 0; i < energies.length; i++) {
    const start = Math.max(0, i - localAverageWindowSize);
    const end = Math.min(energies.length - 1, i + localAverageWindowSize);
    let localAverage = 0;

    for (let j = start; j <= end; j++) {
      localAverage += energies[j];
    }
    localAverage /= end - start + 1;

    const isPeak =
      i > 0 && i < energies.length - 1
        ? energies[i] > energies[i - 1] && energies[i] > energies[i + 1]
        : false;

    if (isPeak && energies[i] > localAverage * 1.5) {
      beats.push(i * hopSizeInSeconds);
    }
  }

  const minTimeBetweenBeats = 0.25;
  const debouncedBeats: number[] = [];

  if (beats.length > 0) {
    debouncedBeats.push(beats[0]);
    let lastBeatTime = beats[0];

    for (let i = 1; i < beats.length; i++) {
      if (beats[i] - lastBeatTime > minTimeBetweenBeats) {
        debouncedBeats.push(beats[i]);
        lastBeatTime = beats[i];
      }
    }
  }

  return debouncedBeats;
};
