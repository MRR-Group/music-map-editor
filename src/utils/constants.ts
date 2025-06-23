export const INITIAL_BITRATE_STRING = `62.192
62.721
63.239
63.756
64.287
64.804
65.322
65.851
66.368
66.896
67.413
67.931
68.456
68.974
69.491
70.025
70.542
71.060
71.595
72.113
72.630`;

// You can add other constants here, e.g.,
// export const API_BASE_URL = 'https://api.example.com';


// src/utils/types.ts
// This file centralizes all your custom TypeScript type definitions.
// Represents the state of a single cell on the game board.
// 0: Blank (gray-700)
// 1: Black (gray-800)
// 2: Purple (purple-600)
export type CellState = 0 | 1 | 2;