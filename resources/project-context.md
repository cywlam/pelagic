# Pelagic — Project Context

> Terse AI context reference. Use section anchors for targeted lookup (e.g. `#backend-modules`).

## Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Backend Modules](#backend-modules)
- [Frontend Structure](#frontend-structure)
- [State Management](#state-management)
- [Active Development Areas](#active-development-areas)
- [External Services](#external-services)
- [Architectural Constraints](#architectural-constraints)

---

## Overview

**Pelagic** — Tauri 2.0 desktop app for underwater photographers.  
Platforms: Windows (primary), macOS. Version: `0.3.44`. Bundle ID: `com.pelagic.app`.

Core flows:
- Import dives from dive computers (BLE/USB/serial) or files (FIT, SSRF, UDDF)
- Organise: trips → dives → photos; manage RAW+JPEG pairs
- Tag marine species (manual, iNaturalist, AI)
- Visualise dive profiles; map geotagged dive sites
- Sync data to community backend

---

## Architecture

```
Frontend (React/TS/Vite)  ←→  Tauri IPC  ←→  Backend (Rust)  ←→  SQLite (bundled)
                                                     ↕
                                iNaturalist / AI API / Community API
```

- All backend features exposed via `#[tauri::command]` in `commands.rs`
- SQLite bundled (not system); `r2d2_sqlite` connection pool
- Background workers: `sync_worker.rs` (community sync), `watcher.rs` (fs watch)
- DB auto-migrated on startup; pre-seeded with 1,934+ dive sites from `divesites_filtered.csv`
- `dive-computer-ts/` is a git submodule (TypeScript dive computer bindings)

---

## Backend Modules

`src-tauri/src/`

| File | Responsibility |
|------|----------------|
| `commands.rs` | All Tauri IPC handlers — entry point for every frontend `invoke` call |
| `db.rs` | Connection pool, schema init, migrations |
| `import.rs` | Photo/dive import orchestration |
| `photos.rs` | Photo processing, thumbnail generation |
| `metadata.rs` | EXIF/XMP read-write |
| `ai.rs` | AI API integration (species ID, photo analysis) |
| `inaturalist.rs` | iNaturalist API — species search/lookup |
| `biodiversity.rs` | Local species data store |
| `libdc.rs` | FFI bindings to libdivecomputer C library |
| `transport.rs` | Dive computer transports: serial / USB HID / BLE |
| `archive.rs` | Archive/export |
| `backup.rs` | Backup and restore |
| `community.rs` | Community feature API calls |
| `sync_worker.rs` | Background sync worker |
| `validation.rs` | Data validation helpers |
| `watcher.rs` | File system watcher for live photo folder monitoring |

RAW support: DNG, CR2, NEF, CR3 via `rawloader` + `rawler` + `imagepipe`.

---

## Frontend Structure

`src/`

| Path | Purpose |
|------|---------|
| `App.tsx` | Root — layout and routing |
| `components/` | 48 view/modal/panel components (`.tsx` + `.css` pairs) |
| `hooks/` | `useCommunityAuth`, `useCommunitySync`, `useImageData` |
| `stores/` | Zustand stores (see [State Management](#state-management)) |
| `types/` | TypeScript types (`index.ts`, `shareCard.ts`) |
| `utils/` | `dialogs`, `diveNames`, `logger`, `platform`, `shareCardRenderer` |
| `styles/` | `globals.css`, `layout.css` |

Visualisation: Visx (dive profile charts). Maps: Leaflet.

---

## State Management

All state via **Zustand** in `src/stores/`:

| Store | Purpose |
|-------|---------|
| `dataStore.ts` | Primary app data: trips, dives, photos, species |
| `navigationStore.ts` | Current view and selection |
| `searchStore.ts` | Search/filter state |
| `selectionStore.ts` | Multi-select (photos/dives) |
| `uiStore.ts` | Modal, panel, and loading flag state |

---

## Active Development Areas

1. **AI features** — `ai.rs` + AI-related components; species ID and photo analysis
2. **Community/sync** — `community.rs`, `sync_worker.rs`, `useCommunitySync`, `useCommunityAuth`
3. **Dive computer import** — `libdc.rs`, `transport.rs`, `import.rs`; BLE/USB/serial via libdivecomputer FFI
4. **Photo management** — `photos.rs`, `metadata.rs`; RAW+JPEG pairing, EXIF handling, thumbnails
5. **Frontend/UI** — `src/components/`; views, modals, dive profile charts, maps

---

## External Services

| Service | Module | Auth/Config |
|---------|---------|-------------|
| AI API (species/photo analysis) | `ai.rs` | API key via `tauri-plugin-store` |
| iNaturalist API | `inaturalist.rs` | Public — no key required |
| Community backend | `community.rs`, `sync_worker.rs` | URL + auth token via `tauri-plugin-store` |
| GitHub auto-updater | `tauri-plugin-updater` | `https://github.com/wyvernp/pelagic/releases/latest/download/latest.json` |

---

## Architectural Constraints

- **Bundled SQLite**: `rusqlite` feature `bundled` — do not assume system SQLite.
- **libdivecomputer is C FFI**: requires native C compilation; affects cross-compile and CI.
- **Tauri command boundary**: Rust logic must be exposed via `commands.rs` to be callable from the frontend — no direct JS↔Rust access otherwise.
- **BLE is async** (`btleplug`): serial/USB/BLE have different latency/reliability profiles; handle accordingly.
- **RAW processing is CPU-intensive**: run `rawloader`/`rawler`/`imagepipe` off the main thread.
- **DB migrations must be additive**: destructive schema changes will break existing user databases.
- **File watcher** (`watcher.rs` / `notify` crate): monitors photo directories and fires Tauri events on change.
