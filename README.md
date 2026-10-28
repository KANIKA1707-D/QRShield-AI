# QRShield AI

**QRShield AI** is an Explainable QR Code Threat Investigation System.

This repository contains two independent projects:

- **frontend/** – React + Vite UI
- **backend/** – Flask API

Both can be run locally for development.

---

## Prerequisites

- **Node.js** (v20 or later) – for the frontend
- **Python** (3.11+) – for the backend
- **Git** (optional) – to clone the repo

---

## Setup Instructions

### 1️⃣ Backend (Flask)

```bash
# cd into the backend folder
cd backend

# (Optional) create a virtual environment
python -m venv venv
# Windows activation
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy example env file and adjust if needed
copy .env.example .env

# Run the Flask development server
flask run --port 5000
```

The API will be available at `http://localhost:5000`.

### 2️⃣ Frontend (React + Vite)

```bash
# open a new terminal and go to the frontend folder
cd frontend

# Install JavaScript dependencies
npm install

# Copy example env file (if you need environment variables)
copy .env.example .env

# Start the development server
npm run dev
```

The UI will be served at `http://localhost:5173` (default Vite port).

---

## Verify Backend Health Endpoint

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{ "status": "ok", "message": "Backend is running" }
```

---

## Project Structure

```
qrshield-ai/
├─ backend/          # Flask API
│   ├─ app.py
│   ├─ requirements.txt
│   ├─ .env.example
│   └─ ... (future modules)
├─ frontend/         # React UI
│   ├─ index.html
│   ├─ package.json
│   ├─ vite.config.js
│   ├─ .env.example
│   └─ src/
│       ├─ main.jsx
│       ├─ App.jsx
│       ├─ index.css
│       ├─ components/
│       │   └─ Navbar.jsx
│       └─ pages/
│           ├─ Dashboard.jsx
│           ├─ QRScanner.jsx
│           ├─ History.jsx
│           └─ About.jsx
└─ README.md
```

---

**Next steps** – Once both servers are running and `GET /health` returns *ok*, we can move to Phase 1.
