# Music Map Editor

[![Deploy](https://img.shields.io/badge/View%20Demo-mrr--group.github.io-blue?style=for-the-badge&logo=github)](https://mrr-group.github.io/music-map-editor/)
[![Repo](https://img.shields.io/badge/GitHub-Repo-lightgrey?style=for-the-badge&logo=github)](https://github.com/MRR-Group/music-map-editor)

A web-based visual editor for creating beat maps for music-based VR games developed by the MRR Group.
![image](https://github.com/user-attachments/assets/fb1d6487-830a-460b-94fe-aacf08764581)

## 🎵 About The Project
The Music Map Editor is a browser-based tool designed to streamline the creation of beat maps for our rhythm-based VR games. It leverages the Web Audio API for sophisticated audio analysis, including beat detection, to automatically generate a baseline map that can be manually fine-tuned.

This tool was built to provide an intuitive and efficient workflow for level designers.

### ✨ Features

- **WAV File Support**: Load and process `.wav` audio files directly in the browser.
- **Automatic Beat Detection**: Uses DSP to analyze the audio and automatically place panels on detected beats.
- **Interactive Visualizers**: Real-time frequency and panel visualizers that are synced with audio playback.
- **Timeline Viewer**: A responsive timeline that displays multiple boards at once, allowing for quick navigation.
- **Panel & Board Editing**:
    - Manually add, remove, or nudge panels to perfectly sync with the music.
    - An interactive 2x4 grid editor for modifying the state of each panel.
- **Import/Export**: Save your work to a custom `.txt` format and load it back in later.
- **Keyboard Shortcuts**: Control playback, navigate panels, and adjust timestamps with keyboard controls.

### 🛠️ Built With
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

## 🚀 Getting Started
To get a local copy up and running, follow these simple steps.

### Prerequisites
You need to have [Bun](https://bun.sh/) installed on your machine.

### Installation
1.  **Clone the repo**
    ```sh
    git clone https://github.com/MRR-Group/music-map-editor.git
    ```
2.  **Navigate to the project directory**
    ```sh
    cd music-map-editor
    ```
3.  **Install dependencies**
    ```sh
    bun install
    ```
4.  **Run the development server**
    ```sh
    bun dev
    ```
    The application will be available at `http://localhost:5173`.

## 📖 Usage
1.  **Load an Audio File**: Drag and drop a `.wav` file onto the dropzone, or click to select a file.
2.  **Wait for Analysis**: If you loaded a WAV file, the application will process the audio to detect beats and generate frequency data. A loading indicator will show the progress.
3.  **Edit the Map**:
    - Use the **Audio Player** to play, pause, and seek through the song.
    - Click on a panel in the **Board Timeline** or use the arrow keys to navigate.
    - Use the **Current Board Editor** to change the state of the cells for the active panel.
    - Use the **Add Panel**, **Remove Panel**, and **Move** buttons to fine-tune the map. Hold `Shift` or `Ctrl` while moving for finer adjustments.
4.  **Import/Export**:
    - Click **Export** to save your map as a `music-map.txt` file.
    - Click **Import** to load a previously saved map file.

### 📄 File Format
The exported `music-map.txt` file has a simple, human-readable format. Each panel is represented by a block of 3 lines, with blocks separated by a blank line.

```
0.46
1100
0000

1.07
0000
0011
```

- **Line 1**: The timestamp of the panel in seconds.
- **Line 2**: The state of the top row of the 2x4 board.
- **Line 3**: The state of the bottom row of the 2x4 board.

Cell states are represented by numbers: `0` (blank), `1` (black), `2` (purple).

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License
Distributed under the MIT License.

## 👥 Contact
MRR Group - [https://github.com/MRR-Group](https://github.com/MRR-Group)
Project Link: [https://github.com/MRR-Group/music-map-editor](https://github.com/MRR-Group/music-map-editor)
