# CTFLingo

A modern, gamified CTF (Capture The Flag) cybersecurity learning platform built with React, Vite, Tailwind CSS, and **Local SQLite**.

Runs 100% locally with zero external database dependencies — fully self-contained and ready to push to GitHub!

---

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd project
npm install --legacy-peer-deps
```

### 2. Run Locally (Development)
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

> On first launch, the local SQLite database (`ctflingo.db`) is automatically initialized and seeded with cybersecurity units, lessons, CTF paths, challenges, and user accounts!

---

## 🔐 Default Demo Accounts

| Role | Username / Email | Password | Access |
|---|---|---|---|
| **Administrator** | `admin` (`admin@ctflingo.local`) | `admin123` | Full Admin Panel access (Units, Lessons, Challenges, CTF Paths, Users) |
| **Student** | `netrunner` (`netrunner@ctflingo.local`) | `password123` | Standard student access with existing solved challenges and progress |

*(You can also click **Sign Up** on the landing page to register any new account! The first registered account automatically receives Admin privileges).*

---

## 🛠️ Architecture & Local SQLite Integration

- **Database**: Local SQLite database stored in `ctflingo.db` (auto-created on first run).
- **Backend API**: Integrated Vite middleware (in development) and standalone Node server (in production) handling:
  - User Authentication (Local sha256 password hashing & session management)
  - Query & Mutation API (Units, Lessons, Challenges, Hints, Paths, Progress, Leaderboard)
  - RPC Functions (`get_public_stats`, `join_ctf_path`, `advance_ctf_node`)
  - File Storage (PCAP captures, static challenge files stored in `data/uploads/challenge-files/`)
- **Frontend Client**: Drop-in Supabase-compatible adapter in [`src/lib/supabase.ts`](file:///src/lib/supabase.ts) communicating with the local SQLite API.

---

## 📦 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite dev server with integrated SQLite API on `http://localhost:5173` |
| `npm run build` | Compiles the React application to `dist/` |
| `npm start` | Starts the production server on `http://localhost:3000` |
| `npm run typecheck` | Validates TypeScript types across the codebase |
| `npm run db:init` | Manually re-initializes or seeds the SQLite database |

---

## 🚀 Features

- **Cybersecurity Learning Units**: Web Exploitation, Applied Cryptography, Network Analysis, Linux Privilege Escalation.
- **Interactive Lessons**: Structured markdown blocks, code snippets, security callouts, and curated resources.
- **CTF Challenges**: Flag verification, XP rewards, sequential hint unlocking with score penalties, and downloadable lab files (PCAP, binaries).
- **Visual CTF Tracks**: Node-based learning tracks rendered on an interactive canvas.
- **Leaderboard**: Global rankings and cumulative XP progress chart.
- **Admin Dashboard**: Create, edit, publish, or remove units, lessons, challenges, and tracks.
