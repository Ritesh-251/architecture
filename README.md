# Architecture Master
Modern 3D Interior Design Tool with Cloud Sync & Auth

## Overview
**Architecture Master** is a premium, WebGL-based 3D interior design platform built on Three.js. It allows users to create 2D floor plans, furnish spaces in 3D, and save their projects securely to the cloud.

### Key Features
- **🎨 Modern Dark UI**: Glassmorphic dashboard and editor theme.
- **☁️ Cloud Sync**: Save and load your floor plans from anywhere.
- **🔐 Secure Auth**: Built-in registration and login system.
- **📐 2D/3D Toggle**: Seamless transition between architectural drafting and realistic 3D visualization.
- **📦 Item Library**: Comprehensive library of furniture and structural items.

## Tech Stack
- **Frontend**: Vanilla JS, Three.js, Blueprint3D, HTML5, CSS3.
- **Backend**: Node.js, Express, MongoDB, Mongoose.
- **Auth**: JWT (JSON Web Tokens).

## Setup & Running Locally

### 1. Prerequisites
- Node.js (v14+)
- MongoDB (Running locally or on Atlas)

## Setup & Running
The entire platform (Frontend, Backend, and Database) can be set up and started with a single command. 

From the root directory:
```bash
npm start
```

This will automatically:
1. Install all dependencies (using `--legacy-peer-deps` where needed).
2. Create your `.env` configuration file from the template.
3. Start MongoDB, the Backend API, and the Design Editor.

Once started, visit `http://localhost:10001/landing.html` in your browser.


## Directory Structure
- `src/`: Core engine source code (ES6).
- `build/`: Distribution files, HTML templates, and assets.
- `backend/`: Express API and Database models.

## License
MIT
