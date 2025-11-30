<div align="center">

# 🟩 <strong>MC Mod Updater</strong>  
### <em>A Fast, Modern, Browser-Based Mod Update Scanner</em>

<p>
A minimal, efficient, drag-and-drop Minecraft mod updater powered by the Modrinth API.  
Checks compatibility across Fabric, Forge, NeoForge, and Quilt with zero configuration.  
</p>

<br>

<a href="https://mcmodupdater.netlify.app">
  <img src="https://img.shields.io/badge/Live_Demo-Online-brightgreen?style=for-the-badge">
</a>
<img src="https://img.shields.io/badge/Status-Stable-success?style=for-the-badge">
<img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge">
<img src="https://img.shields.io/badge/Platform-Web-orange?style=for-the-badge">

<br><br>

</div>

---

## ✨ Features

<ul>
  <li><strong>Drag-and-drop mod scanning</strong> — Drop any number of <code>.jar</code> files and the app parses them automatically.</li>
  <li><strong>Smart mod name detection</strong> — Cleans file names, strips versions, and matches them accurately.</li>
  <li><strong>Modrinth-powered update search</strong> — Uses the Modrinth API v2 for fast, reliable information.</li>
  <li><strong>Loader support</strong> — Fabric, Forge, NeoForge, Quilt.</li>
  <li><strong>Minecraft version selector</strong> — Includes all major versions from <code>1.21.4</code> down to <code>1.12.2</code>.</li>
  <li><strong>Real-time status UI</strong> — Pending → Checking → Found / Missing.</li>
  <li><strong>One-click bulk download</strong> — Fetches all updated files and bundles them into a single ZIP.</li>
  <li><strong>Modern Minecraft-inspired UI</strong> — Glassmorphism, animated grid, responsive layout.</li>
  <li><strong>Client-side only</strong> — No file uploads, no tracking, fully private.</li>
</ul>

---

## 🚀 How It Works

### **1. Choose Your Target Version**
The sidebar includes a clean version selector covering all actively used MC versions.

### **2. Select a Mod Loader**
Supports:
- Fabric  
- Forge  
- NeoForge  
- Quilt  

### **3. Drop Your Mods**
The app:
- parses `.jar` file names  
- extracts clean mod identifiers  
- prepares them for lookup  

### **4. Scan for Updates**
For each mod:
1. Searches Modrinth  
2. Matches loader + MC version  
3. Shows update status  
4. If available → stores download link  

### **5. Download ZIP**
Aggregates all mod updates into a single ZIP file using:
- **JSZip** for packaging  
- **FileSaver.js** for download  

All of it runs **locally**.

---

## 🧱 Architecture Overview

```
/ (root)
├── index.html          → Main UI + structure
├── mcf.otf             → Minecraft font
├── /scripts            → Drag-drop logic, API calls, ZIP builder
├── /styles             → Theme, layout, animations
└── /assets             → Icons, SVGs (if added)
```

---

## 🔧 Tech Stack

<table>
<tr><td><strong>Frontend</strong></td><td>HTML, CSS, JavaScript</td></tr>
<tr><td><strong>API</strong></td><td>Modrinth API v2</td></tr>
<tr><td><strong>Download System</strong></td><td>JSZip, FileSaver.js</td></tr>
<tr><td><strong>Fonts</strong></td><td>Minecraft, Inter, JetBrains Mono</td></tr>
<tr><td><strong>Design</strong></td><td>Minecraft-inspired glass morphism UI</td></tr>
</table>

---

## 📡 Modrinth API Endpoints Used

```http
GET /v2/search?query=<mod>&limit=1
```

Finds the closest matching project.

```http
GET /v2/project/<project_id>/version?loaders=["<loader>"]&game_versions=["<mc_version>"]
```

Retrieves compatible versions & download URLs.

---

## 🛡️ Security & Privacy

- 100% client-side  
- No telemetry  
- No external file uploads  
- Communication only with Modrinth’s public API  
- Safe for modpack creators & server owners  

---

## 🛣️ Roadmap

- [ ] Auto-detect loader from file manifests  
- [ ] Option to export update reports  
- [ ] Offline support (PWA)  
- [ ] Auto-ignore incompatible mods  
- [ ] Theme customization  

---

## 🤝 Contributing

Pull requests and feature suggestions are welcome.  
Please open an issue before significant changes.

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

### Maintained with 💚 by Bhoid

