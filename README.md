# LORESTEAD

> A focus timer where your work time grows a medieval world.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-Lambda%20%2F%20DynamoDB%20%2F%20S3-FF9900?logo=amazonaws&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)

---

## Overview

Lorestead is a productivity web app that combines the Pomodoro technique with a visual world-growth system. As you accumulate focus hours, an animated medieval town on your screen evolves through 8 distinct phases — from an empty field to a thriving city.

## Features

- **Pomodoro Timer** — Active sessions (25 / 45 / 60 / 90 min) and Rest sessions (5 / 10 / 15 min) with preset switching
- **Living World** — Animated medieval town background that evolves through 8 phases based on total accumulated hours (0 → 1 → 3 → 5 → 8 → 12 → 16 → 20 hrs)
- **Timelapse Recording** — Captures your screen during a session and exports an MP4 timelapse when you end the session
- **Picture-in-Picture** — Float the timer in a PiP window so you can work in other tabs without losing track
- **Cloud Sync** — Sign in to save your sessions and progress to AWS; resume from any device
- **Session History** — Browse past sessions with stage thumbnails and download timelapse videos

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | AWS Lambda (Node.js 20), Amazon DynamoDB, Amazon S3 |
| Auth | Amazon Cognito |
| Infrastructure | AWS CDK (TypeScript) |
| Hosting | Vercel (frontend) |

## Project Structure

```
lorestead/
├── frontend/        # React app (Vite + Tailwind CSS)
├── backend/         # Lambda functions (sessions, progress, auth, timelapse)
└── infrastructure/  # AWS CDK stack
```

## Getting Started

### Prerequisites

- Node.js 20+
- AWS account (for backend / infrastructure)
- AWS CLI configured

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run build:all
```

### Infrastructure

```bash
cd infrastructure
npm install
npx cdk deploy
```

## How It Works

1. Hit **START** to begin a focus session.
2. The medieval town animates in the background while your timer runs.
3. Accumulated hours across all sessions determine your world's current **Phase** (1–8).
4. End a session to generate a **timelapse** of your work and save it to history.
5. Sign in to sync progress across devices and resume sessions from where you left off.

## License

MIT
