# MC Mod Updater

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)
[![Live Demo](https://img.shields.io/badge/demo-live-green.svg)](https://mcmods.sednium.com)

**MC Mod Updater** is the ultimate tool for Minecraft players who want to keep their modpack up-to-date without the hassle. It simplifies the process of managing mods by automatically detecting outdated files, resolving missing dependencies, and fetching the latest versions directly from Modrinth.

## ✨ Key Features

### 🔍 Intelligent Detection
-   **Hash-Based Identification**: Identifies mods by their SHA-1 hash to ensure 100% accuracy, even if filenames are changed.
-   **Fuzzy Search Fallback**: If a hash isn't found, it uses smart name matching to find the correct project on Modrinth.

### 🧩 Dependency Resolution
-   **Auto-Resolve**: Automatically detects required dependencies (e.g., Fabric API, Cloth Config) for your mods.
-   **Missing Dependency Alerts**: Clearly highlights which dependencies are missing so you can add them with one click.

### 🌍 Universal Support
-   **Multi-Loader Support**: Fully supports **Fabric**, **Forge**, **NeoForge**, and **Quilt**.
-   **Version Targeting**: Supports both **Release** versions (e.g., 1.20.4) and **Snapshots** (e.g., 24w14a).
-   **Cross-Version Checks**: Easily check if your mods have updates for a newer version of Minecraft.

### ⚡ User Experience
-   **Drag & Drop Interface**: simply drag your entire `mods` folder into the window.
-   **Bulk Download**: Download all updated mods and dependencies as a single optimized `.zip` file.
-   **Modern UI**: A focused, dark-mode interface designed for ease of use.

## 🛠️ Installation & Setup

### Prerequisites
-   **Node.js** (v18 or higher)
-   **npm** (comes with Node.js)

### Quick Start
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/mc-mod-updater.git
    cd mc-mod-updater
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  **Open the app**:
    Launch your browser and go to `http://localhost:3000`.

## 📖 How It Works

1.  **Select Your Environment**: Choose your Minecraft version (e.g., 1.20.1) and Mod Loader (Fabric, Forge, etc.).
2.  **Import Mods**: Drag and drop your `.jar` files onto the central drop zone.
3.  **Scan**: The app calculates SHA-1 hashes of your files and queries the Modrinth API.
4.  **Review**:
    -   **Green**: Update available!
    -   **Red**: Mod not found or no compatible version.
    -   **Yellow**: Missing dependency detected.
5.  **Download**: Click "Download ZIP" to get the latest versions of all compatible mods.

## 📦 Technology Stack

-   **Frontend Framework**: [React](https://react.dev/) (v19)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Animations**: [Framer Motion](https://www.framer.com/motion/)
-   **API Integration**: [Modrinth API v2](https://docs.modrinth.com/)
-   **Utilities**: `jszip`, `file-saver` for file management.

## 🤝 Contributing

Contributions are welcome! If you'd like to improve the project:

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <p>Built with ❤️ by <b>Bhoid</b> for the Minecraft community.</p>
  <p>Powered by <b>Sednium</b></p>
  <br />
  <p style="font-size: 0.8rem; color: #666;">NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG.</p>
</div>
