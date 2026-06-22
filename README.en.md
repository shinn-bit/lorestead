# LORESTEAD

> A focus timer where your work time — or your completed tasks — grows a medieval world.

[日本語版 → README.md](./README.md)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss&logoColor=white)

---

![Splash](frontend/screenshot/01_splash.png)

---

## Overview

Lorestead is a web app that blends a focus timer with a world-building game experience. At the start of each session, choose how your world grows — then watch an animated medieval town evolve through 5 stages as you work. No login required. Fully client-side.

## Screenshots

| Setup | Home |
|---|---|
| ![Setup](frontend/screenshot/02_setup.png) | ![Home](frontend/screenshot/03_home.png) |

| Task Mode |  |
|---|---|
| ![Tasks](frontend/screenshot/04_tasks.png) | |

## Features

### 3 Growth Modes

| Mode | How it grows |
|---|---|
| **By Time** | Set a time goal — the town evolves through 5 phases as you progress |
| **By Tasks** | Add a to-do list — each completed task pushes the town forward |
| **Free** | No setup needed — the town grows automatically every hour (complete in 4h) |

### More Features

- **5-stage world evolution** — animated medieval town video changes with each phase
- **Setup wizard** — guided onboarding tour to choose your mode on first launch
- **Timelapse generation** — captures your screen during a session and exports an MP4
- **Picture-in-Picture** — float the timer in a PiP window while working in other tabs
- **Hide UI** — hide all UI to show only the world video fullscreen
- **Chronicle (History)** — browse and download past session timelapses locally
- **EN / JP interface** — switch between English and Japanese

## Tech Stack

| | |
|---|---|
| Framework | React 19, TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Storage | IndexedDB (timelapses & frames) |
| Browser APIs | MediaRecorder, getDisplayMedia, documentPictureInPicture |
| Hosting | Vercel |

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

## How to Use

1. On first launch, select your **language** → choose a **growth mode** in the setup wizard
2. Hit **START** — the world comes alive
3. In Task mode, check off tasks on the right to evolve the town
4. Hit **END SESSION** to generate a timelapse and save it to history
5. Open the **HISTORY** tab to watch and download past timelapses

## License

MIT
