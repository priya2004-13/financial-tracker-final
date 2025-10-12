⚡ Vite + Express Fullstack Starter (TypeScript)

Aapke lightning-fast fullstack playground mein swagat hai! Yeh repo ek sleek Vite-powered frontend ko ek robust Express backend ke saath combine karti hai—dono TypeScript mein likhe gaye hain taaki maximum type safety aur developer ko behtar anubhav mile.

---

## 🧭 Project ka Overview

📦 root/

├── client/ → Vite + React + TypeScript

├── server/ → Express + TypeScript

└── README.md

[https://github.com/priya2004-13/financial-tracker-final.git](https://github.com/priya2004-13/financial-tracker-final.git)

* **Frontend** : Instant hot reloads aur super-fast builds ke liye Vite ke saath banaya gaya hai.
* **Backend** : Smooth development cycles ke liye Express aur Nodemon se powered hai.
* **TypeScript** : Poore stack mein end-to-end type safety.

---

## 🚀 Jaldi Shuru Karein (Quick Start)

### 1. Repo ko clone karein

**Bash**

```
git clone https://github.com/priya2004-13/financial-tracker-final.git
cd financial-tracker-final
```

### 2. Dependencies install karein

**Bash**

```
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

**Bash**

```
cd client
npm run dev
```

Vite dev server `http://localhost:5173` (default) par shuru karta hai.

### ▶️ Backend (Express)

**Bash**

```
cd server
npm run dev
```

Nodemon ke saath Express server `http://localhost:3001` par chalata hai.

---

## 🏗️ Production ke liye Build Karein

### 🧱 Frontend

**Bash**

```
cd client
npm run build
```

* TypeScript ko compile karta hai
* Vite ke saath bundle karta hai
* Output: `client/dist`

### 🧱 Backend

**Bash**

```
cd server
npm run build
```

* TypeScript ko compile karta hai
* Output: `server/dist` ya aapka configured `outDir`

## 🌐 Deployment Tips

* `client/dist` ko Express ya CDN ke zariye statically serve karein.
* Compiled backend ko `node dist/index.js` se run karein.
* Configuration ke liye environment variables ka istemal karein (`.env` support recommended hai).

---

## 💡 Bonus Tips

* Dono servers ko ek hi terminal mein chalane ke liye [concurrently](https://www.npmjs.com/package/concurrently) ka use karein.
* API calls ko Express par forward karne ke liye `vite.config.ts` mein proxy config add karein.
* Consistent deployment ke liye Dockerizing ka vichaar karein.

---

## 🙌 Inse Banaya Gaya (Built With)

* 🧪 TypeScript
* ⚡ Vite
* 🚂 Express
* 🔁 Nodemon
* 🧹 ESLint
