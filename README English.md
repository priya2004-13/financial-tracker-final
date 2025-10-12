## ⚡ Vite + Express Fullstack Starter (TypeScript)

Welcome to your lightning-fast fullstack playground! This repo combines a sleek Vite-powered frontend with a robust Express backend—both written in TypeScript for maximum type safety and developer joy.

---

## 🧭 Project Overview

📦 root/
├── client/   → Vite + React + TypeScript
├── server/   → Express + TypeScript
└── README.md

https://github.com/priya2004-13/financial-tracker-final.git

- **Frontend**: Built with Vite for instant hot reloads and blazing builds.
- **Backend**: Powered by Express and Nodemon for smooth dev cycles.
- **TypeScript**: End-to-end type safety across the stack.

---

## 🚀 Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/priya2004-13/financial-tracker-final.git
cd financial-tracker-final
```

### 2. Install dependencies

```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

---

## 🔧 Development Scripts

### ▶️ Frontend (Vite)

```bash
cd client
npm run dev
```

Starts Vite dev server at `http://localhost:5173` (default).

### ▶️ Backend (Express)

```bash
cd server
npm run dev
```

Runs Express server with Nodemon at `http://localhost:3001`.

---

## 🏗️ Build for Production

### 🧱 Frontend

```bash
cd client
npm run build
```

- Compiles TypeScript
- Bundles with Vite
- Output: `client/dist`

### 🧱 Backend

```bash
cd server
npm run build
```

- Compiles TypeScript
- Output: `server/dist` or configured `outDir`


## 🌐 Deployment Tips

- Serve `client/dist` statically via Express or CDN.
- Run compiled backend with `node dist/index.js`.
- Use environment variables for config (`.env` support recommended).

---

## 💡 Bonus Tips

- Use [concurrently](https://www.npmjs.com/package/concurrently) to run both servers in one terminal.
- Add proxy config in `vite.config.ts` to forward API calls to Express.
- Consider Dockerizing for consistent deployment.

---

## 🙌 Built With

- 🧪 TypeScript
- ⚡ Vite
- 🚂 Express
- 🔁 Nodemon
- 🧹 ESLint
