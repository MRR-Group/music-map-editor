import * as mm from 'music-metadata';

export const parseFile = async (file: File): Promise<number[]> => {
  try {
    const metadata = await mm.parseBlob(file);
    const { sampleRate, bitsPerSample, numberOfChannels, duration } = metadata.format;

    if (sampleRate && bitsPerSample && numberOfChannels && duration) {
      // Calculate constant bitrate for WAV
      const bitrate = (sampleRate * bitsPerSample * numberOfChannels) / 1000; // in kbps
      const boardsPerSecond = 4; // Generate 4 boards per second
      const numberOfPoints = Math.ceil(duration) * boardsPerSecond;
      const bitrateData = new Array(numberOfPoints).fill(bitrate);
      return bitrateData;
    }
    return [];
  } catch (error) {
    console.error('Error parsing file:', error);
    return [];
  }
};
