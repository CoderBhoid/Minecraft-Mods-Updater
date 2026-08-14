# MC Mod Updater — Domain Migration & Upgrade Implementation Brief

> **Purpose of this document:** This is a task brief intended for an LLM/coding agent to execute against the `mc-mod-updater` repository. It contains project context, the exact tasks to perform, and acceptance criteria. Work through the phases in order unless told otherwise.

---

## 0. Project Context

- **Project Name:** Minecraft Mods Updater (`mc-mod-updater`)
- **Repository:** `CoderBhoid/Minecraft-Mods-Updater`
- **Stack:** React 19, TypeScript 5.8, Vite 6.2, Tailwind CSS 4, Framer Motion 12, JSZip, FileSaver, Modrinth API v2
- **Current Live URL:** `https://mods-updater-minecraft.vercel.app`
- **New Target Domain:** `mcmods.sednium.com`
- **Parent Site to Credit/Link:** `https://sednium.com`

**What the app does:** A client-side SPA where users drag-and-drop Minecraft `.jar` mod files into the browser. The app SHA-1 hashes them, looks them up against the Modrinth API, resolves newer compatible versions + missing dependencies, and lets users download updates individually or as a bundled `.zip`.

### Relevant file map

```
mc-mod-updater/
├── App.tsx                  # Root component: all state + handlers (upload, checkUpdates, downloadAll)
├── constants.ts              # Static fallback MC versions + loader list
├── types.ts                  # ModFile, ModStatus, ModLoader, Modrinth API types
├── index.html                 # SEO meta, canonical URL, OG/Twitter tags, importmap
├── index.tsx / index.css
├── metadata.json              # App metadata manifest
├── .env.local
├── components/
│   ├── Button.tsx
│   ├── Footer.tsx            # <-- footer link goes here
│   ├── LandingPage.tsx
│   └── ModCard.tsx            # Per-mod status card (pending/checking/found/missing/error/up-to-date)
├── services/
│   └── modrinth.ts            # Modrinth API client (search, hash lookup, version resolve, project info)
├── utils/
│   └── fileHelpers.ts         # cleanModName, formatFileSize, computeSHA1
└── public/
    ├── robots.txt              # <-- update sitemap URL
    └── sitemap.xml             # <-- update <loc> entries
```

### Key existing types (for reference, do not break these contracts)
- `ModLoader`: `'fabric' | 'forge' | 'neoforge' | 'quilt'`
- `ModStatus`: `'pending' | 'checking' | 'found' | 'missing' | 'error' | 'up-to-date'`
- `ModFile`: `{ id, originalFile, name, status, downloadUrl, fileName, iconUrl, projectId, versionId, missingDependencies }`

---

## Phase 1 — Domain Migration & Footer Link (do this first, low risk)

### 1.1 DNS / Vercel
- [ ] Add `mcmods.sednium.com` as a CNAME record → Vercel's assigned target (`cname.vercel-dns.com` or the project-specific value shown in Vercel dashboard).
- [ ] In Vercel project settings → Domains, add `mcmods.sednium.com` and set it as the **primary** production domain.
- [ ] Confirm the old `mods-updater-minecraft.vercel.app` URL 301-redirects to the new domain (Vercel handles this automatically once a custom domain is primary — verify, don't assume).
- [ ] Confirm SSL certificate auto-provisions on the new domain.

### 1.2 Footer link to sednium.com
- [ ] Edit `components/Footer.tsx`: add a link to `https://sednium.com` (e.g. label it "Part of the Sednium projects" or similar — match existing footer tone/style), placed alongside the existing Modrinth attribution/credits section.
- [ ] Decide visibility scope: if the footer has a `showInfo` prop that toggles a detailed "About" section (currently shown only on the landing page), either keep the new link inside that conditional block, or move it outside so it's visible on every screen — pick whichever matches how the rest of the footer credits behave, and keep it consistent.

### 1.3 Update all hardcoded domain references
- [ ] `index.html`: update canonical URL, `og:url`, Twitter card URL to `https://mcmods.sednium.com`.
- [ ] `public/sitemap.xml`: update all `<loc>` entries to the new domain.
- [ ] `public/robots.txt`: update the `Sitemap:` directive URL.
- [ ] `metadata.json`: update any URL fields present.
- [ ] `.env.local`: update any base-URL env var if one exists (e.g. used for share links or canonical generation).

### Acceptance criteria — Phase 1
- Visiting `mcmods.sednium.com` loads the app correctly with valid SSL.
- Visiting the old `.vercel.app` URL redirects (not 404s) to the new domain.
- Footer visibly links to `sednium.com`.
- No leftover hardcoded references to the old domain anywhere in the repo (`grep -r "mods-updater-minecraft.vercel.app"` should return nothing after the change, aside from an intentional historical mention if desired).

---

## Phase 2 — Feature & QoL Upgrades

Implement in the order given — each tier assumes the previous tier is done, since some later items build on earlier state changes (e.g. persisted settings before profiles).

### 2.1 Quick wins (low effort, high QoL)
- [ ] **Persist settings** — store last-used `loader` and `mcVersion` in `localStorage`; hydrate on load so returning users don't have to reselect every session.
- [ ] **Search/filter mods** — add a text input that filters the visible `ModCard` list by mod name, useful once a user has 30+ mods loaded.
- [ ] **Sort/group by status** — group or sort `ModCard`s by `ModStatus` (up-to-date / found / missing / error) so users can triage results at a glance.
- [ ] **Per-mod retry button** — on `error`/`missing` status cards, add a retry action that re-runs just that mod's check instead of forcing a full re-run of `checkUpdates()`.
- [ ] **Folder drag-and-drop** — confirm/extend the existing drop handler to accept a dropped folder of `.jar` files, not just individually selected files.
- [ ] **Copy mod list as text** — a button that copies the current mod list (names + versions) to clipboard, useful for sharing/debugging a modpack.

### 2.2 Medium effort
- [ ] **Progress indicator during batch operations** — replace/augment the generic spinner during `checkUpdates()` and `downloadAll()` with a count (e.g. "12/40 checked") so long batches feel responsive.
- [ ] **Version pinning / "skip this update"** — let a user mark a specific mod as intentionally held back so future `checkUpdates()` runs don't re-flag it.
- [ ] **Changelog preview** — Modrinth's version endpoint returns changelog text; surface it in an expandable section or modal on `ModCard` before the user downloads.
- [ ] **Per-mod loader/version override** — allow overriding the global `mcVersion`/`loader` for a single mod (handles cases where one mod needs to stay on an older MC version).
- [ ] **Export/import mod list as JSON** — export the current mod manifest (names, project IDs, versions — not the binary jars) so users can share a modpack definition and someone else can re-resolve downloads from it.

### 2.3 Larger features
- [ ] **Modpack profiles** — allow saving/loading named sets of loader + MC version + mod list (localStorage or IndexedDB), so users can manage multiple instances/modpacks.
- [ ] **File System Access API sync** (Chromium browsers) — read a live mods folder directly, check for updates, and write updated jars back to disk without manual zip/unzip. Feature-detect and fall back to the existing flow on unsupported browsers.
- [ ] **Curseforge as secondary source** — new `services/curseforge.ts` mirroring the function shape of `services/modrinth.ts` (`searchMod`, `getVersionByHash` equivalent, `getProject`, `getLatestVersion`), used as fallback when Modrinth has no match.
- [ ] **Dependency graph view** — a visualization (even a simple nested list) showing shared dependencies across mods before a user bulk-adds them.

### Architecture guidance before starting 2.x
- `App.tsx` currently owns all state directly. Before adding persisted settings + profiles (2.1/2.3), consider extracting mod-related state into a `useMods()` hook or reducer so the component doesn't keep growing unmanageably. This refactor should happen once, early, rather than repeatedly patched.
- Follow the existing pattern in `services/modrinth.ts` (one exported function per API concern) for any new API client, e.g. Curseforge.
- Changelog and progress-tracking fields should be added to the existing `ModFile` type in `types.ts` (e.g. optional `changelog?: string`, `progress?: number`) rather than introducing a parallel state shape.

### Acceptance criteria — Phase 2
- Existing core flow (upload → check updates → download individually or as zip) is not broken by any addition.
- All new features degrade gracefully (e.g. File System Access API feature-detects and falls back).
- New localStorage/IndexedDB usage is namespaced (e.g. prefixed keys) to avoid collisions with future features.
- TypeScript types remain accurate — no `any` introduced to bypass the existing `ModFile`/`ModrinthVersion` contracts.

---

## Suggested delivery order (if versioning releases)
1. **v1.1** — Phase 1 (domain + footer) + Phase 2.1 (quick wins)
2. **v1.2** — Phase 2.2 (medium effort)
3. **v2.0** — Phase 2.3 (larger features, likely needs its own design/testing pass)
