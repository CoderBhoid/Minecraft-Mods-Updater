# 📦 MC Mod Updater — Complete Project Structure & Architecture Guide

> **Project Name:** Minecraft Mods Updater (`mc-mod-updater`)  
> **Repository Target:** [CoderBhoid/Minecraft-Mods-Updater](https://github.com/CoderBhoid/Minecraft-Mods-Updater)  
> **Primary Technology Stack:** React 19, TypeScript 5.8, Vite 6.2, Tailwind CSS 4, Framer Motion 12, JSZip, FileSaver, Modrinth API v2, CurseForge API  
> **Live Target Domain:** [https://mcmods.sednium.com](https://mcmods.sednium.com)  
> **Ecosystem:** [Sednium](https://sednium.com)

---

## 1. Project Overview & Architecture

**MC Mod Updater** is a client-side single-page web application (SPA) designed to simplify Minecraft modpack maintenance. It allows users to drag-and-drop their Minecraft `.jar` mod files or entire `.minecraft/mods` directory directly into the browser to detect outdated mods, verify file integrity, resolve missing library dependencies, manage modpack profiles, sync directly with disk via the File System Access API, and download updated versions in bulk as a unified `.zip` archive or individually.

### Core Architecture Flow:
1. **Client-Side Ingestion & Recursive Folder Traversal**:
   - Mod files (`.jar`) or entire folders are ingested in-browser via HTML5 Drag and Drop (`webkitGetAsEntry`) or File Picker. The browser Web Crypto API calculates SHA-1 hashes of the files locally.
2. **Dual-Source API Verification & Identification**:
   - **Primary Lookup**: Modrinth v2 `/version_file/{hash}` endpoint matches exact file signatures.
   - **Fuzzy Search Fallback**: If hash lookup returns 404, the app sanitizes the filename into a clean query and queries `/search?query={name}&facets=[["categories:{loader}"]]`.
   - **Secondary Source Fallback (CurseForge)**: If Modrinth returns no match, queries `services/curseforge.ts` to locate project and version files.
3. **Target Version Resolution & Overrides**:
   - Queries `/project/{id}/version?loaders=[loader]&game_versions=[mcVersion]` to locate compatible updates.
   - Supports per-mod loader and MC version overrides for hybrid/compatibility modpacks.
   - Supports version pinning to intentionally skip updates on select mods.
4. **Dependency Resolution**:
   - Scans required dependencies returned by Modrinth and alerts the user if any required library is not in the installed list, offering a 1-click addition button or bulk "Resolve All Dependencies" modal.
5. **Profiles & State Persistence**:
   - Persists last-used loader, game version, and filters in `localStorage` under `mcmodupdater:settings`.
   - Supports named Modpack Profiles (`mcmodupdater:profiles`) to switch between modpacks.
6. **Bulk Packaging & Direct Disk Sync**:
   - **ZIP Packaging**: Fetches download streams for all updated mod JARs in parallel and compresses them using `jszip`, generating a downloadable `.zip` file with `file-saver`.
   - **Direct Folder Sync**: Chromium File System Access API reads from and writes updated JAR files directly into the local directory, replacing obsolete files.

---

## 2. Directory Tree Structure

```text
mc-mod-updater/
├── .env.local                    # Local environment variables
├── .gitignore                    # Git ignore rules
├── App.tsx                       # Root React component (state, handlers, layout)
├── constants.ts                  # Static fallbacks for Minecraft versions & loaders
├── font_base64.txt               # Raw Base64 string for Minecraft font (subset)
├── font_base64_full.txt          # Raw Base64 string for Minecraft font (full)
├── footer.txt                    # CSS snippet closing @font-face definition
├── header.txt                    # CSS snippet opening @font-face definition
├── index.css                     # Main stylesheet importing Tailwind CSS
├── index.html                    # Root HTML file with meta tags, importmaps & scripts
├── index.tsx                     # React DOM entry point
├── metadata.json                 # Application metadata manifest
├── minecraft-font.css            # Base64 embedded Monocraft pixel font stylesheet
├── package.json                  # NPM dependencies and scripts
├── package-lock.json             # NPM lockfile
├── postcss.config.js             # PostCSS configuration with Tailwind plugin
├── projectdesc.md                # Full project structure and component documentation
├── README.md                     # Project overview and documentation
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript compiler configuration
├── types.ts                      # Core TypeScript definitions and Modrinth/CurseForge types
├── vite.config.ts                # Vite build and dev server configuration
│
├── components/                   # UI Presentation Components
│   ├── Button.tsx                # Reusable styled button with loading state & variants
│   ├── ChangelogModal.tsx        # Version release notes and changelog modal
│   ├── DependencyGraphModal.tsx  # Visual dependency tree & 1-click resolver modal
│   ├── FolderSyncModal.tsx       # Direct File System Access API disk sync modal
│   ├── Footer.tsx                # Application footer with Sednium & Modrinth attribution
│   ├── LandingPage.tsx           # Feature grid & quickstart actions when list is empty
│   ├── ModCard.tsx               # Interactive card for individual mod items
│   ├── ModFilterBar.tsx          # Search, status pills, sort, copy & export toolbar
│   ├── ProfileManagerModal.tsx   # Modpack profiles switcher & manager modal
│   ├── ProgressBar.tsx           # High-polish batch scan & download progress indicator
│   └── ToastContainer.tsx        # Animated feedback toast notifications
│
├── fonts/                        # Font assets
│   └── Monocraft.ttf             # Monocraft pixel font TrueType binary
│
├── hooks/                        # React Custom Hooks
│   ├── useFolderSync.ts          # File System Access API direct directory sync
│   ├── useModSettings.ts         # Persistent loader, mcVersion, filters & sort state
│   ├── useMods.ts                # Mod ingestion, scanning, pinning, retries & downloads
│   ├── useProfiles.ts            # Named modpack profile CRUD state management
│   └── useToast.ts               # Toast alerts and notification bus
│
├── public/                       # Static public assets
│   ├── fonts/                    # Static font directory
│   ├── robots.txt                # Search engine crawler instructions with sitemap
│   └── sitemap.xml               # XML sitemap for SEO discovery
│
├── services/                     # External API Integrations
│   ├── curseforge.ts             # CurseForge API fallback service
│   └── modrinth.ts               # Modrinth v2 API service client functions
│
└── utils/                        # Utility & Helper Functions
    ├── fileHelpers.ts            # Name cleaner, hashing, folder traversal & manifest parser
    └── storage.ts                # Namespaced localStorage persistence helper
```

---

## 3. Comprehensive File-by-File Breakdown

---

### 3.1. Core Application & Hooks

#### `App.tsx`
- **Location:** `./App.tsx`
- **Purpose:** Root component coordinating all custom hooks, global drag-and-drop listener, sidebar configuration, responsive mod card grid, and modal dialogs.
- **Key Integrations:**
  - `useModSettings`: Persistent environment config (`versionType`, `mcVersion`, `loader`, `sortBy`, `searchQuery`, `filterStatus`).
  - `useMods`: Batch update pipeline, single downloads, bulk ZIP packaging, version pinning, per-mod retries, overrides, and dependency resolution.
  - `useProfiles`: Modpack profile switcher and persistence.
  - `useFolderSync`: Direct local directory sync.
  - `useToastManager`: Feedback toasts.

#### `hooks/useMods.ts`
- **Location:** `./hooks/useMods.ts`
- **Purpose:** Centralized business logic for mod list lifecycle, SHA-1 calculation, two-phase identification, CurseForge fallback, pinning, and downloads.
- **Key Methods:** `addFiles`, `removeMod`, `clearMods`, `togglePin`, `setModOverride`, `retryMod`, `checkUpdates`, `addDependency`, `resolveAllDependencies`, `downloadOne`, `downloadAll`, `exportManifest`, `importManifest`.

#### `hooks/useModSettings.ts`
- **Location:** `./hooks/useModSettings.ts`
- **Purpose:** Manages persistent settings and search/filter state in `localStorage` under `mcmodupdater:settings`.

#### `hooks/useProfiles.ts`
- **Location:** `./hooks/useProfiles.ts`
- **Purpose:** Handles named modpack profile CRUD operations in `localStorage` under `mcmodupdater:profiles`.

#### `hooks/useFolderSync.ts`
- **Location:** `./hooks/useFolderSync.ts`
- **Purpose:** Integrates with the Chromium File System Access API (`window.showDirectoryPicker`) to read `.jar` files and write updated downloads directly into the local folder.

#### `hooks/useToast.ts`
- **Location:** `./hooks/useToast.ts`
- **Purpose:** Global event bus and hook for toast notifications (`success`, `warning`, `error`, `info`).

---

### 3.2. Components (`components/`)

- **`Button.tsx`**: Accessible custom button supporting variants (`primary`, `secondary`, `outline`, `ghost`), loading spinners, and touch targets (min 48px).
- **`ModCard.tsx`**: Rich mod card featuring status badges, pinned indicator, retry button, per-mod loader/version override dialog, changelog trigger, and dependency alerts.
- **`ModFilterBar.tsx`**: Toolbar containing search bar, status pills (`All`, `Updates Found`, `Attention`, `Pinned`), sort selector, copy list dropdown (Markdown, Discord, Plain text), JSON import/export buttons, and modal triggers.
- **`ProgressBar.tsx`**: Real-time batch scan and download progress bar with percentage, step details, and neon pulse styling.
- **`DependencyGraphModal.tsx`**: Interactive modal displaying required dependencies and 1-click "Resolve All" bulk resolution.
- **`ProfileManagerModal.tsx`**: Modal for creating, switching, updating, and deleting named modpack profiles.
- **`FolderSyncModal.tsx`**: Directory picker connection status, disk update trigger, and progress indicators.
- **`ChangelogModal.tsx`**: Release notes viewer for inspecting mod changes before downloading.
- **`ToastContainer.tsx`**: Floating bottom-right animated toast notifications.
- **`LandingPage.tsx`**: Welcome hero section with quickstart buttons and feature breakdown.
- **`Footer.tsx`**: Attribution to `https://sednium.com`, Modrinth API, and maintainer credits.

---

### 3.3. Services & Utilities

- **`services/modrinth.ts`**: Modrinth API v2 client for SHA-1 hash lookup, project search, version filtering, and game tags.
- **`services/curseforge.ts`**: Secondary provider client for searching and fetching updates from CurseForge when Modrinth has no match.
- **`utils/fileHelpers.ts`**: Helper functions for filename regex sanitization (`cleanModName`), byte formatting (`formatFileSize`), Web Crypto SHA-1 hashing (`computeSHA1`), recursive folder traversal (`extractJarFilesFromDataTransfer`), clipboard formatting, and JSON manifest import/export.
- **`utils/storage.ts`**: Safe `localStorage` wrapper with prefix `mcmodupdater:`.

---

## 4. Key Summary Table of Project Files

| File Path | Type | Key Responsibility |
|---|---|---|
| [`App.tsx`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/App.tsx) | React / TSX | Main application container, global drag-and-drop listener, sidebar & grid layout |
| [`types.ts`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/types.ts) | TypeScript | Type definitions for `ModFile`, profiles, manifests, progress, and API schemas |
| [`constants.ts`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/constants.ts) | TypeScript | Fallback Minecraft releases (`1.21.4`–`1.7.2`), snapshots, and loader options |
| [`services/modrinth.ts`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/services/modrinth.ts) | TypeScript | Primary Modrinth v2 API integration |
| [`services/curseforge.ts`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/services/curseforge.ts) | TypeScript | Secondary CurseForge API fallback integration |
| [`hooks/useMods.ts`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/hooks/useMods.ts) | TypeScript Hook | Mod ingestion, identification, scans, pinning, retries, and downloads |
| [`hooks/useModSettings.ts`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/hooks/useModSettings.ts) | TypeScript Hook | Persistent settings, search, filter, and sorting state |
| [`hooks/useProfiles.ts`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/hooks/useProfiles.ts) | TypeScript Hook | Named modpack profile CRUD state management |
| [`hooks/useFolderSync.ts`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/hooks/useFolderSync.ts) | TypeScript Hook | File System Access API integration for direct local folder sync |
| [`hooks/useToast.ts`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/hooks/useToast.ts) | TypeScript Hook | Global toast feedback system |
| [`utils/fileHelpers.ts`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/utils/fileHelpers.ts) | TypeScript | Hashing, name cleaning, folder extraction, clipboard text & manifest JSON |
| [`utils/storage.ts`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/utils/storage.ts) | TypeScript | Namespaced `localStorage` persistence helper |
| [`components/ModCard.tsx`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/components/ModCard.tsx) | React / TSX | Interactive mod card with status, pin, retry, override, changelog & download |
| [`components/ModFilterBar.tsx`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/components/ModFilterBar.tsx) | React / TSX | Search bar, status filter pills, sort dropdown, copy list & manifest actions |
| [`components/ProgressBar.tsx`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/components/ProgressBar.tsx) | React / TSX | High-polish batch scan and download progress bar |
| [`components/DependencyGraphModal.tsx`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/components/DependencyGraphModal.tsx) | React / TSX | Interactive dependency tree and bulk resolution modal |
| [`components/ProfileManagerModal.tsx`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/components/ProfileManagerModal.tsx) | React / TSX | Modpack profile switcher and manager modal |
| [`components/FolderSyncModal.tsx`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/components/FolderSyncModal.tsx) | React / TSX | Direct local directory synchronization modal |
| [`components/ChangelogModal.tsx`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/components/ChangelogModal.tsx) | React / TSX | Version release notes inspection modal |
| [`components/ToastContainer.tsx`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/components/ToastContainer.tsx) | React / TSX | Animated toast notification stack |
| [`components/LandingPage.tsx`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/components/LandingPage.tsx) | React / TSX | Empty-state hero banner with quickstart actions & feature cards |
| [`components/Footer.tsx`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/components/Footer.tsx) | React / TSX | Footer with Sednium & Modrinth links and credits |
| [`index.html`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/index.html) | HTML | Document head, SEO metadata, canonical URLs to `mcmods.sednium.com` |
| [`public/robots.txt`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/public/robots.txt) | Text | Crawler instructions linking to `mcmods.sednium.com/sitemap.xml` |
| [`public/sitemap.xml`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/public/sitemap.xml) | XML | SEO sitemap for `mcmods.sednium.com` |
| [`README.md`](file:///run/media/bhoid/StorageVault/WEbs/mc-mod-updater/README.md) | Markdown | Updated documentation with new live demo links and feature summary |
